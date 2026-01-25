/**
 * SmartChart - Google Analytics Style Charts
 * Multi-series line charts, horizontal bars, and detailed tables
 */
import { useMemo } from 'react'
import {
    LineChart,
    Line,
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
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { TrendingUp, BarChart3 } from 'lucide-react'
import {
    aggregateByColumn,
    createHistogram,
    aggregateTimeSeries,
    formatColumnName
} from '../utils/DataAnalyzer'

// Google Analytics inspired color palette
const GA_COLORS = [
    '#4285f4', // Google Blue
    '#ea4335', // Google Red  
    '#fbbc04', // Google Yellow
    '#34a853', // Google Green
    '#ff6d01', // Orange
    '#46bdc6', // Teal
    '#7baaf7', // Light Blue
    '#f07b72', // Light Red
]

// Custom Tooltip (GA Style)
const GATooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff',
                border: '1px solid #dadce0',
                borderRadius: '8px',
                padding: '12px 16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                minWidth: '150px'
            }}>
                <p style={{
                    margin: 0,
                    fontWeight: 500,
                    color: '#202124',
                    fontSize: '13px',
                    marginBottom: '8px',
                    borderBottom: '1px solid #e8eaed',
                    paddingBottom: '6px'
                }}>
                    {label}
                </p>
                {payload.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginTop: '4px'
                    }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: '#5f6368'
                        }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: item.color
                            }}></span>
                            {item.name}
                        </span>
                        <strong style={{ color: '#202124', fontSize: '12px' }}>
                            {formatValue(item.value)}
                        </strong>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

function formatValue(val) {
    if (typeof val !== 'number') return val
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + 'M'
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(2) + 'K'
    return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)
}

export default function SmartChart({ chartConfig, data, height = 300, colors = GA_COLORS }) {
    // Generate chart data based on config
    const chartData = useMemo(() => {
        if (!data || !chartConfig) return { data: [], series: [] }

        const { type, columns, aggregation = 'count' } = chartConfig

        switch (type) {
            case 'multiLine':
            case 'gaLine':
            case 'smoothLine':
                return generateMultiSeriesData(data, columns, aggregation)

            case 'horizontalBar':
            case 'gaBar':
                return {
                    data: aggregateByColumn(data, columns[0], columns[1], aggregation).slice(0, 8),
                    series: ['value']
                }

            case 'stackedBar':
                return generateMultiSeriesData(data, columns, aggregation)

            case 'donut':
            case 'pie':
                return {
                    data: aggregateByColumn(data, columns[0], columns[1], aggregation).slice(0, 6),
                    series: ['value']
                }

            case 'area':
            case 'line':
                if (columns.length >= 2) {
                    return {
                        data: aggregateTimeSeries(data, columns[0], columns[1], aggregation),
                        series: ['value']
                    }
                }
                return {
                    data: aggregateTimeSeries(data, columns[0], null, 'count'),
                    series: ['value']
                }

            case 'histogram':
                return {
                    data: createHistogram(data, columns[0], 10),
                    series: ['value']
                }

            default:
                return {
                    data: aggregateByColumn(data, columns[0], columns[1], aggregation).slice(0, 10),
                    series: ['value']
                }
        }
    }, [data, chartConfig])

    if (!chartData.data || chartData.data.length === 0) {
        return (
            <div className="ga-chart-card" style={{ minHeight: height }}>
                <div className="ga-chart-header">
                    <div className="ga-chart-title">{chartConfig?.title || 'Chart'}</div>
                </div>
                <div className="ga-chart-empty">No data available</div>
            </div>
        )
    }

    return (
        <div className="ga-chart-card">
            <div className="ga-chart-header">
                <div className="ga-chart-title">
                    {chartConfig.type.includes('Line') || chartConfig.type === 'area' ?
                        <TrendingUp size={16} /> : <BarChart3 size={16} />}
                    {chartConfig.title}
                </div>
            </div>
            <div className="ga-chart-body" style={{ height }}>
                {renderChart(chartConfig.type, chartData, height, colors, chartConfig.showComparison)}
            </div>
        </div>
    )
}

