// #!/usr/bin/env node
// /**
//  * Simple direct telemetry test data generator
//  * Sends directly to /api/v1/telemetry (simpler format, no OTEL conversion needed)
//  */

// const http = require('http');

// const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
// const SERVICES = ['payment', 'user', 'order', 'inventory', 'notification'];

// /**
//  * Generate mock telemetry (internal format)
//  */
// function generateTelemetry({ elapsedSeconds, fixedService, mode }) {
//   const service = fixedService || SERVICES[Math.floor(Math.random() * SERVICES.length)];

//   // For sequence-window ML models: first 5 minutes build context, 6th minute inject strong failures.
//   const minute = Math.floor(elapsedSeconds / 60) + 1;
//   const isWindowFailureMode = mode === 'window-failure';
//   const isFailureWave = isWindowFailureMode && minute >= 6;
//   const hasAnomaly = isFailureWave || (!isWindowFailureMode && Math.random() < 0.2);

//   const cpu = isFailureWave ? 96 + Math.random() * 4 : 35 + Math.random() * 45;
//   const memory = isFailureWave ? 95 + Math.random() * 5 : 40 + Math.random() * 35;
//   const latency = isFailureWave ? 700 + Math.random() * 500 : 35 + Math.random() * 120;
//   const errorRate = isFailureWave ? 0.2 + Math.random() * 0.25 : Math.random() * 0.03;

//   return {
//     service_name: service,
//     timestamp: new Date().toISOString(),
//     metrics: {
//       cpu,
//       memory,
//       latency,
//       error_rate: errorRate,
//       request_count: Math.floor(Math.random() * 1000),
//       throughput: Math.floor(Math.random() * 5000),
//     },
//     logs: [
//       `[${service}] INFO: Request handled`,
//       hasAnomaly ? `[${service}] CRITICAL: latency spike and error burst` : null,
//     ].filter(Boolean),
//     trace: {
//       trace_id: Math.random().toString(36).slice(2, 18),
//       depth: Math.floor(Math.random() * 6) + 1,
//       parent_service: 'gateway',
//     },
//   };
// }

// /**
//  * Send test data
//  */
// async function sendTestData(data) {
//   return new Promise((resolve, reject) => {
//     const url = new URL('/api/v1/telemetry', BACKEND_URL);
//     const options = {
//       hostname: url.hostname,
//       port: url.port || 3001,
//       path: url.pathname,
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     };

//     const req = http.request(options, (res) => {
//       let body = '';
//       res.on('data', (chunk) => body += chunk);
//       res.on('end', () => resolve({ status: res.statusCode, data: body }));
//     });

//     req.on('error', reject);
//     req.write(JSON.stringify(data));
//     req.end();
//   });
// }

// /**
//  * Run continuous test
//  */
// async function runTest(durationSeconds = 60, intervalMs = 3000, fixedService = '', mode = 'mixed') {
//   console.log(`
// ╔════════════════════════════════════════════════════════╗
// ║      PRISM Telemetry Test Data Generator               ║
// ╚════════════════════════════════════════════════════════╝

// Backend URL: ${BACKEND_URL}
// Duration: ${durationSeconds}s
// Interval: ${intervalMs}ms
// Service: ${fixedService || 'random'}
// Mode: ${mode}
//   `);

//   const startTime = Date.now();
//   let sent = 0;
//   let errors = 0;

//   const interval = setInterval(async () => {
//     const elapsed = Math.round((Date.now() - startTime) / 1000);
    
//     if (elapsed >= durationSeconds) {
//       clearInterval(interval);
//       console.log(`
// ✅ Test Complete!
//    📊 Total sent: ${sent}
//    ❌ Errors: ${errors}
//    ⏱️  Duration: ${elapsed}s
//       `);
//       process.exit(0);
//     }

//     try {
//       const telemetry = generateTelemetry({
//         elapsedSeconds: elapsed,
//         fixedService,
//         mode,
//       });
//       const result = await sendTestData(telemetry);
      
//       if (result.status === 200 || result.status === 201) {
//         sent++;
//         const anomaly = telemetry.metrics.error_rate >= 0.15 ? 'FAIL' : 'OK';
//         console.log(
//           `[${elapsed}s] ${anomaly} ${telemetry.service_name} ` +
//           `cpu=${telemetry.metrics.cpu.toFixed(1)} ` +
//           `mem=${telemetry.metrics.memory.toFixed(1)} ` +
//           `lat=${telemetry.metrics.latency.toFixed(1)} ` +
//           `err=${(telemetry.metrics.error_rate * 100).toFixed(1)}%`
//         );
//       } else {
//         errors++;
//         console.log(`[${elapsed}s] ✗ Status ${result.status}`);
//       }
//     } catch (error) {
//       errors++;
//       console.log(`[${elapsed}s] ✗ ${error.message}`);
//     }
//   }, intervalMs);
// }

