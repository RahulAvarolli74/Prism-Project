const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Seed Services ──
  const services = [
    { name: 'api-gateway', metadata: { team: 'platform', region: 'us-east-1', version: '2.1.0' } },
    { name: 'payment-service', metadata: { team: 'payments', region: 'us-east-1', version: '1.4.2' } },
    { name: 'user-service', metadata: { team: 'identity', region: 'us-west-2', version: '3.0.1' } },
    { name: 'order-service', metadata: { team: 'commerce', region: 'us-east-1', version: '1.8.0' } },
    { name: 'notification-service', metadata: { team: 'engagement', region: 'eu-west-1', version: '1.2.3' } },
    { name: 'inventory-service', metadata: { team: 'commerce', region: 'us-east-1', version: '2.0.0' } },
  ];

  const createdServices = {};
  for (const svc of services) {
    const created = await prisma.service.upsert({
      where: { name: svc.name },
      update: { metadata: svc.metadata },
      create: svc,
    });
    createdServices[svc.name] = created;
    console.log(`  ✅ Service: ${created.name} (${created.id})`);
  }

  // ── Seed Service Dependencies ──
  const dependencies = [
    { source: 'api-gateway', target: 'user-service', metadata: { protocol: 'HTTP', avgLatency: 45 } },
    { source: 'api-gateway', target: 'order-service', metadata: { protocol: 'HTTP', avgLatency: 60 } },
    { source: 'api-gateway', target: 'payment-service', metadata: { protocol: 'HTTP', avgLatency: 80 } },
    { source: 'order-service', target: 'payment-service', metadata: { protocol: 'gRPC', avgLatency: 30 } },
    { source: 'order-service', target: 'inventory-service', metadata: { protocol: 'gRPC', avgLatency: 25 } },
    { source: 'payment-service', target: 'notification-service', metadata: { protocol: 'AMQP', avgLatency: 15 } },
  ];

  for (const dep of dependencies) {
    await prisma.serviceDependency.upsert({
      where: {
        sourceServiceId_targetServiceId: {
          sourceServiceId: createdServices[dep.source].id,
          targetServiceId: createdServices[dep.target].id,
        },
      },
      update: { metadata: dep.metadata },
      create: {
        sourceServiceId: createdServices[dep.source].id,
        targetServiceId: createdServices[dep.target].id,
        metadata: dep.metadata,
      },
    });
    console.log(`  🔗 Dependency: ${dep.source} → ${dep.target}`);
  }

  // ── Seed Sample Telemetry ──
  const now = new Date();
  const sampleTelemetry = [
    {
      serviceId: createdServices['payment-service'].id,
      timestamp: new Date(now.getTime() - 5 * 60000),
      metrics: { cpu: 75, memory: 60, latency: 320, error_rate: 0.12 },
      logs: ['error connecting to db', 'retry timeout'],
      trace: { trace_id: 'abc123', parent_service: 'api-gateway', depth: 3 },
      rawData: { source: 'seed' },
    },
    {
      serviceId: createdServices['api-gateway'].id,
      timestamp: new Date(now.getTime() - 4 * 60000),
      metrics: { cpu: 45, memory: 55, latency: 120, error_rate: 0.02 },
      logs: ['request processed', 'health check ok'],
      trace: { trace_id: 'def456', parent_service: null, depth: 1 },
      rawData: { source: 'seed' },
    },
    {
      serviceId: createdServices['order-service'].id,
      timestamp: new Date(now.getTime() - 3 * 60000),
      metrics: { cpu: 88, memory: 72, latency: 450, error_rate: 0.25 },
      logs: ['database connection pool exhausted', 'timeout on inventory check', 'retrying payment call'],
      trace: { trace_id: 'ghi789', parent_service: 'api-gateway', depth: 2 },
      rawData: { source: 'seed' },
    },
    {
      serviceId: createdServices['user-service'].id,
      timestamp: new Date(now.getTime() - 2 * 60000),
      metrics: { cpu: 30, memory: 40, latency: 80, error_rate: 0.01 },
      logs: ['cache hit', 'user authenticated'],
      trace: { trace_id: 'jkl012', parent_service: 'api-gateway', depth: 2 },
      rawData: { source: 'seed' },
    },
  ];

  for (const telemetry of sampleTelemetry) {
    const created = await prisma.telemetry.create({ data: telemetry });
    console.log(`  📊 Telemetry: ${created.id} for service ${telemetry.serviceId}`);
  }

  console.log('\n✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
