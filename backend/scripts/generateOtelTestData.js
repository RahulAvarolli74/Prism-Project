/**
 * Generate mock OTEL telemetry data for system testing
 * Sends to backend /v1/traces, /v1/metrics, /v1/logs
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Mock service names for testing
const SERVICES = [
  'payment-service',
  'user-service',
  'order-service',
  'inventory-service',
  'notification-service'
];

/**
 * Generate mock trace spans (OTLP format)
 */
function generateTraces() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const latency = Math.random() * 200 + 20; // 20-220ms
  const isError = Math.random() < 0.1; // 10% errors

  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: service } },
            { key: 'service.version', value: { stringValue: '1.0.0' } },
            { key: 'service.environment', value: { stringValue: 'production' } }
          ]
        },
        scopeSpans: [
          {
            scope: { name: 'manual-instrumentation' },
            spans: [
              {
                traceId: Buffer.from(Math.random().toString()).toString('base64').slice(0, 16),
                spanId: Buffer.from(Math.random().toString()).toString('base64').slice(0, 8),
                name: `${service}-operation`,
                startTimeUnixNano: (Date.now() * 1e6).toString(),
                endTimeUnixNano: ((Date.now() + latency) * 1e6).toString(),
                attributes: [
                  { key: 'http.method', value: { stringValue: 'POST' } },
                  { key: 'http.url', value: { stringValue: '/api/transaction' } },
                  { key: 'http.status_code', value: { intValue: isError ? '500' : '200' } },
                  { key: 'span.kind', value: { stringValue: 'INTERNAL' } },
                  { key: 'latency_ms', value: { doubleValue: latency } }
                ],
                status: { code: isError ? 2 : 0 }
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Generate mock metrics (OTLP format)
 */
function generateMetrics() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const timestamp = Date.now() * 1e6;

  return {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: service } },
            { key: 'host.name', value: { stringValue: 'host-01' } }
          ]
        },
        scopeMetrics: [
          {
            scope: { name: 'system-metrics' },
            metrics: [
              {
                name: 'cpu_usage',
                unit: '%',
                gauge: {
                  dataPoints: [
                    {
                      timeUnixNano: timestamp.toString(),
                      asDouble: Math.random() * 100,
                      attributes: [
                        { key: 'cpu.number', value: { intValue: '0' } }
                      ]
                    }
                  ]
                }
              },
              {
                name: 'memory_usage',
                unit: 'MB',
                gauge: {
                  dataPoints: [
                    {
                      timeUnixNano: timestamp.toString(),
                      asInt: Math.floor(Math.random() * 2000),
                      attributes: [
                        { key: 'mem.type', value: { stringValue: 'heap' } }
                      ]
                    }
                  ]
                }
              },
              {
                name: 'request_count',
                unit: 'requests',
                sum: {
                  dataPoints: [
                    {
                      timeUnixNano: timestamp.toString(),
                      asInt: Math.floor(Math.random() * 100),
                      attributes: [
                        { key: 'endpoint', value: { stringValue: '/api/v1' } },
                        { key: 'method', value: { stringValue: 'POST' } }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Generate mock logs (OTLP format)
 */
function generateLogs() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const levels = ['INFO', 'WARN', 'ERROR'];
  const level = levels[Math.floor(Math.random() * levels.length)];

  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: service } },
            { key: 'service.instance.id', value: { stringValue: 'instance-001' } }
          ]
        },
        scopeLogs: [
          {
            scope: { name: 'logging' },
            logRecords: [
              {
                timeUnixNano: (Date.now() * 1e6).toString(),
                observedTimeUnixNano: (Date.now() * 1e6).toString(),
                severityNumber: level === 'ERROR' ? 17 : level === 'WARN' ? 13 : 9,
                severityText: level,
                body: {
                  stringValue: `[${service}] ${level}: Operation completed in transaction`
                },
                attributes: [
                  { key: 'transaction.id', value: { stringValue: 'txn-' + Math.random().toString(36).substr(2, 9) } },
                  { key: 'user.id', value: { stringValue: 'user-' + Math.floor(Math.random() * 1000) } },
                  { key: 'environment', value: { stringValue: 'production' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Send data to backend
 */
function sendToBackend(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OtelTestDataGenerator/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Main test loop
 */
async function runTests(durationSeconds = 30, intervalMs = 2000) {
  console.log(`\n🚀 Starting OTEL test data generation for ${durationSeconds}s`);
  console.log(`📍 Backend: ${BACKEND_URL}`);
  console.log(`⏱️  Interval: ${intervalMs}ms\n`);

  const startTime = Date.now();
  let count = 0;

  const interval = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > durationSeconds * 1000) {
      clearInterval(interval);
      console.log(`\n✅ Test completed! Sent ${count} data batches.`);
      process.exit(0);
    }

    try {
      count++;
      console.log(`\n[${count}] Sending test data...`);

      // Send traces
      const traceRes = await sendToBackend('/v1/traces', generateTraces());
      console.log(`  ✓ Traces: ${traceRes.status}`);

      // Send metrics
      const metricsRes = await sendToBackend('/v1/metrics', generateMetrics());
      console.log(`  ✓ Metrics: ${metricsRes.status}`);

      // Send logs
      const logsRes = await sendToBackend('/v1/logs', generateLogs());
      console.log(`  ✓ Logs: ${logsRes.status}`);

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }, intervalMs);
}

// Usage
const durationSeconds = parseInt(process.argv[2]) || 30;
const intervalMs = parseInt(process.argv[3]) || 2000;

runTests(durationSeconds, intervalMs).catch(console.error);
