const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
const TELEMETRY_URL = `${BASE_URL}/api/v1/telemetry`;

const sampleEvents = [
  {
    type: 'metric',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    service_name: 'order-service',
    metrics: {
      cpu: 82,
      memory: 71,
      latency: 438,
      error_rate: 0.18,
    },
    logs: ['latency rising', 'retry count increasing'],
    trace: {
      trace_id: 'demo-trace-1',
      parent_service: 'api-gateway',
      depth: 2,
    },
  },
  {
    type: 'log',
    timestamp: new Date(Date.now() - 45_000).toISOString(),
    service_name: 'payment-service',
    level: 'error',
    message: 'payment gateway timeout',
  },
  {
    type: 'trace',
    timestamp: new Date(Date.now() - 30_000).toISOString(),
    source: 'order-service',
    target: 'payment-service',
  },
  {
    type: 'metric',
    timestamp: new Date(Date.now() - 15_000).toISOString(),
    service_name: 'inventory-service',
    metrics: {
      cpu: 64,
      memory: 58,
      latency: 212,
      error_rate: 0.06,
    },
    logs: ['inventory reservation delayed'],
    trace: {
      trace_id: 'demo-trace-2',
      parent_service: 'order-service',
      depth: 3,
    },
  },
];

async function main() {
  console.log(`Posting ${sampleEvents.length} telemetry events to ${TELEMETRY_URL}`);

  for (const event of sampleEvents) {
    const response = await axios.post(TELEMETRY_URL, event, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log(`✓ ${event.type} → ${response.status}`);
  }

  console.log('Demo telemetry sent successfully.');
}

main().catch((error) => {
  const details = error.response?.data || error.message;
  console.error('Demo telemetry failed:', details);
  process.exit(1);
});