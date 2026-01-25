/**
 * DataAnalyzer - Intelligent Column Type Detection
 * Analyzes datasets to detect types, dimensions, metrics, and suggest visualizations
 */

/**
 * Analyze a dataset and detect column types, roles, and suggested visualizations
 * @param {Array} data - Array of data records
 * @param {Array} columns - Column names
 * @param {string} targetColumn - The target column of the model (optional)
 * @returns {Object} Analysis results
 */
export function analyzeDataset(data, columns, targetColumn = null) {
    if (!data || !columns || data.length === 0) {
        return { columns: {}, filters: [], charts: [], metrics: {} }
    }

    const columnAnalysis = {}
    const filters = []
    const charts = []
    const sampleSize = Math.min(data.length, 500)

    // Analyze each column
    columns.forEach(col => {
        const values = data.slice(0, sampleSize).map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '')
        const analysis = analyzeColumn(col, values, data.length)
        columnAnalysis[col] = analysis

        // Generate filter suggestions
        if (analysis.suggestFilter) {
            filters.push({
                column: col,
                type: analysis.filterType,
                ...analysis.filterConfig
            })
        }
    })

    // Generate chart suggestions based on column combinations
    const dimensions = Object.entries(columnAnalysis).filter(([_, a]) => a.role === 'dimension').map(([k]) => k)
    const metrics = Object.entries(columnAnalysis).filter(([_, a]) => a.role === 'metric').map(([k]) => k)
    const timeColumns = Object.entries(columnAnalysis).filter(([_, a]) => a.role === 'time').map(([k]) => k)

    // Chart 1: Target column distribution (if categorical)
    if (targetColumn && columnAnalysis[targetColumn]?.type === 'categorical') {
        charts.push({
            type: columnAnalysis[targetColumn].uniqueCount <= 6 ? 'donut' : 'bar',
            title: `${formatColumnName(targetColumn)} Distribution`,
            columns: [targetColumn],
            priority: 1
        })
    }

    // Chart 2: Time series (if time column exists with numeric column)
    if (timeColumns.length > 0 && metrics.length > 0) {
        charts.push({
            type: 'area',
            title: `${formatColumnName(metrics[0])} Over Time`,
            columns: [timeColumns[0], metrics[0]],
            priority: 2
        })
    }

    // Chart 3: Top dimensions by count
    dimensions.slice(0, 2).forEach((dim, i) => {
        if (dim !== targetColumn) {
            charts.push({
                type: columnAnalysis[dim].uniqueCount <= 6 ? 'donut' : 'horizontalBar',
                title: `${formatColumnName(dim)} Breakdown`,
                columns: [dim],
                priority: 3 + i
            })
        }
    })

    // Chart 4: Dimension vs Metric
    if (dimensions.length > 0 && metrics.length > 0) {
        const bestDim = dimensions.find(d => d !== targetColumn) || dimensions[0]
        charts.push({
            type: 'bar',
            title: `${formatColumnName(metrics[0])} by ${formatColumnName(bestDim)}`,
            columns: [bestDim, metrics[0]],
            aggregation: 'avg',
            priority: 5
        })
    }

    // Chart 5: Numeric distributions
    metrics.slice(0, 2).forEach((metric, i) => {
        charts.push({
            type: 'histogram',
            title: `${formatColumnName(metric)} Distribution`,
            columns: [metric],
            priority: 6 + i
        })
    })

    // Calculate summary metrics
    const summaryMetrics = calculateSummaryMetrics(data, columnAnalysis, targetColumn)

    return {
        columns: columnAnalysis,
        filters: filters.slice(0, 5), // Max 5 filters
        charts: charts.sort((a, b) => a.priority - b.priority).slice(0, 8), // Max 8 charts
        metrics: summaryMetrics,
        dimensions,
        numericColumns: metrics,
        timeColumns
    }
}

/**
 * Analyze a single column
 */
