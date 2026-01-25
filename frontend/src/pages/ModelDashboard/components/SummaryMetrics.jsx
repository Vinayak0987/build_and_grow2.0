/**
 * SummaryMetrics - Auto-generated KPI cards
 * Shows key statistics from analyzed dataset
 */
import {
    Database,
    Hash,
    TrendingUp,
    Layers,
    Target,
    BarChart3
} from 'lucide-react'

export default function SummaryMetrics({ metrics, analysis }) {
    if (!metrics) return null

    const cards = []

    // Total Records
    if (metrics.totalRecords) {
        cards.push({
            icon: Database,
            label: 'Total Records',
            value: metrics.totalRecords.toLocaleString(),
            color: '#3b82f6'
        })
    }

    // Target Classes (if classification)
    if (metrics.targetClasses) {
        cards.push({
            icon: Target,
            label: `${formatLabel(metrics.targetColumn)} Classes`,
            value: metrics.targetClasses,
            color: '#8b5cf6'
        })
    }

    // Unique Categories
    if (metrics.uniqueCategories && metrics.categoryColumn) {
        cards.push({
            icon: Layers,
            label: `Unique ${formatLabel(metrics.categoryColumn)}`,
            value: metrics.uniqueCategories.toLocaleString(),
            color: '#10b981'
        })
    }

    // Numeric summaries
    Object.entries(metrics).forEach(([key, value]) => {
        if (key.endsWith('_avg') && typeof value === 'number') {
            const colName = key.replace('_avg', '')
            cards.push({
                icon: TrendingUp,
                label: `Avg ${formatLabel(colName)}`,
                value: formatNumber(value),
                color: '#f59e0b'
            })
        }
        if (key.endsWith('_sum') && typeof value === 'number' && cards.length < 6) {
            const colName = key.replace('_sum', '')
            cards.push({
                icon: Hash,
                label: `Total ${formatLabel(colName)}`,
                value: formatNumber(value),
                color: '#06b6d4'
            })
        }
    })

    // Dimensions and metrics count
    if (analysis?.dimensions?.length) {
        cards.push({
            icon: BarChart3,
            label: 'Dimensions',
            value: analysis.dimensions.length,
            color: '#ec4899'
        })
    }

    return (
        <div className="summary-metrics">
            {cards.slice(0, 6).map((card, i) => (
                <div
                    key={i}
                    className="metric-card"
                    style={{ '--accent-color': card.color }}
                >
                    <div className="metric-icon" style={{ background: `${card.color}20`, color: card.color }}>
                        <card.icon size={20} />
                    </div>
                    <div className="metric-content">
                        <div className="metric-value">{card.value}</div>
                        <div className="metric-label">{card.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function formatLabel(name) {
    if (!name) return ''
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

function formatNumber(num) {
    if (num === undefined || num === null) return '—'
    if (Math.abs(num) >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    }
    if (Math.abs(num) >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    if (Number.isInteger(num)) {
        return num.toLocaleString()
    }
    return num.toFixed(2)
}
