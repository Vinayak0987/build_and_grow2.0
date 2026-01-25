/**
 * Predict Tab - Model Dashboard
 * Make predictions using the trained model with dynamic form from schema
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    Sparkles,
    Loader2,
    AlertCircle,
    Clock,
    Trash2,
    ChevronRight
} from 'lucide-react'
import { modelDashboardApi } from '../../../services/modelDashboardApi'

export default function PredictTab({ model, modelId }) {
    const [formValues, setFormValues] = useState({})
    const [predictionResult, setPredictionResult] = useState(null)
    const [predictionHistory, setPredictionHistory] = useState([])

    // Fetch UI schema
    const { data: schemaData, isLoading: schemaLoading } = useQuery({
        queryKey: ['modelSchema', modelId],
        queryFn: () => modelDashboardApi.getSchema(modelId),
        enabled: !!modelId
    })

    const schema = schemaData?.data?.schema || schemaData?.data

    // Initialize form values from schema
    useEffect(() => {
        if (schema?.fields) {
            const initialValues = {}
            schema.fields.forEach(field => {
                if (field.default !== undefined) {
                    initialValues[field.name] = field.default
                } else if (field.input_type === 'number' || field.input_type === 'slider') {
                    initialValues[field.name] = field.min || 0
                } else if (field.input_type === 'dropdown' && field.options?.length > 0) {
                    initialValues[field.name] = field.options[0]
                } else if (field.input_type === 'checkbox') {
                    initialValues[field.name] = false
                } else {
                    initialValues[field.name] = ''
                }
            })
            setFormValues(initialValues)
        }
    }, [schema])

    // Load prediction history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`prediction-history-${modelId}`)
        if (saved) {
            try {
                setPredictionHistory(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load prediction history:', e)
            }
        }
    }, [modelId])

    // Prediction mutation
    const predictMutation = useMutation({
        mutationFn: (input) => modelDashboardApi.predict(modelId, input),
        onSuccess: (response) => {
            const result = response.data
            setPredictionResult(result)

            // Add to history
            const historyItem = {
                id: Date.now(),
                input: { ...formValues },
                prediction: result.prediction,
                probability: result.probability || result.confidence,
                timestamp: new Date().toISOString()
            }
            const newHistory = [historyItem, ...predictionHistory].slice(0, 20)
            setPredictionHistory(newHistory)
            localStorage.setItem(`prediction-history-${modelId}`, JSON.stringify(newHistory))
        }
    })

    // Handle form input change
    const handleInputChange = (name, value) => {
        setFormValues(prev => ({ ...prev, [name]: value }))
    }

    // Handle prediction
    const handlePredict = () => {
        predictMutation.mutate(formValues)
    }

    // Clear history
    const clearHistory = () => {
        setPredictionHistory([])
        localStorage.removeItem(`prediction-history-${modelId}`)
    }

    // Load history item
    const loadHistoryItem = (item) => {
        setFormValues(item.input)
        setPredictionResult({
            prediction: item.prediction,
            probability: item.probability
        })
    }

    // Render form field based on schema
    const renderField = (field) => {
        const { name, input_type, label, min, max, options, step } = field
        const displayLabel = label || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const value = formValues[name]

        switch (input_type) {
            case 'number':
                return (
                    <div className="form-group" key={name}>
                        <label>{displayLabel}</label>
                        <input
                            type="number"
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(name, parseFloat(e.target.value) || 0)}
                            min={min}
                            max={max}
                            step={step || 1}
                        />
                    </div>
                )

            case 'slider':
                return (
                    <div className="form-group" key={name}>
                        <label>{displayLabel}</label>
                        <input
                            type="range"
                            value={value ?? min ?? 0}
                            onChange={(e) => handleInputChange(name, parseFloat(e.target.value))}
                            min={min ?? 0}
                            max={max ?? 100}
                            step={step || 1}
                        />
                        <div className="range-labels">
                            <span>{min ?? 0}</span>
                            <span className="range-value">{value}</span>
                            <span>{max ?? 100}</span>
                        </div>
                    </div>
                )

            case 'dropdown':
                return (
                    <div className="form-group" key={name}>
                        <label>{displayLabel}</label>
                        <select
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(name, e.target.value)}
                        >
                            {options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )

            case 'checkbox':
                return (
                    <div className="form-group" key={name}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={value ?? false}
                                onChange={(e) => handleInputChange(name, e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            {displayLabel}
                        </label>
                    </div>
                )

            case 'radio':
                return (
                    <div className="form-group" key={name}>
                        <label>{displayLabel}</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {options?.map(opt => (
                                <label
                                    key={opt}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={name}
                                        value={opt}
                                        checked={value === opt}
                                        onChange={(e) => handleInputChange(name, e.target.value)}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>
                )

            default:
                return (
                    <div className="form-group" key={name}>
                        <label>{displayLabel}</label>
                        <input
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(name, e.target.value)}
                            placeholder={`Enter ${displayLabel}`}
                        />
                    </div>
                )
        }
    }

    // Format time ago
    const formatTimeAgo = (timestamp) => {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)
        if (seconds < 60) return 'Just now'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return new Date(timestamp).toLocaleDateString()
    }

    // Loading schema state
    if (schemaLoading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading prediction form...</p>
            </div>
        )
    }

    // No schema available
    if (!schema || !schema.fields || schema.fields.length === 0) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">
                    <AlertCircle size={32} />
                </div>
                <h3>No Schema Available</h3>
                <p>
                    This model doesn't have a prediction schema.
                    Please retrain the model to generate the prediction form.
                </p>
            </div>
        )
    }

    return (
        <div className="predict-tab">
            <div className="prediction-console">
                {/* Prediction Form */}
                <div className="prediction-form-card">
                    <h3>
                        <Sparkles size={20} />
                        Enter Feature Values
                    </h3>

                    <div className="form-grid">
                        {schema.fields.map(field => renderField(field))}
                    </div>

                    <button
                        className="predict-button"
                        onClick={handlePredict}
                        disabled={predictMutation.isPending}
                    >
                        {predictMutation.isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Predicting...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Make Prediction
                            </>
                        )}
                    </button>

                    {predictMutation.isError && (
                        <div className="mt-4" style={{ color: '#f87171', fontSize: '0.875rem' }}>
                            Prediction failed: {predictMutation.error?.message || 'Unknown error'}
                        </div>
                    )}
                </div>

                {/* Prediction Result */}
                <div className="prediction-result-card">
                    {!predictionResult ? (
                        <div className="result-placeholder">
                            <div className="placeholder-icon">🎯</div>
                            <h3>No Prediction Yet</h3>
                            <p>Fill in the form and click "Make Prediction" to see results</p>
                        </div>
                    ) : (
                        <div className="result-display">
                            <div className="result-label">Prediction Result</div>
                            <div className="result-value">{String(predictionResult.prediction)}</div>

                            {predictionResult.probability !== undefined && (
                                <>
                                    <div className="confidence-bar">
                                        <div
                                            className="confidence-fill"
                                            style={{ width: `${predictionResult.probability * 100}%` }}
                                        />
                                    </div>
                                    <div className="confidence-text">
                                        Confidence: {(predictionResult.probability * 100).toFixed(1)}%
                                    </div>
                                </>
                            )}

                            {predictionResult.class_probabilities && (
                                <div className="class-probabilities">
                                    <h4>Class Probabilities</h4>
                                    {Object.entries(predictionResult.class_probabilities).map(([cls, prob]) => (
                                        <div className="probability-bar" key={cls}>
                                            <span className="prob-label">{cls}</span>
                                            <div className="prob-track">
                                                <div
                                                    className={`prob-fill ${prob === Math.max(...Object.values(predictionResult.class_probabilities)) ? 'primary' : 'secondary'}`}
                                                    style={{ width: `${prob * 100}%` }}
                                                />
                                            </div>
                                            <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Prediction History */}
            {predictionHistory.length > 0 && (
                <div className="prediction-history info-card mt-6">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>
                            <Clock size={18} />
                            Prediction History
                        </h3>
                        <button
                            className="btn btn-secondary"
                            onClick={clearHistory}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                        >
                            <Trash2 size={14} />
                            Clear
                        </button>
                    </div>

                    <div className="history-list">
                        {predictionHistory.map(item => (
                            <div
                                key={item.id}
                                className="history-item"
                                onClick={() => loadHistoryItem(item)}
                            >
                                <div className="history-summary">
                                    {Object.entries(item.input).slice(0, 3).map(([k, v]) => (
                                        <span key={k}>{k}: {String(v).substring(0, 10)} </span>
                                    ))}
                                    {Object.keys(item.input).length > 3 && '...'}
                                </div>
                                <div className="history-result">
                                    <span className="history-prediction">{String(item.prediction)}</span>
                                    {item.probability && (
                                        <span className="history-confidence">
                                            {(item.probability * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    <span className="history-time">{formatTimeAgo(item.timestamp)}</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