function generateMultiSeriesData(data, columns, aggregation) {
    if (columns.length < 2) return { data: [], series: [] }

    const [timeCol, categoryCol, valueCol] = columns

    // Get unique categories
    const categories = [...new Set(data.map(row => String(row[categoryCol] || 'Other')))]
        .slice(0, 6) // Max 6 series

    // Get unique time points
    const timePoints = [...new Set(data.map(row => String(row[timeCol] || '')))]
        .filter(t => t)
        .sort()

    // Build multi-series data
    const seriesData = timePoints.map(time => {
        const point = { name: time }
        categories.forEach(cat => {
            const matching = data.filter(row =>
                String(row[timeCol]) === time &&
                String(row[categoryCol]) === cat
            )
            if (valueCol) {
                point[cat] = matching.reduce((sum, row) => sum + (parseFloat(row[valueCol]) || 0), 0)
            } else {
                point[cat] = matching.length
            }
        })
        return point
    })

    return { data: seriesData, series: categories }
}

function renderChart(type, chartData, height, colors, showComparison = false) {
    switch (type) {
        case 'multiLine':
        case 'gaLine':
        case 'smoothLine':
            return <GALineChart data={chartData.data} series={chartData.series} height={height} colors={colors} showComparison={showComparison} />
        case 'horizontalBar':
        case 'gaBar':
            return <GAHorizontalBar data={chartData.data} height={height} colors={colors} />
        case 'stackedBar':
            return <GAStackedBar data={chartData.data} series={chartData.series} height={height} colors={colors} />
        case 'donut':
        case 'pie':
            return <GADonutChart data={chartData.data} height={height} colors={colors} isPie={type === 'pie'} />
        case 'area':
            return <GAAreaChart data={chartData.data} height={height} colors={colors} showComparison={showComparison} />
        case 'line':
            return <GASingleLineChart data={chartData.data} height={height} colors={colors} showComparison={showComparison} />
        case 'histogram':
        case 'bar':
            return <GAVerticalBar data={chartData.data} height={height} colors={colors} />
        default:
            return <GAVerticalBar data={chartData.data} height={height} colors={colors} />
    }
}

// Google Analytics Multi-Line Chart
function GALineChart({ data, series, height, colors = GA_COLORS, showComparison = false }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                />
                <YAxis
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<GATooltip />} />
                <Legend
                    verticalAlign="bottom"
                    align="left"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                        paddingTop: '10px',
                        fontSize: '12px'
                    }}
                    formatter={(value) => <span style={{ color: '#5f6368' }}>{value}</span>}
                />
                {series.map((s, i) => (
                    <Line
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={colors[i % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                ))}
                {showComparison && (
                    <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="#9e9e9e"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                    />
                )}
            </LineChart>
        </ResponsiveContainer>
    )
}

// Single Line Chart
function GASingleLineChart({ data, height, colors = GA_COLORS, showComparison = false }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                />
                <YAxis
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<GATooltip />} />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={colors[0]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    name="Value"
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

// Area Chart
function GAAreaChart({ data, height, colors = GA_COLORS, showComparison = false }) {
    const mainColor = colors[0]
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
                <defs>
                    <linearGradient id="gaAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={mainColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={mainColor} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                />
                <YAxis
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<GATooltip />} />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={mainColor}
                    strokeWidth={2}
                    fill="url(#gaAreaGradient)"
                    name="Value"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// Horizontal Bar Chart (GA Style)
function GAHorizontalBar({ data, height, colors = GA_COLORS }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" horizontal={false} />
                <XAxis
                    type="number"
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={11}
                    width={95}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val?.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <Tooltip content={<GATooltip />} />
                <Bar
                    dataKey="value"
                    fill={colors[0]}
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                    name="Value"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Vertical Bar Chart
function GAVerticalBar({ data, height, colors = GA_COLORS }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                    tickFormatter={(val) => val?.length > 12 ? val.substring(0, 12) + '...' : val}
                />
                <YAxis
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<GATooltip />} />
                <Bar
                    dataKey="value"
                    fill={colors[1] || colors[0]}
                    radius={[4, 4, 0, 0]}
                    name="Value"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

// Stacked Bar Chart
function GAStackedBar({ data, series, height, colors = GA_COLORS }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#5f6368"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    tickLine={false}
                    axisLine={{ stroke: '#e8eaed' }}
                />
                <YAxis
                    stroke="#5f6368"
                    fontSize={11}
                    tickFormatter={formatValue}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<GATooltip />} />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                {series.map((s, i) => (
                    <Bar
                        key={s}
                        dataKey={s}
                        stackId="a"
                        fill={colors[i % colors.length]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    )
}

// Donut/Pie Chart
function GADonutChart({ data, height, colors = GA_COLORS, isPie = false }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={isPie ? 0 : 50}
                    outerRadius={80}
                    paddingAngle={isPie ? 0 : 2}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            stroke="transparent"
                        />
                    ))}
                </Pie>
                <Tooltip content={<GATooltip />} />
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span style={{ color: '#5f6368' }}>{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
