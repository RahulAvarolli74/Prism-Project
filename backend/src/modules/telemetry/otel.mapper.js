function toPrimitiveValue(value) {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, 'boolValue')) return value.boolValue;
  if (Object.prototype.hasOwnProperty.call(value, 'intValue')) return Number(value.intValue);
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, 'bytesValue')) return value.bytesValue;

  if (value.arrayValue && Array.isArray(value.arrayValue.values)) {
    return value.arrayValue.values.map(toPrimitiveValue);
  }

  if (value.kvlistValue && Array.isArray(value.kvlistValue.values)) {
    return value.kvlistValue.values.reduce((accumulator, entry) => {
      if (entry && entry.key) {
        accumulator[entry.key] = toPrimitiveValue(entry.value);
      }
      return accumulator;
    }, {});
  }

  return value;
}

function attributesToObject(attributes = []) {
  return attributes.reduce((accumulator, attribute) => {
    if (!attribute || !attribute.key) {
      return accumulator;
    }

    accumulator[attribute.key] = toPrimitiveValue(attribute.value);
    return accumulator;
  }, {});
}

function getServiceName(resource = {}) {
  const attributes = attributesToObject(resource.attributes || []);
  return (
    attributes['service.name']
    || attributes.serviceName
    || attributes.service_name
    || attributes.name
    || 'unknown-service'
  );
}

function safeDateFromUnixNano(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return new Date();
  }

  const millis = Math.floor(numericValue / 1_000_000);
  const parsed = new Date(millis);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function extractDataPointValue(dataPoint = {}) {
  if (Object.prototype.hasOwnProperty.call(dataPoint, 'asDouble')) return Number(dataPoint.asDouble);
  if (Object.prototype.hasOwnProperty.call(dataPoint, 'asInt')) return Number(dataPoint.asInt);
  if (Object.prototype.hasOwnProperty.call(dataPoint, 'value')) return Number(dataPoint.value);
  if (Object.prototype.hasOwnProperty.call(dataPoint, 'sum')) return Number(dataPoint.sum);

  if (dataPoint.value && typeof dataPoint.value === 'object') {
    return Number(toPrimitiveValue(dataPoint.value));
  }

  return Number.NaN;
}

function normalizeLatency(value) {
  if (!Number.isFinite(value)) return null;
  return value > 10 ? value : value * 1000;
}

function isErrorStatus(status = {}) {
  const code = String(status.code || status.statusCode || '').toUpperCase();
  return code === 'STATUS_CODE_ERROR' || code === 'ERROR' || code === '2';
}

function mapMetricToTelemetry(metricName, value) {
  const normalizedName = String(metricName || '').toLowerCase();
  const payload = {};

  if (normalizedName.includes('cpu')) {
    payload.cpu = value;
  } else if (normalizedName.includes('memory') || normalizedName.includes('mem')) {
    payload.memory = value;
  } else if (
    normalizedName.includes('latency')
    || normalizedName.includes('duration')
    || normalizedName.includes('response_time')
    || normalizedName.includes('response-time')
    || normalizedName.includes('request_time')
  ) {
    payload.latency = normalizeLatency(value);
  } else if (normalizedName.includes('error') || normalizedName.includes('failure') || normalizedName.includes('exception')) {
    payload.error_rate = value > 1 ? value / 100 : value;
  } else {
    payload[metricName] = value;
  }

  return payload;
}

function mergeMetrics(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (key === 'latency' && value == null) {
      continue;
    }

    if (value == null || Number.isNaN(value)) {
      continue;
    }

    target[key] = value;
  }

  return target;
}

