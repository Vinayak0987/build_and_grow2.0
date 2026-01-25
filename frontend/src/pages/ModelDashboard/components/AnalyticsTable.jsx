/**
 * AnalyticsTable - Google Analytics Style Data Table
 * Multi-column metrics table with row-level details
 */
import { useState, useMemo } from 'react'
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ArrowUpDown
} from 'lucide-react'

export default function AnalyticsTable({ data, columns, analysis, title = "Data Table" }) {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortColumn, setSortColumn] = useState(null)
    const [sortDirection, setSortDirection] = useState('desc')

    // Identify dimensions and metrics for smart table layout
    const { dimensionCols, metricCols } = useMemo(() => {
        if (!analysis?.columns) {
            return { dimensionCols: columns.slice(0, 2), metricCols: columns.slice(2, 8) }
        }

        const dims = []
        const mets = []

        columns.forEach(col => {
            const colAnalysis = analysis.columns[col]
            if (!colAnalysis) return

            if (colAnalysis.role === 'dimension' || colAnalysis.role === 'time') {
                dims.push(col)
            } else if (colAnalysis.role === 'metric') {
                mets.push(col)
            }
        })

        // Fallback if none detected
        if (dims.length === 0) dims.push(...columns.slice(0, 2))
        if (mets.length === 0) mets.push(...columns.slice(2, 6))

        return {
            dimensionCols: dims.slice(0, 2),
            metricCols: mets.slice(0, 6)
        }
    }, [columns, analysis])

    const displayColumns = [...dimensionCols, ...metricCols]

    // Calculate totals for metrics
    const totals = useMemo(() => {
        const sums = {}
        metricCols.forEach(col => {
            const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v))
            sums[col] = {
                sum: values.reduce((a, b) => a + b, 0),
                avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
                count: values.length
            }
        })
        return sums
    }, [data, metricCols])

    // Filter and sort data
    const processedData = useMemo(() => {
        let result = [...data]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(row =>
                displayColumns.some(col =>
                    String(row[col] || '').toLowerCase().includes(query)
                )
            )
        }

        // Sort
        if (sortColumn) {
            result.sort((a, b) => {
                const aVal = a[sortColumn]
                const bVal = b[sortColumn]

                const aNum = parseFloat(aVal)
                const bNum = parseFloat(bVal)

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
                }

                const aStr = String(aVal || '')
                const bStr = String(bVal || '')
                return sortDirection === 'asc'
                    ? aStr.localeCompare(bStr)
                    : bStr.localeCompare(aStr)
            })
        }

        return result
    }, [data, searchQuery, sortColumn, sortDirection, displayColumns])

    // Pagination
    const totalPages = Math.ceil(processedData.length / pageSize)
    const paginatedData = processedData.slice((page - 1) * pageSize, page * pageSize)
    const startRow = (page - 1) * pageSize + 1
    const endRow = Math.min(page * pageSize, processedData.length)

    // Handle sort
    const handleSort = (col) => {
        if (sortColumn === col) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(col)
            setSortDirection('desc')
        }
        setPage(1)
    }

    // Format cell value
    const formatCell = (value, isMetric = false) => {
        if (value === null || value === undefined || value === '') return '—'
        if (typeof value === 'number' || (isMetric && !isNaN(parseFloat(value)))) {
            const num = parseFloat(value)
            if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M'
            if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K'
            return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)
        }
        const str = String(value)
        return str.length > 30 ? str.substring(0, 27) + '...' : str
    }

    // Calculate percentage of total for metric
    const getPercentage = (value, col) => {
        const num = parseFloat(value)
        if (isNaN(num) || !totals[col]) return null
        const total = totals[col].sum
        if (total === 0) return 0
        return ((num / total) * 100).toFixed(1)
    }

    return (
        <div className="ga-table-section">
            {/* Table Controls */}
            <div className="ga-table-controls">
                <div className="ga-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                    />
                </div>
                <div className="ga-table-options">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="ga-table-wrapper">
                <table className="ga-data-table">
                    <thead>
                        <tr>
                            {displayColumns.map((col, idx) => {
                                const isMetric = metricCols.includes(col)
                                return (
                                    <th
                                        key={col}
                                        onClick={() => handleSort(col)}
                                        className={`${isMetric ? 'metric-col' : 'dimension-col'} sortable`}
                                    >
                                        <div className="th-content">
                                            <span>{formatColumnName(col)}</span>
                                            {sortColumn === col ? (
                                                sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                            ) : (
                                                <ArrowUpDown size={12} className="sort-inactive" />
                                            )}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                        {/* Totals Row */}
                        <tr className="totals-row">
                            {displayColumns.map((col, idx) => {
                                const isMetric = metricCols.includes(col)
                                if (!isMetric) {
                                    return <td key={col}></td>
                                }
                                const total = totals[col]
                                return (
                                    <td key={col} className="metric-col">
                                        <div className="total-value">{formatCell(total?.sum, true)}</div>
                                        <div className="total-label">100% of total</div>
                                    </td>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {displayColumns.map((col, colIdx) => {
                                    const isMetric = metricCols.includes(col)
                                    const pct = isMetric ? getPercentage(row[col], col) : null
                                    return (
                                        <td
                                            key={col}
                                            className={isMetric ? 'metric-col' : 'dimension-col'}
                                        >
                                            <div className="cell-content">
                                                <span className="cell-value">{formatCell(row[col], isMetric)}</span>
                                                {pct !== null && (
                                                    <span className="cell-pct">{pct}%</span>
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={displayColumns.length} className="empty-row">
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="ga-table-pagination">
                <div className="pagination-info">
                    {startRow}-{endRow} of {processedData.length}
                </div>
                <div className="pagination-nav">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="pagination-btn"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="pagination-btn"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}

function formatColumnName(name) {
    if (!name) return ''
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}
