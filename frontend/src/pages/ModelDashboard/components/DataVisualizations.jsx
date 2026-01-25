/**
 * Data Visualizations Component
 * Automatic chart generation based on data types
 */
import { useState, useEffect, useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Layers, Filter } from 'lucide-react'

// Professional color palette
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1']
const GRADIENT_COLORS = [
    ['#3b82f6', '#1d4ed8'],
    ['#10b981', '#047857'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
]

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    {label}
                </p>
                {payload.map((item, i) => (
                    <p key={i} style={{ margin: 0, fontSize: '0.875rem', color: item.color || '#94a3b8' }}>
                        {item.name}: <strong>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</strong>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Donut Chart Component
function DonutChart({ data, title, dataKey = 'value', nameKey = 'name', colors = COLORS }) {
    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0)

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title">
                    <PieChartIcon size={18} style={{ color: 'var(--color-primary-light)' }} />
                    {title}
                </div>
            </div>
            <div className="chart-container" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey={dataKey}
                            nameKey={nameKey}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                    stroke="transparent"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span style={{ color: '#f8fafc', fontSize: '0.75rem' }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', marginTop: '-20px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {total.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total</div>
            </div>
        </div>
    )
}

// Horizontal Bar Chart Component
function HorizontalBarChart({ data, title, dataKey = 'value', nameKey = 'name', color = '#3b82f6' }) {
    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title">
                    <BarChart3 size={18} style={{ color: 'var(--color-primary-light)' }} />
                    {title}
                </div>
            </div>
            <div className="chart-container" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey={nameKey}
                            stroke="#94a3b8"
                            fontSize={12}
                            width={75}
                            tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// Stacked Bar Chart for Quarterly/Category Data
function StackedBarChart({ data, title, categories, colors = COLORS }) {
    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title">
                    <Layers size={18} style={{ color: 'var(--color-primary-light)' }} />
                    {title}
                </div>
            </div>
            <div className="chart-container" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            formatter={(value) => <span style={{ color: '#f8fafc', fontSize: '0.75rem' }}>{value}</span>}
                        />
                        {categories.map((cat, i) => (
                            <Bar
                                key={cat}
                                dataKey={cat}
                                stackId="a"
                                fill={colors[i % colors.length]}
                                radius={i === categories.length - 1 ? [0, 4, 4, 0] : 0}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// Area Chart for Trends
function TrendAreaChart({ data, title, dataKey = 'value', xKey = 'name' }) {
    return (
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-header">
                <div className="chart-title">
                    <TrendingUp size={18} style={{ color: 'var(--color-primary-light)' }} />
                    {title}
                </div>
            </div>
            <div className="chart-container" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={xKey}
                            stroke="#94a3b8"
                            fontSize={11}
                            tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) : val}
                        />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#areaGradient)"
                        />
                        {/* Average line */}
                        <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                            strokeWidth={1}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// Vertical Bar Chart
function VerticalBarChart({ data, title, dataKey = 'value', xKey = 'name', color = '#8b5cf6' }) {
    return (
        <div className="chart-card">
            <div className="chart-header">
                <div className="chart-title">
                    <BarChart3 size={18} style={{ color: 'var(--color-primary-light)' }} />
                    {title}
                </div>
            </div>
            <div className="chart-container" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data.slice(0, 10)}
                        margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={xKey}
                            stroke="#94a3b8"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                        />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// Main Data Visualizations Component
export default function DataVisualizations({ data, columns, targetColumn }) {
    const [selectedColumn, setSelectedColumn] = useState(null)

    // Analyze columns and generate chart data
    const chartData = useMemo(() => {
        if (!data || !columns || data.length === 0) return null

        const result = {
            categoricalCharts: [],
            numericDistributions: [],
            timeSeriesData: null,
            correlations: []
        }

        // Detect column types and aggregate
        columns.forEach(col => {
            // Skip ID-like columns
            if (col.toLowerCase().includes('id') && col.length <= 10) return

            // Get sample values
            const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
            if (values.length === 0) return

            // Check if numeric
            const numericValues = values.filter(v => !isNaN(parseFloat(v)))
            const isNumeric = numericValues.length > values.length * 0.8

            // Check if date/time
            const isDateTime = col.toLowerCase().includes('date') ||
                col.toLowerCase().includes('time') ||
                col.toLowerCase().includes('month') ||
                col.toLowerCase().includes('year')

            if (isDateTime) {
                // Time series data
                const aggregated = {}
                data.forEach(row => {
                    const key = String(row[col])
                    if (!aggregated[key]) {
                        aggregated[key] = { name: key, count: 0, total: 0 }
                    }
                    aggregated[key].count += 1
                    // Try to sum a numeric column
                    columns.forEach(numCol => {
                        const val = parseFloat(row[numCol])
                        if (!isNaN(val) && numCol !== col) {
                            if (!aggregated[key][numCol]) aggregated[key][numCol] = 0
                            aggregated[key][numCol] += val
                        }
                    })
                })
                result.timeSeriesData = {
                    column: col,
                    data: Object.values(aggregated).sort((a, b) => {
                        if (a.name < b.name) return -1
                        if (a.name > b.name) return 1
                        return 0
                    })
                }
            } else if (!isNumeric) {
                // Categorical column - aggregate
                const counts = {}
                data.forEach(row => {
                    const val = String(row[col] || 'Unknown')
                    counts[val] = (counts[val] || 0) + 1
                })

                const uniqueCount = Object.keys(counts).length

                // Only create charts for columns with reasonable cardinality
                if (uniqueCount >= 2 && uniqueCount <= 20) {
                    const chartData = Object.entries(counts)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)

                    result.categoricalCharts.push({
                        column: col,
                        data: chartData,
                        uniqueCount,
                        // Use donut for few categories, bar for many
                        chartType: uniqueCount <= 6 ? 'donut' : 'bar'
                    })
                }
            } else {
                // Numeric column - create distribution
                const numVals = numericValues.map(v => parseFloat(v))
                const min = Math.min(...numVals)
                const max = Math.max(...numVals)
                const sum = numVals.reduce((a, b) => a + b, 0)
                const avg = sum / numVals.length

                // Create histogram buckets
                const bucketCount = 10
                const bucketSize = (max - min) / bucketCount || 1
                const buckets = Array(bucketCount).fill(0)

                numVals.forEach(v => {
                    const bucketIndex = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1)
                    buckets[bucketIndex]++
                })

                result.numericDistributions.push({
                    column: col,
                    min,
                    max,
                    avg,
                    sum,
                    data: buckets.map((count, i) => ({
                        name: `${(min + i * bucketSize).toFixed(1)}`,
                        value: count
                    }))
                })
            }
        })

        // Sort by number of unique values (prioritize more interesting charts)
        result.categoricalCharts.sort((a, b) => {
            // Prioritize target column if exists
            if (a.column === targetColumn) return -1
            if (b.column === targetColumn) return 1
            return b.uniqueCount - a.uniqueCount
        })

        return result
    }, [data, columns, targetColumn])

    if (!chartData) {
        return (
            <div className="info-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <BarChart3 size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--color-text-main)' }}>No Data for Visualization</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Upload data to see automatic visualizations</p>
            </div>
        )
    }

    return (
        <div className="data-visualizations">
            <div className="visualization-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--color-text-main)',
                    fontSize: '1.125rem',
                    fontWeight: 600
                }}>
                    <BarChart3 size={20} />
                    Data Visualizations
                </h3>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                }}>
                    <span className="badge badge-info">{chartData.categoricalCharts.length} Categorical</span>
                    <span className="badge badge-success">{chartData.numericDistributions.length} Numeric</span>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Categorical Charts - First Row */}
                {chartData.categoricalCharts.slice(0, 4).map((chart, i) => (
                    chart.chartType === 'donut' ? (
                        <DonutChart
                            key={chart.column}
                            data={chart.data}
                            title={`${chart.column.replace(/_/g, ' ')} Distribution`}
                        />
                    ) : (
                        <HorizontalBarChart
                            key={chart.column}
                            data={chart.data}
                            title={`${chart.column.replace(/_/g, ' ')} Breakdown`}
                            color={COLORS[i % COLORS.length]}
                        />
                    )
                ))}
            </div>

            {/* Time Series / Trend Chart */}
            {chartData.timeSeriesData && chartData.timeSeriesData.data.length > 2 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <TrendAreaChart
                        data={chartData.timeSeriesData.data.map(d => ({
                            ...d,
                            value: d.count,
                            average: chartData.timeSeriesData.data.reduce((s, x) => s + x.count, 0) / chartData.timeSeriesData.data.length
                        }))}
                        title={`${chartData.timeSeriesData.column.replace(/_/g, ' ')} Trend`}
                    />
                </div>
            )}

            {/* More Categorical Charts */}
            {chartData.categoricalCharts.length > 4 && (
                <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
                    {chartData.categoricalCharts.slice(4, 8).map((chart, i) => (
                        <VerticalBarChart
                            key={chart.column}
                            data={chart.data}
                            title={`Top ${chart.column.replace(/_/g, ' ')}`}
                            color={COLORS[(i + 4) % COLORS.length]}
                        />
                    ))}
                </div>
            )}

            {/* Numeric Distributions */}
            {chartData.numericDistributions.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: '1rem'
                    }}>
                        Numeric Distributions
                    </h4>
                    <div className="charts-grid">
                        {chartData.numericDistributions.slice(0, 4).map((dist, i) => (
                            <VerticalBarChart
                                key={dist.column}
                                data={dist.data}
                                title={`${dist.column.replace(/_/g, ' ')} Distribution`}
                                color={COLORS[(i + 2) % COLORS.length]}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
