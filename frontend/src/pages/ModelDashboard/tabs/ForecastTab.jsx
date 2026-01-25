/**
 * Forecast Tab - Model Dashboard
 * Shows 7-day forecast per product with table, visualization chart, and AI recommendations
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    TrendingUp,
    Loader2,
    AlertCircle,
    Calendar,
    RefreshCw,
    BarChart3,
    Package,
    Sparkles,
    Lightbulb,
    AlertTriangle,
    CheckCircle,
    ShoppingCart,
    TrendingDown
} from 'lucide-react'
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
    Area,
    AreaChart
} from 'recharts'
import { modelDashboardApi } from '../../../services/modelDashboardApi'
import '../AnalyticsDashboard.css'

// Product colors for chart lines
const PRODUCT_COLORS = [
    '#4285f4', '#ea4335', '#34a853', '#fbbc04', '#ff6d01',
    '#46bdc6', '#7c4dff', '#ff6b6b', '#4ecdc4', '#45b7d1'
]

// Generate demo forecast data for multiple products
const generateMultiProductForecast = (model) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Demo products - in production, this would come from the dataset
    const products = [
        { name: 'Amul Milk 1L', baseValue: 35 },
        { name: 'Britannia Bread', baseValue: 22 },
        { name: 'Coca Cola 750ml', baseValue: 28 },
        { name: 'Lays Classic 52g', baseValue: 20 },
        { name: 'Mother Dairy Curd', baseValue: 25 }
    ]

    const forecasts = products.map((product, productIdx) => {
        const predictions = days.map((day, dayIdx) => {
            const variation = Math.sin(dayIdx * 0.8 + productIdx) * 8 + Math.random() * 5
            const predicted = Math.round(product.baseValue + variation)
            const confidence = 0.12 + Math.random() * 0.08
            return {
                day_name: day,
                day_short: day.slice(0, 3),
                predicted_quantity: predicted,
                confidence_lower: Math.round(predicted * (1 - confidence)),
                confidence_upper: Math.round(predicted * (1 + confidence)),
                date: getNextDate(dayIdx)
            }
        })

        return {
            product_name: product.name,
            predictions,
            total_predicted: predictions.reduce((sum, p) => sum + p.predicted_quantity, 0),
            color: PRODUCT_COLORS[productIdx % PRODUCT_COLORS.length]
        }
    })

    return {
        forecasts,
        model_accuracy: 85 + Math.random() * 10,
        total_products: products.length,
        total_forecast: forecasts.reduce((sum, f) => sum + f.total_predicted, 0),
        last_updated: new Date().toISOString()
    }
}

// Generate AI recommendations based on forecast data
const generateAIRecommendations = (forecastData) => {
    // Find highest and lowest demand products
    const sortedProducts = [...forecastData.forecasts].sort(
        (a, b) => b.total_predicted - a.total_predicted
    )
    const highestDemand = sortedProducts[0]
    const lowestDemand = sortedProducts[sortedProducts.length - 1]

    // Find peak days
    const dailyTotals = [0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
        day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx],
        total: forecastData.forecasts.reduce(
            (sum, p) => sum + (p.predictions[dayIdx]?.predicted_quantity || 0), 0
        )
    }))
    const peakDay = dailyTotals.reduce((max, d) => d.total > max.total ? d : max)
    const slowestDay = dailyTotals.reduce((min, d) => d.total < min.total ? d : min)

    return {
        summary: `Based on your forecast data, I've analyzed demand patterns for ${forecastData.total_products} products over the next 7 days. The total predicted demand is ${forecastData.total_forecast} units with a model accuracy of ${forecastData.model_accuracy.toFixed(1)}%.`,

        insights: [
            {
                type: 'high_demand',
                icon: 'trending_up',
                title: 'Highest Demand Product',
                content: `${highestDemand.product_name} shows the highest demand with ${highestDemand.total_predicted} units forecasted. Consider increasing stock levels by 15-20% to avoid stockouts.`,
                priority: 'high'
            },
            {
                type: 'peak_day',
                icon: 'calendar',
                title: 'Peak Sales Day',
                content: `${peakDay.day} is projected to be your busiest day with ${peakDay.total} total units. Ensure adequate staffing and inventory for this day.`,
                priority: 'high'
            },
            {
                type: 'low_demand',
                icon: 'trending_down',
                title: 'Low Demand Alert',
                content: `${lowestDemand.product_name} has the lowest forecast (${lowestDemand.total_predicted} units). Consider promotional offers or bundling with high-demand items.`,
                priority: 'medium'
            },
            {
                type: 'slow_day',
                icon: 'alert',
                title: 'Slowest Day',
                content: `${slowestDay.day} typically has lower foot traffic (${slowestDay.total} units). This could be a good day for inventory restocking or staff training.`,
                priority: 'low'
            }
        ],

        actions: [
            {
                title: 'Restock Recommendations',
                items: sortedProducts.slice(0, 3).map(p => ({
                    product: p.product_name,
                    suggested_order: Math.round(p.total_predicted * 1.15),
                    reason: 'Based on 7-day forecast + 15% safety stock'
                }))
            }
        ],

        weeklyTrend: peakDay.total > slowestDay.total * 1.3
            ? 'Weekend demand is significantly higher than weekdays. Plan staffing accordingly.'
            : 'Demand is relatively consistent throughout the week.',

        confidence: forecastData.model_accuracy
    }
}

// Get date for next N days
const getNextDate = (daysFromNow) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Custom tooltip for charts
const ForecastTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null

    return (
        <div className="ga-tooltip">
            <div className="ga-tooltip-header">{label}</div>
            <div className="ga-tooltip-content">
                {payload.map((entry, i) => (
                    <div key={i} className="ga-tooltip-row">
                        <span
                            className="ga-tooltip-dot"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="ga-tooltip-label">{entry.name}:</span>
                        <span className="ga-tooltip-value">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ForecastTab({ model, modelId }) {
    const [chartType, setChartType] = useState('line')
    const [selectedProducts, setSelectedProducts] = useState([])
    const [showRecommendations, setShowRecommendations] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [recommendations, setRecommendations] = useState(null)
    const [selectedDetailProduct, setSelectedDetailProduct] = useState('')


    // Generate demo data (in production, this would be an API call)
    const forecastData = useMemo(() => generateMultiProductForecast(model), [model])

    // Initialize selected products
    useMemo(() => {
        if (selectedProducts.length === 0 && forecastData.forecasts.length > 0) {
            setSelectedProducts(forecastData.forecasts.slice(0, 3).map(f => f.product_name))
        }
    }, [forecastData])

    // Prepare chart data
    const chartData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return days.map((day, dayIdx) => {
            const dayData = { name: day, date: getNextDate(dayIdx) }
            forecastData.forecasts.forEach(product => {
                if (selectedProducts.includes(product.product_name)) {
                    dayData[product.product_name] = product.predictions[dayIdx]?.predicted_quantity || 0
                }
            })
            return dayData
        })
    }, [forecastData, selectedProducts])

    // Toggle product selection
    const toggleProduct = (productName) => {
        setSelectedProducts(prev => {
            if (prev.includes(productName)) {
                return prev.filter(p => p !== productName)
            } else {
                return [...prev, productName]
            }
        })
    }

    // Generate AI recommendations
    const handleGenerateRecommendations = async () => {
        setIsGenerating(true)
        setShowRecommendations(true)

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // In production, this would call the LLM API
        // const response = await modelDashboardApi.getRecommendations(modelId, forecastData)
        const aiRecommendations = generateAIRecommendations(forecastData)

        setRecommendations(aiRecommendations)
        setIsGenerating(false)
    }

    // Get icon for recommendation type
    const getInsightIcon = (type) => {
        switch (type) {
            case 'high_demand': return <TrendingUp size={18} />
            case 'low_demand': return <TrendingDown size={18} />
            case 'peak_day': return <Calendar size={18} />
            case 'slow_day': return <AlertTriangle size={18} />
            default: return <Lightbulb size={18} />
        }
    }

    // Get priority badge class
    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'high': return 'priority-high'
            case 'medium': return 'priority-medium'
            default: return 'priority-low'
        }
    }

    return (
        <div className="forecast-tab">
            {/* Header Section */}
            <div className="forecast-header-section">
                <div className="forecast-summary-cards">
                    <div className="summary-card primary">
                        <div className="summary-icon">
                            <TrendingUp size={24} />
                        </div>
                        <div className="summary-content">
                            <div className="summary-value">{forecastData.total_forecast}</div>
                            <div className="summary-label">Total 7-Day Forecast</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">
                            <Package size={24} />
                        </div>
                        <div className="summary-content">
                            <div className="summary-value">{forecastData.total_products}</div>
                            <div className="summary-label">Products Forecasted</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">
                            <BarChart3 size={24} />
                        </div>
                        <div className="summary-content">
                            <div className="summary-value">{forecastData.model_accuracy.toFixed(1)}%</div>
                            <div className="summary-label">Model Accuracy</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">
                            <Calendar size={24} />
                        </div>
                        <div className="summary-content">
                            <div className="summary-value">7 Days</div>
                            <div className="summary-label">Forecast Horizon</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendations Button */}
            <div className="ai-recommendations-trigger">
                <button
                    className="btn btn-ai-recommend"
                    onClick={handleGenerateRecommendations}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Analyzing Forecast...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Get AI Recommendations
                        </>
                    )}
                </button>
                <span className="ai-hint">
                    Let AI analyze your forecast data and provide actionable insights
                </span>
            </div>

            {/* AI Recommendations Panel */}
            {showRecommendations && (
                <div className="ai-recommendations-panel">
                    <div className="ai-panel-header">
                        <div className="ai-header-left">
                            <Sparkles size={22} className="ai-icon" />
                            <h3>AI-Powered Recommendations</h3>
                        </div>
                        <button
                            className="btn btn-close-ai"
                            onClick={() => setShowRecommendations(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {isGenerating ? (
                        <div className="ai-loading">
                            <div className="ai-loading-animation">
                                <Sparkles size={32} className="pulse-icon" />
                            </div>
                            <p>Analyzing your forecast data with AI...</p>
                            <span>This may take a few seconds</span>
                        </div>
                    ) : recommendations ? (
                        <div className="ai-recommendations-content">
                            {/* Summary */}
                            <div className="ai-summary">
                                <p>{recommendations.summary}</p>
                            </div>

                            {/* Insights Grid */}
                            <div className="ai-insights-grid">
                                {recommendations.insights.map((insight, idx) => (
                                    <div
                                        key={idx}
                                        className={`ai-insight-card ${getPriorityClass(insight.priority)}`}
                                    >
                                        <div className="insight-icon">
                                            {getInsightIcon(insight.type)}
                                        </div>
                                        <div className="insight-content">
                                            <h4>{insight.title}</h4>
                                            <p>{insight.content}</p>
                                        </div>
                                        <span className={`priority-badge ${insight.priority}`}>
                                            {insight.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Restock Recommendations */}
                            <div className="ai-restock-section">
                                <h4>
                                    <ShoppingCart size={18} />
                                    Suggested Restock Orders
                                </h4>
                                <div className="restock-items">
                                    {recommendations.actions[0]?.items.map((item, idx) => (
                                        <div key={idx} className="restock-item">
                                            <div className="restock-product">
                                                <span className="restock-rank">#{idx + 1}</span>
                                                {item.product}
                                            </div>
                                            <div className="restock-details">
                                                <span className="restock-qty">{item.suggested_order} units</span>
                                                <span className="restock-reason">{item.reason}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly Trend */}
                            <div className="ai-trend-note">
                                <Lightbulb size={16} />
                                <span>{recommendations.weeklyTrend}</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Total Quantity Sold Forecast Chart - Daily Totals */}
            <div className="ga-card forecast-chart-card">
                <div className="ga-card-header">
                    <h3>📊 {model?.target_column || 'quantity_sold'} Forecast</h3>
                    <div className="chart-controls">
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="chart-type-select"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                        </select>
                    </div>
                </div>
                <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart
                                data={[0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
                                    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx],
                                    Forecast: forecastData.forecasts.reduce(
                                        (sum, p) => sum + (p.predictions[dayIdx]?.predicted_quantity || 0), 0
                                    )
                                }))}
                                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                <Bar dataKey="Forecast" fill="#4285f4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : chartType === 'area' ? (
                            <AreaChart
                                data={[0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
                                    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx],
                                    Forecast: forecastData.forecasts.reduce(
                                        (sum, p) => sum + (p.predictions[dayIdx]?.predicted_quantity || 0), 0
                                    )
                                }))}
                                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4285f4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4285f4" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="Forecast"
                                    stroke="#4285f4"
                                    strokeWidth={2}
                                    fill="url(#totalGradient)"
                                />
                            </AreaChart>
                        ) : (
                            <LineChart
                                data={[0, 1, 2, 3, 4, 5, 6].map(dayIdx => ({
                                    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx],
                                    Forecast: forecastData.forecasts.reduce(
                                        (sum, p) => sum + (p.predictions[dayIdx]?.predicted_quantity || 0), 0
                                    )
                                }))}
                                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="Forecast"
                                    stroke="#4285f4"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#4285f4' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Product Selection */}
            <div className="product-selection-bar">
                <span className="selection-label">Select Products:</span>
                <div className="product-chips">
                    {forecastData.forecasts.map((product, idx) => (
                        <button
                            key={product.product_name}
                            className={`product-chip ${selectedProducts.includes(product.product_name) ? 'active' : ''}`}
                            onClick={() => toggleProduct(product.product_name)}
                            style={{
                                '--chip-color': product.color,
                                borderColor: selectedProducts.includes(product.product_name) ? product.color : 'transparent'
                            }}
                        >
                            <span
                                className="chip-dot"
                                style={{ backgroundColor: product.color }}
                            />
                            {product.product_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Section */}
            <div className="ga-card forecast-chart-card">
                <div className="ga-card-header">
                    <h3>📈 Product Forecast Comparison</h3>
                    <div className="chart-controls">
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="chart-type-select"
                        >
                            <option value="line">Line Chart</option>
                            <option value="bar">Bar Chart</option>
                            <option value="area">Area Chart</option>
                        </select>
                    </div>
                </div>
                <div className="chart-container" style={{ height: 380 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                {forecastData.forecasts
                                    .filter(p => selectedProducts.includes(p.product_name))
                                    .map((product) => (
                                        <Bar
                                            key={product.product_name}
                                            dataKey={product.product_name}
                                            fill={product.color}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    ))
                                }
                            </BarChart>
                        ) : chartType === 'area' ? (
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    {forecastData.forecasts.map((product, idx) => (
                                        <linearGradient key={product.product_name} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={product.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={product.color} stopOpacity={0.05} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                {forecastData.forecasts
                                    .filter(p => selectedProducts.includes(p.product_name))
                                    .map((product, idx) => (
                                        <Area
                                            key={product.product_name}
                                            type="monotone"
                                            dataKey={product.product_name}
                                            stroke={product.color}
                                            strokeWidth={2}
                                            fill={`url(#gradient-${forecastData.forecasts.findIndex(f => f.product_name === product.product_name)})`}
                                        />
                                    ))
                                }
                            </AreaChart>
                        ) : (
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                {forecastData.forecasts
                                    .filter(p => selectedProducts.includes(p.product_name))
                                    .map((product) => (
                                        <Line
                                            key={product.product_name}
                                            type="monotone"
                                            dataKey={product.product_name}
                                            stroke={product.color}
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: product.color }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))
                                }
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Individual Product Forecast with Min/Max */}
            <div className="ga-card forecast-chart-card">
                <div className="ga-card-header">
                    <h3>📉 Individual Product Forecast with Confidence Bounds</h3>
                    <div className="chart-controls">
                        <select
                            value={selectedDetailProduct}
                            onChange={(e) => setSelectedDetailProduct(e.target.value)}
                            className="chart-type-select product-select"
                        >
                            <option value="">Select a product...</option>
                            {forecastData.forecasts.map((product) => (
                                <option key={product.product_name} value={product.product_name}>
                                    {product.product_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {selectedDetailProduct ? (
                    <div className="chart-container" style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={forecastData.forecasts
                                    .find(p => p.product_name === selectedDetailProduct)?.predictions
                                    .map(pred => ({
                                        name: pred.day_short,
                                        Forecast: pred.predicted_quantity,
                                        Min: pred.confidence_lower,
                                        Max: pred.confidence_upper
                                    })) || []
                                }
                                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="forecastGradientDetail" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4285f4" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4285f4" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="boundsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34a853" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ea4335" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                                <XAxis dataKey="name" stroke="#5f6368" fontSize={11} tickLine={false} />
                                <YAxis stroke="#5f6368" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<ForecastTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="Max"
                                    stroke="#ea4335"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    fill="none"
                                    name="Upper Bound"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Forecast"
                                    stroke="#4285f4"
                                    strokeWidth={3}
                                    fill="url(#forecastGradientDetail)"
                                    name="Forecast"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Min"
                                    stroke="#34a853"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    fill="none"
                                    name="Lower Bound"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="chart-placeholder">
                        <div className="placeholder-content">
                            <Package size={40} />
                            <p>Select a product from the dropdown to view its forecast with min/max bounds</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Forecast Table by Product */}
            <div className="ga-card forecast-table-card">
                <div className="ga-card-header">
                    <h3>🔮 7-Day Forecast by Product</h3>
                </div>
                <div className="analytics-table-wrapper">
                    <table className="analytics-table forecast-table product-forecast-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                                <th>Sun</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forecastData.forecasts.map((product, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="product-name-cell">
                                            <span
                                                className="product-color-dot"
                                                style={{ backgroundColor: product.color }}
                                            />
                                            {product.product_name}
                                        </div>
                                    </td>
                                    {product.predictions.map((pred, j) => (
                                        <td key={j}>
                                            <div className="prediction-cell">
                                                <span className="prediction-value">{pred.predicted_quantity}</span>
                                                <span className="prediction-range">
                                                    {pred.confidence_lower}-{pred.confidence_upper}
                                                </span>
                                            </div>
                                        </td>
                                    ))}
                                    <td>
                                        <strong className="total-value">{product.total_predicted}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Daily Total</strong></td>
                                {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                    <td key={dayIdx}>
                                        <strong>
                                            {forecastData.forecasts.reduce((sum, p) =>
                                                sum + (p.predictions[dayIdx]?.predicted_quantity || 0), 0
                                            )}
                                        </strong>
                                    </td>
                                ))}
                                <td>
                                    <strong className="grand-total">{forecastData.total_forecast}</strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Model Info */}
            <div className="ga-card model-info-card">
                <div className="ga-card-header">
                    <h3>ℹ️ Forecast Information</h3>
                </div>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Model</span>
                        <span className="info-value">{model?.best_model_name || 'AutoML'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Target Column</span>
                        <span className="info-value">{model?.target_column || 'quantity_sold'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Problem Type</span>
                        <span className="info-value">{model?.problem_type || 'Regression'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Last Updated</span>
                        <span className="info-value">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
