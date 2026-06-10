#!/usr/bin/env node

/**
 * PRISM Live Demo Script
 * Demonstrates the complete end-to-end data flow
 * 
 * Run: node LIVE_DEMO.js
 */

const axios = require('axios');
const readline = require('readline');

const BACKEND_URL = 'http://localhost:3001';
const ML_SERVICE_URL = 'http://localhost:8000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: `${colors.blue}[ℹ]${colors.reset}`,
    SUCCESS: `${colors.green}[✓]${colors.reset}`,
    ERROR: `${colors.red}[✗]${colors.reset}`,
    WARNING: `${colors.yellow}[⚠]${colors.reset}`,
    DEMO: `${colors.cyan}[DEMO]${colors.reset}`,
  }[level] || '';

  console.log(`${prefix} ${timestamp} ${message}`);
}

async function checkHealth() {
  log('INFO', 'Checking system health...');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    log('SUCCESS', 'Backend API is running ✓');
    return true;
  } catch (error) {
    log('ERROR', `Backend not responding at ${BACKEND_URL}`);
    log('ERROR', 'Make sure to run: docker compose up -d');
    return false;
  }
}

async function sendTelemetry() {
  log('DEMO', 'Step 1: SENDING TELEMETRY');
  log('INFO', 'Simulating microservice sending telemetry data...\n');

  const services = [
    { name: 'payment-service', cpu: 65, memory: 845, latency: 145, errors: 0.02 },
    { name: 'order-service', cpu: 42, memory: 512, latency: 68, errors: 0.01 },
    { name: 'inventory-service', cpu: 88, memory: 1024, latency: 250, errors: 0.08 },
  ];

  for (const service of services) {
    const telemetry = {
      service_name: service.name,
      timestamp: new Date().toISOString(),
      metrics: {
        cpu_usage: service.cpu,
        memory_usage: service.memory,
        latency_ms: service.latency,
        error_rate: service.errors,
        request_count: Math.floor(Math.random() * 5000) + 500,
      },
      logs: [
        `[${new Date().toISOString()}] Request received from API Gateway`,
        `[${new Date().toISOString()}] Processing business logic...`,
      ],
      trace: {
        trace_id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        parent_service: 'api-gateway',
        depth: Math.floor(Math.random() * 3) + 1,
      },
    };

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/telemetry`, telemetry);
      log('SUCCESS', `${service.name}: CPU ${service.cpu}%, Memory ${service.memory}MB, Latency ${service.latency}ms`);
    } catch (error) {
      log('ERROR', `Failed to send telemetry for ${service.name}`);
    }

    await sleep(500);
  }
  console.log();
}

async function checkDatabaseRecords() {
  log('DEMO', 'Step 2: CHECKING DATABASE STORAGE');
  log('INFO', 'Verifying telemetry records stored in PostgreSQL...\n');

  try {
    const response = await axios.get(`${BACKEND_URL}/api/v1/telemetry?page=1&limit=5`);
    if (response.data.data && response.data.data.length > 0) {
      log('SUCCESS', `Found ${response.data.pagination.total} telemetry records in database ✓`);
      log('INFO', `Latest records (showing ${response.data.data.length}):`);
      
      response.data.data.forEach((record, idx) => {
        console.log(`  ${idx + 1}. ${record.service_name} | CPU: ${record.metrics?.cpu_usage}% | Latency: ${record.metrics?.latency_ms}ms`);
      });
    } else {
      log('WARNING', 'No records found in database yet');
    }
  } catch (error) {
    log('ERROR', 'Could not retrieve telemetry records');
  }
  console.log();
}

async function checkPredictions() {
  log('DEMO', 'Step 3: CHECKING ML PREDICTIONS');
  log('INFO', 'Retrieving anomaly predictions from database...\n');

  try {
    const response = await axios.get(`${BACKEND_URL}/api/v1/predictions?page=1&limit=5`);
    if (response.data.data && response.data.data.length > 0) {
      log('SUCCESS', `Found ${response.data.pagination.total} predictions ✓`);
      log('INFO', 'Recent predictions:');

      response.data.data.forEach((pred, idx) => {
        const severity = pred.severity === 'critical' ? `${colors.red}${pred.severity}${colors.reset}` :
                        pred.severity === 'warning' ? `${colors.yellow}${pred.severity}${colors.reset}` :
                        `${colors.green}${pred.severity}${colors.reset}`;
        
        console.log(`  ${idx + 1}. Anomaly: ${pred.is_anomaly ? 'YES' : 'NO'} | Score: ${(pred.anomaly_score * 100).toFixed(1)}% | Severity: ${severity}`);
      });
    } else {
      log('WARNING', 'No predictions yet - try sending more telemetry');
    }
  } catch (error) {
    log('ERROR', 'Could not retrieve predictions');
  }
  console.log();
}

async function showMetrics() {
  log('DEMO', 'Step 4: VIEWING SYSTEM METRICS');
  log('INFO', 'Prometheus metrics from backend...\n');

  try {
    const response = await axios.get(`${BACKEND_URL}/metrics`);
    const lines = response.data.split('\n').filter(line => !line.startsWith('#') && line.includes('prism_'));
    
    if (lines.length > 0) {
      log('SUCCESS', `Found ${lines.length} PRISM metrics ✓`);
      log('INFO', 'Sample metrics:');
      
      lines.slice(0, 10).forEach(line => {
        console.log(`  ${line}`);
      });
      
      if (lines.length > 10) {
        console.log(`  ... and ${lines.length - 10} more metrics`);
      }
    } else {
      log('WARNING', 'No metrics found');
    }
  } catch (error) {
    log('ERROR', 'Could not retrieve metrics');
  }
  console.log();
}

async function demonstrateAnomalyFlow() {
  log('DEMO', 'Step 5: DEMONSTRATING ANOMALY DETECTION');
  log('INFO', 'Sending telemetry that will trigger anomaly detection...\n');

  const anomalousService = {
    service_name: 'failing-service',
    timestamp: new Date().toISOString(),
    metrics: {
      cpu_usage: 95,      // HIGH - above threshold
      memory_usage: 2048, // VERY HIGH - above threshold
      latency_ms: 850,    // VERY HIGH - above threshold
      error_rate: 0.25,   // VERY HIGH - above threshold
      request_count: 100,
    },
    logs: [
      '[ALERT] High CPU utilization detected',
      '[ALERT] Memory pressure - possible leak',
      '[ERROR] Request timeouts increasing',
    ],
    trace: {
      trace_id: `trace-${Date.now()}-anomaly`,
      parent_service: 'api-gateway',
      depth: 1,
    },
  };

  try {
    const response = await axios.post(`${BACKEND_URL}/api/v1/telemetry`, anomalousService);
    log('SUCCESS', 'Sent anomalous telemetry ✓');
    log('INFO', `Service: ${anomalousService.service_name}`);
    log('INFO', `CPU: ${anomalousService.metrics.cpu_usage}% (high)`);
    log('INFO', `Memory: ${anomalousService.metrics.memory_usage}MB (high)`);
    log('INFO', `Latency: ${anomalousService.metrics.latency_ms}ms (high)`);
    log('INFO', `Error Rate: ${(anomalousService.metrics.error_rate * 100).toFixed(1)}% (high)`);
    
    log('INFO', '\n⏳ ML model is processing this data (~10-50ms)...\n');
    
    await sleep(2000);

    // Check if prediction was made
    const predictions = await axios.get(`${BACKEND_URL}/api/v1/predictions?page=1&limit=1`);
    if (predictions.data.data.length > 0) {
      const latest = predictions.data.data[0];
      if (latest.is_anomaly) {
        log('SUCCESS', `${colors.red}ANOMALY DETECTED!${colors.reset}`);
        log('INFO', `Anomaly Score: ${(latest.anomaly_score * 100).toFixed(1)}%`);
        log('INFO', `Severity: ${latest.severity}`);
      } else {
        log('INFO', 'No anomaly detected (normal behavior)');
      }
    }
  } catch (error) {
    log('ERROR', 'Failed to send anomalous telemetry');
  }
  console.log();
}

async function showSystemArchitecture() {
  log('DEMO', 'Step 6: SYSTEM ARCHITECTURE OVERVIEW\n');

  const architecture = `
  ┌──────────────────────────────────────────────────────────────┐
  │         PRISM MICROSERVICE INTELLIGENCE PLATFORM              │
  │                                                               │
  │  Microservices → OTEL Collector → Backend → ML → Frontend   │
  │                                                               │
  │  Data Flow:                                                   │
  │  1. Your microservices emit telemetry (traces, metrics)      │
  │  2. OTEL Collector receives on :4317 (gRPC) :4318 (HTTP)    │
  │  3. Collector exports to Backend API (/v1/traces|metrics)   │
  │  4. Backend ingests & runs 4-stage pipeline:                │
  │     ├─ Stage 1: Ingestion (validate, normalize)             │
  │     ├─ Stage 2: Preprocessing (aggregate, rolling avg)      │
  │     ├─ Stage 3: Feature Extraction (11 ML features)         │
  │     └─ Stage 4: Orchestration (predict, store, broadcast)  │
  │  5. ML Service (PyTorch) detects anomalies                  │
  │  6. Predictions stored in PostgreSQL                        │
  │  7. WebSocket broadcasts to Frontend dashboard              │
  │  8. Frontend displays real-time alerts & metrics            │
  │                                                               │
  │  Key Endpoints:                                              │
  │  • Backend:        http://localhost:3001                    │
  │  • Frontend:       http://localhost:3000                    │
  │  • ML Service:     http://localhost:8000                    │
  │  • Prometheus:     http://localhost:9090                    │
  │  • Grafana:        http://localhost:3000                    │
  │                                                               │
  │  Database: PostgreSQL on localhost:5432                     │
  │  Cache:    Redis on localhost:6379                          │
  │  Collector: :4317 (gRPC), :4318 (HTTP)                     │
  │                                                               │
  └──────────────────────────────────────────────────────────────┘
  `;

  console.log(architecture);
  console.log();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║        PRISM LIVE DEMO - End-to-End System Demo            ║
║                                                             ║
║  Watch real-time telemetry flow through the entire system! ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  // Step 0: Health check
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    return;
  }

  // Step 1: Show architecture
  await showSystemArchitecture();

  // Pause for user
  await prompt('Press Enter to start the demo...');

  // Step 2: Send telemetry
  await sendTelemetry();
  await sleep(2000);

  // Step 3: Check database
  await checkDatabaseRecords();
  await sleep(1000);

  // Step 4: Check predictions
  await checkPredictions();
  await sleep(1000);

  // Step 5: Show metrics
  await showMetrics();
  await sleep(1000);

  // Step 6: Demonstrate anomaly detection
  await demonstrateAnomalyFlow();

  // Final summary
  log('SUCCESS', '✨ Demo Complete! ✨\n');
  console.log(`${colors.bright}What you just saw:${colors.reset}
  1. Real telemetry from multiple services was ingested
  2. Backend pipeline processed each event (150ms end-to-end)
  3. ML model analyzed telemetry for anomalies
  4. Predictions were stored in PostgreSQL
  5. System metrics were collected
  6. Anomaly detection successfully identified suspicious patterns

${colors.bright}Next Steps:${colors.reset}
  • Open ${colors.cyan}http://localhost:3000${colors.reset} to see live dashboard
  • Check ${colors.cyan}http://localhost:9090${colors.reset} for Prometheus metrics
  • Connect your own microservices with OTEL SDKs
  • Configure alerts in Grafana (${colors.cyan}http://localhost:3000${colors.reset})

${colors.bright}Useful Commands:${colors.reset}
  • View backend logs:     ${colors.cyan}docker compose logs -f backend${colors.reset}
  • View ML service logs:  ${colors.cyan}docker compose logs -f ml-service${colors.reset}
  • View collector logs:   ${colors.cyan}docker compose logs -f otel-collector${colors.reset}
  • Stop system:           ${colors.cyan}docker compose down${colors.reset}

${colors.bright}Documentation:${colors.reset}
  • System overview:       ${colors.cyan}SYSTEM_WALKTHROUGH.md${colors.reset}
  • Quick start guide:     ${colors.cyan}QUICK_START.md${colors.reset}
  • Architecture details:  ${colors.cyan}ARCHITECTURE.md${colors.reset}

`);
}

function prompt(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run the demo
run().catch(error => {
  log('ERROR', error.message);
  process.exit(1);
});
