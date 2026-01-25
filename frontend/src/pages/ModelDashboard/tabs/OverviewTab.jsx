/**
 * Overview Tab - Model Dashboard
 * Shows quick stats, metrics, and model information
 */
import {
    Activity,
    Target,
    Percent,
    TrendingUp,
    CheckCircle,
    Clock,
    Database,
    Cpu,
    Layers,
    Info
} from 'lucide-react'

export default function OverviewTab({ model, overview, overviewLoading }) {
    // Extract metrics from model data
    const metrics = overview?.metrics || model?.metrics || {}
    const trainingInfo = overview?.training_info || {}
    const datasetInfo = overview?.dataset_info || {}

    // Calculate display values
    const accuracy = model?.best_score || metrics?.accuracy || 0
    const f1Score = metrics?.f1_weighted || metrics?.f1_score || 0
    const precision = metrics?.precision_weighted || metrics?.precision || 0
    const recall = metrics?.recall_weighted || metrics?.recall || 0

    // Training timeline steps
    const timelineSteps = [
        { label: 'Upload', status: 'completed' },
        { label: 'Profile', status: 'completed' },
        { label: 'Preprocess', status: 'completed' },
        { label: 'Train', status: 'completed' },
        { label: 'Evaluate', status: 'completed' },
        { label: 'Package', status: model?.has_package ? 'completed' : 'pending' }
    ]

    return (
        <div className="overview-tab">
            {/* Stats Grid */}
            <div className="stats-grid-4">
                <div className="stat-card-dashboard">
                    <div className="stat-header">
                        <div className="stat-icon primary">
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{(accuracy * 100).toFixed(1)}%</div>
                    <div className="stat-label">Accuracy</div>
                </div>

                <div className="stat-card-dashboard">
                    <div className="stat-header">
                        <div className="stat-icon success">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{(f1Score * 100).toFixed(1)}%</div>
                    <div className="stat-label">F1 Score</div>
                </div>

                <div className="stat-card-dashboard">
                    <div className="stat-header">
                        <div className="stat-icon warning">
                            <Percent size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{(precision * 100).toFixed(1)}%</div>
                    <div className="stat-label">Precision</div>
                </div>

                <div className="stat-card-dashboard">
                    <div className="stat-header">
                        <div className="stat-icon info">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="stat-value">{(recall * 100).toFixed(1)}%</div>
                    <div className="stat-label">Recall</div>
                </div>
            </div>

            {/* Model Info Grid */}
            <div className="model-info-grid">
                {/* Model Details Card */}
                <div className="info-card">
                    <h3>
                        <Info size={18} />
                        Model Details
                    </h3>

                    <div className="info-item">
                        <span className="info-label">Model Name</span>
                        <span className="info-value">{model?.name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Problem Type</span>
                        <span className="info-value">
                            {model?.problem_type?.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Best Algorithm</span>
                        <span className="info-value">{model?.best_model_name || 'Auto'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Target Column</span>
                        <span className="info-value">{model?.target_column}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Features Count</span>
                        <span className="info-value">
                            {overview?.num_features || model?.num_features || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Created At</span>
                        <span className="info-value">
                            {new Date(model?.created_at).toLocaleString()}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Model Package</span>
                        <span className="info-value">
                            {model?.has_package ? (
                                <span className="badge badge-success">Available</span>
                            ) : (
                                <span className="badge badge-warning">Not Available</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Dataset Info Card */}
                <div className="info-card">
                    <h3>
                        <Database size={18} />
                        Dataset Info
                    </h3>

                    <div className="info-item">
                        <span className="info-label">Dataset</span>
                        <span className="info-value">
                            {model?.dataset_name || datasetInfo?.name || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Rows</span>
                        <span className="info-value">
                            {datasetInfo?.num_rows?.toLocaleString() || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Columns</span>
                        <span className="info-value">
                            {datasetInfo?.num_columns || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">File Size</span>
                        <span className="info-value">
                            {datasetInfo?.file_size || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Training Timeline */}
            <div className="info-card">
                <h3>
                    <Layers size={18} />
                    Training Pipeline
                </h3>

                <div className="training-timeline">
                    {timelineSteps.map((step, index) => (
                        <>
                            <div className="timeline-step" key={step.label}>
                                <div className={`step-dot ${step.status}`}>
                                    {step.status === 'completed' ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                            {index < timelineSteps.length - 1 && (
                                <div
                                    key={`connector-${index}`}
                                    className={`timeline-connector ${step.status === 'completed' ? 'completed' : ''
                                        }`}
                                />
                            )}
                        </>
                    ))}
                </div>
            </div>

            {/* Training Info Card */}
            {trainingInfo && Object.keys(trainingInfo).length > 0 && (
                <div className="info-card mt-6">
                    <h3>
                        <Cpu size={18} />
                        Training Summary
                    </h3>

                    {trainingInfo.training_time && (
                        <div className="info-item">
                            <span className="info-label">Training Time</span>
                            <span className="info-value">
                                {trainingInfo.training_time}
                            </span>
                        </div>
                    )}
                    {trainingInfo.models_trained && (
                        <div className="info-item">
                            <span className="info-label">Models Trained</span>
                            <span className="info-value">
                                {trainingInfo.models_trained}
                            </span>
                        </div>
                    )}
                    {trainingInfo.cv_folds && (
                        <div className="info-item">
                            <span className="info-label">Cross-Validation Folds</span>
                            <span className="info-value">
                                {trainingInfo.cv_folds}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
