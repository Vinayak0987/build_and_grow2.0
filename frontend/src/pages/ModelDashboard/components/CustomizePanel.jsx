/**
 * CustomizePanel - Enhanced Report Customization
 * Chart type, aggregation, comparison, breakdown options
 */
import { useState } from 'react'
import {
    Settings2,
    ChevronRight,
    Eye,
    EyeOff,
    X,
    Plus,
    Layers,
    Hash,
    Filter,
    BarChart3,
    TrendingUp,
    PieChart,
    LayoutGrid,
    Activity,
    ArrowUpDown,
    Calendar,
    GitCompare,
    Palette
} from 'lucide-react'

// Chart type options
const CHART_TYPES = [
    { id: 'line', label: 'Line Chart', icon: TrendingUp },
    { id: 'area', label: 'Area Chart', icon: Activity },
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'horizontalBar', label: 'Horizontal Bar', icon: BarChart3 },
    { id: 'donut', label: 'Donut/Pie', icon: PieChart },
]

// Aggregation options
const AGGREGATION_TYPES = [
    { id: 'sum', label: 'Sum' },
    { id: 'avg', label: 'Average' },
    { id: 'count', label: 'Count' },
    { id: 'min', label: 'Minimum' },
    { id: 'max', label: 'Maximum' },
]

// Time grouping options
const TIME_GROUPINGS = [
    { id: 'auto', label: 'Auto' },
    { id: 'day', label: 'Daily' },
    { id: 'week', label: 'Weekly' },
    { id: 'month', label: 'Monthly' },
    { id: 'quarter', label: 'Quarterly' },
    { id: 'year', label: 'Yearly' },
]

