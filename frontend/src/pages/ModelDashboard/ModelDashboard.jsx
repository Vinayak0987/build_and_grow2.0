/**
 * Model Dashboard - Main Layout Component
 * Provides tabbed navigation for model analytics, predictions, and data exploration
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft,
    LayoutDashboard,
    Database,
    Sparkles,
    BarChart3,
    Brain,
    Download,
    RefreshCw,
    Clock,
    Target,
    TrendingUp
} from 'lucide-react'
import { modelsApi } from '../../services/api'
import { modelDashboardApi } from '../../services/modelDashboardApi'
import OverviewTab from './tabs/OverviewTab'
import DataExplorerTab from './tabs/DataExplorerTab'
import ForecastTab from './tabs/ForecastTab'
import AnalyticsTab from './tabs/AnalyticsTab'
import ExplainTab from './tabs/ExplainTab'
import ExportTab from './tabs/ExportTab'
import './ModelDashboard.css'

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'data', label: 'Data Explorer', icon: Database },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'explain', label: 'Explainability', icon: Brain },
    { id: 'export', label: 'Export', icon: Download }
]

export default function ModelDashboard() {
    const { modelId, tab } = useParams()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(tab || 'overview')

    // Fetch model details
    const { data: modelData, isLoading: modelLoading, error: modelError, refetch } = useQuery({
        queryKey: ['model', modelId],
        queryFn: () => modelsApi.get(modelId),
        enabled: !!modelId
    })

    // Fetch model overview data
    const { data: overviewData, isLoading: overviewLoading } = useQuery({
        queryKey: ['modelOverview', modelId],
        queryFn: () => modelDashboardApi.getOverview(modelId),
        enabled: !!modelId
    })

    const model = modelData?.data?.model || modelData?.data
    const overview = overviewData?.data

    // Sync tab with URL
    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [tab])

    // Update URL when tab changes
    const handleTabChange = (newTab) => {
        setActiveTab(newTab)
        navigate(`/models/${modelId}/${newTab}`, { replace: true })
    }

    // Get problem type icon
    const getProblemTypeIcon = (type) => {
        if (type?.includes('classification')) return '🎯'
        if (type === 'regression') return '📈'
        if (type === 'clustering') return '🔮'
        if (type === 'timeseries') return '📊'
        return '🤖'
    }

    // Loading state
    if (modelLoading) {
        return (
            <div className="model-dashboard">
                <div className="dashboard-loading">
                    <div className="spinner"></div>
                    <p>Loading model dashboard...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (modelError || !model) {
        return (
            <div className="model-dashboard">
                <div className="dashboard-error">
                    <div className="error-icon">
                        <Target size={32} />
                    </div>
                    <h3>Model Not Found</h3>
                    <p>The model you're looking for doesn't exist or has been deleted.</p>
                    <Link to="/models" className="btn btn-primary">
                        <ArrowLeft size={18} />
                        Back to Models
                    </Link>
                </div>
            </div>
        )
    }

    // Render active tab content
    const renderTabContent = () => {
        const tabProps = {
            model,
            modelId,
            overview,
            overviewLoading
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewTab {...tabProps} />
            case 'data':
                return <DataExplorerTab {...tabProps} />
            case 'forecast':
                return <ForecastTab {...tabProps} />
            case 'analytics':
                return <AnalyticsTab {...tabProps} />
            case 'explain':
                return <ExplainTab {...tabProps} />
            case 'export':
                return <ExportTab {...tabProps} />
            default:
                return <OverviewTab {...tabProps} />
        }
    }

    return (
        <div className="model-dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <Link to="/models" className="back-link">
                    <ArrowLeft size={18} />
                    Back to Models
                </Link>

                <div className="model-title-section">
                    <div className="model-icon-large">
                        {getProblemTypeIcon(model.problem_type)}
                    </div>
                    <div className="model-title-info">
                        <h1>{model.name}</h1>
                        <div className="model-meta">
                            <span className="badge badge-info">
                                {model.problem_type?.replace('_', ' ')}
                            </span>
                            <span className="separator">•</span>
                            <span>{model.best_model_name || 'Auto'}</span>
                            <span className="separator">•</span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(model.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => refetch()}
                        title="Refresh data"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                {TABS.map((tabItem) => (
                    <button
                        key={tabItem.id}
                        className={`tab-button ${activeTab === tabItem.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tabItem.id)}
                    >
                        <tabItem.icon size={18} />
                        {tabItem.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    )
}
