import { useState, useEffect, useRef } from 'react'
import { salesApi, forecastApi, datasetsApi, modelsApi, predictionsApi } from '../services/api'
import './DemandForecast.css'

export default function DemandForecast() {
    // Data selection states
    const [datasets, setDatasets] = useState([])
    const [models, setModels] = useState([])
    const [selectedDataset, setSelectedDataset] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)

    // Forecast states
    const [forecasts, setForecasts] = useState([])
    const [accuracy, setAccuracy] = useState(null)
    const [weeklyOrder, setWeeklyOrder] = useState(null)

    // UI states
    const [loading, setLoading] = useState(true)
    const [loadingForecasts, setLoadingForecasts] = useState(false)
    const [training, setTraining] = useState(false)
    const [error, setError] = useState(null)
    const [forecastDays, setForecastDays] = useState(7)

    const fileInputRef = useRef(null)

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        setError(null)
        try {
            // Load available datasets and models in parallel
            const [datasetsRes, modelsRes] = await Promise.all([
                datasetsApi.list(),
                modelsApi.list()
            ])

            const availableDatasets = datasetsRes.data.datasets || []
            const availableModels = modelsRes.data.models || []

            setDatasets(availableDatasets)
            setModels(availableModels)

            // Auto-select first model if available
            if (availableModels.length > 0) {
                setSelectedModel(availableModels[0])
            }

            // Auto-select first dataset if available
            if (availableDatasets.length > 0) {
                setSelectedDataset(availableDatasets[0])
            }

            // Also try to load any existing forecasts from the forecast service
            try {
                const [forecastRes, accuracyRes, orderRes] = await Promise.all([
                    forecastApi.getAll(7),
                    forecastApi.getAccuracy(30),
                    forecastApi.getWeeklyOrder()
                ])

                const forecastData = forecastRes.data
                if (forecastData.forecasts && forecastData.forecasts.length > 0) {
                    setForecasts(forecastData.forecasts)
                }

                if (accuracyRes.data && accuracyRes.data.evaluated > 0) {
                    setAccuracy(accuracyRes.data)
                }

                if (orderRes.data && orderRes.data.suggestions?.length > 0) {
                    setWeeklyOrder(orderRes.data)
                }
            } catch (forecastError) {
                console.log('No existing forecasts available:', forecastError.message)
            }

        } catch (error) {
            console.error('Failed to load data:', error)
            setError('Failed to connect to the server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateForecasts = async () => {
        if (!selectedModel && !selectedDataset) {
            alert('Please select a model or dataset first')
            return
        }

        setLoadingForecasts(true)
        setError(null)

        try {
            if (selectedModel) {
                // Use the selected trained model for predictions
                // For time series models, we can use batch prediction
                const result = await forecastApi.getAll(forecastDays)

                if (result.data.forecasts && result.data.forecasts.length > 0) {
                    setForecasts(result.data.forecasts)
                } else {
                    // If no forecasts from forecast API, try generating from the model
                    setError('No forecast data available. Please train a forecasting model first.')
                }
            } else if (selectedDataset) {
                // Use dataset for forecast training first
                await forecastApi.train('random_forest', 90)
                const result = await forecastApi.getAll(forecastDays)
                setForecasts(result.data.forecasts || [])
            }

            // Also update weekly order suggestions
            try {
                const orderRes = await forecastApi.getWeeklyOrder()
                if (orderRes.data && orderRes.data.suggestions?.length > 0) {
                    setWeeklyOrder(orderRes.data)
                }
            } catch (e) {
                console.log('No weekly order data available')
            }

        } catch (error) {
            console.error('Forecast generation failed:', error)
            setError('Failed to generate forecasts: ' + (error.response?.data?.error || error.message))
        } finally {
            setLoadingForecasts(false)
        }
    }

    const handleTrainModel = async () => {
        if (!selectedDataset) {
            alert('Please select a dataset first')
            return
        }

        setTraining(true)
        try {
            const result = await forecastApi.train('random_forest', 90)
            alert(`Model trained! ${result.data.products_trained} products trained.`)
            await loadInitialData()
        } catch (error) {
            console.error('Training failed:', error)
            alert('Training failed: ' + (error.response?.data?.error || error.message))
        } finally {
            setTraining(false)
        }
    }

    const handleUploadCSV = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await salesApi.uploadCsv(formData)
            alert(`Imported ${result.data.imported} sales records!`)
            await loadInitialData()
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Upload failed: ' + (error.response?.data?.error || error.message))
        }
    }

    const getAccuracyClass = (value) => {
        if (value >= 80) return 'good'
        if (value >= 60) return 'medium'
        return 'bad'
    }

    const getModelIcon = (type) => {
        if (type?.includes('classification')) return '🎯'
        if (type === 'regression') return '📈'
        if (type === 'timeseries') return '📊'
        return '🤖'
    }

    if (loading) {
        return (
            <div className="forecast-page">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading models and datasets...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="forecast-page">
            <div className="forecast-header">
                <div>
                    <h1>📈 Demand Forecasting</h1>
                    <p>Select a trained model and dataset to generate demand predictions</p>
                </div>
                <div className="header-actions">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleUploadCSV}
                    />
                    <button
                        className="upload-csv-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📁 Upload CSV
                    </button>
                    <button className="refresh-btn" onClick={loadInitialData}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="forecast-section">
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button className="retry-btn" onClick={loadInitialData}>
                            🔄 Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Model & Dataset Selection Section */}
            <div className="forecast-section selection-section">
                <div className="section-header">
                    <h2>🎯 Select Model & Dataset</h2>
                </div>

                <div className="selection-grid">
                    {/* Models Selection */}
                    <div className="selection-column">
                        <h3>Trained Models</h3>
                        <p className="selection-hint">Select a model to use for predictions</p>

                        {models.length > 0 ? (
                            <div className="selection-list">
                                {models.map((model) => (
                                    <div
                                        key={model.id}
                                        className={`selection-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedModel(model)}
                                    >
                                        <div className="selection-icon">
                                            {getModelIcon(model.problem_type)}
                                        </div>
                                        <div className="selection-info">
                                            <span className="selection-name">{model.name}</span>
                                            <span className="selection-meta">
                                                {model.problem_type?.replace('_', ' ')} • {model.best_score ? `${(model.best_score * 100).toFixed(1)}% accuracy` : 'N/A'}
                                            </span>
                                        </div>
                                        {selectedModel?.id === model.id && (
                                            <span className="check-icon">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-selection">
                                <p>No trained models available</p>
                                <a href="/training" className="link-btn">Train a Model →</a>
                            </div>
                        )}
                    </div>

                    {/* Datasets Selection */}
                    <div className="selection-column">
                        <h3>Available Datasets</h3>
                        <p className="selection-hint">Select a dataset for training or reference</p>

                        {datasets.length > 0 ? (
                            <div className="selection-list">
                                {datasets.map((dataset) => (
                                    <div
                                        key={dataset.id}
                                        className={`selection-card ${selectedDataset?.id === dataset.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedDataset(dataset)}
                                    >
                                        <div className="selection-icon">📊</div>
                                        <div className="selection-info">
                                            <span className="selection-name">{dataset.name}</span>
                                            <span className="selection-meta">
                                                {dataset.rows?.toLocaleString() || '?'} rows • {dataset.columns || '?'} columns
                                            </span>
                                        </div>
                                        {selectedDataset?.id === dataset.id && (
                                            <span className="check-icon">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-selection">
                                <p>No datasets available</p>
                                <button
                                    className="link-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Upload Dataset →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Forecast Controls */}
                <div className="forecast-controls">
                    <div className="control-group">
                        <label>Forecast Days:</label>
                        <select
                            value={forecastDays}
                            onChange={(e) => setForecastDays(parseInt(e.target.value))}
                            className="days-select"
                        >
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                        </select>
                    </div>

                    <div className="control-buttons">
                        <button
                            className="train-btn"
                            onClick={handleTrainModel}
                            disabled={training || !selectedDataset}
                        >
                            {training ? '🔄 Training...' : '🧠 Train New Model'}
                        </button>

                        <button
                            className="generate-btn"
                            onClick={handleGenerateForecasts}
                            disabled={loadingForecasts || (!selectedModel && !selectedDataset)}
                        >
                            {loadingForecasts ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>🚀 Generate Forecasts</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Forecasts Display Section */}
            {forecasts.length > 0 && (
                <>
                    {/* Model Accuracy Section */}
                    <div className="forecast-section">
                        <div className="section-header">
                            <h2>📊 Model Performance</h2>
                            <span className="live-badge">🔴 LIVE DATA</span>
                        </div>
                        {accuracy && accuracy.evaluated > 0 ? (
                            <div className="accuracy-grid">
                                <div className="accuracy-card">
                                    <div className={`accuracy-value ${getAccuracyClass(accuracy.accuracy_percent)}`}>
                                        {accuracy.accuracy_percent?.toFixed(1)}%
                                    </div>
                                    <div className="accuracy-label">Overall Accuracy</div>
                                </div>
                                <div className="accuracy-card">
                                    <div className="accuracy-value">{accuracy.mape?.toFixed(2)}%</div>
                                    <div className="accuracy-label">MAPE</div>
                                </div>
                                <div className="accuracy-card">
                                    <div className="accuracy-value">{accuracy.mae?.toFixed(1)}</div>
                                    <div className="accuracy-label">MAE</div>
                                </div>
                                <div className="accuracy-card">
                                    <div className="accuracy-value">{accuracy.evaluated || 0}</div>
                                    <div className="accuracy-label">Predictions Evaluated</div>
                                </div>
                            </div>
                        ) : (
                            <div className="info-state">
                                <p>📈 Forecasts generated! Accuracy metrics will appear once predictions are compared with actual sales.</p>
                            </div>
                        )}
                    </div>

                    {/* Forecasts Table */}
                    <div className="forecast-section">
                        <div className="section-header">
                            <h2>🔮 {forecastDays}-Day Demand Forecasts</h2>
                            <span className="forecast-count">{forecasts.length} products</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="forecast-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        {forecasts[0]?.predictions?.map((p, i) => (
                                            <th key={i}>{p.day_name?.slice(0, 3)}</th>
                                        ))}
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecasts.map((forecast, i) => (
                                        <tr key={i}>
                                            <td>{forecast.product_name}</td>
                                            {forecast.predictions?.map((p, j) => (
                                                <td key={j}>
                                                    <div className="prediction-cell">
                                                        <span className="prediction-value">{p.predicted_quantity}</span>
                                                        <span className="prediction-range">
                                                            {p.confidence_lower} - {p.confidence_upper}
                                                        </span>
                                                    </div>
                                                </td>
                                            ))}
                                            <td>
                                                <strong>{forecast.total_predicted}</strong>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Weekly Order Suggestion */}
                    <div className="forecast-section">
                        <div className="section-header">
                            <h2>🛒 Weekly Order Suggestion</h2>
                        </div>
                        {weeklyOrder && weeklyOrder.suggestions?.length > 0 ? (
                            <>
                                <div className="order-summary-grid">
                                    <div className="order-card">
                                        <div className="value">{weeklyOrder.total_products}</div>
                                        <div className="label">Products to Order</div>
                                    </div>
                                    <div className="order-card">
                                        <div className="value critical">{weeklyOrder.critical_items || 0}</div>
                                        <div className="label">Critical Items</div>
                                    </div>
                                    <div className="order-card">
                                        <div className="value money">₹{weeklyOrder.total_order_value?.toFixed(2)}</div>
                                        <div className="label">Estimated Total</div>
                                    </div>
                                </div>
                                <div className="order-items">
                                    {weeklyOrder.suggestions.map((item, i) => (
                                        <div key={i} className={`order-item ${item.urgency}`}>
                                            <div className="order-item-info">
                                                <span className="order-item-name">{item.product_name}</span>
                                                <span className="order-item-details">
                                                    Stock: {item.current_stock} | Predicted: {item.predicted_demand}
                                                    {item.safety_buffer && ` | Buffer: ${item.safety_buffer}`}
                                                </span>
                                            </div>
                                            <div className="order-item-qty">
                                                <span className={`urgency-tag ${item.urgency}`}>{item.urgency}</span>
                                                <span className="order-qty-value">Order: {item.order_quantity}</span>
                                                <span className="order-cost">₹{item.cost_estimate?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="create-order-btn">
                                    📦 Create Purchase Order
                                </button>
                            </>
                        ) : (
                            <div className="success-state">
                                <p>✨ All stocked up! No items need ordering based on current forecasts and inventory levels.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Empty state when no forecasts yet */}
            {forecasts.length === 0 && !error && (
                <div className="forecast-section">
                    <div className="empty-forecast-state">
                        <div className="empty-icon">🔮</div>
                        <h3>Ready to Generate Forecasts</h3>
                        <p>
                            {models.length > 0
                                ? `Select a model above and click "Generate Forecasts" to see demand predictions.`
                                : datasets.length > 0
                                    ? `Select a dataset and click "Train New Model" to create your forecasting model.`
                                    : `Upload a sales dataset to get started with demand forecasting.`
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