function analyzeColumn(name, values, totalRows) {
    const uniqueValues = [...new Set(values)]
    const uniqueCount = uniqueValues.length
    const nonNullCount = values.length
    const nullRatio = 1 - (nonNullCount / totalRows)

    // Detect if it's an ID column
    const isIdColumn = detectIdColumn(name, uniqueCount, totalRows)
    if (isIdColumn) {
        return {
            type: 'id',
            role: 'identifier',
            uniqueCount,
            nullRatio,
            suggestFilter: false
        }
    }

    // Detect datetime
    const isDateTime = detectDateTime(name, values)
    if (isDateTime) {
        return {
            type: 'datetime',
            role: 'time',
            uniqueCount,
            nullRatio,
            suggestFilter: true,
            filterType: 'dateRange',
            filterConfig: {
                min: Math.min(...values.map(v => new Date(v).getTime()).filter(v => !isNaN(v))),
                max: Math.max(...values.map(v => new Date(v).getTime()).filter(v => !isNaN(v)))
            }
        }
    }

    // Detect numeric
    const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v))
    const isNumeric = numericValues.length > values.length * 0.8

    if (isNumeric) {
        const nums = numericValues.map(v => parseFloat(v))
        const min = Math.min(...nums)
        const max = Math.max(...nums)
        const sum = nums.reduce((a, b) => a + b, 0)
        const avg = sum / nums.length

        // High cardinality numeric = metric, low = could be categorical code
        const isMetric = uniqueCount > 20 || (max - min) > 10

        return {
            type: 'numeric',
            role: isMetric ? 'metric' : 'dimension',
            uniqueCount,
            nullRatio,
            min,
            max,
            avg,
            sum,
            suggestFilter: isMetric && uniqueCount > 5,
            filterType: 'range',
            filterConfig: { min, max }
        }
    }

    // Categorical
    return {
        type: 'categorical',
        role: 'dimension',
        uniqueCount,
        nullRatio,
        topValues: getTopValues(values, 10),
        suggestFilter: uniqueCount <= 20 && uniqueCount >= 2,
        filterType: 'select',
        filterConfig: {
            options: uniqueValues.slice(0, 50)
        }
    }
}

/**
 * Detect if column is an ID field
 */
function detectIdColumn(name, uniqueCount, totalRows) {
    const idPatterns = /^(id|_id|key|uuid|guid|index|idx)$/i
    const endsWithId = /(id|_id|Id|ID)$/

    if (idPatterns.test(name) || endsWithId.test(name)) {
        return true
    }

    // If almost all values are unique, likely an ID
    if (uniqueCount > totalRows * 0.9 && totalRows > 10) {
        return true
    }

    return false
}

/**
 * Detect if column contains datetime values
 */
function detectDateTime(name, values) {
    const datePatterns = /(date|time|created|updated|timestamp|dt|day|month|year)/i
    if (datePatterns.test(name)) {
        return true
    }

    // Try parsing sample values as dates
    const sample = values.slice(0, 10)
    const validDates = sample.filter(v => {
        if (typeof v !== 'string') return false
        const d = new Date(v)
        return !isNaN(d.getTime()) && v.match(/[-\/]/)
    })

    return validDates.length > sample.length * 0.7
}

/**
 * Get top N values by frequency
 */
function getTopValues(values, n = 10) {
    const counts = {}
    values.forEach(v => {
        const key = String(v)
        counts[key] = (counts[key] || 0) + 1
    })

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([value, count]) => ({ value, count }))
}

/**
 * Calculate summary metrics for the dashboard
 */
function calculateSummaryMetrics(data, columnAnalysis, targetColumn) {
    const metrics = {
        totalRecords: data.length
    }

    // Find primary numeric columns
    const numericCols = Object.entries(columnAnalysis)
        .filter(([_, a]) => a.type === 'numeric' && a.role === 'metric')
        .slice(0, 3)

    numericCols.forEach(([col, analysis]) => {
        metrics[`${col}_sum`] = analysis.sum
        metrics[`${col}_avg`] = analysis.avg
        metrics[`${col}_max`] = analysis.max
    })

    // Count unique dimensions
    const primaryDimension = Object.entries(columnAnalysis)
        .find(([col, a]) => a.role === 'dimension' && col !== targetColumn)

    if (primaryDimension) {
        metrics.uniqueCategories = primaryDimension[1].uniqueCount
        metrics.categoryColumn = primaryDimension[0]
    }

    // Target column stats
    if (targetColumn && columnAnalysis[targetColumn]) {
        metrics.targetColumn = targetColumn
        metrics.targetClasses = columnAnalysis[targetColumn].uniqueCount
    }

    return metrics
}