// // Parse args
// const duration = parseInt(process.argv[2], 10) || 60;
// const interval = parseInt(process.argv[3], 10) || 3000;
// const service = process.argv[4] || '';
// const mode = process.argv[5] || 'mixed';

// runTest(duration, interval, service, mode).catch(console.error);


const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const INTERVAL = 2000; // 2 seconds for a smooth live UI feel

// 1. Define a complex Service Topology
// This structure dictates the Dependency Graph lines in your UI
const TOPOLOGY = {
  'api-gateway': { parents: ['internet'], depth: 1 },
  'auth-service': { parents: ['api-gateway'], depth: 2 },
  'order-service': { parents: ['api-gateway'], depth: 2 },
  'payment-service': { parents: ['order-service'], depth: 3 },
  'inventory-service': { parents: ['order-service'], depth: 3 },
  'shipping-service': { parents: ['order-service'], depth: 3 },
  'notification-service': { parents: ['shipping-service', 'payment-service'], depth: 4 },
  'database-cluster': { parents: ['auth-service', 'order-service', 'inventory-service'], depth: 4 }
};

const SERVICE_NAMES = Object.keys(TOPOLOGY);

function generateInterconnectedTelemetry(elapsedSeconds) {
  const serviceName = SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)];
  const config = TOPOLOGY[serviceName];

  // 2. Failure Logic: "The Database Outage"
  // After 3 minutes, the database fails. 
  // Services that depend on it will show "Warning" states, and the DB will show "Critical".
  const dbIsDown = elapsedSeconds > 180;
  const isTargetService = serviceName === 'database-cluster';
  const isDependentOnDB = config.parents.includes(serviceName) || 
                          ['order-service', 'auth-service', 'inventory-service'].includes(serviceName);

  let status = 'HEALTHY';
  let metrics = {
    cpu: 20 + Math.random() * 20,
    memory: 30 + Math.random() * 15,
    latency: 40 + Math.random() * 60,
    error_rate: Math.random() * 0.02
  };

  if (dbIsDown) {
    if (isTargetService) {
      status = 'CRITICAL';
      metrics = { cpu: 98, memory: 95, latency: 2500, error_rate: 0.85 };
    } else if (isDependentOnDB) {
      status = 'DEGRADED'; // High latency because DB is slow/down
      metrics = { cpu: 65, memory: 70, latency: 800 + Math.random() * 500, error_rate: 0.15 };
    }
  }

  return {
    service_name: serviceName,
    timestamp: new Date().toISOString(),
    metrics: {
      ...metrics,
      request_count: Math.floor(Math.random() * 100),
    },
    logs: status !== 'HEALTHY' 
      ? [`[${serviceName}] ERROR: Connection timeout to downstream peer`, `[${serviceName}] ALERT: Resource exhaustion`]
      : [`[${serviceName}] INFO: Request processed successfully`],
    trace: {
      trace_id: `trace-${Math.floor(elapsedSeconds)}-${Math.random().toString(36).slice(2, 8)}`,
      parent_service: config.parents[Math.floor(Math.random() * config.parents.length)],
      depth: config.depth
    }
  };
}

async function sendData(data) {
  return new Promise((resolve) => {
    const url = new URL('/api/v1/telemetry', BACKEND_URL);
    const req = http.request({
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, (res) => resolve(res.statusCode));
    req.on('error', () => resolve(500));
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log(`\x1b[32m--- PRISM Advanced Live Demo Generator Started ---\x1b[0m`);
  console.log(`Connecting ${SERVICE_NAMES.length} services...`);
  
  let elapsed = 0;
  setInterval(async () => {
    const telemetry = generateInterconnectedTelemetry(elapsed);
    const code = await sendData(telemetry);
    
    const color = telemetry.metrics.error_rate > 0.1 ? '\x1b[31m' : '\x1b[36m';
    console.log(`${color}[${elapsed}s] ${telemetry.service_name.padEnd(20)} | Latency: ${telemetry.metrics.latency.toFixed(0)}ms | Errors: ${(telemetry.metrics.error_rate * 100).toFixed(1)}%\x1b[0m`);
    
    elapsed += (INTERVAL / 1000);
  }, INTERVAL);
}

run();