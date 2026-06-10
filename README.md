# PRISM — Predictive Real-time Intelligent Service Monitor

An end-to-end microservice observability platform with ML-powered anomaly detection, real-time telemetry ingestion, and a live operations dashboard.

![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-Vite-61DAFB?logo=react&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-GNN-EE4C2C?logo=pytorch&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/Status-In_Development-yellow)

---

## Demo

https://github.com/user-attachments/assets/REPLACE_THIS

> Upload `demo.mp4` by dragging it into a GitHub Issue comment box. GitHub will generate a URL — paste it above, replacing `REPLACE_THIS`.

---

## What It Does

PRISM collects telemetry (traces, metrics, logs) from microservices, processes it through a 4-stage pipeline, runs anomaly detection via a PyTorch Graph Neural Network, and broadcasts predictions to a real-time React dashboard — all within ~150ms.

```
Microservices (with OTEL SDK)
        |
        v
  OTEL Collector (gRPC / HTTP)
        |
        v
  Backend API (Express + Prisma)
    |-- Ingestion
    |-- Preprocessing
    |-- Feature Extraction (11 features)
    |-- Orchestrator
        |
        v
  ML Service (FastAPI + PyTorch GNN)
        |
        v
  PostgreSQL (storage) + Redis (cache)
        |
        v
  WebSocket Broadcast
        |
        v
  React Dashboard (Vite + Recharts + React Flow)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, React Flow, Framer Motion, Zustand |
| **Backend** | Node.js, Express, Prisma ORM, Socket.IO, Winston |
| **ML Service** | Python, FastAPI, PyTorch, PyTorch Geometric (GNN) |
| **Database** | PostgreSQL 16, Redis 7 |
| **Telemetry** | OpenTelemetry Collector |
| **Monitoring** | Prometheus, Grafana |
| **Infrastructure** | Docker Compose (9 services) |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose v2

### Setup

```bash
git clone https://github.com/RahulAvarolli74/Prism-Project.git
cd Prism-Project

# Start all 9 services
docker compose up -d --build

# Verify
docker compose ps
```

### Access

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:3001/health |
| ML Service | http://localhost:8000/health |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 |
| OTEL Collector (gRPC) | localhost:4317 |
| OTEL Collector (HTTP) | localhost:4318 |

---

## Services

Docker Compose orchestrates 9 services:

| Service | Role |
|---|---|
| `database` | PostgreSQL 16 — stores telemetry and predictions |
| `redis` | Redis 7 — caching layer |
| `backend` | Express API — ingestion, pipeline, WebSocket broadcast |
| `ml-service` | FastAPI — PyTorch GNN inference |
| `frontend` | React 19 + Vite — operations dashboard |
| `otel-collector` | OpenTelemetry Collector — receives traces, metrics, logs |
| `data-generator` | Auto-generates simulated telemetry for testing |
| `prometheus` | Metrics scraping and storage |
| `grafana` | Historical dashboards and alerting |

---

## Data Pipeline

Telemetry flows through four stages:

1. **Ingestion** — Validates and normalizes payloads
2. **Preprocessing** — Aggregates into time windows
3. **Feature Extraction** — Computes 11 ML-ready features
4. **Orchestration** — Calls ML service, stores predictions, broadcasts via WebSocket

### Sending Telemetry

**Direct API:**

```bash
curl -X POST http://localhost:3001/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{"service_name":"payment","metrics":{"cpu_usage":75,"memory_usage":60}}'
```

**OpenTelemetry SDK:**

Point your OTEL exporter to `localhost:4318` (HTTP) or `localhost:4317` (gRPC).

### Test Data

```bash
cd backend

# Mixed traffic — 3 minutes
node scripts/testDirectTelemetry.js 180 15000 payment mixed

# Failure scenario — triggers anomaly detection after warm-up
node scripts/testDirectTelemetry.js 480 15000 payment window-failure
```

---

## ML Model

| Property | Value |
|---|---|
| Architecture | Graph Neural Network (PyTorch Geometric) |
| Input | 11-dimensional feature vector |
| Output | Risk score, failure prediction, top risky services |
| Latency | < 50ms per prediction |
| Warm-up | Several windows required before stable predictions |

---

## Project Structure

```
PrismSystem/
|-- backend/
|   |-- src/
|   |   |-- modules/telemetry/     # OTEL routes, mappers, controllers
|   |   |-- modules/prediction/    # ML integration and prediction logic
|   |   |-- modules/dashboard/     # Dashboard data aggregation
|   |   |-- modules/service/       # Service registry
|   |   |-- pipeline/              # 4-stage processing pipeline
|   |   |-- integrations/          # ML client, WebSocket, alerts
|   |   |-- utils/                 # Logger, circuit breaker, metrics
|   |   `-- app.js
|   |-- model/                     # Trained PyTorch model
|   |-- api/                       # ML service API layer
|   |-- preprocessing/             # Feature engineering
|   |-- scripts/                   # Test data generators
|   |-- prisma/                    # Database schema
|   |-- main.py                    # ML service entry (FastAPI)
|   |-- Dockerfile                 # Backend image
|   `-- Dockerfile.ml              # ML service image
|
|-- frontend/
|   |-- src/
|   |   |-- pages/                 # Dashboard, Alerts, Metrics, Timeline
|   |   |-- components/            # Charts, UI, Layout
|   |   |-- features/              # Dashboard panels, predictions
|   |   |-- services/              # API and WebSocket clients
|   |   |-- store/                 # Zustand state
|   |   |-- hooks/                 # Custom hooks
|   |   `-- utils/                 # Formatters, helpers
|   |-- Dockerfile
|   `-- vite.config.js
|
|-- docker-compose.yml             # All 9 services
|-- otel-collector-config.yaml
|-- prometheus.yml
`-- .env.example
```

---

## Environment Variables

```bash
cp .env.example .env
```

Defaults work out of the box for local development. See `.env.example` for all available options.

---

## Stop / Reset

```bash
# Stop all services
docker compose down

# Stop and delete all data
docker compose down -v
```

---

## License

This project is for academic and research purposes.
