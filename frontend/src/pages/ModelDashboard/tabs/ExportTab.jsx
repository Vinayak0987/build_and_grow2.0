/**
 * Export Tab - Model Dashboard
 * Download model package and view API integration code
 */
import { useState } from 'react'
import {
    Download,
    Code,
    Copy,
    Check,
    Package,
    FileCode,
    Terminal,
    ExternalLink
} from 'lucide-react'
import { modelDashboardApi } from '../../../services/modelDashboardApi'

export default function ExportTab({ model, modelId }) {
    const [downloading, setDownloading] = useState(false)
    const [copiedCode, setCopiedCode] = useState(null)
    const [selectedLanguage, setSelectedLanguage] = useState('python')

    // Handle model download
    const handleDownload = async () => {
        setDownloading(true)
        try {
            const response = await modelDashboardApi.downloadPackage(modelId)

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/zip' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${model?.name?.replace(/\s+/g, '_') || 'model'}_package.zip`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Download failed. The model package may not be available.')
        } finally {
            setDownloading(false)
        }
    }

    // Copy code to clipboard
    const copyToClipboard = (code, codeId) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(codeId)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    // API endpoint URL
    const apiUrl = window.location.origin
    const predictEndpoint = `${apiUrl}/api/predict/${modelId}`

    // Code examples
    const codeExamples = {
        python: `import requests

# Make a prediction
response = requests.post(
    "${predictEndpoint}",
    json={
        "input": {
            "feature_1": 25,
            "feature_2": "value",
            # Add all required features...
        }
    },
    headers={
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }
)

result = response.json()
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result.get('probability', 'N/A')}")`,

        javascript: `// Using fetch API
const response = await fetch("${predictEndpoint}", {
    method: "POST",
    headers: {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        input: {
            feature_1: 25,
            feature_2: "value",
            // Add all required features...
        }
    })
});

const result = await response.json();
console.log("Prediction:", result.prediction);
console.log("Confidence:", result.probability);`,

        curl: `curl -X POST "${predictEndpoint}" \\
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{
        "input": {
            "feature_1": 25,
            "feature_2": "value"
        }
    }'`
    }

    return (
        <div className="export-tab">
            <div className="export-section">
                {/* Download Package Card */}
                <div className="export-card">
                    <h3>
                        <Package size={18} />
                        Download Model Package
                    </h3>
                    <p>
                        Download the complete model package including trained model,
                        preprocessor, and configuration files.
                    </p>

                    <ul className="package-contents">
                        <li>
                            <Check size={16} />
                            model.pkl - Trained model
                        </li>
                        <li>
                            <Check size={16} />
                            preprocessor.pkl - Feature transformer
                        </li>
                        <li>
                            <Check size={16} />
                            ui_schema.json - Prediction form schema
                        </li>
                        <li>
                            <Check size={16} />
                            model_info.json - Model metadata
                        </li>
                    </ul>

                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={downloading || !model?.has_package}
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        {downloading ? (
                            <>
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Download ZIP
                            </>
                        )}
                    </button>

                    {!model?.has_package && (
                        <p style={{
                            color: '#fbbf24',
                            fontSize: '0.75rem',
                            marginTop: '0.5rem',
                            textAlign: 'center'
                        }}>
                            Package not available. Train a new model to generate.
                        </p>
                    )}
                </div>

                {/* API Endpoint Card */}
                <div className="export-card">
                    <h3>
                        <Terminal size={18} />
                        API Endpoint
                    </h3>
                    <p>
                        Make predictions programmatically using the REST API.
                    </p>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '0.5rem'
                        }}>
                            Endpoint URL
                        </div>
                        <div className="code-block">
                            <pre><code>POST {predictEndpoint}</code></pre>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(predictEndpoint, 'endpoint')}
                            >
                                {copiedCode === 'endpoint' ? <Check size={12} /> : <Copy size={12} />}
                                {copiedCode === 'endpoint' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '0.5rem'
                        }}>
                            Request Body
                        </div>
                        <div className="code-block">
                            <pre>{`{
  "input": {
    "feature_1": "value",
    "feature_2": 123,
    ...
  }
}`}</pre>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '0.5rem'
                        }}>
                            Response
                        </div>
                        <div className="code-block">
                            <pre>{`{
  "prediction": "Class A",
  "probability": 0.873,
  "class_probabilities": {
    "Class A": 0.873,
    "Class B": 0.127
  }
}`}</pre>
                        </div>
                    </div>
                </div>

                {/* Integration Code Card */}
                <div className="export-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>
                        <Code size={18} />
                        Integration Code
                    </h3>
                    <p>
                        Copy and paste this code to integrate predictions into your application.
                    </p>

                    <div className="language-tabs">
                        <button
                            className={`language-tab ${selectedLanguage === 'python' ? 'active' : ''}`}
                            onClick={() => setSelectedLanguage('python')}
                        >
                            🐍 Python
                        </button>
                        <button
                            className={`language-tab ${selectedLanguage === 'javascript' ? 'active' : ''}`}
                            onClick={() => setSelectedLanguage('javascript')}
                        >
                            📜 JavaScript
                        </button>
                        <button
                            className={`language-tab ${selectedLanguage === 'curl' ? 'active' : ''}`}
                            onClick={() => setSelectedLanguage('curl')}
                        >
                            💻 cURL
                        </button>
                    </div>

                    <div className="code-block">
                        <pre><code>{codeExamples[selectedLanguage]}</code></pre>
                        <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(codeExamples[selectedLanguage], selectedLanguage)}
                        >
                            {copiedCode === selectedLanguage ? <Check size={12} /> : <Copy size={12} />}
                            {copiedCode === selectedLanguage ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Model Info Card */}
                <div className="export-card">
                    <h3>
                        <FileCode size={18} />
                        Model Details
                    </h3>

                    <div className="info-item">
                        <span className="info-label">Model ID</span>
                        <span className="info-value">{modelId}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Model Name</span>
                        <span className="info-value">{model?.name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Problem Type</span>
                        <span className="info-value">{model?.problem_type}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Algorithm</span>
                        <span className="info-value">{model?.best_model_name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Target Column</span>
                        <span className="info-value">{model?.target_column}</span>
                    </div>
                </div>

                {/* Documentation Link */}
                <div className="export-card">
                    <h3>
                        <ExternalLink size={18} />
                        Documentation
                    </h3>
                    <p>
                        Learn more about the InferX API, authentication, and best practices.
                    </p>

                    <div style={{ marginTop: '1rem' }}>
                        <a
                            href="#"
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={(e) => {
                                e.preventDefault()
                                alert('Documentation coming soon!')
                            }}
                        >
                            <ExternalLink size={16} />
                            View API Documentation
                        </a>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.875rem'
                    }}>
                        <strong style={{ color: '#60a5fa' }}>💡 Tip:</strong>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                            {' '}Use the prediction schema from the Export tab to ensure
                            you're sending the correct feature names and types.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
