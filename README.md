<![CDATA[<div align="center">

# PRISM

**Predictive Real-time Intelligent Service Monitor**

An end-to-end microservice observability platform with ML-powered anomaly detection, real-time telemetry ingestion, and a live operations dashboard.

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](backend/)
[![React](https://img.shields.io/badge/React_19-Vite-61DAFB?logo=react&logoColor=white)](frontend/)
[![PyTorch](https://img.shields.io/badge/PyTorch-GNN-EE4C2C?logo=pytorch&logoColor=white)](backend/model/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](docker-compose.yml)

> **Status:** In active development · Not yet deployed to production

</div>

---

## Demo

https://github.com/user-attachments/assets/REPLACE_WITH_VIDEO_ASSET_ID

> **To make the demo visible on GitHub:**
> 1. Go to your repo → open an Issue or Pull Request
> 2. Drag and drop `demo.mp4` into the comment box
> 3. GitHub will upload it and give you a URL like `https://github.com/user-attachments/assets/...`
> 4. Replace the placeholder URL above with that link
> 5. Commit the updated README

---

## What It Does

PRISM collects telemetry (traces, metrics, logs) from microservices, processes it through a multi-stage pipeline, runs anomaly detection via a PyTorch Graph Neural Network, and broadcasts predictions to a real-time React dashboard — all within ~150ms end-to-end.

```
Microservices (OTEL SDK)
    ↓
OTEL Collector (gRPC / HTTP)
    ↓
Backend API (Express + Prisma)
    ├─ Ingestion → Preprocessing → Feature Extraction
    └─ Orchestrator → ML Service (FastAPI + PyTorch)
                          ↓
                    PostgreSQL Storage
                          ↓
                  WebSocket Broadcast
                          ↓
                  React Dashboard (Vite)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, React Flow, Framer Motion, Zustand |
| **Backend** | Node.js, Express, Prisma ORM, Socket.IO, Winston |
| **ML Service** | Python, FastAPI, PyTorch, PyTorch Geometric (GNN) |
| **Database** | PostgreSQL 16, Redis 7 |
| **Telemetry** | OpenTelemetry Collector |
| **Monitoring** | Prometheus, Grafana |
| **Infrastructure** | Docker Compose (9 services) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │   OTEL   │───▶│   Backend    │───▶│     ML Service      │   │
│  │ Collector│    │  (Express)   │    │ (FastAPI + PyTorch)  │   │
│  └──────────┘    └──────┬───────┘    └─────────────────────┘   │
│                         │                                       │
│            ┌────────────┼────────────┐                          │
│            ▼            ▼            ▼                          │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│     │PostgreSQL│  │  Redis   │  │WebSocket │                   │
│     │    16    │  │    7     │  │Broadcast │                   │
│     └──────────┘  └──────────┘  └─────┬────┘                  │
│                                       ▼                        │
│  ┌──────────┐  ┌──────────┐    ┌──────────┐                   │
│  │Prometheus│  │ Grafana  │    │ Frontend │                   │
│  │          │◀─│          │    │ (React)  │                   │
│  └──────────┘  └──────────┘    └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose v2)

### Run

```bash
# Clone the repository
git clone https://github.com/<your-username>/PrismSystem.git
cd PrismSystem

# Start all services
docker compose up -d --build

# Verify everything is running
docker compose ps
```

All 9 services will start automatically: PostgreSQL, Redis, Backend, ML Service, Frontend, OTEL Collector, Data Generator, Prometheus, and Grafana.

### Access

| Service | URL |
|---------|-----|
| **Dashboard** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:3001](http://localhost:3001) |
| **ML Service** | [http://localhost:8000](http://localhost:8000) |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) |
| **Grafana** | [http://localhost:3002](http://localhost:3002) |
| **OTEL (gRPC)** | `localhost:4317` |
| **OTEL (HTTP)** | `localhost:4318` |

---

## Data Pipeline

The system processes telemetry through four stages:

1. **Ingestion** — Validates and normalizes incoming telemetry payloads
2. **Preprocessing** — Aggregates raw data into time windows
3. **Feature Extraction** — Computes 11 ML-ready features from processed windows
4. **Orchestration** — Sends features to the ML service, stores predictions, broadcasts results

### Sending Telemetry

**Via the direct API:**
```bash
curl -X POST http://localhost:3001/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{"service_name":"payment","metrics":{"cpu_usage":75,"memory_usage":60}}'
```

**Via OpenTelemetry SDK:**
Point your OTEL exporter to `localhost:4318` (HTTP) or `localhost:4317` (gRPC).

### Test Data Generator

A built-in data generator service continuously pushes simulated telemetry. For manual testing:

```bash
cd backend

# Normal mixed traffic (3 minutes, one event every 15s)
node scripts/testDirectTelemetry.js 180 15000 payment mixed

# Failure scenario (8 minutes, triggers anomaly detection after warm-up)
node scripts/testDirectTelemetry.js 480 15000 payment window-failure
```

---

## ML Model

- **Architecture:** Graph Neural Network (PyTorch Geometric)
- **Input:** 11-dimensional feature vector derived from telemetry windows
- **Output:** Risk score, failure prediction, top risky services
- **Latency:** < 50ms per prediction
- **Warm-up:** Model requires several windows before producing stable predictions (status shows `warming_up` during this phase)

---

## Project Structure

```
PrismSystem/
├── backend/
│   ├── src/
│   │   ├── modules/telemetry/    # OTEL routes, mappers, controllers
│   │   ├── pipeline/             # 4-stage processing pipeline
│   │   └── app.js                # Express application
│   ├── model/                    # Trained PyTorch model artifacts
│   ├── api/                      # ML service API layer
│   ├── preprocessing/            # Data preprocessing utilities
│   ├── scripts/                  # Test data generators
│   ├── prisma/                   # Database schema
│   ├── main.py                   # ML service entry point (FastAPI)
│   ├── Dockerfile                # Backend image
│   └── Dockerfile.ml             # ML service image
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Dashboard views
│   │   ├── components/           # Reusable UI components
│   │   ├── services/             # API and WebSocket clients
│   │   ├── store/                # Zustand state management
│   │   ├── hooks/                # Custom React hooks
│   │   └── features/             # Feature modules
│   ├── Dockerfile                # Frontend image
│   └── vite.config.js
│
├── docker-compose.yml            # All services orchestration
├── otel-collector-config.yaml    # OTEL Collector configuration
├── prometheus.yml                # Prometheus scrape config
└── .env.example                  # Environment variable template
```

---

## Environment Variables

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

Key variables are documented in [`.env.example`](.env.example). Defaults work out of the box for local development.

---

## Stopping the System

```bash
# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

---

## License

This project is for academic and research purposes.
]]>
