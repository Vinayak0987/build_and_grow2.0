/**
 * GlobalFilters - Dynamic Filter Controls
 * Auto-generates filters based on column analysis
 */
import { useState, useEffect } from 'react'
import { Filter, X, Calendar, ChevronDown, RotateCcw } from 'lucide-react'

export default function GlobalFilters({
    filters,
    activeFilters,
    onFilterChange,
    onReset,
    data
}) {
    if (!filters || filters.length === 0) return null

    return (
        <div className="global-filters">
            <div className="filters-header">
                <div className="filters-title">
                    <Filter size={16} />
                    <span>Filters</span>
                </div>
                {Object.keys(activeFilters).length > 0 && (
                    <button className="reset-btn" onClick={onReset}>
                        <RotateCcw size={14} />
                        Reset All
                    </button>
                )}
            </div>

            <div className="filters-row">
                {filters.map(filter => (
                    <FilterControl
                        key={filter.column}
                        filter={filter}
                        value={activeFilters[filter.column]}
                        onChange={(val) => onFilterChange(filter.column, val)}
                        data={data}
                    />
                ))}
            </div>
        </div>
    )
}

function FilterControl({ filter, value, onChange, data }) {
    const [isOpen, setIsOpen] = useState(false)

    switch (filter.type) {
        case 'select':
            return (
                <SelectFilter
                    filter={filter}
                    value={value}
                    onChange={onChange}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                />
            )
        case 'range':
            return (
                <RangeFilter
                    filter={filter}
                    value={value}
                    onChange={onChange}
                />
            )
        case 'dateRange':
            return (
                <DateRangeFilter
                    filter={filter}
                    value={value}
                    onChange={onChange}
                />
            )
        default:
            return null
    }
}

function SelectFilter({ filter, value, onChange, isOpen, setIsOpen }) {
    const options = filter.options || []
    const selectedValue = value || 'all'
    const displayValue = selectedValue === 'all' ? `All ${formatLabel(filter.column)}` : selectedValue

    return (
        <div className="filter-control">
            <label className="filter-label">{formatLabel(filter.column)}</label>
            <div className="select-wrapper">
                <button
                    className={`filter-select ${value && value !== 'all' ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="select-value">{displayValue}</span>
                    <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="select-backdrop" onClick={() => setIsOpen(false)} />
                        <div className="select-dropdown">
                            <div
                                className={`select-option ${selectedValue === 'all' ? 'selected' : ''}`}
                                onClick={() => { onChange('all'); setIsOpen(false) }}
                            >
                                All
                            </div>
                            {options.map(opt => (
                                <div
                                    key={opt}
                                    className={`select-option ${selectedValue === opt ? 'selected' : ''}`}
                                    onClick={() => { onChange(opt); setIsOpen(false) }}
                                >
                                    {String(opt)}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function RangeFilter({ filter, value, onChange }) {
    const [localMin, setLocalMin] = useState(value?.min ?? filter.min ?? 0)
    const [localMax, setLocalMax] = useState(value?.max ?? filter.max ?? 100)

    const handleBlur = () => {
        onChange({ min: parseFloat(localMin), max: parseFloat(localMax) })
    }

    return (
        <div className="filter-control range-filter">
            <label className="filter-label">{formatLabel(filter.column)}</label>
            <div className="range-inputs">
                <input
                    type="number"
                    className="range-input"
                    placeholder="Min"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    onBlur={handleBlur}
                />
                <span className="range-separator">—</span>
                <input
                    type="number"
                    className="range-input"
                    placeholder="Max"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>
        </div>
    )
}

function DateRangeFilter({ filter, value, onChange }) {
    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        const d = new Date(timestamp)
        return d.toISOString().split('T')[0]
    }

    const [startDate, setStartDate] = useState(value?.min ? formatDate(value.min) : '')
    const [endDate, setEndDate] = useState(value?.max ? formatDate(value.max) : '')

    const handleChange = () => {
        onChange({
            min: startDate ? new Date(startDate).getTime() : undefined,
            max: endDate ? new Date(endDate).getTime() : undefined
        })
    }

    return (
        <div className="filter-control date-filter">
            <label className="filter-label">
                <Calendar size={14} />
                {formatLabel(filter.column)}
            </label>
            <div className="date-inputs">
                <input
                    type="date"
                    className="date-input"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); handleChange() }}
                />
                <span className="range-separator">to</span>
                <input
                    type="date"
                    className="date-input"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); handleChange() }}
                />
            </div>
        </div>
    )
}

function formatLabel(name) {
    if (!name) return ''
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}
