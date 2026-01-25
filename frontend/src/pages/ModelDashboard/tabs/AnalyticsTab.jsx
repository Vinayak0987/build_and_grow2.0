/**
 * Analytics Tab - Model Dashboard
 * Shows confusion matrix, feature importance, ROC curves, and model comparison
 */
import { useQuery } from '@tanstack/react-query'
import {
    BarChart3,
    PieChart,
    Activity,
    TrendingUp,
    Award
} from 'lucide-react'
import { modelDashboardApi } from '../../../services/modelDashboardApi'

export default function AnalyticsTab({ model, modelId, overview }) {
    // Fetch analytics data
    const { data: analyticsResponse, isLoading } = useQuery({
        queryKey: ['modelAnalytics', modelId],
        queryFn: () => modelDashboardApi.getAnalytics(modelId),
        enabled: !!modelId
    })

    // Fetch feature importance
    const { data: importanceResponse } = useQuery({
        queryKey: ['featureImportance', modelId],
        queryFn: () => modelDashboardApi.getFeatureImportance(modelId),
        enabled: !!modelId
    })

    // Fetch model comparison
    const { data: comparisonResponse } = useQuery({
        queryKey: ['modelComparison', modelId],
        queryFn: () => modelDashboardApi.getModelComparison(modelId),
        enabled: !!modelId
    })

    const analytics = analyticsResponse?.data || {}
    const confusionMatrix = analytics?.confusion_matrix
    const featureImportance = importanceResponse?.data?.features || analytics?.feature_importance || []
    const modelComparison = comparisonResponse?.data?.models || analytics?.model_comparison || []

    // Get metrics from overview or analytics
    const metrics = overview?.metrics || model?.metrics || analytics?.metrics || {}

    // Loading state
    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        )
    }

    // Classification metrics
    const isClassification = model?.problem_type?.includes('classification')

    return (
        <div className="analytics-tab">
            {/* Confusion Matrix - Only for classification */}
            {isClassification && confusionMatrix && (
                <div className="info-card confusion-matrix-card">
                    <h3>
                        <PieChart size={18} />
                        Confusion Matrix
                    </h3>
                    <div className="confusion-matrix">
                        {/* Header row */}
                        <div className="cm-header"></div>
                        <div className="cm-header">Predicted Negative</div>
                        <div className="cm-header">Predicted Positive</div>

                        {/* Actual Negative row */}
                        <div className="cm-label">Actual Negative</div>
                        <div className="cm-cell tn">{confusionMatrix.tn || confusionMatrix[0]?.[0] || 0}</div>
                        <div className="cm-cell fp">{confusionMatrix.fp || confusionMatrix[0]?.[1] || 0}</div>

                        {/* Actual Positive row */}
                        <div className="cm-label">Actual Positive</div>
                        <div className="cm-cell fn">{confusionMatrix.fn || confusionMatrix[1]?.[0] || 0}</div>
                        <div className="cm-cell tp">{confusionMatrix.tp || confusionMatrix[1]?.[1] || 0}</div>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        marginTop: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        <span>
                            <span style={{ color: '#34d399' }}>■</span> Correct Predictions
                        </span>
                        <span>
                            <span style={{ color: '#f87171' }}>■</span> Incorrect Predictions
                        </span>
                    </div>
                </div>
            )}

            <div className="analytics-grid">
                {/* Feature Importance */}
                <div className="info-card">
                    <h3>
                        <BarChart3 size={18} />
                        Feature Importance
                    </h3>

                    {featureImportance.length > 0 ? (
                        <div className="feature-importance-list">
                            {featureImportance.slice(0, 10).map((feature, index) => (
                                <div className="feature-bar" key={feature.name || index}>
                                    <span className="feature-name" title={feature.name}>
                                        {feature.name}
                                    </span>
                                    <div className="feature-bar-track">
                                        <div
                                            className="feature-bar-fill"
                                            style={{
                                                width: `${(feature.importance / featureImportance[0].importance) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <span className="feature-value">
                                        {feature.importance.toFixed(3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                            Feature importance not available for this model.
                        </p>
                    )}
                </div>

                {/* Model Metrics */}
                <div className="info-card">
                    <h3>
                        <Activity size={18} />
                        Performance Metrics
                    </h3>

                    <div className="info-item">
                        <span className="info-label">Accuracy</span>
                        <span className="info-value">
                            {((metrics.accuracy || model?.best_score || 0) * 100).toFixed(2)}%
                        </span>
                    </div>

                    {isClassification && (
                        <>
                            <div className="info-item">
                                <span className="info-label">F1 Score</span>
                                <span className="info-value">
                                    {((metrics.f1_weighted || metrics.f1_score || 0) * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Precision</span>
                                <span className="info-value">
                                    {((metrics.precision_weighted || metrics.precision || 0) * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Recall</span>
                                <span className="info-value">
                                    {((metrics.recall_weighted || metrics.recall || 0) * 100).toFixed(2)}%
                                </span>
                            </div>
                            {metrics.roc_auc && (
                                <div className="info-item">
                                    <span className="info-label">ROC AUC</span>
                                    <span className="info-value">
                                        {(metrics.roc_auc * 100).toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {!isClassification && (
                        <>
                            <div className="info-item">
                                <span className="info-label">R² Score</span>
                                <span className="info-value">
                                    {(metrics.r2_score || model?.best_score || 0).toFixed(4)}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">MAE</span>
                                <span className="info-value">
                                    {(metrics.mae || 0).toFixed(4)}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">RMSE</span>
                                <span className="info-value">
                                    {(metrics.rmse || 0).toFixed(4)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Model Comparison Table */}
            {modelComparison.length > 0 && (
                <div className="info-card mt-6">
                    <h3>
                        <Award size={18} />
                        Algorithm Comparison
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>CV Score</th>
                                    <th>CV Std</th>
                                    <th>Test Accuracy</th>
                                    <th>F1 Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modelComparison.map((m) => (
                                    <tr
                                        key={m.model_name}
                                        className={m.model_name === model?.best_model_name ? 'best-model' : ''}
                                    >
                                        <td>
                                            {m.model_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </td>
                                        <td>
                                            {m.cv_score_mean
                                                ? `${(m.cv_score_mean * 100).toFixed(2)}%`
                                                : '—'
                                            }
                                        </td>
                                        <td>
                                            {m.cv_score_std
                                                ? `±${(m.cv_score_std * 100).toFixed(2)}%`
                                                : '—'
                                            }
                                        </td>
                                        <td>
                                            {m.test_metrics?.accuracy
                                                ? `${(m.test_metrics.accuracy * 100).toFixed(2)}%`
                                                : '—'
                                            }
                                        </td>
                                        <td>
                                            {m.test_metrics?.f1_weighted
                                                ? `${(m.test_metrics.f1_weighted * 100).toFixed(2)}%`
                                                : '—'
                                            }
                                        </td>
                                        <td>
                                            <span className={`badge ${m.status === 'completed' ? 'badge-success' : 'badge-error'}`}>
                                                {m.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Additional Info */}
            <div className="info-card mt-6">
                <h3>
                    <TrendingUp size={18} />
                    Training Details
                </h3>

                <div className="info-item">
                    <span className="info-label">Best Algorithm</span>
                    <span className="info-value">{model?.best_model_name || 'Auto'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Best CV Score</span>
                    <span className="info-value">
                        {((model?.best_score || 0) * 100).toFixed(2)}%
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-label">Cross-Validation</span>
                    <span className="info-value">5-Fold</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Target Column</span>
                    <span className="info-value">{model?.target_column}</span>
                </div>
            </div>
        </div>
    )
}
