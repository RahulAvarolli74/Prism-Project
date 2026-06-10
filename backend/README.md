# 🔮 PRISM — Microservices Failure Prediction Engine

A production-grade backend system that continuously ingests telemetry data from microservices, processes it through an intelligent pipeline, integrates with an external ML model for failure predictions, and exposes APIs for real-time frontend visualization.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/              # Environment, DB, constants
│   │   ├── db.js            # Prisma client singleton
│   │   ├── env.js           # Centralized env config
│   │   └── constants.js     # App-wide constants & thresholds
│   │
│   ├── modules/             # Feature-based architecture
│   │   ├── telemetry/       # Telemetry ingestion & queries
│   │   ├── prediction/      # ML predictions & insights
│   │   ├── service/         # Service registry & dependencies
│   │   └── dashboard/       # Aggregated statistics
│   │
│   ├── pipeline/            # Core intelligence layer
│   │   ├── ingestion.js     # Data normalization
│   │   ├── preprocessing.js # Cleaning & metric normalization
│   │   ├── featureExtractor.js # Feature vector generation
│   │   └── orchestrator.js  # End-to-end pipeline coordination
│   │
│   ├── integrations/        # External service clients
│   │   ├── mlService.js     # ML API client (retry + circuit breaker)
│   │   ├── websocket.js     # Socket.IO server
│   │   └── alertService.js  # Alert threshold evaluation
│   │
│   ├── middlewares/         # Express middleware
│   │   ├── error.middleware.js
│   │   ├── logger.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── utils/               # Shared utilities
│   │   ├── logger.js        # Winston logger
│   │   ├── ApiError.js      # Custom error class
│   │   ├── ApiResponse.js   # Response wrapper
│   │   └── asyncHandler.js  # Async error catcher
│   │
│   ├── app.js               # Express app configuration
│   └── server.js            # HTTP + WebSocket server
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Seed data
│
├── logs/                    # Auto-generated log files
├── .env                     # Environment variables
├── .env.example             # Environment template
└── package.json
```

## ⚙️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js + Express** | HTTP server & API framework |
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Database access & migrations |
| **Socket.IO** | Real-time WebSocket communication |
| **Axios** | ML service HTTP client |
| **Winston** | Structured logging with rotation |
| **express-validator** | Request validation |
| **Helmet + CORS** | Security hardening |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Or run migrations (production)
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

### Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Key variables:
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/prism_db` | PostgreSQL connection |
| `ML_SERVICE_URL` | `http://localhost:8000` | External ML service URL |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin for CORS |

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health status |

### Telemetry (v1)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/telemetry` | Ingest telemetry data |
| GET | `/api/v1/telemetry` | List telemetry (paginated, filterable) |
| GET | `/api/v1/telemetry/:id` | Get single telemetry record |

### Predictions (v1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/predictions` | List predictions (filterable) |
| GET | `/api/v1/predictions/:id` | Get single prediction |
| GET | `/api/v1/predictions/failures/recent` | Recent failure predictions |
| GET | `/api/v1/predictions/nodes/top-affected` | Top failing nodes |
| GET | `/api/v1/predictions/ml/health` | ML service health status |

### Services (v1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/services` | List all registered services |
| GET | `/api/v1/services/:name` | Service details + telemetry |
| GET | `/api/v1/services/dependencies` | Dependency graph |

### Dashboard (v1)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/summary` | Aggregated dashboard statistics |

## 📨 Telemetry Ingestion Format

```json
POST /api/v1/telemetry

{
  "service_name": "payment-service",
  "timestamp": "2026-04-13T12:00:00Z",
  "metrics": {
    "cpu": 75,
    "memory": 60,
    "latency": 320,
    "error_rate": 0.12
  },
  "logs": [
    "error connecting to db",
    "retry timeout"
  ],
  "trace": {
    "trace_id": "abc123",
    "parent_service": "api-gateway",
    "depth": 3
  }
}
```

**Notes:**
- `service_name` (or `serviceName`) is required; all other fields are optional
- Missing fields are handled gracefully with defaults
- Additional/custom metrics are preserved in JSONB
- Services are auto-registered on first telemetry ingestion

## 🔌 WebSocket Events

Connect via Socket.IO to `ws://localhost:3001`

| Event | Direction | Description |
|---|---|---|
| `new_telemetry` | Server → Client | New telemetry ingested |
| `new_prediction` | Server → Client | New prediction generated |
| `service_alert` | Server → Client | Alert threshold exceeded |
| `dashboard_update` | Server → Client | Dashboard data changed |
| `subscribe_service` | Client → Server | Subscribe to service-specific events |
| `unsubscribe_service` | Client → Server | Unsubscribe from service events |

## 📡 OpenTelemetry Ingest

The backend exposes standard OTLP HTTP endpoints mounted at `/v1`:

- `POST /v1/traces`
- `POST /v1/logs`
- `POST /v1/metrics`

These endpoints accept OTLP JSON forwarded by the OpenTelemetry Collector, normalize the payload into the existing telemetry schema, store the raw data in PostgreSQL, and then run the prediction pipeline.

## 🧠 ML Service Integration

The backend expects a Python FastAPI service at the configured `ML_SERVICE_URL`:

```
POST /predict
{
  "features": [0.75, 0.60, 0.32, 0.12, 0.7, 0.5, 0.3, 0.5, 0, 0.5, 0.5]
}

Response:
{
  "failure": true,
  "confidence": 0.87,
  "affected_node": "payment-service",
  "root_cause": "high latency + error spike"
}
```

**Resilience features:**
- Retry with exponential backoff (3 attempts)
- Circuit breaker (opens after 5 failures, resets after 30s)
- Fallback to heuristic-based prediction when ML service is down

## 📊 Database Schema

Four core tables with JSONB flexibility:

- **services** — Service registry with metadata
- **telemetry** — Metrics, logs, traces (JSONB)
- **predictions** — ML predictions linked to telemetry
- **service_dependencies** — Dependency graph

## 📝 License

ISC