export default function CustomizePanel({
    isOpen,
    onClose,
    analysis,
    config,
    onConfigChange
}) {
    const [expandedSection, setExpandedSection] = useState('dimensions')
    const [expandedChart, setExpandedChart] = useState(null)

    if (!isOpen) return null

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section)
    }

    // Get available columns by type
    const dimensions = analysis?.dimensions || []
    const metrics = analysis?.numericColumns || []
    const timeColumns = analysis?.timeColumns || []

    // Handle dimension/metric selection
    const handleDimensionToggle = (dim) => {
        const current = config.selectedDimensions || []
        const updated = current.includes(dim)
            ? current.filter(d => d !== dim)
            : [...current, dim].slice(0, 3)
        onConfigChange({ ...config, selectedDimensions: updated })
    }

    const handleMetricToggle = (metric) => {
        const current = config.selectedMetrics || []
        const updated = current.includes(metric)
            ? current.filter(m => m !== metric)
            : [...current, metric].slice(0, 5)
        onConfigChange({ ...config, selectedMetrics: updated })
    }

    // Handle chart visibility
    const handleChartToggle = (chartId) => {
        const current = config.visibleCharts || {}
        onConfigChange({
            ...config,
            visibleCharts: { ...current, [chartId]: !current[chartId] }
        })
    }

    // Handle chart settings
    const updateChartSetting = (chartId, key, value) => {
        const chartSettings = config.chartSettings || {}
        onConfigChange({
            ...config,
            chartSettings: {
                ...chartSettings,
                [chartId]: {
                    ...(chartSettings[chartId] || {}),
                    [key]: value
                }
            }
        })
    }

    // Get chart setting value
    const getChartSetting = (chartId, key, defaultValue) => {
        return config.chartSettings?.[chartId]?.[key] ?? defaultValue
    }

    return (
        <>
            {/* Backdrop */}
            <div className="customize-backdrop" onClick={onClose} />

            {/* Panel */}
            <div className="customize-panel">
                {/* Header */}
                <div className="customize-header">
                    <div className="customize-title">
                        <Settings2 size={18} />
                        <span>Customize report</span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="customize-content">

                    {/* Report Data Section */}
                    <div className="customize-section-label">REPORT DATA</div>

                    {/* Dimensions */}
                    <div
                        className={`customize-item ${expandedSection === 'dimensions' ? 'expanded' : ''}`}
                        onClick={() => toggleSection('dimensions')}
                    >
                        <div className="item-row">
                            <Layers size={16} />
                            <span>Dimensions</span>
                            <span className="item-badge">{(config.selectedDimensions || dimensions.slice(0, 2)).length}</span>
                            <ChevronRight size={16} className="chevron" />
                        </div>
                        {expandedSection === 'dimensions' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                {dimensions.map(dim => (
                                    <label key={dim} className="option-item">
                                        <input
                                            type="checkbox"
                                            checked={(config.selectedDimensions || dimensions.slice(0, 2)).includes(dim)}
                                            onChange={() => handleDimensionToggle(dim)}
                                        />
                                        <span>{formatLabel(dim)}</span>
                                    </label>
                                ))}
                                {dimensions.length === 0 && (
                                    <div className="no-options">No dimensions detected</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metrics */}
                    <div
                        className={`customize-item ${expandedSection === 'metrics' ? 'expanded' : ''}`}
                        onClick={() => toggleSection('metrics')}
                    >
                        <div className="item-row">
                            <Hash size={16} />
                            <span>Metrics</span>
                            <span className="item-badge">{(config.selectedMetrics || metrics.slice(0, 3)).length}</span>
                            <ChevronRight size={16} className="chevron" />
                        </div>
                        {expandedSection === 'metrics' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                {metrics.map(metric => (
                                    <label key={metric} className="option-item">
                                        <input
                                            type="checkbox"
                                            checked={(config.selectedMetrics || metrics.slice(0, 3)).includes(metric)}
                                            onChange={() => handleMetricToggle(metric)}
                                        />
                                        <span>{formatLabel(metric)}</span>
                                    </label>
                                ))}
                                {metrics.length === 0 && (
                                    <div className="no-options">No metrics detected</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Time Grouping */}
                    {timeColumns.length > 0 && (
                        <div
                            className={`customize-item ${expandedSection === 'timeGrouping' ? 'expanded' : ''}`}
                            onClick={() => toggleSection('timeGrouping')}
                        >
                            <div className="item-row">
                                <Calendar size={16} />
                                <span>Time Grouping</span>
                                <span className="item-value">{TIME_GROUPINGS.find(t => t.id === (config.timeGrouping || 'auto'))?.label}</span>
                                <ChevronRight size={16} className="chevron" />
                            </div>
                            {expandedSection === 'timeGrouping' && (
                                <div className="item-options" onClick={e => e.stopPropagation()}>
                                    {TIME_GROUPINGS.map(opt => (
                                        <label key={opt.id} className="option-item">
                                            <input
                                                type="radio"
                                                name="timeGrouping"
                                                checked={(config.timeGrouping || 'auto') === opt.id}
                                                onChange={() => onConfigChange({ ...config, timeGrouping: opt.id })}
                                            />
                                            <span>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aggregation */}
                    <div
                        className={`customize-item ${expandedSection === 'aggregation' ? 'expanded' : ''}`}
                        onClick={() => toggleSection('aggregation')}
                    >
                        <div className="item-row">
                            <ArrowUpDown size={16} />
                            <span>Aggregation</span>
                            <span className="item-value">{AGGREGATION_TYPES.find(a => a.id === (config.aggregation || 'sum'))?.label}</span>
                            <ChevronRight size={16} className="chevron" />
                        </div>
                        {expandedSection === 'aggregation' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                {AGGREGATION_TYPES.map(opt => (
                                    <label key={opt.id} className="option-item">
                                        <input
                                            type="radio"
                                            name="aggregation"
                                            checked={(config.aggregation || 'sum') === opt.id}
                                            onChange={() => onConfigChange({ ...config, aggregation: opt.id })}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Report Filter Section */}
                    <div className="customize-section-label">REPORT FILTER</div>

                    <div
                        className="customize-item add-item"
                        onClick={() => toggleSection('filters')}
                    >
                        <div className="item-row">
                            <Plus size={16} />
                            <span>Add filter</span>
                        </div>
                        {expandedSection === 'filters' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                <div className="filter-hint">
                                    Use the filter dropdowns at the top of the dashboard to filter data.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts Section */}
                    <div className="customize-section-label">CHARTS</div>

                    {/* Line Chart */}
                    <ChartConfigItem
                        icon={TrendingUp}
                        label="Line Chart"
                        chartId="lineChart"
                        isVisible={config.visibleCharts?.lineChart !== false}
                        onToggle={() => handleChartToggle('lineChart')}
                        isExpanded={expandedChart === 'lineChart'}
                        onExpand={() => setExpandedChart(expandedChart === 'lineChart' ? null : 'lineChart')}
                        chartType={getChartSetting('lineChart', 'type', 'area')}
                        onTypeChange={(type) => updateChartSetting('lineChart', 'type', type)}
                        showComparison={getChartSetting('lineChart', 'showComparison', false)}
                        onComparisonChange={(val) => updateChartSetting('lineChart', 'showComparison', val)}
                        breakdownDimension={getChartSetting('lineChart', 'breakdown', '')}
                        onBreakdownChange={(dim) => updateChartSetting('lineChart', 'breakdown', dim)}
                        dimensions={dimensions}
                    />

                    {/* Bar Chart */}
                    <ChartConfigItem
                        icon={BarChart3}
                        label="Bar Chart"
                        chartId="barChart"
                        isVisible={config.visibleCharts?.barChart !== false}
                        onToggle={() => handleChartToggle('barChart')}
                        isExpanded={expandedChart === 'barChart'}
                        onExpand={() => setExpandedChart(expandedChart === 'barChart' ? null : 'barChart')}
                        chartType={getChartSetting('barChart', 'type', 'horizontalBar')}
                        onTypeChange={(type) => updateChartSetting('barChart', 'type', type)}
                        showComparison={getChartSetting('barChart', 'showComparison', false)}
                        onComparisonChange={(val) => updateChartSetting('barChart', 'showComparison', val)}
                        breakdownDimension={getChartSetting('barChart', 'breakdown', '')}
                        onBreakdownChange={(dim) => updateChartSetting('barChart', 'breakdown', dim)}
                        dimensions={dimensions}
                    />

                    {/* Pie Chart */}
                    <ChartConfigItem
                        icon={PieChart}
                        label="Pie Chart"
                        chartId="pieChart"
                        isVisible={config.visibleCharts?.pieChart !== false}
                        onToggle={() => handleChartToggle('pieChart')}
                        isExpanded={expandedChart === 'pieChart'}
                        onExpand={() => setExpandedChart(expandedChart === 'pieChart' ? null : 'pieChart')}
                        chartType={getChartSetting('pieChart', 'type', 'donut')}
                        onTypeChange={(type) => updateChartSetting('pieChart', 'type', type)}
                        showComparison={false}
                        breakdownDimension={getChartSetting('pieChart', 'breakdown', '')}
                        onBreakdownChange={(dim) => updateChartSetting('pieChart', 'breakdown', dim)}
                        dimensions={dimensions}
                        hideComparison={true}
                    />

                    {/* Comparison Mode */}
                    <div className="customize-section-label">COMPARISON</div>

                    <div
                        className={`customize-item ${expandedSection === 'comparison' ? 'expanded' : ''}`}
                        onClick={() => toggleSection('comparison')}
                    >
                        <div className="item-row">
                            <GitCompare size={16} />
                            <span>Compare Mode</span>
                            <span className="item-value">{config.compareMode ? 'On' : 'Off'}</span>
                            <ChevronRight size={16} className="chevron" />
                        </div>
                        {expandedSection === 'comparison' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                <label className="option-item">
                                    <input
                                        type="checkbox"
                                        checked={config.compareMode || false}
                                        onChange={() => onConfigChange({ ...config, compareMode: !config.compareMode })}
                                    />
                                    <span>Enable comparison overlay</span>
                                </label>
                                <div className="filter-hint" style={{ marginTop: '0.5rem' }}>
                                    Shows average line on charts when enabled.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Color Theme */}
                    <div
                        className={`customize-item ${expandedSection === 'colors' ? 'expanded' : ''}`}
                        onClick={() => toggleSection('colors')}
                    >
                        <div className="item-row">
                            <Palette size={16} />
                            <span>Color Theme</span>
                            <span className="item-value">{config.colorTheme || 'Default'}</span>
                            <ChevronRight size={16} className="chevron" />
                        </div>
                        {expandedSection === 'colors' && (
                            <div className="item-options color-options" onClick={e => e.stopPropagation()}>
                                {['Default', 'Vibrant', 'Pastel', 'Monochrome'].map(theme => (
                                    <label key={theme} className="option-item">
                                        <input
                                            type="radio"
                                            name="colorTheme"
                                            checked={(config.colorTheme || 'Default') === theme}
                                            onChange={() => onConfigChange({ ...config, colorTheme: theme })}
                                        />
                                        <span>{theme}</span>
                                        <div className="color-preview" data-theme={theme.toLowerCase()}></div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary Cards Section */}
                    <div className="customize-section-label">SUMMARY CARDS</div>

                    <div
                        className="customize-item add-item"
                        onClick={() => toggleSection('cards')}
                    >
                        <div className="item-row">
                            <Plus size={16} />
                            <span>Create new card</span>
                        </div>
                        {expandedSection === 'cards' && (
                            <div className="item-options" onClick={e => e.stopPropagation()}>
                                <div className="filter-hint">
                                    Summary cards are auto-generated based on your selected metrics.
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    )
}

// Chart Configuration Item with expanded options
function ChartConfigItem({
    icon: Icon,
    label,
    chartId,
    isVisible,
    onToggle,
    isExpanded,
    onExpand,
    chartType,
    onTypeChange,
    showComparison,
    onComparisonChange,
    breakdownDimension,
    onBreakdownChange,
    dimensions,
    hideComparison = false
}) {
    const chartTypeOptions = chartId === 'pieChart'
        ? [{ id: 'donut', label: 'Donut' }, { id: 'pie', label: 'Pie' }]
        : chartId === 'barChart'
            ? [{ id: 'horizontalBar', label: 'Horizontal' }, { id: 'bar', label: 'Vertical' }, { id: 'stackedBar', label: 'Stacked' }]
            : [{ id: 'line', label: 'Line' }, { id: 'area', label: 'Area' }, { id: 'smoothLine', label: 'Smooth Line' }]

    return (
        <div className={`customize-item chart-item ${isExpanded ? 'expanded' : ''}`}>
            <div className="item-row" onClick={onExpand}>
                <button
                    className={`visibility-btn ${isVisible ? 'visible' : 'hidden'}`}
                    onClick={(e) => { e.stopPropagation(); onToggle() }}
                >
                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <LayoutGrid size={14} className="drag-icon" />
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={16} className="chevron" />
            </div>

            {isExpanded && (
                <div className="chart-config-options" onClick={e => e.stopPropagation()}>
                    {/* Chart Type */}
                    <div className="config-group">
                        <label className="config-label">Chart Type</label>
                        <div className="config-buttons">
                            {chartTypeOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`config-btn ${chartType === opt.id ? 'active' : ''}`}
                                    onClick={() => onTypeChange(opt.id)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown Dimension */}
                    <div className="config-group">
                        <label className="config-label">Breakdown by</label>
                        <select
                            className="config-select"
                            value={breakdownDimension}
                            onChange={(e) => onBreakdownChange(e.target.value)}
                        >
                            <option value="">None</option>
                            {dimensions.map(dim => (
                                <option key={dim} value={dim}>{formatLabel(dim)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Comparison Toggle */}
                    {!hideComparison && (
                        <div className="config-group">
                            <label className="config-label">
                                <input
                                    type="checkbox"
                                    checked={showComparison}
                                    onChange={(e) => onComparisonChange(e.target.checked)}
                                />
                                Show comparison line
                            </label>
                        </div>
                    )}
                </div>
            )}
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
