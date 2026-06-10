import pandas as pd
import numpy as np
import torch
from collections import defaultdict, deque
from torch_geometric.data import Data

from .config import *

# =========================
# STATE
# =========================
service_buffer = defaultdict(list)
trace_buffer = []
sequence_queue = deque(maxlen=SEQ_LEN)

# =========================
# SERVICE MAPPING
# =========================
def get_service_id(service):
    if service is None:
        return UNKNOWN_ID

    return SERVICE_TO_ID.get(str(service), UNKNOWN_ID)


def _extract_service_name(event):
    return (
        event.get("service")
        or event.get("service_name")
        or event.get("service.name")
        or event.get("resource.service.name")
        or event.get("name")
    )


def _parse_timestamp(event):
    timestamp = event.get("timestamp") or event.get("time") or event.get("ts")

    if timestamp is None:
        return pd.Timestamp.utcnow()

    parsed = pd.to_datetime(timestamp, utc=True, errors="coerce")

    if pd.isna(parsed):
        return pd.Timestamp.utcnow()

    return parsed


def _series_or_default(df, column, default=0.0):
    if column in df.columns:
        return pd.to_numeric(df[column], errors="coerce").fillna(default)

    return pd.Series(default, index=df.index, dtype=float)


def _prune_state(timestamp):
    window_start = timestamp - pd.Timedelta(seconds=WINDOW)

    for sid in list(service_buffer.keys()):
        records = [record for record in service_buffer[sid] if record["timestamp"] >= window_start]

        if records:
            service_buffer[sid] = records
        else:
            del service_buffer[sid]

    global trace_buffer
    trace_buffer = [record for record in trace_buffer if record["timestamp"] >= window_start]

# =========================
# FEATURE ENGINEERING
# =========================
def compute_features(df):

    if df.empty:
        return np.zeros(NUM_FEATURES)

    df = df.copy()

    # base features
    df["container_cpu_usage_seconds_total"] = _series_or_default(df, "cpu")
    df["latency"] = _series_or_default(df, "latency")
    df["error_rate"] = _series_or_default(df, "error_rate")

    # trends
    df["cpu_trend"] = df["container_cpu_usage_seconds_total"].diff().fillna(0)
    df["latency_trend"] = df["latency"].diff().fillna(0)
    df["error_trend"] = df["error_rate"].diff().fillna(0)

    # rolling stats
    df["latency_mean_3"] = df["latency"].rolling(3).mean().fillna(0)
    df["error_mean_3"] = df["error_rate"].rolling(3).mean().fillna(0)
    df["latency_std_3"] = df["latency"].rolling(3).std().fillna(0)

    # spikes
    df["latency_spike"] = (df["latency"] > df["latency_mean_3"]*1.5).astype(int)
    df["error_spike"] = (df["error_rate"] > df["error_mean_3"]*1.5).astype(int)

    agg = df.tail(10).mean(numeric_only=True)

    # enforce schema
    vec = [agg.get(col, 0) for col in FEATURE_COLS]

    return np.array(vec)

# =========================
# INGEST EVENTS
# =========================
def ingest_event(event):

    event_type = event.get("type")
    t = _parse_timestamp(event)

    if pd.isna(t):
        t = pd.Timestamp.utcnow()

    if event_type == "metric":
        sid = get_service_id(_extract_service_name(event))

        service_buffer[sid].append({
            "timestamp": t,
            "cpu": event.get("cpu", 0),
            "latency": event.get("latency", 0),
            "error_rate": event.get("error_rate", event.get("error", 0))
        })

    elif event_type == "log":
        sid = get_service_id(_extract_service_name(event))

        level = str(event.get("level", event.get("severity", ""))).lower()
        error_rate = event.get("error_rate")

        if error_rate is None:
            error_rate = 1 if level in {"error", "fatal", "critical"} else 0

        service_buffer[sid].append({
            "timestamp": t,
            "error_rate": error_rate
        })

    elif event_type == "trace":
        src = get_service_id(event.get("source") or event.get("source_service") or event.get("parent_service"))
        dst = get_service_id(event.get("target") or event.get("target_service") or event.get("child_service"))

        trace_buffer.append({
            "timestamp": t,
            "src": src,
            "dst": dst
        })

    _prune_state(t)

# =========================
# BUILD GRAPH
# =========================
def build_graph(timestamp):

    x = np.zeros((NUM_NODES, NUM_FEATURES))
    window_start = timestamp - pd.Timedelta(seconds=WINDOW)

    for sid in range(NUM_NODES):

        records = service_buffer.get(sid, [])

        recent = [
            r for r in records
            if window_start <= r["timestamp"] <= timestamp
        ]

        df = pd.DataFrame(recent)

        x[sid] = compute_features(df)

    edges = [
        (record["src"], record["dst"])
        for record in trace_buffer
        if window_start <= record["timestamp"] <= timestamp
    ]

    # remove duplicate edges while preserving order
    seen_edges = set()
    deduped_edges = []

    for edge in edges:
        if edge not in seen_edges:
            seen_edges.add(edge)
            deduped_edges.append(edge)

    if deduped_edges:
        edge_index = torch.tensor(deduped_edges, dtype=torch.long).t().contiguous()
    else:
        edge_index = torch.empty((2, 0), dtype=torch.long)

    return Data(
        x=torch.tensor(x, dtype=torch.float),
        edge_index=edge_index
    )

# =========================
# SEQUENCE BUILDER
# =========================
def update_sequence(graph):

    sequence_queue.append(graph)

    if len(sequence_queue) == SEQ_LEN:
        return list(sequence_queue)

    return None

# =========================
# MAIN PIPELINE
# =========================
def process_event(event):

    if isinstance(event, list):
        latest_seq = None

        for item in event:
            latest_seq = process_event(item)

        return latest_seq

    ingest_event(event)

    graph = build_graph(_parse_timestamp(event))

    seq = update_sequence(graph)

    return seq