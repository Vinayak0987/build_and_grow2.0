import { useState, useEffect, useRef, useCallback } from 'react'
import { salesApi, datasetsApi } from '../services/api'
import './SalesInput.css'

// Category icon mapping
const getCategoryIcon = (category) => {
    const icons = {
        'Dairy': '🥛',
        'Groceries': '🛒',
        'Beverages': '🥤',
        'Snacks': '🍿',
        'Personal Care': '🧴',
        'Household': '🏠',
        'Bakery': '🍞',
        'Frozen': '❄️',
        'Fruits': '🍎',
        'Vegetables': '🥬'
    }
    return icons[category] || '📦'
}

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount)
}

export default function SalesInput() {
    const [dailySales, setDailySales] = useState(null)
    const [salesHistory, setSalesHistory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('today')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [toast, setToast] = useState(null)

    // Dataset selection states
    const [datasets, setDatasets] = useState([])
    const [selectedDataset, setSelectedDataset] = useState('')
    const [importingDataset, setImportingDataset] = useState(false)
    const [showDatasetSelector, setShowDatasetSelector] = useState(false)

    const [formData, setFormData] = useState({
        product_name: '',
        category: '',
        quantity_sold: 1,
        unit_price: 0
    })

    const fileInputRef = useRef(null)

    // Show toast notification
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    // Load datasets
    const loadDatasets = useCallback(async () => {
        try {
            const response = await datasetsApi.list()
            // Filter to only show CSV/Excel datasets
            const csvDatasets = (response.data?.datasets || []).filter(
                d => ['csv', 'xlsx', 'xls'].includes(d.file_type)
            )
            setDatasets(csvDatasets)
        } catch (err) {
            console.error('Failed to load datasets:', err)
        }
    }, [])

    // Load daily sales from API
    const loadDailySales = useCallback(async (date = null) => {
        try {
            setError(null)
            const response = await salesApi.getDaily(date || selectedDate)
            setDailySales(response.data)
        } catch (err) {
            console.error('Failed to load sales:', err)
            setError('Failed to load sales data. Please try again.')
            setDailySales({ sales: [], total_sales: 0, total_items: 0, transaction_count: 0, by_product: [] })
        }
    }, [selectedDate])

    // Load sales history
    const loadHistory = useCallback(async () => {
        try {
            const response = await salesApi.getHistory({ days: 30 })
            setSalesHistory(response.data)
        } catch (err) {
            console.error('Failed to load history:', err)
        }
    }, [])

    // Initial load
    useEffect(() => {
        const initLoad = async () => {
            setLoading(true)
            await Promise.all([loadDailySales(), loadHistory(), loadDatasets()])
            setLoading(false)
        }
        initLoad()
    }, [loadDailySales, loadHistory, loadDatasets])

    // Handle date change
    const handleDateChange = async (e) => {
        const newDate = e.target.value
        setSelectedDate(newDate)
        setRefreshing(true)
        await loadDailySales(newDate)
        setRefreshing(false)
    }

    // Refresh data
    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([loadDailySales(), loadHistory(), loadDatasets()])
        setRefreshing(false)
        showToast('Data refreshed successfully')
    }

    // Submit sale
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.product_name || formData.quantity_sold <= 0) {
            showToast('Please fill in product name and quantity', 'error')
            return
        }

        setSubmitting(true)
        try {
            await salesApi.logSale({
                ...formData,
                sale_date: selectedDate
            })
            setFormData({
                product_name: '',
                category: '',
                quantity_sold: 1,
                unit_price: 0
            })
            await loadDailySales()
            showToast('Sale logged successfully!')
        } catch (err) {
            console.error('Failed to log sale:', err)
            showToast('Failed to log sale. Please try again.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    // Import from existing dataset
    const handleImportFromDataset = async () => {
        if (!selectedDataset) {
            showToast('Please select a dataset', 'error')
            return
        }

        setImportingDataset(true)
        try {
            const result = await salesApi.importFromDataset(selectedDataset)
            const data = result.data
            showToast(`Imported ${data.imported} records from dataset!`)
            setSelectedDataset('')
            setShowDatasetSelector(false)
            await loadDailySales()
            await loadHistory()
        } catch (err) {
            console.error('Import failed:', err)
            const errorMsg = err.response?.data?.error || 'Failed to import dataset'
            const columns = err.response?.data?.available_columns
            if (columns) {
                showToast(`${errorMsg}. Available columns: ${columns.slice(0, 5).join(', ')}...`, 'error')
            } else {
                showToast(errorMsg, 'error')
            }
        } finally {
            setImportingDataset(false)
        }
    }

    // Upload CSV (keep as fallback)
    const handleUploadCSV = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const uploadData = new FormData()
        uploadData.append('file', file)

        try {
            const result = await salesApi.uploadCsv(uploadData)
            showToast(`Successfully imported ${result.data.imported} sales records!`)
            await loadDailySales()
            await loadHistory()
        } catch (err) {
            console.error('Upload failed:', err)
            showToast('Upload failed: ' + (err.response?.data?.error || err.message), 'error')
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Get filtered sales
    const getFilteredSales = () => {
        if (!dailySales?.sales) return []
        if (!categoryFilter) return dailySales.sales
        return dailySales.sales.filter(s => s.category === categoryFilter)
    }

    // Get unique categories
    const getCategories = () => {
        if (!dailySales?.sales) return []
        const cats = new Set(dailySales.sales.map(s => s.category).filter(Boolean))
        return Array.from(cats)
    }

    // Calculate max for progress bars
    const maxProductSale = dailySales?.by_product?.length > 0
        ? Math.max(...dailySales.by_product.map(p => p.total))
        : 0

    // Loading state
    if (loading) {
        return (
            <div className="sales-page">
                <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p className="loading-text">Loading sales data...</p>
                </div>
            </div>
        )
    }

    const filteredSales = getFilteredSales()
    const categories = getCategories()

    return (
        <div className="sales-page">
            {/* Header */}
            <div className="sales-header">
                <div className="sales-header-left">
                    <h1>💰 Sales Dashboard</h1>
                    <p>Track and log sales to improve demand forecasting accuracy</p>
                </div>
                <div className="header-actions">
                    <div className="date-picker-wrapper">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <button
                        className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh data"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span className="icon">⚠️</span>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={handleRefresh}>Retry</button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card revenue">
                    <div className="stat-icon">💵</div>
                    <div className="stat-value revenue-value">
                        {formatCurrency(dailySales?.total_sales || 0)}
                    </div>
                    <div className="stat-label">Today's Revenue</div>
                    {salesHistory?.total_revenue > 0 && (
                        <div className="stat-trend positive">
                            <span>📈</span>
                            <span>{formatCurrency(salesHistory.total_revenue)} (30 days)</span>
                        </div>
                    )}
                </div>
                <div className="stat-card items">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{dailySales?.total_items || 0}</div>
                    <div className="stat-label">Items Sold</div>
                </div>
                <div className="stat-card transactions">
                    <div className="stat-icon">🧾</div>
                    <div className="stat-value">{dailySales?.transaction_count || 0}</div>
                    <div className="stat-label">Transactions</div>
                </div>
                <div className="stat-card products">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-value">{dailySales?.by_product?.length || 0}</div>
                    <div className="stat-label">Unique Products</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="sales-main-content">
                {/* Left Panel - Form */}
                <div className="form-section">
                    <div className="section-title">
                        <span className="icon">➕</span>
                        Quick Sale Entry
                    </div>

                    <form className="sale-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                value={formData.product_name}
                                onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                                placeholder="e.g., Amul Milk 1L"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select category</option>
                                <option value="Dairy">🥛 Dairy</option>
                                <option value="Groceries">🛒 Groceries</option>
                                <option value="Beverages">🥤 Beverages</option>
                                <option value="Snacks">🍿 Snacks</option>
                                <option value="Personal Care">🧴 Personal Care</option>
                                <option value="Household">🏠 Household</option>
                                <option value="Bakery">🍞 Bakery</option>
                                <option value="Frozen">❄️ Frozen</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.quantity_sold}
                                    onChange={e => setFormData({ ...formData, quantity_sold: parseFloat(e.target.value) || 0 })}
                                    min="0.1"
                                    step="0.1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit Price (₹)</label>
                                <input
                                    type="number"
                                    value={formData.unit_price}
                                    onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading-spinner-small"></span>
                                    Logging...
                                </>
                            ) : (
                                <>✓ Log Sale</>
                            )}
                        </button>
                    </form>

                    {/* Dataset Import Section */}
                    <div className="import-section">
                        <div className="import-divider">
                            <span>or import from</span>
                        </div>

                        {/* Dataset Selector */}
                        <div className="dataset-import">
                            <button
                                className={`dataset-toggle-btn ${showDatasetSelector ? 'active' : ''}`}
                                onClick={() => setShowDatasetSelector(!showDatasetSelector)}
                            >
                                <span className="btn-icon">📊</span>
                                Select from Uploaded Datasets
                                <span className="arrow">{showDatasetSelector ? '▲' : '▼'}</span>
                            </button>

                            {showDatasetSelector && (
                                <div className="dataset-selector">
                                    {datasets.length > 0 ? (
                                        <>
                                            <select
                                                className="dataset-dropdown"
                                                value={selectedDataset}
                                                onChange={(e) => setSelectedDataset(e.target.value)}
                                            >
                                                <option value="">-- Select a dataset --</option>
                                                {datasets.map(ds => (
                                                    <option key={ds.id} value={ds.id}>
                                                        {ds.name} ({ds.num_rows} rows)
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="import-dataset-btn"
                                                onClick={handleImportFromDataset}
                                                disabled={!selectedDataset || importingDataset}
                                            >
                                                {importingDataset ? (
                                                    <>
                                                        <span className="spinner-small"></span>
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>📥 Import Sales Data</>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <p className="no-datasets-msg">
                                            No CSV datasets available. Upload datasets in the Datasets page first.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CSV Upload (as fallback) */}
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
                            <span className="btn-icon">📁</span>
                            Upload New CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel - Tables */}
                <div className="sales-right-panel">
                    {/* Tabs */}
                    <div className="tabs-container">
                        <button
                            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                            onClick={() => setActiveTab('today')}
                        >
                            📋 Today's Sales
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            📊 Product Summary
                        </button>
                    </div>

                    {activeTab === 'today' ? (
                        <div className="table-container">
                            <div className="table-header">
                                <div className="table-title">
                                    <span className="icon">🧾</span>
                                    Sales Transactions
                                </div>
                                <div className="table-filters">
                                    <select
                                        className="filter-select"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>
                                                {getCategoryIcon(cat)} {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredSales.length > 0 ? (
                                <div className="sales-table-wrapper">
                                    <table className="sales-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Category</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSales.slice(0, 15).map((sale, i) => (
                                                <tr key={sale.id || i}>
                                                    <td>
                                                        <div className="product-cell">
                                                            <span className="product-avatar">
                                                                {getCategoryIcon(sale.category)}
                                                            </span>
                                                            {sale.product_name}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {sale.category && (
                                                            <span className={`category-badge ${sale.category?.toLowerCase().replace(' ', '-')}`}>
                                                                {sale.category}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="quantity-cell">{sale.quantity_sold}</td>
                                                    <td className="price-cell">₹{sale.unit_price?.toFixed(2)}</td>
                                                    <td className="total-cell">₹{sale.total_amount?.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📝</div>
                                    <h3>No sales recorded</h3>
                                    <p>Use the form to log sales or select a dataset to import</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="summary-section">
                            <div className="summary-header">
                                <span className="icon">📊</span>
                                Top Selling Products
                            </div>

                            {dailySales?.by_product?.length > 0 ? (
                                <div className="product-bars">
                                    {dailySales.by_product.slice(0, 8).map((product, i) => (
                                        <div key={i} className="product-bar-item">
                                            <span className={`product-bar-rank ${i < 3 ? 'top-3' : ''}`}>
                                                {i + 1}
                                            </span>
                                            <div className="product-bar-info">
                                                <div className="product-bar-name" title={product.product}>
                                                    {product.product}
                                                </div>
                                                <div className="product-bar-track">
                                                    <div
                                                        className="product-bar-fill"
                                                        style={{ width: `${(product.total / maxProductSale) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="product-bar-value">
                                                {formatCurrency(product.total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <h3>No product data available</h3>
                                    <p>Start logging sales to see product summaries</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
