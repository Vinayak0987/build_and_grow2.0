/**
 * Data Explorer Tab - Google Analytics Style with Full Customization
 * Charts respond to customize panel settings
 */
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Rows,
    Columns,
    HardDrive,
    Download,
    BarChart3,
    Table,
    Loader2,
    Settings2
} from 'lucide-react'
import { modelDashboardApi } from '../../../services/modelDashboardApi'
import { analyzeDataset, applyFilters } from '../utils/DataAnalyzer'
import GlobalFilters from '../components/GlobalFilters'
import SummaryMetrics from '../components/SummaryMetrics'
import SmartChart from '../components/SmartChart'
import AnalyticsTable from '../components/AnalyticsTable'
import CustomizePanel from '../components/CustomizePanel'
import '../AnalyticsDashboard.css'

export default function DataExplorerTab({ model, modelId }) {
    const [viewMode, setViewMode] = useState('analytics')
    const [activeFilters, setActiveFilters] = useState({})
    const [showCustomize, setShowCustomize] = useState(false)
    const [reportConfig, setReportConfig] = useState({
        selectedDimensions: [],
        selectedMetrics: [],
        aggregation: 'sum',
        timeGrouping: 'auto',
        compareMode: false,
        colorTheme: 'Default',
        visibleCharts: {
            lineChart: true,
            barChart: true,
            pieChart: true
        },
        chartSettings: {
            lineChart: { type: 'area', breakdown: '', showComparison: false },
            barChart: { type: 'horizontalBar', breakdown: '', showComparison: false },
            pieChart: { type: 'donut', breakdown: '' }
        }
    })

    // Fetch training data
    const { data: dataResponse, isLoading: dataLoading, error: dataError } = useQuery({
        queryKey: ['trainingData', modelId, 1, 500],
        queryFn: () => modelDashboardApi.getTrainingData(modelId, { page: 1, limit: 500 }),
        enabled: !!modelId,
        retry: 1
    })

    // Fetch statistics
    const { data: statsResponse, error: statsError } = useQuery({
        queryKey: ['dataStats', modelId],
        queryFn: () => modelDashboardApi.getDataStats(modelId),
        enabled: !!modelId,
        retry: 1
    })

    // Debug logging - check in browser console (F12)
    console.log('[DataExplorer] modelId:', modelId)
    console.log('[DataExplorer] dataResponse:', dataResponse)
    console.log('[DataExplorer] dataError:', dataError)

    if (dataError) {
        console.error('Data fetch error:', dataError?.response?.data || dataError.message)
    }
    if (statsError) {
        console.error('Stats fetch error:', statsError?.response?.data || statsError.message)
    }

    const rawData = dataResponse?.data?.data || []
    const columns = dataResponse?.data?.columns || []
    const totalRows = dataResponse?.data?.total_rows || 0
    const stats = statsResponse?.data || {}

    console.log('[DataExplorer] rawData length:', rawData.length)
    console.log('[DataExplorer] columns:', columns)

    // Analyze dataset
    const analysis = useMemo(() => {
        if (rawData.length === 0 || columns.length === 0) return null
        return analyzeDataset(rawData, columns, model?.target_column)
    }, [rawData, columns, model?.target_column])

    // Apply filters
    const filteredData = useMemo(() => {
        return applyFilters(rawData, activeFilters)
    }, [rawData, activeFilters])

    // Get selected dimensions and metrics
    const selectedDims = reportConfig.selectedDimensions.length > 0
        ? reportConfig.selectedDimensions
        : analysis?.dimensions?.slice(0, 2) || []

    const selectedMets = reportConfig.selectedMetrics.length > 0
        ? reportConfig.selectedMetrics
        : analysis?.numericColumns?.slice(0, 3) || []

    // Generate chart configs based on user selection
    const chartConfigs = useMemo(() => {
        if (!analysis) return []

        const configs = []
        const primaryDim = selectedDims[0]
        const primaryMet = selectedMets[0]
        const timeCol = analysis.timeColumns?.[0]
        const { chartSettings, aggregation } = reportConfig

        // Line/Area Chart
        if (reportConfig.visibleCharts.lineChart) {
            const lineSettings = chartSettings.lineChart || {}
            const breakdownDim = lineSettings.breakdown || primaryDim

            configs.push({
                type: lineSettings.type || 'area',
                title: timeCol
                    ? `${formatLabel(primaryMet || 'Count')} Over Time`
                    : `${formatLabel(primaryMet || 'Count')} by ${formatLabel(breakdownDim)}`,
                columns: timeCol
                    ? [timeCol, breakdownDim, primaryMet]
                    : [breakdownDim, primaryMet],
                aggregation: aggregation,
                chartId: 'lineChart',
                showComparison: lineSettings.showComparison || reportConfig.compareMode
            })
        }

        // Bar Chart
        if (reportConfig.visibleCharts.barChart) {
            const barSettings = chartSettings.barChart || {}
            const breakdownDim = barSettings.breakdown || primaryDim

            configs.push({
                type: barSettings.type || 'horizontalBar',
                title: `${formatLabel(breakdownDim)} Distribution`,
                columns: [breakdownDim, primaryMet],
                aggregation: primaryMet ? aggregation : 'count',
                chartId: 'barChart',
                showComparison: barSettings.showComparison || reportConfig.compareMode
            })
        }

        // Pie/Donut Chart
        if (reportConfig.visibleCharts.pieChart) {
            const pieSettings = chartSettings.pieChart || {}
            const breakdownDim = pieSettings.breakdown || selectedDims[1] || primaryDim

            configs.push({
                type: pieSettings.type || 'donut',
                title: `${formatLabel(breakdownDim)} Breakdown`,
                columns: [breakdownDim, primaryMet],
                aggregation: primaryMet ? aggregation : 'count',
                chartId: 'pieChart'
            })
        }

        return configs
    }, [analysis, selectedDims, selectedMets, reportConfig])

    // Handlers
    const handleFilterChange = (column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }))
    }

    const handleResetFilters = () => {
        setActiveFilters({})
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A'
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    // Get color theme
    const getColorTheme = () => {
        switch (reportConfig.colorTheme) {
            case 'Vibrant': return ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9']
            case 'Pastel': return ['#a8dadc', '#f4a261', '#e9c46a', '#2a9d8f', '#e76f51', '#457b9d']
            case 'Monochrome': return ['#1e3a5f', '#3d5a80', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0']
            default: return ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6']
        }
    }

    if (dataLoading) {
        return (
            <div className="dashboard-loading" style={{ minHeight: '400px' }}>
                <Loader2 size={32} className="animate-spin" />
                <p>Analyzing dataset...</p>
            </div>
        )
    }

    // Show error if data fetch failed
    if (dataError) {
        return (
            <div className="dashboard-error" style={{ minHeight: '300px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#f87171', marginBottom: '1rem' }}>
                    Failed to load data: {dataError?.response?.data?.error || dataError.message}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Make sure the backend and MinIO services are running, and the dataset file exists.
                </p>
            </div>
        )
    }

    // Show message if no data
    if (rawData.length === 0) {
        return (
            <div className="dashboard-error" style={{ minHeight: '300px', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    No data available for this model.
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    The training dataset may not be accessible.
                </p>
            </div>
        )
    }

    return (
        <div className="data-explorer">
            {/* Stats Bar */}
            <div className="data-stats-bar">
                <div className="data-stat">
                    <Rows size={18} className="stat-icon" />
                    <span className="stat-text">
                        <strong>{totalRows.toLocaleString()}</strong> <span>rows</span>
                    </span>
                </div>
                <div className="data-stat">
                    <Columns size={18} className="stat-icon" />
                    <span className="stat-text">
                        <strong>{columns.length}</strong> <span>columns</span>
                    </span>
                </div>
                <div className="data-stat">
                    <HardDrive size={18} className="stat-icon" />
                    <span className="stat-text">
                        <strong>{formatFileSize(stats?.file_size)}</strong>
                    </span>
                </div>

                {/* View Toggle + Customize */}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <button
                        className={`btn ${viewMode === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode('analytics')}
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        <BarChart3 size={16} />
                        Analytics
                    </button>
                    <button
                        className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode('table')}
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        <Table size={16} />
                        Table
                    </button>
                </div>

                {/* Customize Button */}
                <button
                    className="customize-btn"
                    onClick={() => setShowCustomize(true)}
                >
                    <Settings2 size={16} />
                    Customize
                </button>

                <button className="btn btn-secondary" onClick={() => alert('Export coming soon!')}>
                    <Download size={16} />
                    Export
                </button>
            </div>

            {/* Analytics View */}
            {viewMode === 'analytics' && analysis && (
                <div className="analytics-dashboard">
                    {/* Global Filters */}
                    {analysis.filters.length > 0 && (
                        <GlobalFilters
                            filters={analysis.filters}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onReset={handleResetFilters}
                            data={rawData}
                        />
                    )}

                    {/* Summary Metrics */}
                    <SummaryMetrics
                        metrics={{
                            ...analysis.metrics,
                            totalRecords: filteredData.length
                        }}
                        analysis={analysis}
                    />

                    {/* Charts Grid */}
                    <div className="analytics-charts">
                        {chartConfigs.slice(0, 2).map((config, i) => (
                            <div key={config.chartId || i} className="ga-chart-card">
                                <SmartChart
                                    chartConfig={config}
                                    data={filteredData}
                                    height={280}
                                    colors={getColorTheme()}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Secondary Charts */}
                    {chartConfigs.length > 2 && (
                        <div className="analytics-charts-secondary">
                            {chartConfigs.slice(2).map((config, i) => (
                                <div key={config.chartId || i} className="ga-chart-card">
                                    <SmartChart
                                        chartConfig={config}
                                        data={filteredData}
                                        height={250}
                                        colors={getColorTheme()}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Data Table */}
                    <AnalyticsTable
                        data={filteredData}
                        columns={columns}
                        analysis={analysis}
                        title={`${model?.name || 'Dataset'} Records`}
                    />
                </div>
            )}

            {/* Table Only View */}
            {viewMode === 'table' && (
                <div className="mt-6">
                    <AnalyticsTable
                        data={rawData}
                        columns={columns}
                        analysis={analysis}
                        title="Full Dataset"
                    />
                </div>
            )}

            {viewMode === 'analytics' && !analysis && rawData.length > 0 && (
                <div className="dashboard-error" style={{ minHeight: '200px', marginTop: '1.5rem' }}>
                    <p>Unable to analyze this dataset. Switch to Table view.</p>
                </div>
            )}

            {/* Customize Panel */}
            <CustomizePanel
                isOpen={showCustomize}
                onClose={() => setShowCustomize(false)}
                analysis={analysis}
                config={reportConfig}
                onConfigChange={setReportConfig}
            />
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