function buildTelemetryEventsFromTraces(payload) {
  const resourceSpans = Array.isArray(payload?.resourceSpans) ? payload.resourceSpans : [];
  return resourceSpans.flatMap((resourceSpan) => {
    const serviceName = getServiceName(resourceSpan.resource);
    const spans = (resourceSpan.scopeSpans || []).flatMap((scopeSpan) => scopeSpan.spans || []);

    if (spans.length === 0) {
      return [{
        service_name: serviceName,
        timestamp: new Date().toISOString(),
        metrics: {},
        logs: [],
        trace: {},
        rawData: payload,
        sourceSignal: 'traces',
      }];
    }

    const timestamps = spans
      .map((span) => safeDateFromUnixNano(span.startTimeUnixNano || span.endTimeUnixNano))
      .filter((date) => !Number.isNaN(date.getTime()));

    const durationsMs = spans
      .map((span) => {
        const start = Number(span.startTimeUnixNano || 0);
        const end = Number(span.endTimeUnixNano || 0);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
        return (end - start) / 1_000_000;
      })
      .filter((value) => value != null);

    const errorCount = spans.filter((span) => isErrorStatus(span.status)).length;
    const representativeSpan = spans[0] || {};
    const representativeAttributes = attributesToObject(representativeSpan.attributes || []);
    const rootSpan = spans.find((span) => !span.parentSpanId) || representativeSpan;

    const metrics = {};
    if (durationsMs.length > 0) {
      const averageLatency = durationsMs.reduce((sum, value) => sum + value, 0) / durationsMs.length;
      metrics.latency = averageLatency;
    }
    metrics.error_rate = spans.length > 0 ? errorCount / spans.length : 0;

    const logs = spans.map((span) => {
      const attributes = attributesToObject(span.attributes || []);
      const status = span.status?.message || span.status?.code || 'OK';
      return `${span.name || 'span'} :: ${status}${attributes['exception.type'] ? ` :: ${attributes['exception.type']}` : ''}`;
    });

    const trace = {
      trace_id: rootSpan.traceId || null,
      parent_service: representativeAttributes['peer.service'] || representativeAttributes['service.name'] || null,
      depth: spans.length,
      span_name: representativeSpan.name || null,
    };

    return [{
      service_name: serviceName,
      timestamp: (timestamps[0] || new Date()).toISOString(),
      metrics,
      logs,
      trace,
      rawData: payload,
      sourceSignal: 'traces',
    }];
  });
}

function buildTelemetryEventsFromLogs(payload) {
  const resourceLogs = Array.isArray(payload?.resourceLogs) ? payload.resourceLogs : [];
  return resourceLogs.flatMap((resourceLog) => {
    const serviceName = getServiceName(resourceLog.resource);
    const logRecords = (resourceLog.scopeLogs || []).flatMap((scopeLog) => scopeLog.logRecords || []);

    const logs = [];
    let errorCount = 0;
    let timestamp = new Date();
    let trace = null;

    for (const record of logRecords) {
      const body = toPrimitiveValue(record.body);
      const message = typeof body === 'string' ? body : JSON.stringify(body);
      logs.push(message);

      const severity = String(record.severityText || '').toLowerCase();
      if (severity === 'error' || severity === 'fatal' || severity === 'critical') {
        errorCount += 1;
      }

      if (record.timeUnixNano) {
        timestamp = safeDateFromUnixNano(record.timeUnixNano);
      }

      if (!trace && (record.traceId || record.spanId)) {
        trace = {
          trace_id: record.traceId || null,
          parent_service: serviceName,
          depth: 1,
          span_id: record.spanId || null,
        };
      }
    }

    const metrics = {
      error_rate: logRecords.length > 0 ? errorCount / logRecords.length : 0,
    };

    return [{
      service_name: serviceName,
      timestamp: timestamp.toISOString(),
      metrics,
      logs,
      trace,
      rawData: payload,
      sourceSignal: 'logs',
    }];
  });
}

function buildTelemetryEventsFromMetrics(payload) {
  const resourceMetrics = Array.isArray(payload?.resourceMetrics) ? payload.resourceMetrics : [];
  return resourceMetrics.flatMap((resourceMetric) => {
    const serviceName = getServiceName(resourceMetric.resource);
    const metrics = {};
    let timestamp = new Date();

    const allMetrics = (resourceMetric.scopeMetrics || []).flatMap((scopeMetric) => scopeMetric.metrics || []);

    for (const metric of allMetrics) {
      const dataPoints = [
        ...(metric.gauge?.dataPoints || []),
        ...(metric.sum?.dataPoints || []),
        ...(metric.histogram?.dataPoints || []),
        ...(metric.exponentialHistogram?.dataPoints || []),
      ];

      for (const dataPoint of dataPoints) {
        const numericValue = extractDataPointValue(dataPoint);
        if (Number.isNaN(numericValue)) {
          continue;
        }

        if (dataPoint.timeUnixNano) {
          timestamp = safeDateFromUnixNano(dataPoint.timeUnixNano);
        }

        const mapped = mapMetricToTelemetry(metric.name, numericValue);
        mergeMetrics(metrics, mapped);
      }
    }

    return [{
      service_name: serviceName,
      timestamp: timestamp.toISOString(),
      metrics,
      logs: [],
      trace: null,
      rawData: payload,
      sourceSignal: 'metrics',
    }];
  });
}

function buildTelemetryEventsFromOtlp(signalType, payload) {
  if (signalType === 'traces') {
    return buildTelemetryEventsFromTraces(payload);
  }

  if (signalType === 'logs') {
    return buildTelemetryEventsFromLogs(payload);
  }

  if (signalType === 'metrics') {
    return buildTelemetryEventsFromMetrics(payload);
  }

  throw new Error(`Unsupported OTLP signal type: ${signalType}`);
}

module.exports = {
  buildTelemetryEventsFromOtlp,
};
