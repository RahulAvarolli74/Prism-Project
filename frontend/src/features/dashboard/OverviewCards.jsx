import React from 'react'
import { Activity, AlertTriangle, Server, ShieldCheck } from 'lucide-react'
import MetricCard from '../../components/ui/MetricCard'
import { formatCompactNumber, formatPercent } from '../../utils/formatters'

export default function OverviewCards({ summary, services }) {
  const serviceCounts = services.reduce(
    (accumulator, service) => {
      if (service.status === 'healthy') accumulator.healthy += 1
      else if (service.status === 'warning') accumulator.warning += 1
      else if (service.status === 'critical') accumulator.critical += 1
      else accumulator.unknown += 1

      return accumulator
    },
    { healthy: 0, warning: 0, critical: 0, unknown: 0 }
  )

  const cards = [
    {
      title: 'Total services',
      value: formatCompactNumber(summary?.overview?.totalServices ?? services.length),
      change: `${formatCompactNumber(summary?.overview?.totalTelemetry ?? 0)} telemetry points`,
      hint: 'Registered microservices',
      icon: <Server size={18} />,
      tone: 'accent',
    },
    {
      title: 'Healthy services',
      value: formatCompactNumber(serviceCounts.healthy),
      change: `${formatCompactNumber(serviceCounts.warning + serviceCounts.critical)} at risk`,
      hint: 'Fleet health snapshot',
      icon: <ShieldCheck size={18} />,
      tone: 'success',
    },
    {
      title: 'Failing services',
      value: formatCompactNumber(serviceCounts.critical),
      change: `${formatCompactNumber(serviceCounts.warning)} degraded`,
      hint: 'Immediate intervention required',
      icon: <AlertTriangle size={18} />,
      tone: 'critical',
    },
    {
      title: 'Failure rate',
      value: formatPercent(summary?.overview?.failureRate ?? 0),
      change: `${formatCompactNumber(summary?.overview?.totalFailures ?? 0)} total failures`,
      hint: 'Prediction-driven failure density',
      icon: <Activity size={18} />,
      tone: 'warning',
    },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  )
}