import { useState, useEffect } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { inventoryApi } from '../services/api'
import './Inventory.css'

import { VENDORS_LIST } from '../constants/vendors'

// Fallback Demo Data (only used when no AI analysis has been run)
const DEMO_DATA = {
    orders: {
        suggested_items: [],
        critical_count: 0,
        high_priority_count: 0,
        estimated_total_cost: 0,
        ai_reasoning: 'Run AI Analysis in the Reasoning page to get personalized order suggestions based on your data.'
    }
}


// Order tracking steps
const TRACKING_STEPS = {
    QUOTATION_SENT: 'quotation_sent',
    SELECT_VENDOR: 'select_vendor',
    VENDOR_SELECTED: 'vendor_selected',
    ORDER_PLACED: 'order_placed'
}

export default function Inventory() {
    // Get order suggestions from the shared store (populated by AI Reasoning page)
    const {
        orderSuggestions,
        setOrderSuggestions,
        lastUpdated,
        inventoryState,
        setInventoryState
    } = useInventoryStore()

    const {
        vendors = [],
        selectedVendorIds: selectedVendors = [],
        showAddVendor = false,
        purchaseOrder = null,
        trackingStep = null,
        finalVendor = null,
        isInitialized = false
    } = inventoryState || {}

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [sendingEmails, setSendingEmails] = useState(false)
    const [newVendor, setNewVendor] = useState({ name: '', contact: '', email: '', category: 'Wholesale' })

    // Setters wrappers
    const setVendors = (v) => setInventoryState({ vendors: v })
    const setSelectedVendors = (v) => {
        // Handle functional update if needed, but since we have global state, 
        // passing function to setter might be tricky if we don't wrap it right.
        // Simplified: calculate new value in handler.
        setInventoryState({ selectedVendorIds: v })
    }
    const setShowAddVendor = (v) => setInventoryState({ showAddVendor: v })
    const setPurchaseOrder = (v) => {
        // Support functional update for Purchase Order if used
        if (typeof v === 'function') {
            setInventoryState({ purchaseOrder: v(purchaseOrder) })
        } else {
            setInventoryState({ purchaseOrder: v })
        }
    }
    const setTrackingStep = (v) => setInventoryState({ trackingStep: v })
    const setFinalVendor = (v) => setInventoryState({ finalVendor: v })

    // Initialize vendors
    useEffect(() => {
        if (!isInitialized) {
            setInventoryState({
                vendors: VENDORS_LIST,
                isInitialized: true
            })
        }
    }, [isInitialized])

    useEffect(() => {
        loadOrderSuggestions()
    }, [orderSuggestions])

    const loadOrderSuggestions = async () => {
        setLoading(true)

        // First, check if we have data from the AI Reasoning page or persisted state
        if (orderSuggestions && (orderSuggestions.suggested_items?.length > 0 || orderSuggestions.total_items)) {
            setLoading(false)
            return
        }

        // If no stored data, try to fetch from API
        try {
            const orders = await inventoryApi.suggestOrder()
            if (orders.data?.suggested_items?.length > 0) {
                setOrderSuggestions(orders.data)
            } else {
                // Use empty demo data with message to run AI analysis
                setOrderSuggestions(DEMO_DATA.orders)
            }
        } catch (error) {
            console.error('Failed to load analysis:', error)
            // Use empty demo data with message
            setOrderSuggestions(DEMO_DATA.orders)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrderSuggestions()
        setRefreshing(false)
    }

    const handleAddVendor = () => {
        if (!newVendor.name || !newVendor.contact) return

        const vendor = {
            id: Date.now(),
            ...newVendor,
            rating: 0
        }
        setVendors([...vendors, vendor])
        setNewVendor({ name: '', contact: '', email: '', category: 'Wholesale' })
        setShowAddVendor(false)
    }

    const handleToggleVendor = (vendorId) => {
        const prev = selectedVendors
        if (prev.includes(vendorId)) {
            setSelectedVendors(prev.filter(id => id !== vendorId))
        } else {
            setSelectedVendors([...prev, vendorId])
        }
    }

    const handleSelectAllVendors = () => {
        if (selectedVendors.length === vendors.length) {
            setSelectedVendors([])
        } else {
            setSelectedVendors(vendors.map(v => v.id))
        }
    }

    const handleSendQuotations = async () => {
        if (selectedVendors.length === 0 || !orderSuggestions?.suggested_items?.length) return

        setSendingEmails(true)

        const selectedVendorsList = vendors.filter(v => selectedVendors.includes(v.id))

        // Simulate sending emails to all selected vendors
        await new Promise(resolve => setTimeout(resolve, 2000))

        const orderData = {
            orderId: `PO-${Date.now()}`,
            quotationVendors: selectedVendorsList,
            items: orderSuggestions.suggested_items,
            subtotal: orderSuggestions.estimated_total_cost,
            total: orderSuggestions.estimated_total_cost,
            ai_reasoning: orderSuggestions.ai_reasoning,
            urgency_level: orderSuggestions.critical_count > 0 ? 'critical' :
                orderSuggestions.high_priority_count > 0 ? 'high' : 'normal',
            createdAt: new Date().toISOString(),
            quotationSentAt: new Date().toISOString()
        }

        setPurchaseOrder(orderData)
        setTrackingStep(TRACKING_STEPS.QUOTATION_SENT)
        setSendingEmails(false)

        // Auto-progress to select vendor step after 2 seconds
        setTimeout(() => {
            setTrackingStep(TRACKING_STEPS.SELECT_VENDOR)
        }, 2000)
    }

    const handleFinalVendorSelect = (vendorId) => {
        const vendor = vendors.find(v => v.id === parseInt(vendorId))
        setFinalVendor(vendor)
        setTrackingStep(TRACKING_STEPS.VENDOR_SELECTED)
    }

    const handlePlaceOrder = async () => {
        if (!finalVendor) return

        // Simulate sending order confirmation email
        await new Promise(resolve => setTimeout(resolve, 1500))

        const updatedOrder = {
            ...purchaseOrder,
            finalVendor: finalVendor,
            orderPlacedAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
        setPurchaseOrder(updatedOrder)
        setTrackingStep(TRACKING_STEPS.ORDER_PLACED)

        // Try to create order in backend
        try {
            await inventoryApi.createOrder(purchaseOrder)
        } catch (error) {
            console.error('Failed to save order:', error)
        }
    }

    const getTrackingStepIndex = () => {
        const steps = [
            TRACKING_STEPS.QUOTATION_SENT,
            TRACKING_STEPS.SELECT_VENDOR,
            TRACKING_STEPS.VENDOR_SELECTED,
            TRACKING_STEPS.ORDER_PLACED
        ]
        return steps.indexOf(trackingStep)
    }

    const hasActionItems = orderSuggestions?.suggested_items?.length > 0
    const selectedVendorsList = vendors.filter(v => selectedVendors.includes(v.id))

    return (
        <div className="inventory-page">
            <div className="inventory-header">
                <div>
                    <h1>🤖 AI Inventory Center</h1>
                    <p>Order Generation Agent - Smart inventory replenishment</p>
                    {lastUpdated && (
                        <span className="last-updated">
                            Last analyzed: {new Date(lastUpdated).toLocaleString()}
                        </span>
                    )}
                </div>
                <button
                    className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Purchase Tracking Section - Shows when quotations are sent */}
            {purchaseOrder && trackingStep && (
                <div className="purchase-tracking-section">
                    <div className="tracking-header">
                        <div className="tracking-title">
                            <span className="tracking-icon">📋</span>
                            <div>
                                <h2>Purchase Order Tracking</h2>
                                <p>Order ID: {purchaseOrder.orderId}</p>
                            </div>
                        </div>
                        <div className="tracking-vendor-count">
                            <span className="vendor-label">Vendors Contacted:</span>
                            <span className="vendor-count">{purchaseOrder.quotationVendors?.length || 0}</span>
                        </div>
                    </div>

                    <div className="tracking-progress">
                        {/* Step 1: Quotation Sent */}
                        <div className={`tracking-step ${getTrackingStepIndex() >= 0 ? 'active' : ''} ${trackingStep === TRACKING_STEPS.QUOTATION_SENT ? 'current' : ''}`}>
                            <div className="step-icon">📧</div>
                            <div className="step-content">
                                <span className="step-label">Quotation Request Sent</span>
                                <span className="step-time">
                                    {new Date(purchaseOrder.quotationSentAt).toLocaleString()}
                                </span>
                                <span className="step-detail">
                                    Sent to {purchaseOrder.quotationVendors?.length} vendors
                                </span>
                            </div>
                            <div className={`step-connector ${getTrackingStepIndex() >= 1 ? 'active' : ''}`}></div>
                        </div>

                        {/* Step 2: Select Vendor */}
                        <div className={`tracking-step ${getTrackingStepIndex() >= 1 ? 'active' : ''} ${trackingStep === TRACKING_STEPS.SELECT_VENDOR ? 'current' : ''}`}>
                            <div className="step-icon">🔍</div>
                            <div className="step-content">
                                <span className="step-label">Select Vendor</span>
                                {trackingStep === TRACKING_STEPS.SELECT_VENDOR && (
                                    <div className="vendor-dropdown-container">
                                        <select
                                            className="vendor-dropdown"
                                            value={finalVendor?.id || ''}
                                            onChange={(e) => handleFinalVendorSelect(e.target.value)}
                                        >
                                            <option value="">-- Select Best Vendor --</option>
                                            {purchaseOrder.quotationVendors?.map(vendor => (
                                                <option key={vendor.id} value={vendor.id}>
                                                    {vendor.name} ({vendor.category})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="dropdown-hint">Choose the vendor with the best quotation</p>
                                    </div>
                                )}
                            </div>
                            <div className={`step-connector ${getTrackingStepIndex() >= 2 ? 'active' : ''}`}></div>
                        </div>

                        {/* Step 3: Vendor Selected */}
                        <div className={`tracking-step ${getTrackingStepIndex() >= 2 ? 'active' : ''} ${trackingStep === TRACKING_STEPS.VENDOR_SELECTED ? 'current' : ''}`}>
                            <div className="step-icon">✓</div>
                            <div className="step-content">
                                <span className="step-label">Vendor Selected</span>
                                {finalVendor && (
                                    <span className="step-detail selected-vendor">{finalVendor.name}</span>
                                )}
                                {trackingStep === TRACKING_STEPS.VENDOR_SELECTED && (
                                    <button className="place-order-btn" onClick={handlePlaceOrder}>
                                        📦 Confirm & Place Order
                                    </button>
                                )}
                            </div>
                            <div className={`step-connector ${getTrackingStepIndex() >= 3 ? 'active' : ''}`}></div>
                        </div>

                        {/* Step 4: Order Placed */}
                        <div className={`tracking-step ${getTrackingStepIndex() >= 3 ? 'active' : ''} ${trackingStep === TRACKING_STEPS.ORDER_PLACED ? 'current' : ''}`}>
                            <div className="step-icon">🎉</div>
                            <div className="step-content">
                                <span className="step-label">Order Placed</span>
                                {trackingStep === TRACKING_STEPS.ORDER_PLACED && (
                                    <>
                                        <span className="step-time">
                                            {new Date(purchaseOrder.orderPlacedAt).toLocaleString()}
                                        </span>
                                        <span className="step-detail success">
                                            ✉️ Confirmation email sent to {finalVendor?.name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="tracking-details">
                        <div className="tracking-detail-item">
                            <span className="detail-label">Total Items</span>
                            <span className="detail-value">{purchaseOrder.items.length}</span>
                        </div>
                        <div className="tracking-detail-item">
                            <span className="detail-label">Total Amount</span>
                            <span className="detail-value amount">₹{purchaseOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="tracking-detail-item">
                            <span className="detail-label">Priority</span>
                            <span className={`detail-value priority ${purchaseOrder.urgency_level}`}>
                                {purchaseOrder.urgency_level.toUpperCase()}
                            </span>
                        </div>
                        {purchaseOrder.estimatedDelivery && (
                            <div className="tracking-detail-item">
                                <span className="detail-label">Est. Delivery</span>
                                <span className="detail-value">
                                    {new Date(purchaseOrder.estimatedDelivery).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading inventory data...</p>
                </div>
            ) : (
                <div className="inventory-content">
                    {/* Order Generation Agent */}
                    <div className="agent-card order-agent">
                        <div className="agent-header">
                            <div className="agent-icon order">🛒</div>
                            <div className="agent-title">
                                <h3>Order Generation Agent</h3>
                                <p>AI-powered reorder suggestions from your data</p>
                            </div>
                        </div>
                        <div className="agent-content">
                            {!hasActionItems ? (
                                <div className="no-data-state">
                                    <div className="no-data-icon">📊</div>
                                    <h4>No Action Items Available</h4>
                                    <p>Run AI Analysis in the <strong>Reasoning</strong> page to generate personalized order suggestions based on your datasets.</p>
                                    <a href="/reasoning" className="go-to-reasoning-btn">
                                        Go to AI Reasoning →
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="order-summary">
                                        <div className="stat-item">
                                            <div className="stat-value info">{orderSuggestions.total_items || orderSuggestions.suggested_items?.length || 0}</div>
                                            <div className="stat-label">Items to Order</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-value critical">{orderSuggestions.critical_count || 0}</div>
                                            <div className="stat-label">Critical</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-value warning">{orderSuggestions.high_priority_count || 0}</div>
                                            <div className="stat-label">High Priority</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '1rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        borderRadius: '12px',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Estimated Total</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                                            ₹{(orderSuggestions.estimated_total_cost || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    {orderSuggestions.suggested_items?.length > 0 && (
                                        <div className="suggested-items">
                                            {orderSuggestions.suggested_items.slice(0, 8).map((item, i) => (
                                                <div key={i} className="order-item">
                                                    <div className="details">
                                                        <span className="name">{item.item_name}</span>
                                                        <span className="qty">
                                                            Current: {item.current_quantity || 0} → Order: +{item.suggested_quantity || item.order_quantity} {item.unit || 'units'}
                                                        </span>
                                                    </div>
                                                    <span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {orderSuggestions.ai_reasoning && (
                                        <div className="ai-insights">
                                            <div className="ai-insights-header">
                                                <span>✨</span> AI Reasoning
                                            </div>
                                            <p>{orderSuggestions.ai_reasoning}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Vendors Section */}
                    <div className="vendors-section">
                        <div className="vendors-header">
                            <div className="vendors-title">
                                <span className="vendors-icon">🏪</span>
                                <div>
                                    <h3>Vendors</h3>
                                    <p>Select vendors to request quotations</p>
                                </div>
                            </div>
                            <button
                                className="add-vendor-btn"
                                onClick={() => setShowAddVendor(!showAddVendor)}
                            >
                                {showAddVendor ? '✕ Cancel' : '+ Add Vendor'}
                            </button>
                        </div>

                        {/* Add Vendor Form */}
                        {showAddVendor && (
                            <div className="add-vendor-form">
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="Vendor Name *"
                                        value={newVendor.name}
                                        onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Contact Number *"
                                        value={newVendor.contact}
                                        onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={newVendor.email}
                                        onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                                    />
                                    <select
                                        value={newVendor.category}
                                        onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                                    >
                                        <option value="Wholesale">Wholesale</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Online">Online</option>
                                        <option value="Local">Local</option>
                                    </select>
                                </div>
                                <button className="save-vendor-btn" onClick={handleAddVendor}>
                                    Save Vendor
                                </button>
                            </div>
                        )}

                        {/* Select All Toggle */}
                        <div className="select-all-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedVendors.length === vendors.length}
                                    onChange={handleSelectAllVendors}
                                />
                                <span>Select All Vendors ({vendors.length})</span>
                            </label>
                            {selectedVendors.length > 0 && (
                                <span className="selected-count">{selectedVendors.length} selected</span>
                            )}
                        </div>

                        {/* Vendors List */}
                        <div className="vendors-list">
                            {vendors.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    className={`vendor-card ${selectedVendors.includes(vendor.id) ? 'selected' : ''}`}
                                    onClick={() => handleToggleVendor(vendor.id)}
                                >
                                    <div className="vendor-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedVendors.includes(vendor.id)}
                                            onChange={() => { }}
                                        />
                                    </div>
                                    <div className="vendor-info">
                                        <div className="vendor-avatar">
                                            {vendor.name.charAt(0)}
                                        </div>
                                        <div className="vendor-details">
                                            <span className="vendor-name">{vendor.name}</span>
                                            <span className="vendor-category">{vendor.category}</span>
                                        </div>
                                    </div>
                                    <div className="vendor-meta">
                                        <div className="vendor-contact">
                                            <span className="contact-icon">📧</span>
                                            <span>{vendor.email}</span>
                                        </div>
                                        {vendor.rating > 0 && (
                                            <div className="vendor-rating">
                                                <span className="rating-star">⭐</span>
                                                <span>{vendor.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Send Quotations Button */}
                        {selectedVendors.length > 0 && hasActionItems && !purchaseOrder && (
                            <button
                                className="send-quotations-btn"
                                onClick={handleSendQuotations}
                                disabled={sendingEmails}
                            >
                                {sendingEmails ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Sending Quotation Requests...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">📧</span>
                                        Send Quotation Request to {selectedVendors.length} Vendor{selectedVendors.length > 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        )}

                        {/* Message when no action items */}
                        {selectedVendors.length > 0 && !hasActionItems && (
                            <div className="no-items-message">
                                <p>⚠️ No action items available. Run AI Analysis first to generate order suggestions.</p>
                            </div>
                        )}

                        {/* Hint when no vendors selected */}
                        {selectedVendors.length === 0 && hasActionItems && !purchaseOrder && (
                            <div className="select-vendor-hint">
                                <p>👆 Select one or more vendors above to request quotations</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
