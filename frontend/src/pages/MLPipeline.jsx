import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    Upload,
    FileSpreadsheet,
    Database,
    Cpu,
    Play,
    Target,
    CheckCircle,
    Clock,
    AlertCircle,
    Sparkles,
    Wand2,
    ArrowRight,
    ArrowLeft,
    Box,
    TrendingUp,
    Settings,
    Zap,
    BarChart3
} from 'lucide-react'
import { datasetsApi, trainingApi, modelsApi } from '../services/api'
import './MLPipeline.css'

// Step Component
function StepIndicator({ steps, currentStep }) {
    return (
        <div className="pipeline-steps">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={`pipeline-step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                >
                    <div className="step-circle">
                        {index < currentStep ? <CheckCircle size={20} /> : <span>{index + 1}</span>}
                    </div>
                    <span className="step-label">{step.label}</span>
                    {index < steps.length - 1 && <div className="step-line" />}
                </div>
            ))}
        </div>
    )
}

export default function MLPipeline() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const fileInputRef = useRef()
    const logsEndRef = useRef()

    // Step state
    const [currentStep, setCurrentStep] = useState(0)
    const steps = [
        { label: 'Upload Data', icon: Upload },
        { label: 'Preprocessing', icon: Settings },
        { label: 'Training', icon: Cpu },
        { label: 'Model Ready', icon: Box }
    ]

    // Upload state
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedDataset, setSelectedDataset] = useState(null)

    // Preprocessing/Training state
    const [targetColumn, setTargetColumn] = useState('')
    const [experimentName, setExperimentName] = useState('')
    const [goalDescription, setGoalDescription] = useState('')
    const [isTraining, setIsTraining] = useState(false)
    const [currentJob, setCurrentJob] = useState(null)

    // AI Analysis state
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiAnalysis, setAiAnalysis] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisError, setAnalysisError] = useState(null)

    // Trained model state
    const [trainedModel, setTrainedModel] = useState(null)

    // Fetch existing datasets for reuse
    const { data: datasetsData } = useQuery({
        queryKey: ['datasets'],
        queryFn: () => datasetsApi.list()
    })
    const datasets = datasetsData?.data?.datasets || []

    // Fetch profile data when dataset is selected
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['dataset-profile', selectedDataset?.id],
        queryFn: () => datasetsApi.getProfile(selectedDataset.id),
        enabled: !!selectedDataset?.id
    })

    const columns = profileData?.data?.column_info
        ? Object.keys(profileData.data.column_info)
        : []

    // Training status polling
    const { data: statusData } = useQuery({
        queryKey: ['training-status', currentJob?.id],
        queryFn: () => trainingApi.getStatus(currentJob.id),
        enabled: !!currentJob,
        refetchInterval: isTraining ? 2000 : false
    })

    // Training logs polling
    const { data: logsData } = useQuery({
        queryKey: ['training-logs', currentJob?.id],
        queryFn: () => trainingApi.getLogs(currentJob.id),
        enabled: !!currentJob,
        refetchInterval: isTraining ? 2000 : false
    })

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: (formData) => datasetsApi.upload(formData, setUploadProgress),
        onSuccess: (response) => {
            queryClient.invalidateQueries(['datasets'])
            setUploading(false)
            setUploadProgress(0)
            // Set the uploaded dataset and move to next step
            setSelectedDataset(response.data.dataset)
            setCurrentStep(1) // Move to preprocessing
        },
        onError: () => {
            setUploading(false)
            setUploadProgress(0)
        }
    })

    // Training mutation
    const startTrainingMutation = useMutation({
        mutationFn: (data) => trainingApi.start(data),
        onSuccess: (response) => {
            setCurrentJob(response.data.experiment)
            setIsTraining(true)
        }
    })

    // Check for training completion
    useEffect(() => {
        if (isTraining && statusData?.data?.experiment?.status === 'completed') {
            setIsTraining(false)
            // Move to final step
            setTrainedModel(statusData.data.experiment)
            setCurrentStep(3)
        }
    }, [isTraining, statusData])

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logsData])

    // Handle file upload
    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name)

        setUploading(true)
        uploadMutation.mutate(formData)
    }

    // Handle selecting existing dataset
    const handleSelectExistingDataset = (dataset) => {
        setSelectedDataset(dataset)
        setCurrentStep(1)
    }

    // Handle AI analysis
    const handleAnalyzeWithAI = async () => {
        if (!selectedDataset?.id || !aiPrompt.trim()) return

        setIsAnalyzing(true)
        setAnalysisError(null)
        setAiAnalysis(null)

        try {
            const response = await trainingApi.analyzePrompt(selectedDataset.id, aiPrompt)
            if (response.data.success) {
                setAiAnalysis(response.data.analysis)
                if (response.data.analysis.suggested_target) {
                    setTargetColumn(response.data.analysis.suggested_target)
                }
                setGoalDescription(aiPrompt)
            } else {
                setAnalysisError(response.data.error || 'Analysis failed')
            }
        } catch (error) {
            setAnalysisError(error.response?.data?.error || 'Failed to analyze with AI')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // Handle start training
    const handleStartTraining = () => {
        if (!selectedDataset?.id || !targetColumn) return

        setCurrentStep(2) // Move to training step
        startTrainingMutation.mutate({
            dataset_id: selectedDataset.id,
            name: experimentName || `Experiment ${new Date().toLocaleDateString()}`,
            target_column: targetColumn,
            goal_description: goalDescription
        })
    }

    // Combined logs
    const allLogs = logsData?.data?.logs || []
    const combinedLogs = allLogs.map(job =>
        `--- ${job.model_name} ---\n${job.logs || ''}`
    ).join('\n')

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '—'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // Reset pipeline
    const resetPipeline = () => {
        setCurrentStep(0)
        setSelectedDataset(null)
        setTargetColumn('')
        setExperimentName('')
        setGoalDescription('')
        setIsTraining(false)
        setCurrentJob(null)
        setAiPrompt('')
        setAiAnalysis(null)
        setAnalysisError(null)
        setTrainedModel(null)
    }

    return (
        <div className="ml-pipeline-page">
            <div className="page-header">
                <div>
                    <h1>
                        <Zap size={28} />
                        ML Pipeline
                    </h1>
                    <p>Upload data, train models, and make predictions - all in one flow</p>
                </div>
            </div>

            {/* Step Indicator */}
            <StepIndicator steps={steps} currentStep={currentStep} />

            {/* Step Content */}
            <div className="pipeline-content">
                {/* Step 0: Upload Data */}
                {currentStep === 0 && (
                    <div className="step-content step-upload">
                        <div className="upload-section card">
                            <div className="section-header">
                                <Upload size={24} />
                                <h2>Upload New Dataset</h2>
                            </div>
                            <div
                                className={`upload-zone ${uploading ? 'uploading' : ''}`}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <div className="upload-progress">
                                        <div className="progress-ring">
                                            <svg viewBox="0 0 100 100">
                                                <circle
                                                    className="progress-ring-bg"
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                />
                                                <circle
                                                    className="progress-ring-fill"
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    strokeDasharray={`${uploadProgress * 2.83} 283`}
                                                />
                                            </svg>
                                            <span className="progress-text">{uploadProgress}%</span>
                                        </div>
                                        <p>Uploading & Processing...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="upload-icon">
                                            <Upload size={48} />
                                        </div>
                                        <h3>Drop files here or click to upload</h3>
                                        <p>Supports: CSV, Excel (.xlsx, .xls)</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {datasets.length > 0 && (
                            <div className="existing-datasets card">
                                <div className="section-header">
                                    <Database size={24} />
                                    <h2>Or Select Existing Dataset</h2>
                                </div>
                                <div className="datasets-list">
                                    {datasets.map((dataset) => (
                                        <div
                                            key={dataset.id}
                                            className="dataset-item"
                                            onClick={() => handleSelectExistingDataset(dataset)}
                                        >
                                            <FileSpreadsheet size={20} />
                                            <div className="dataset-info">
                                                <span className="dataset-name">{dataset.name}</span>
                                                <span className="dataset-meta">
                                                    {dataset.num_rows?.toLocaleString()} rows • {formatFileSize(dataset.file_size)}
                                                </span>
                                            </div>
                                            <ArrowRight size={18} className="arrow-icon" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: Preprocessing & Configuration */}
                {currentStep === 1 && (
                    <div className="step-content step-preprocessing">
                        <div className="config-section card">
                            <div className="section-header">
                                <Settings size={24} />
                                <h2>Data Preprocessing & Configuration</h2>
                            </div>

                            {/* Dataset Summary */}
                            <div className="dataset-summary">
                                <div className="summary-icon">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <div className="summary-info">
                                    <h3>{selectedDataset?.name}</h3>
                                    <p>
                                        {selectedDataset?.num_rows?.toLocaleString()} rows × {selectedDataset?.num_columns || columns.length} columns
                                        • {formatFileSize(selectedDataset?.file_size)}
                                    </p>
                                </div>
                                <span className={`status-badge ${selectedDataset?.profile_status}`}>
                                    {selectedDataset?.profile_status === 'completed' ? (
                                        <><CheckCircle size={14} /> Profiled</>
                                    ) : (
                                        <><Clock size={14} /> Processing</>
                                    )}
                                </span>
                            </div>

                            {profileLoading ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Analyzing dataset...</p>
                                </div>
                            ) : (
                                <>
                                    {/* AI Analysis Section */}
                                    <div className="ai-section">
                                        <div className="form-group">
                                            <label className="label">
                                                <Sparkles size={16} />
                                                Describe Your Goal (AI-Powered)
                                            </label>
                                            <div className="ai-input-row">
                                                <textarea
                                                    className="input textarea"
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    placeholder="e.g., I want to predict which products need restocking based on sales patterns..."
                                                    rows={2}
                                                    disabled={isAnalyzing}
                                                />
                                                <button
                                                    className="btn btn-secondary ai-analyze-btn"
                                                    onClick={handleAnalyzeWithAI}
                                                    disabled={!aiPrompt.trim() || isAnalyzing}
                                                >
                                                    {isAnalyzing ? (
                                                        <div className="spinner" style={{ width: 16, height: 16 }}></div>
                                                    ) : (
                                                        <Wand2 size={16} />
                                                    )}
                                                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Analysis Results */}
                                        {aiAnalysis && (
                                            <div className="ai-analysis-result">
                                                <div className="ai-result-header">
                                                    <Sparkles size={18} />
                                                    <span>AI Recommendation</span>
                                                </div>
                                                <div className="ai-result-content">
                                                    <div className="ai-result-item">
                                                        <strong>Suggested Target:</strong>
                                                        <span className="ai-target-badge">{aiAnalysis.suggested_target}</span>
                                                    </div>
                                                    <div className="ai-result-item">
                                                        <strong>Problem Type:</strong>
                                                        <span className="ai-problem-badge">{aiAnalysis.problem_type}</span>
                                                    </div>
                                                    {aiAnalysis.confidence && (
                                                        <div className="ai-result-item">
                                                            <strong>Confidence:</strong>
                                                            <span>{(aiAnalysis.confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                    )}
                                                    <div className="ai-reasoning">
                                                        <strong>Reasoning:</strong>
                                                        <p>{aiAnalysis.reasoning}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {analysisError && (
                                            <div className="ai-error">
                                                <AlertCircle size={16} />
                                                <span>{analysisError}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Configuration */}
                                    <div className="manual-config">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="label">
                                                    <Target size={16} />
                                                    Target Column
                                                </label>
                                                <select
                                                    className="input"
                                                    value={targetColumn}
                                                    onChange={(e) => setTargetColumn(e.target.value)}
                                                >
                                                    <option value="">Select target column...</option>
                                                    {columns.map((col) => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="label">Experiment Name</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={experimentName}
                                                    onChange={(e) => setExperimentName(e.target.value)}
                                                    placeholder="My Experiment"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columns Preview */}
                                    {columns.length > 0 && (
                                        <div className="columns-preview">
                                            <h4>Available Columns ({columns.length})</h4>
                                            <div className="columns-grid">
                                                {columns.map((col) => (
                                                    <div
                                                        key={col}
                                                        className={`column-chip ${col === targetColumn ? 'selected' : ''}`}
                                                        onClick={() => setTargetColumn(col)}
                                                    >
                                                        {col}
                                                        {profileData?.data?.column_info?.[col]?.dtype && (
                                                            <span className="col-type">
                                                                {profileData.data.column_info[col].dtype}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="step-navigation">
                            <button className="btn btn-secondary" onClick={() => setCurrentStep(0)}>
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleStartTraining}
                                disabled={!targetColumn || profileLoading}
                            >
                                <Play size={18} />
                                Start Training
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Training */}
                {currentStep === 2 && (
                    <div className="step-content step-training">
                        <div className="training-section card">
                            <div className="section-header">
                                <Cpu size={24} className={isTraining ? 'animate-pulse' : ''} />
                                <h2>Training in Progress</h2>
                            </div>

                            {/* Progress Steps */}
                            <div className="training-progress">
                                <div className={`progress-step ${['training', 'completed'].includes(statusData?.data?.experiment?.status) ? 'completed' : 'active'}`}>
                                    <div className="progress-icon">
                                        <Settings size={20} />
                                    </div>
                                    <div className="progress-info">
                                        <h4>Preprocessing</h4>
                                        <p>Cleaning and preparing data</p>
                                    </div>
                                    {['training', 'completed'].includes(statusData?.data?.experiment?.status) && (
                                        <CheckCircle size={20} className="check-icon" />
                                    )}
                                </div>

                                <div className={`progress-step ${statusData?.data?.experiment?.status === 'training' ? 'active' : statusData?.data?.experiment?.status === 'completed' ? 'completed' : ''}`}>
                                    <div className="progress-icon">
                                        <Cpu size={20} />
                                    </div>
                                    <div className="progress-info">
                                        <h4>Model Training</h4>
                                        <p>Training multiple algorithms</p>
                                    </div>
                                    {statusData?.data?.experiment?.status === 'training' && (
                                        <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                    )}
                                    {statusData?.data?.experiment?.status === 'completed' && (
                                        <CheckCircle size={20} className="check-icon" />
                                    )}
                                </div>

                                <div className={`progress-step ${statusData?.data?.experiment?.status === 'completed' ? 'completed' : ''}`}>
                                    <div className="progress-icon">
                                        <BarChart3 size={20} />
                                    </div>
                                    <div className="progress-info">
                                        <h4>Evaluation</h4>
                                        <p>Selecting best model</p>
                                    </div>
                                    {statusData?.data?.experiment?.status === 'completed' && (
                                        <CheckCircle size={20} className="check-icon" />
                                    )}
                                </div>
                            </div>

                            {/* Live Logs */}
                            <div className="logs-terminal">
                                <div className="terminal-header">
                                    <span className="terminal-dot red"></span>
                                    <span className="terminal-dot yellow"></span>
                                    <span className="terminal-dot green"></span>
                                    <span className="terminal-title">Training Logs</span>
                                </div>
                                <pre className="terminal-content">
                                    {combinedLogs || 'Initializing training pipeline...'}
                                    <div ref={logsEndRef} />
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Model Ready */}
                {currentStep === 3 && (
                    <div className="step-content step-complete">
                        <div className="success-section card">
                            <div className="success-animation">
                                <div className="success-circle">
                                    <CheckCircle size={64} />
                                </div>
                            </div>

                            <h2>🎉 Model Successfully Trained!</h2>
                            <p>Your model is ready to make predictions</p>

                            {trainedModel && (
                                <div className="model-summary">
                                    <div className="summary-stat">
                                        <span className="stat-label">Best Model</span>
                                        <span className="stat-value">{trainedModel.best_model_name}</span>
                                    </div>
                                    <div className="summary-stat highlight">
                                        <span className="stat-label">Accuracy Score</span>
                                        <span className="stat-value">
                                            {trainedModel.best_score ? `${(trainedModel.best_score * 100).toFixed(2)}%` : '—'}
                                        </span>
                                    </div>
                                    <div className="summary-stat">
                                        <span className="stat-label">Target Column</span>
                                        <span className="stat-value">{trainedModel.target_column}</span>
                                    </div>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={() => navigate(`/predictions/${trainedModel?.model_id || trainedModel?.id}`)}
                                >
                                    <TrendingUp size={20} />
                                    Make Predictions
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/models')}
                                >
                                    <Box size={18} />
                                    View All Models
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={resetPipeline}
                                >
                                    <Zap size={18} />
                                    Train Another Model
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
