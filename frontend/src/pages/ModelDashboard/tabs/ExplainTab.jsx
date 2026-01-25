/**
 * Explain Tab - Model Dashboard
 * SHAP-based explainability for predictions
 */
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    Brain,
    Sparkles,
    Loader2,
    AlertCircle,
    Info,
    ArrowRight
} from 'lucide-react'
import { modelDashboardApi } from '../../../services/modelDashboardApi'

export default function ExplainTab({ model, modelId }) {
    const [selectedInput, setSelectedInput] = useState(null)
    const [localExplanation, setLocalExplanation] = useState(null)

    // Load prediction history from localStorage
    const predictionHistory = (() => {
        try {
            const saved = localStorage.getItem(`prediction-history-${modelId}`)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })()

    // Fetch global SHAP values
    const { data: globalShapResponse, isLoading: globalLoading } = useQuery({
        queryKey: ['globalShap', modelId],
        queryFn: () => modelDashboardApi.getGlobalShap(modelId),
        enabled: !!modelId
    })

    const globalShap = globalShapResponse?.data?.shap_values || []

    // Local SHAP explanation mutation
    const explainMutation = useMutation({
        mutationFn: (input) => modelDashboardApi.getLocalShap(modelId, input),
        onSuccess: (response) => {
            setLocalExplanation(response.data)
        }
    })

    // Request explanation for a prediction
    const handleExplain = (historyItem) => {
        setSelectedInput(historyItem)
        explainMutation.mutate(historyItem.input)
    }

    // Get color for SHAP value
    const getShapColor = (value) => {
        if (value > 0) return '#f87171' // Red for positive (increases prediction)
        if (value < 0) return '#60a5fa' // Blue for negative (decreases prediction)
        return '#94a3b8' // Gray for neutral
    }

    return (
        <div className="explain-tab">
            {/* Global SHAP Section */}
            <div className="info-card">
                <h3>
                    <Brain size={18} />
                    Global Feature Impact (SHAP)
                </h3>
                <p style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.875rem',
                    marginBottom: '1.5rem'
                }}>
                    Shows how each feature generally affects predictions across all samples.
                    <span style={{ color: '#f87171' }}> Red = increases prediction</span>,
                    <span style={{ color: '#60a5fa' }}> Blue = decreases prediction</span>
                </p>

                {globalLoading ? (
                    <div className="dashboard-loading" style={{ minHeight: '150px' }}>
                        <div className="spinner"></div>
                        <p>Loading SHAP values...</p>
                    </div>
                ) : globalShap.length > 0 ? (
                    <div className="feature-importance-list">
                        {globalShap.slice(0, 10).map((feature, index) => (
                            <div className="feature-bar" key={feature.name || index}>
                                <span className="feature-name" title={feature.name}>
                                    {feature.name}
                                </span>
                                <div className="feature-bar-track">
                                    <div
                                        className="feature-bar-fill"
                                        style={{
                                            width: `${Math.abs(feature.mean_shap) / Math.abs(globalShap[0]?.mean_shap || 1) * 100}%`,
                                            background: `linear-gradient(90deg, ${getShapColor(-1)} 0%, ${getShapColor(1)} 100%)`
                                        }}
                                    />
                                </div>
                                <span className="feature-value" style={{ color: getShapColor(feature.mean_shap) }}>
                                    {feature.mean_shap > 0 ? '+' : ''}{feature.mean_shap.toFixed(3)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        <Info size={32} style={{ marginBottom: '0.5rem' }} />
                        <p>SHAP values are not available for this model.</p>
                        <p style={{ fontSize: '0.875rem' }}>
                            Make a prediction with explanation to generate local SHAP values.
                        </p>
                    </div>
                )}
            </div>

            {/* Local Explanation Section */}
            <div className="charts-grid mt-6">
                {/* Select Prediction */}
                <div className="info-card">
                    <h3>
                        <Sparkles size={18} />
                        Explain a Prediction
                    </h3>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                    }}>
                        Select a prediction from history to explain why the model made that decision.
                    </p>

                    {predictionHistory.length > 0 ? (
                        <div className="history-list" style={{ maxHeight: '300px' }}>
                            {predictionHistory.map((item) => (
                                <div
                                    key={item.id}
                                    className="history-item"
                                    onClick={() => handleExplain(item)}
                                    style={{
                                        background: selectedInput?.id === item.id
                                            ? 'rgba(139, 92, 246, 0.15)'
                                            : undefined,
                                        borderColor: selectedInput?.id === item.id
                                            ? 'rgba(139, 92, 246, 0.3)'
                                            : undefined
                                    }}
                                >
                                    <div className="history-summary">
                                        {Object.entries(item.input).slice(0, 2).map(([k, v]) => (
                                            <span key={k}>{k}: {String(v).substring(0, 8)}, </span>
                                        ))}
                                        ...
                                    </div>
                                    <div className="history-result">
                                        <span className="history-prediction">{String(item.prediction)}</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                            <p>No prediction history yet.</p>
                            <p style={{ fontSize: '0.875rem' }}>
                                Make predictions in the Predict tab first.
                            </p>
                        </div>
                    )}
                </div>

                {/* Local Explanation Display */}
                <div className="info-card">
                    <h3>
                        <Brain size={18} />
                        Local Explanation
                    </h3>

                    {explainMutation.isPending && (
                        <div className="dashboard-loading" style={{ minHeight: '200px' }}>
                            <Loader2 size={24} className="animate-spin" />
                            <p>Calculating explanation...</p>
                        </div>
                    )}

                    {explainMutation.isError && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>
                            <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                            <p>Failed to generate explanation</p>
                        </div>
                    )}

                    {!explainMutation.isPending && !localExplanation && !explainMutation.isError && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Select a prediction to see its explanation</p>
                        </div>
                    )}

                    {localExplanation && !explainMutation.isPending && (
                        <div>
                            {/* Prediction Summary */}
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    Prediction
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {String(selectedInput?.prediction)}
                                </div>
                            </div>

                            {/* Feature Contributions (Waterfall) */}
                            <h4 style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                                color: 'var(--color-text-muted)'
                            }}>
                                Feature Contributions
                            </h4>

                            {localExplanation.shap_values ? (
                                <div className="feature-importance-list">
                                    {Object.entries(localExplanation.shap_values)
                                        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                                        .slice(0, 8)
                                        .map(([feature, value]) => (
                                            <div className="feature-bar" key={feature}>
                                                <span className="feature-name" title={feature}>
                                                    {feature}
                                                </span>
                                                <div className="feature-bar-track" style={{ position: 'relative' }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: '50%',
                                                        top: 0,
                                                        bottom: 0,
                                                        width: '1px',
                                                        background: 'var(--glass-border)'
                                                    }} />
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            position: 'absolute',
                                                            left: value > 0 ? '50%' : `${50 - Math.abs(value) * 50}%`,
                                                            width: `${Math.abs(value) * 50}%`,
                                                            background: getShapColor(value),
                                                            borderRadius: 'var(--radius-full)'
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className="feature-value"
                                                    style={{ color: getShapColor(value) }}
                                                >
                                                    {value > 0 ? '+' : ''}{value.toFixed(3)}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    Detailed SHAP breakdown not available.
                                </p>
                            )}

                            {/* Input Values */}
                            <h4 style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginTop: '1.5rem',
                                marginBottom: '1rem',
                                color: 'var(--color-text-muted)'
                            }}>
                                Input Values
                            </h4>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                            }}>
                                {selectedInput && Object.entries(selectedInput.input).map(([k, v]) => (
                                    <span
                                        key={k}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    >
                                        {k}: <strong style={{ color: 'var(--color-text-main)' }}>{String(v)}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Card */}
            <div className="info-card mt-6">
                <h3>
                    <Info size={18} />
                    About SHAP Explanations
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    SHAP (SHapley Additive exPlanations) values show how much each feature contributes to
                    pushing the prediction away from the baseline. Positive values (red) push the prediction
                    higher, while negative values (blue) push it lower. The magnitude indicates the strength
                    of the contribution.
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginTop: '0.5rem' }}>
                    This helps understand <strong>why</strong> the model made a specific prediction,
                    which is crucial for debugging, compliance (e.g., NBFC audit trails), and building trust.
                </p>
            </div>
        </div>
    )
}