/**
 * Format column name for display
 */
export function formatColumnName(name) {
    if (!name) return ''
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

/**
 * Aggregate data by a column
 */
export function aggregateByColumn(data, groupColumn, valueColumn = null, aggType = 'count') {
    const groups = {}

    data.forEach(row => {
        const key = String(row[groupColumn] ?? 'Unknown')
        if (!groups[key]) {
            groups[key] = { name: key, count: 0, sum: 0, values: [] }
        }
        groups[key].count++
        if (valueColumn && row[valueColumn] !== undefined) {
            const val = parseFloat(row[valueColumn])
            if (!isNaN(val)) {
                groups[key].sum += val
                groups[key].values.push(val)
            }
        }
    })

    return Object.values(groups).map(g => ({
        name: g.name,
        value: aggType === 'count' ? g.count :
            aggType === 'sum' ? g.sum :
                aggType === 'avg' ? (g.values.length > 0 ? g.sum / g.values.length : 0) :
                    g.count
    })).sort((a, b) => b.value - a.value)
}

/**
 * Create histogram buckets for numeric data
 */
export function createHistogram(data, column, bucketCount = 10) {
    const values = data
        .map(row => parseFloat(row[column]))
        .filter(v => !isNaN(v))

    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const bucketSize = (max - min) / bucketCount || 1

    const buckets = Array(bucketCount).fill(0)
    values.forEach(v => {
        const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1)
        buckets[idx]++
    })

    return buckets.map((count, i) => ({
        name: `${(min + i * bucketSize).toFixed(1)}`,
        value: count,
        range: `${(min + i * bucketSize).toFixed(1)} - ${(min + (i + 1) * bucketSize).toFixed(1)}`
    }))
}

/**
 * Aggregate time series data
 */
export function aggregateTimeSeries(data, timeColumn, valueColumn, aggType = 'sum') {
    const groups = {}

    data.forEach(row => {
        const timeVal = row[timeColumn]
        if (!timeVal) return

        // Normalize time key (could be date string, year, month, etc.)
        const key = String(timeVal)

        if (!groups[key]) {
            groups[key] = { name: key, count: 0, sum: 0, values: [] }
        }
        groups[key].count++
        if (valueColumn) {
            const val = parseFloat(row[valueColumn])
            if (!isNaN(val)) {
                groups[key].sum += val
                groups[key].values.push(val)
            }
        }
    })

    const result = Object.values(groups).map(g => ({
        name: g.name,
        value: aggType === 'count' ? g.count :
            aggType === 'sum' ? g.sum :
                aggType === 'avg' ? (g.values.length > 0 ? g.sum / g.values.length : 0) :
                    g.count
    }))

    // Sort by time
    return result.sort((a, b) => {
        const aDate = new Date(a.name)
        const bDate = new Date(b.name)
        if (!isNaN(aDate) && !isNaN(bDate)) {
            return aDate - bDate
        }
        return a.name.localeCompare(b.name)
    })
}

/**
 * Apply filters to data
 */
export function applyFilters(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
        return data
    }

    return data.filter(row => {
        return Object.entries(filters).every(([column, filterValue]) => {
            if (filterValue === null || filterValue === undefined || filterValue === '' || filterValue === 'all') {
                return true
            }

            const cellValue = row[column]

            // Array filter (multi-select)
            if (Array.isArray(filterValue)) {
                if (filterValue.length === 0) return true
                return filterValue.includes(String(cellValue))
            }

            // Range filter
            if (typeof filterValue === 'object' && (filterValue.min !== undefined || filterValue.max !== undefined)) {
                const numVal = parseFloat(cellValue)
                if (isNaN(numVal)) return false
                if (filterValue.min !== undefined && numVal < filterValue.min) return false
                if (filterValue.max !== undefined && numVal > filterValue.max) return false
                return true
            }

            // Exact match
            return String(cellValue) === String(filterValue)
        })
    })
}
