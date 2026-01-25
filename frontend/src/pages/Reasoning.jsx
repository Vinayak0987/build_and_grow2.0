import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'

export default function Reasoning() {
    const { token } = useAuthStore()
    const {
        reasoningState,
        setReasoningState,
        setAllAnalysis,
        stockAnalysis,
        expiryAnalysis,
        orderSuggestions,
        trendsAnalysis,
        fullReport
    } = useInventoryStore()

    const { models, datasets, selectedModel, selectedDataset, activeTab } = reasoningState

    // Setters wrapper
    const setModels = (data) => setReasoningState({ models: data })
    const setDatasets = (data) => setReasoningState({ datasets: data })
    const setSelectedModel = (data) => setReasoningState({ selectedModel: data })
    const setSelectedDataset = (data) => setReasoningState({ selectedDataset: data })
    const setActiveTab = (data) => setReasoningState({ activeTab: data })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchModels()
        fetchDatasets()
    }, [])

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setModels(data.models || [])
            }
        } catch (error) {
            console.error('Failed to fetch models:', error)
        }
    }

    const fetchDatasets = async () => {
        try {
            const response = await fetch('/api/datasets', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setDatasets(data.datasets || [])
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        }
    }

    const runFullAnalysis = async () => {
        if (!selectedDataset || !selectedModel) {
            alert('Please select both a dataset and a model')
            return
        }

        setLoading(true)
        setLoading(true)
        // Clear previous analysis
        setAllAnalysis({ stock: null, expiry: null, orders: null, trends: null, report: null })

        try {
            // Run all agent analyses using the new dataset-based endpoints
            const [stockRes, expiryRes, orderRes, trendRes] = await Promise.all([
                fetch(`/api/reasoning/stock-analysis/${selectedDataset.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`/api/reasoning/expiry-analysis/${selectedDataset.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`/api/reasoning/order-suggestions/${selectedDataset.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`/api/reasoning/trends/${selectedDataset.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ])

            const [stock, expiry, orders, trends] = await Promise.all([
                stockRes.json(),
                expiryRes.json(),
                orderRes.json(),
                trendRes.json()
            ])

            // Store intermediate results if needed, or just wait for full set
            // For now we set them to local variables 'stock', 'expiry' etc are already defined

            // Generate comprehensive AI report
            const reportRes = await fetch(`/api/reasoning/full-report/${selectedDataset.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model_id: selectedModel?.id,
                    stock_analysis: stock,
                    expiry_analysis: expiry,
                    order_suggestions: orders,
                    trends_analysis: trends
                })
            })

            let reportData = null
            if (reportRes.ok) {
                reportData = await reportRes.json()
            }

            // Save all analysis data to the shared inventory store
            setAllAnalysis({
                stock,
                expiry,
                orders,
                trends,
                report: reportData
            })

        } catch (error) {
            console.error('Analysis failed:', error)
            alert('Analysis failed. Please try again.')
        }

        setLoading(false)
    }

    return (
        <div className="reasoning-page">
            <div className="page-header">
                <h1>🧠 AI Reasoning & Data Intelligence</h1>
                <p>Get smart insights and recommendations from your datasets using AI agents</p>
            </div>

            {/* Dataset Selection */}
            <div className="selection-section">
                <div className="card">
                    <h2>📊 Select Dataset for Analysis</h2>
                    <div className="selection-grid">
                        <div className="selection-group">
                            <label>Dataset (Required)</label>
                            <select
                                value={selectedDataset?.id || ''}
                                onChange={(e) => {
                                    const dataset = datasets.find(d => d.id === parseInt(e.target.value))
                                    setSelectedDataset(dataset)
                                }}
                            >
                                <option value="">-- Select a Dataset --</option>
                                {datasets.map(ds => (
                                    <option key={ds.id} value={ds.id}>
                                        {ds.name} ({ds.num_rows?.toLocaleString() || 0} rows)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="selection-group">
                            <label>AI Model (Required)</label>
                            <select
                                value={selectedModel?.id || ''}
                                onChange={(e) => {
                                    const model = models.find(m => m.id === parseInt(e.target.value))
                                    setSelectedModel(model)
                                }}
                            >
                                <option value="">-- Select a Model --</option>
                                {models.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name} ({model.best_model_name} - {(model.best_score * 100).toFixed(1)}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary analyze-btn"
                        onClick={runFullAnalysis}
                        disabled={loading || !selectedDataset || !selectedModel}
                    >
                        {loading ? '🔄 Analyzing your data...' : '🚀 Run AI Analysis on Dataset'}
                    </button>
                    {(!selectedDataset || !selectedModel) && (
                        <p className="helper-text">
                            {datasets.length === 0 ? 'Upload a dataset first to use AI Reasoning features' :
                                models.length === 0 ? 'Train a model first to use AI Reasoning features' :
                                    !selectedDataset ? 'Select a dataset to continue' :
                                        !selectedModel ? 'Select a trained model to continue' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Agent Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >📋 Overview</button>
                    <button
                        className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stock')}
                    >🔍 Data Analysis</button>
                    <button
                        className={`tab ${activeTab === 'expiry' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expiry')}
                    >📅 Patterns & Dates</button>
                    <button
                        className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >🛒 Action Items</button>
                    <button
                        className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trends')}
                    >📈 Trends & Insights</button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-section">
                        {!stockAnalysis ? (
                            <div className="empty-state">
                                <h3>🤖 AI Agents Ready</h3>
                                <p>Select a dataset and click "Run AI Analysis" to get comprehensive data insights</p>
                                <div className="agents-preview">
                                    <div className="agent-item">🔍 <strong>Data Quality Agent</strong> - Analyzes data health and completeness</div>
                                    <div className="agent-item">📅 <strong>Pattern Detection Agent</strong> - Finds patterns and anomalies</div>
                                    <div className="agent-item">🛒 <strong>Recommendation Agent</strong> - Generates actionable insights</div>
                                    <div className="agent-item">📈 <strong>Trend Analysis Agent</strong> - Identifies correlations and trends</div>
                                    <div className="agent-item">🧠 <strong>AI Report Agent</strong> - Creates comprehensive reports</div>
                                </div>
                            </div>
                        ) : (
                            <div className="dashboard-grid">
                                <div className="metric-card health">
                                    <h3>📊 Data Health</h3>
                                    <div className="metric-value">{stockAnalysis.health_score?.toFixed(0) || 0}%</div>
                                    <p>{stockAnalysis.total_items || 0} records analyzed</p>
                                </div>
                                <div className="metric-card warning">
                                    <h3>⚠️ Issues Found</h3>
                                    <div className="metric-value">{stockAnalysis.low_stock?.count || 0}</div>
                                    <p>Items need attention</p>
                                </div>
                                <div className="metric-card danger">
                                    <h3>🚫 Critical</h3>
                                    <div className="metric-value">{stockAnalysis.out_of_stock?.count || 0}</div>
                                    <p>Immediate action needed</p>
                                </div>
                                <div className="metric-card expiry">
                                    <h3>💡 Suggestions</h3>
                                    <div className="metric-value">{orderSuggestions?.total_items || 0}</div>
                                    <p>Actions recommended</p>
                                </div>
                            </div>
                        )}

                        {/* AI Report Summary */}
                        {fullReport && (
                            <div className="card ai-report">
                                <h2>🤖 AI Generated Report</h2>
                                <div className="report-content">
                                    {fullReport.summary && <p className="summary-text">{fullReport.summary}</p>}

                                    {fullReport.risk_level && (
                                        <div className={`risk-badge ${fullReport.risk_level}`}>
                                            Risk Level: {fullReport.risk_level.toUpperCase()}
                                            {fullReport.risk_reason && <span> - {fullReport.risk_reason}</span>}
                                        </div>
                                    )}

                                    {fullReport.recommendations && (
                                        <div className="recommendations">
                                            <h4>Key Recommendations:</h4>
                                            <ul>
                                                {fullReport.recommendations.map((rec, idx) => (
                                                    <li key={idx}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {fullReport.insights && fullReport.insights.length > 0 && (
                                        <div className="insights-section">
                                            <h4>💡 AI Insights:</h4>
                                            <ul>
                                                {fullReport.insights.map((insight, idx) => (
                                                    <li key={idx}>{insight}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Analysis Tab */}
                {activeTab === 'stock' && stockAnalysis && (
                    <div className="stock-section">
                        <div className="card">
                            <h2>🔍 Data Analysis Agent Report</h2>

                            {stockAnalysis.ai_insights && (
                                <div className="ai-insight-box">
                                    <h4>🤖 AI Insights</h4>
                                    <p>{stockAnalysis.ai_insights}</p>
                                </div>
                            )}

                            {stockAnalysis.out_of_stock?.items?.length > 0 && (
                                <div className="alert-section critical">
                                    <h3>🚫 Critical Issues - Immediate Action Required</h3>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Category</th>
                                                <th>Value</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockAnalysis.out_of_stock.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{item.name || `Item ${idx + 1}`}</strong></td>
                                                    <td>{item.category || 'N/A'}</td>
                                                    <td>{item.quantity || 0}</td>
                                                    <td><span className="badge danger">Review Now</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {stockAnalysis.low_stock?.items?.length > 0 && (
                                <div className="alert-section warning">
                                    <h3>⚠️ Items Needing Attention</h3>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Current Value</th>
                                                <th>Threshold</th>
                                                <th>Gap</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockAnalysis.low_stock.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.name || `Item ${idx + 1}`}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.min_stock_level}</td>
                                                    <td className="shortage">-{item.min_stock_level - item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {stockAnalysis.healthy?.count > 0 && (
                                <div className="success-section">
                                    <h3>✅ Healthy Data</h3>
                                    <p>{stockAnalysis.healthy.count} records are within normal parameters</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Patterns Tab */}
                {activeTab === 'expiry' && expiryAnalysis && (
                    <div className="expiry-section">
                        <div className="card">
                            <h2>📅 Pattern Detection Agent Report</h2>

                            {expiryAnalysis.expired?.items?.length > 0 && (
                                <div className="alert-section critical">
                                    <h3>🚨 Past Due - Review Required</h3>
                                    {expiryAnalysis.expired.items.map((item, idx) => (
                                        <div key={idx} className="expiry-item expired">
                                            <strong>{item.name}</strong>
                                            <span>{Math.abs(item.days_until_expiry)} days overdue</span>
                                            <span className="badge danger">Review</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {expiryAnalysis.expiring_soon?.items?.length > 0 && (
                                <div className="alert-section warning">
                                    <h3>⏰ Upcoming (within 7 days)</h3>
                                    {expiryAnalysis.expiring_soon.items.map((item, idx) => (
                                        <div key={idx} className="expiry-item soon">
                                            <strong>{item.name}</strong>
                                            <span>{item.days_until_expiry} days remaining</span>
                                            <span>Count: {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {expiryAnalysis.selling_tips?.length > 0 && (
                                <div className="selling-tips">
                                    <h3>💡 AI Recommendations</h3>
                                    <div className="tips-grid">
                                        {expiryAnalysis.selling_tips.map((tip, idx) => (
                                            <div key={idx} className="tip-card">
                                                <h4>📦 {tip.item_name}</h4>
                                                <p>💰 <strong>Discount:</strong> {tip.discount_percent}% off</p>
                                                <p>🎁 <strong>Bundle:</strong> {tip.bundle_suggestion}</p>
                                                <p>📢 <strong>Message:</strong> {tip.marketing_message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!expiryAnalysis.expired?.items?.length && !expiryAnalysis.expiring_soon?.items?.length) && (
                                <div className="success-section">
                                    <h3>✅ No Critical Date Patterns Found</h3>
                                    <p>Your dataset doesn't have date-based patterns requiring immediate attention.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Items Tab */}
                {activeTab === 'orders' && orderSuggestions && (
                    <div className="orders-section">
                        <div className="card">
                            <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2>🛒 AI Action Recommendations</h2>
                            </div>

                            <div className="order-summary">
                                <div className="summary-item">
                                    <span>Total Actions</span>
                                    <strong>{orderSuggestions.total_items || 0}</strong>
                                </div>
                                <div className="summary-item critical">
                                    <span>Critical</span>
                                    <strong>{orderSuggestions.critical_count || 0}</strong>
                                </div>
                                <div className="summary-item warning">
                                    <span>High Priority</span>
                                    <strong>{orderSuggestions.high_priority_count || 0}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Est. Impact</span>
                                    <strong>${orderSuggestions.estimated_total_cost?.toFixed(0) || 0}</strong>
                                </div>
                            </div>

                            {orderSuggestions.ai_reasoning && (
                                <div className="ai-insight-box">
                                    <h4>🤖 AI Reasoning</h4>
                                    <p>{orderSuggestions.ai_reasoning}</p>
                                </div>
                            )}

                            {orderSuggestions.suggested_items?.length > 0 && (
                                <div className="order-table">
                                    <h3>📋 Recommended Actions</h3>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Priority</th>
                                                <th>Item</th>
                                                <th>Current</th>
                                                <th>Suggested Action</th>
                                                <th>Est. Impact</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderSuggestions.suggested_items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <span className={`badge ${item.urgency}`}>
                                                            {item.urgency === 'critical' ? '🔴' : item.urgency === 'high' ? '🟠' : '🟢'}
                                                            {item.urgency}
                                                        </span>
                                                    </td>
                                                    <td>{item.item_name}</td>
                                                    <td>{item.current_quantity}</td>
                                                    <td><strong>+{item.order_quantity}</strong> {item.unit}</td>
                                                    <td>${item.estimated_cost?.toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Navigate to Inventory Button */}
                            {orderSuggestions.suggested_items?.length > 0 && (
                                <div className="proceed-to-inventory">
                                    <a href="/daily-items" className="btn btn-success proceed-btn">
                                        <span>🛒</span>
                                        Proceed to Vendor Selection & Orders
                                        <span>→</span>
                                    </a>
                                    <p className="proceed-hint">Select vendors and process daily items</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && trendsAnalysis && (
                    <div className="trends-section">
                        <div className="card">
                            <h2>📈 Trends & Patterns Agent Report</h2>
                            <p>Analysis Type: {trendsAnalysis.location} | Patterns Found: {trendsAnalysis.pattern_count || 0}</p>

                            {trendsAnalysis.correlations?.length > 0 && (
                                <div className="correlations-section">
                                    <h3>🔗 Correlations Found</h3>
                                    <div className="correlation-grid">
                                        {trendsAnalysis.correlations.map((corr, idx) => (
                                            <div key={idx} className={`correlation-card ${corr.strength}`}>
                                                <h4>{corr.columns[0]} ↔ {corr.columns[1]}</h4>
                                                <p className="correlation-value">{(corr.value * 100).toFixed(1)}%</p>
                                                <span className="strength-label">{corr.strength} correlation</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="events-grid">
                                {trendsAnalysis.events?.map((event, idx) => (
                                    <div key={idx} className={`event-card ${event.impact}`}>
                                        <h4>{event.name}</h4>
                                        <p><strong>Type:</strong> {event.type}</p>
                                        <p className="demand-change">
                                            <strong>Significance:</strong>
                                            <span className="positive">{event.expected_demand_change}%</span>
                                        </p>
                                        <p><strong>Related:</strong> {event.affected_categories?.join(', ')}</p>
                                    </div>
                                ))}
                            </div>

                            {trendsAnalysis.demand_forecast && (
                                <div className="forecast-section">
                                    <h3>🔮 Insights & Recommendations</h3>
                                    <div className="forecast-content">
                                        {trendsAnalysis.demand_forecast.top_categories?.length > 0 && (
                                            <p><strong>Key Areas:</strong> {trendsAnalysis.demand_forecast.top_categories.join(', ')}</p>
                                        )}
                                        {trendsAnalysis.demand_forecast.recommendations?.map((rec, idx) => (
                                            <p key={idx}>• {rec}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .reasoning-page { padding: 1.5rem; max-width: 1400px; margin: 0 auto; background: #0f0f23; min-height: 100vh; }
                .page-header h1 { font-size: 1.75rem; color: #ffffff; margin-bottom: 0.5rem; }
                .page-header p { color: #9ca3af; }
                
                .card { background: #1a1a2e; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 1rem; border: 1px solid #2d2d44; }
                .card h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #ffffff; }
                .card h3 { color: #e5e7eb; }
                .card p { color: #d1d5db; }
                
                .selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .selection-group label { display: block; font-weight: 500; margin-bottom: 0.5rem; color: #9ca3af; }
                .selection-group select { width: 100%; padding: 0.75rem; border: 1px solid #3d3d5c; border-radius: 8px; background: #0f0f23; color: #ffffff; }
                .selection-group select option { background: #1a1a2e; color: #ffffff; }
                
                .helper-text { margin-top: 0.75rem; color: #f59e0b; font-size: 0.9rem; }
                
                .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
                .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .analyze-btn { width: 100%; font-size: 1rem; }
                
                .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
                .tab { padding: 0.75rem 1rem; border: none; background: #1a1a2e; color: #9ca3af; border-radius: 8px; cursor: pointer; font-weight: 500; border: 1px solid #2d2d44; }
                .tab:hover { background: #2d2d44; color: #ffffff; }
                .tab.active { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; }
                
                .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
                .metric-card { padding: 1.5rem; border-radius: 12px; text-align: center; }
                .metric-card h3 { color: #1a1a2e; margin-bottom: 0.5rem; font-size: 0.9rem; }
                .metric-card p { color: #374151; font-size: 0.85rem; }
                .metric-card.health { background: linear-gradient(135deg, #10b981, #059669); }
                .metric-card.health h3, .metric-card.health p { color: #ffffff; }
                .metric-card.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .metric-card.warning h3, .metric-card.warning p { color: #1a1a2e; }
                .metric-card.danger { background: linear-gradient(135deg, #ef4444, #dc2626); }
                .metric-card.danger h3, .metric-card.danger p { color: #ffffff; }
                .metric-card.expiry { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .metric-card.expiry h3, .metric-card.expiry p { color: #ffffff; }
                .metric-value { font-size: 2.5rem; font-weight: 700; color: #ffffff; }
                
                .agents-preview { margin-top: 1.5rem; }
                .agent-item { padding: 0.75rem; background: #2d2d44; border-radius: 8px; margin-bottom: 0.5rem; color: #d1d5db; border-left: 3px solid #667eea; }
                .agent-item strong { color: #ffffff; }
                
                .empty-state { text-align: center; padding: 3rem; color: #9ca3af; }
                .empty-state h3 { color: #ffffff; margin-bottom: 0.5rem; }
                
                .alert-section { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
                .alert-section h3 { margin-bottom: 0.75rem; }
                .alert-section.critical { background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; }
                .alert-section.critical h3 { color: #fca5a5; }
                .alert-section.warning { background: rgba(245, 158, 11, 0.15); border-left: 4px solid #f59e0b; }
                .alert-section.warning h3 { color: #fcd34d; }
                
                .success-section { padding: 1rem; background: rgba(16, 185, 129, 0.15); border-radius: 8px; border-left: 4px solid #10b981; }
                .success-section h3 { color: #6ee7b7; margin-bottom: 0.5rem; }
                .success-section p { color: #d1d5db; }
                
                .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #2d2d44; color: #d1d5db; }
                .data-table th { background: #0f0f23; font-weight: 600; color: #9ca3af; }
                .data-table td strong { color: #ffffff; }
                
                .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
                .badge.danger { background: #ef4444; color: white; }
                .badge.critical { background: #dc2626; color: white; }
                .badge.high { background: #f59e0b; color: #1a1a2e; }
                .badge.normal { background: #22c55e; color: white; }
                
                .shortage { color: #fca5a5; font-weight: 600; }
                
                .ai-insight-box { background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2)); padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #667eea; }
                .ai-insight-box h4 { margin-bottom: 0.5rem; color: #a5b4fc; }
                .ai-insight-box p { color: #d1d5db; }
                
                .expiry-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #2d2d44; border-radius: 8px; margin-bottom: 0.5rem; }
                .expiry-item strong { color: #ffffff; }
                .expiry-item span { color: #9ca3af; }
                
                .selling-tips h3 { color: #fcd34d; margin-bottom: 1rem; }
                .tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
                .tip-card { background: rgba(34, 197, 94, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid #22c55e; }
                .tip-card h4 { margin-bottom: 0.5rem; color: #86efac; }
                .tip-card p { color: #d1d5db; margin-bottom: 0.25rem; }
                .tip-card strong { color: #ffffff; }
                
                .order-summary { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
                .summary-item { background: #2d2d44; padding: 1rem; border-radius: 8px; text-align: center; flex: 1; min-width: 120px; }
                .summary-item span { color: #9ca3af; font-size: 0.85rem; }
                .summary-item strong { display: block; font-size: 1.5rem; margin-top: 0.5rem; color: #ffffff; }
                .summary-item.critical { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; }
                .summary-item.warning { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; }
                
                .order-table h3 { color: #e5e7eb; margin-bottom: 0.5rem; }
                
                .correlations-section { margin-bottom: 1.5rem; }
                .correlations-section h3 { color: #a5b4fc; margin-bottom: 1rem; }
                .correlation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
                .correlation-card { background: #2d2d44; padding: 1rem; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
                .correlation-card.strong { border-left-color: #22c55e; }
                .correlation-card.moderate { border-left-color: #f59e0b; }
                .correlation-card h4 { color: #ffffff; font-size: 0.9rem; margin-bottom: 0.5rem; }
                .correlation-value { font-size: 1.5rem; font-weight: 700; color: #a5b4fc; }
                .strength-label { color: #9ca3af; font-size: 0.8rem; }
                
                .events-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
                .event-card { background: #2d2d44; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6; }
                .event-card h4 { color: #ffffff; margin-bottom: 0.5rem; }
                .event-card p { color: #d1d5db; margin-bottom: 0.25rem; }
                .event-card strong { color: #9ca3af; }
                .event-card.very_high, .event-card.high { border-left-color: #ef4444; }
                .event-card.medium { border-left-color: #f59e0b; }
                .demand-change .positive { color: #22c55e; font-weight: 600; }
                
                .forecast-section { margin-top: 1.5rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid #3b82f6; }
                .forecast-section h3 { color: #93c5fd; margin-bottom: 0.5rem; }
                .forecast-content p { color: #d1d5db; }
                .forecast-content strong { color: #ffffff; }
                
                .ai-report { background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15)); border: 1px solid #667eea; }
                .ai-report h2 { color: #a5b4fc; }
                .report-content p { color: #d1d5db; }
                .summary-text { font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem; }
                
                .risk-badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-weight: 600; }
                .risk-badge.low { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid #10b981; }
                .risk-badge.medium { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid #f59e0b; }
                .risk-badge.high { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; }
                
                .insights-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #2d2d44; }
                .insights-section h4 { color: #fcd34d; margin-bottom: 0.5rem; }
                
                .recommendations h4 { color: #fcd34d; margin-top: 1rem; }
                .recommendations ul { margin-top: 0.5rem; padding-left: 1.25rem; }
                .recommendations li { margin-bottom: 0.5rem; color: #d1d5db; }
                
                .proceed-to-inventory { margin-top: 1.5rem; text-align: center; padding: 1.5rem; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1)); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3); }
                .btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
                .proceed-btn { display: inline-flex; align-items: center; gap: 0.75rem; padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; color: white; }
                .proceed-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4); }
                .proceed-hint { margin-top: 0.75rem; color: #6ee7b7; font-size: 0.9rem; }
                
                @media (max-width: 768px) {
                    .selection-grid { grid-template-columns: 1fr; }
                    .tabs { flex-direction: column; }
                    .tab { width: 100%; text-align: center; }
                }
            `}</style>
        </div>
    )
}
