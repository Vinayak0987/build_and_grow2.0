import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    MessageSquare,
    Send,
    Database,
    Sparkles,
    BarChart3,
    TrendingUp,
    AlertCircle,
    Loader2,
    FileSpreadsheet,
    Lightbulb,
    RefreshCw
} from 'lucide-react'
import { datasetsApi, advancedApi } from '../services/api'
import './DataChat.css'

// Sample suggested questions
const suggestedQuestions = [
    "What are the main trends in this dataset?",
    "Show me the correlation between variables",
    "Which columns have missing values?",
    "What's the distribution of the target variable?",
    "Find any anomalies or outliers",
    "Summarize the key statistics"
]

export default function DataChat() {
    const [selectedDataset, setSelectedDataset] = useState('')
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Fetch datasets
    const { data: datasetsData } = useQuery({
        queryKey: ['datasets'],
        queryFn: () => datasetsApi.list()
    })
    const datasets = datasetsData?.data?.datasets || []

    // Fetch profile when dataset selected
    const { data: profileData } = useQuery({
        queryKey: ['dataset-profile', selectedDataset],
        queryFn: () => datasetsApi.getProfile(selectedDataset),
        enabled: !!selectedDataset
    })

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle dataset selection
    const handleDatasetSelect = (id) => {
        setSelectedDataset(id)
        setMessages([])
        // Add welcome message
        const dataset = datasets.find(d => d.id.toString() === id)
        if (dataset) {
            setMessages([{
                type: 'assistant',
                content: `I've loaded **${dataset.name}** with ${dataset.num_rows?.toLocaleString()} rows and ${dataset.num_columns} columns. Ask me anything about your data!`,
                timestamp: new Date()
            }])
        }
    }

    // Handle send message
    const handleSend = async () => {
        if (!inputValue.trim() || !selectedDataset || isLoading) return

        const userMessage = {
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])
        const questionToSend = inputValue
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await advancedApi.chatWithDataset(selectedDataset, questionToSend)
            const data = response.data

            const assistantMessage = {
                type: 'assistant',
                content: data.answer || data.response || "I couldn't process that question. Please try rephrasing.",
                visualization: data.visualization,
                insights: data.insights,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                type: 'assistant',
                content: "Sorry, I encountered an error processing your question. Please try again.",
                error: true,
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    // Handle suggested question click
    const handleSuggestedClick = (question) => {
        setInputValue(question)
        inputRef.current?.focus()
    }

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="datachat-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <MessageSquare size={28} />
                    </div>
                    <div>
                        <h1>Chat with Your Data</h1>
                        <p>Ask questions in natural language and get instant insights</p>
                    </div>
                </div>
            </div>

            <div className="chat-container">
                {/* Sidebar - Dataset Selection */}
                <div className="chat-sidebar card">
                    <h3>
                        <Database size={18} />
                        Select Dataset
                    </h3>
                    <div className="dataset-list">
                        {datasets.map((dataset) => (
                            <div
                                key={dataset.id}
                                className={`dataset-option ${selectedDataset === dataset.id.toString() ? 'selected' : ''}`}
                                onClick={() => handleDatasetSelect(dataset.id.toString())}
                            >
                                <FileSpreadsheet size={18} />
                                <div className="dataset-details">
                                    <span className="dataset-name">{dataset.name}</span>
                                    <span className="dataset-meta">
                                        {dataset.num_rows?.toLocaleString()} rows
                                    </span>
                                </div>
                            </div>
                        ))}
                        {datasets.length === 0 && (
                            <div className="empty-datasets">
                                <FileSpreadsheet size={32} />
                                <p>No datasets available</p>
                                <a href="/ml-pipeline" className="btn btn-sm btn-primary">
                                    Upload Dataset
                                </a>
                            </div>
                        )}
                    </div>

                    {selectedDataset && profileData?.data && (
                        <div className="dataset-summary">
                            <h4>Dataset Info</h4>
                            <div className="summary-stats">
                                <div className="stat">
                                    <span className="stat-value">{profileData.data.num_rows?.toLocaleString()}</span>
                                    <span className="stat-label">Rows</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{profileData.data.num_columns}</span>
                                    <span className="stat-label">Columns</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {!selectedDataset ? (
                        <div className="chat-empty-state">
                            <div className="empty-icon">
                                <MessageSquare size={64} />
                            </div>
                            <h2>Start a Conversation</h2>
                            <p>Select a dataset from the sidebar to begin chatting with your data</p>
                            <div className="feature-highlights">
                                <div className="feature">
                                    <BarChart3 size={24} />
                                    <span>Get instant visualizations</span>
                                </div>
                                <div className="feature">
                                    <TrendingUp size={24} />
                                    <span>Discover trends & patterns</span>
                                </div>
                                <div className="feature">
                                    <Lightbulb size={24} />
                                    <span>AI-powered insights</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="messages-container">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.type}`}>
                                        {msg.type === 'assistant' && (
                                            <div className="message-avatar">
                                                <Sparkles size={18} />
                                            </div>
                                        )}
                                        <div className="message-content">
                                            <div className="message-text" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                                            {msg.visualization && (
                                                <div className="message-visualization">
                                                    <img src={`data:image/png;base64,${msg.visualization}`} alt="Chart" />
                                                </div>
                                            )}
                                            {msg.insights && msg.insights.length > 0 && (
                                                <div className="message-insights">
                                                    <h5><Lightbulb size={14} /> Key Insights</h5>
                                                    <ul>
                                                        {msg.insights.map((insight, i) => (
                                                            <li key={i}>{insight}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {msg.error && (
                                                <div className="message-error">
                                                    <AlertCircle size={14} />
                                                    <span>Try a different question</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="message assistant">
                                        <div className="message-avatar">
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested Questions */}
                            {messages.length <= 1 && (
                                <div className="suggested-questions">
                                    <h4>Try asking:</h4>
                                    <div className="suggestions-grid">
                                        {suggestedQuestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                className="suggestion-chip"
                                                onClick={() => handleSuggestedClick(q)}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="chat-input-area">
                                <div className="input-wrapper">
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask anything about your data..."
                                        rows={1}
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="send-btn"
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={20} className="spin" />
                                        ) : (
                                            <Send size={20} />
                                        )}
                                    </button>
                                </div>
                                <p className="input-hint">
                                    Press Enter to send • Shift+Enter for new line
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Helper for markdown rendering
function renderMarkdown(content) {
    if (!content) return { __html: '' };

    // Protect HTML special chars
    let html = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');

    // Split by lines to process blocks
    const lines = html.split('\n');
    let output = [];
    let inTable = false;
    let tableHtml = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Table handling
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                if (inList) { output.push('</ul>'); inList = false; }
                tableHtml.push('<div class="table-scroll"><table>');
            }

            if (line.includes('---')) continue;

            const cells = line.split('|').filter(c => c && c.trim() !== '');
            const isHeader = tableHtml.length === 1;

            tableHtml.push('<tr>');
            cells.forEach(c => {
                tableHtml.push(`<${isHeader ? 'th' : 'td'}>${c.trim()}</${isHeader ? 'th' : 'td'}>`);
            });
            tableHtml.push('</tr>');
            continue;
        } else if (inTable) {
            tableHtml.push('</table></div>');
            output.push(tableHtml.join(''));
            tableHtml = [];
            inTable = false;
        }

        // List handling
        if (line.startsWith('- ')) {
            if (!inList) {
                inList = true;
                output.push('<ul>');
            }
            output.push(`<li>${line.substring(2)}</li>`);
        } else {
            if (inList) {
                output.push('</ul>');
                inList = false;
            }

            if (line.length > 0) {
                output.push(`<p>${line}</p>`);
            }
        }
    }

    if (inTable) {
        tableHtml.push('</table></div>');
        output.push(tableHtml.join(''));
    }
    if (inList) {
        output.push('</ul>');
    }

    return { __html: output.join('') };
}
