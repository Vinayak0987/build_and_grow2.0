import { useState } from 'react'
import {
    Wand2,
    Sparkles,
    Download,
    Settings,
    Loader2,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Sliders,
    Shield,
    Zap,
    Trash2,
    Plus,
    ArrowRight
} from 'lucide-react'
import { advancedApi } from '../services/api'
import './SyntheticData.css'

export default function SyntheticData() {
    const [numRows, setNumRows] = useState(1000)
    const [dataQuality, setDataQuality] = useState('high')

    // Custom schema states
    const [description, setDescription] = useState('')
    const [suggestedSchema, setSuggestedSchema] = useState(null)
    const [isSuggesting, setIsSuggesting] = useState(false)

    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedData, setGeneratedData] = useState(null)
    const [error, setError] = useState(null)

    // Handle AI schema suggestion
    const handleSuggestSchema = async () => {
        if (!description.trim()) return

        setIsSuggesting(true)
        setError(null)

        try {
            const response = await advancedApi.suggestSchema(description)
            if (response.data.success) {
                setSuggestedSchema(response.data.schema)
            } else {
                setError(response.data.error || 'Failed to suggest schema')
            }
        } catch (err) {
            console.error('Schema suggestion error:', err)
            setError('Failed to generate schema. Please try again.')
        } finally {
            setIsSuggesting(false)
        }
    }

    // Handle schema field update
    const handleUpdateField = (index, field, value) => {
        const updated = [...suggestedSchema]
        updated[index] = { ...updated[index], [field]: value }
        setSuggestedSchema(updated)
    }

    // Handle adding a new field
    const handleAddField = () => {
        setSuggestedSchema([
            ...suggestedSchema,
            { name: 'new_field', type: 'string' }
        ])
    }

    // Handle removing a field
    const handleRemoveField = (index) => {
        setSuggestedSchema(suggestedSchema.filter((_, i) => i !== index))
    }

    // Handle generation
    const handleGenerate = async () => {
        if (!suggestedSchema) return

        setIsGenerating(true)
        setError(null)
        setGeneratedData(null)

        try {
            const config = {
                mode: 'custom',
                num_rows: numRows,
                quality: dataQuality,
                parsed_schema: suggestedSchema
            }

            const response = await advancedApi.generateSynthetic(config)
            const data = response.data

            if (data.success) {
                setGeneratedData(data)
            } else {
                setError(data.error || 'Generation failed')
            }
        } catch (err) {
            console.error('Synthetic data generation error:', err)
            setError('Failed to generate synthetic data. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    // Handle download
    const handleDownload = () => {
        if (!generatedData?.preview) return

        // Create CSV from preview data
        const headers = generatedData.preview.columns.join(',')
        const rows = generatedData.preview.rows.map(row =>
            row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(',')
        ).join('\n')
        const csv = `${headers}\n${rows}`

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `synthetic_data_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Reset custom schema flow
    const handleResetSchema = () => {
        setSuggestedSchema(null)
        setDescription('')
    }

    const typeOptions = ['id', 'uuid', 'name', 'email', 'phone', 'integer', 'float', 'category', 'date', 'boolean', 'address', 'company']

    return (
        <div className="synthetic-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Wand2 size={28} />
                    </div>
                    <div>
                        <h1>Synthetic Data Generator</h1>
                        <p>Generate high-quality synthetic data using AI - describe what you need in natural language</p>
                    </div>
                </div>
            </div>

            <div className="synthetic-layout">
                {/* Configuration Panel */}
                <div className="config-panel card">
                    <div className="panel-header">
                        <Settings size={20} />
                        <h2>AI-Powered Data Generation</h2>
                    </div>

                    {/* AI Schema Section */}
                    <div className="ai-schema-section">
                        {!suggestedSchema ? (
                            <>
                                <div className="panel-intro">
                                    <Sparkles size={20} />
                                    <span>Describe your data in natural language</span>
                                </div>
                                <div className="form-group">
                                    <textarea
                                        className="input textarea"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g., I need sales data for a grocery store with product names like milk, bread, eggs. Include quantity sold, unit price, sale date, and store location."
                                        rows={5}
                                    />
                                    <p className="form-hint">
                                        AI will automatically create a data schema you can review and edit.
                                    </p>
                                </div>
                                <button
                                    className="btn btn-primary suggest-btn"
                                    onClick={handleSuggestSchema}
                                    disabled={isSuggesting || !description.trim()}
                                >
                                    {isSuggesting ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            AI is analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            Generate Schema with AI
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            /* Editable Schema */
                            <div className="schema-editor">
                                <div className="schema-header">
                                    <h4>
                                        <CheckCircle size={16} />
                                        AI-Generated Schema
                                    </h4>
                                    <button className="btn-text" onClick={handleResetSchema}>
                                        <RefreshCw size={14} />
                                        Start Over
                                    </button>
                                </div>
                                <p className="schema-hint">Review and edit the schema below. Add, remove, or modify fields as needed.</p>

                                <div className="schema-fields">
                                    {suggestedSchema.map((field, idx) => (
                                        <div key={idx} className="schema-field">
                                            <input
                                                type="text"
                                                className="field-name"
                                                value={field.name}
                                                onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                                                placeholder="Field name"
                                            />
                                            <select
                                                className="field-type"
                                                value={field.type}
                                                onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                                            >
                                                {typeOptions.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            {(field.type === 'integer' || field.type === 'float') && (
                                                <div className="field-range">
                                                    <input
                                                        type="number"
                                                        className="field-min"
                                                        value={field.min || 0}
                                                        onChange={(e) => handleUpdateField(idx, 'min', parseInt(e.target.value))}
                                                        placeholder="Min"
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="number"
                                                        className="field-max"
                                                        value={field.max || 100}
                                                        onChange={(e) => handleUpdateField(idx, 'max', parseInt(e.target.value))}
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            )}
                                            {field.type === 'category' && (
                                                <input
                                                    type="text"
                                                    className="field-values"
                                                    value={field.values?.join(', ') || ''}
                                                    onChange={(e) => handleUpdateField(idx, 'values', e.target.value.split(',').map(v => v.trim()))}
                                                    placeholder="Values (comma separated)"
                                                />
                                            )}
                                            <button className="btn-icon remove" onClick={() => handleRemoveField(idx)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-add-field" onClick={handleAddField}>
                                    <Plus size={14} />
                                    Add Field
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Generation Options - Only show when schema is ready */}
                    {suggestedSchema && (
                        <div className="generation-options">
                            <div className="form-group">
                                <label className="label">Number of Rows</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={numRows}
                                    onChange={(e) => setNumRows(parseInt(e.target.value) || 1000)}
                                    min={100}
                                    max={100000}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Data Quality</label>
                                <div className="quality-options">
                                    {['fast', 'balanced', 'high'].map((q) => (
                                        <button
                                            key={q}
                                            className={`quality-btn ${dataQuality === q ? 'active' : ''}`}
                                            onClick={() => setDataQuality(q)}
                                        >
                                            {q === 'fast' && <Zap size={14} />}
                                            {q === 'balanced' && <Sliders size={14} />}
                                            {q === 'high' && <Shield size={14} />}
                                            {q.charAt(0).toUpperCase() + q.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                className="btn btn-primary generate-btn"
                                onClick={handleGenerate}
                                disabled={isGenerating || !suggestedSchema}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        Generate Synthetic Data
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="results-panel">
                    {!generatedData && !isGenerating && (
                        <div className="results-empty card">
                            <div className="empty-illustration">
                                <Wand2 size={64} />
                            </div>
                            <h3>Ready to Generate</h3>
                            <p>Describe your data and let AI create it for you</p>
                            <div className="benefits-grid">
                                <div className="benefit">
                                    <Shield size={24} />
                                    <span>Privacy Safe</span>
                                    <small>No real user data exposed</small>
                                </div>
                                <div className="benefit">
                                    <Sparkles size={24} />
                                    <span>AI-Powered</span>
                                    <small>Smart schema generation</small>
                                </div>
                                <div className="benefit">
                                    <Zap size={24} />
                                    <span>Instant</span>
                                    <small>Generate in seconds</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="results-loading card">
                            <div className="loading-animation">
                                <div className="spinner-large"></div>
                            </div>
                            <h3>Generating Synthetic Data</h3>
                            <p>Our AI is creating realistic data based on your schema...</p>
                            <div className="progress-steps">
                                <div className="progress-step active">
                                    <CheckCircle size={16} />
                                    <span>Processing schema</span>
                                </div>
                                <div className="progress-step">
                                    <Loader2 size={16} className="spin" />
                                    <span>Generating rows</span>
                                </div>
                                <div className="progress-step">
                                    <div className="step-dot"></div>
                                    <span>Validating quality</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {generatedData && (
                        <div className="results-success card">
                            <div className="success-header">
                                <div className="success-icon">
                                    <CheckCircle size={48} />
                                </div>
                                <h3>Synthetic Data Generated!</h3>
                                <p>{generatedData.rows_generated?.toLocaleString()} rows created successfully</p>
                            </div>

                            <div className="results-stats">
                                <div className="stat-card">
                                    <span className="stat-value">{generatedData.rows_generated?.toLocaleString()}</span>
                                    <span className="stat-label">Rows Generated</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{generatedData.columns_count}</span>
                                    <span className="stat-label">Columns</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{generatedData.quality_score}%</span>
                                    <span className="stat-label">Quality Score</span>
                                </div>
                            </div>

                            {/* Data Preview */}
                            {generatedData.preview && (
                                <div className="data-preview">
                                    <h4>Data Preview</h4>
                                    <div className="preview-table-container">
                                        <table className="preview-table">
                                            <thead>
                                                <tr>
                                                    {generatedData.preview.columns?.map((col, i) => (
                                                        <th key={i}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generatedData.preview.rows?.slice(0, 5).map((row, i) => (
                                                    <tr key={i}>
                                                        {row.map((cell, j) => (
                                                            <td key={j}>{typeof cell === 'boolean' ? (cell ? 'true' : 'false') : cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="results-actions">
                                <button className="btn btn-primary" onClick={handleDownload}>
                                    <Download size={18} />
                                    Download CSV
                                </button>
                                <button className="btn btn-secondary" onClick={() => setGeneratedData(null)}>
                                    <RefreshCw size={18} />
                                    Generate Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
