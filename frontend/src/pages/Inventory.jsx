import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inventory.css';
import { useInventoryStore } from '../store/inventoryStore';
import { useVendorStore } from '../store/vendorStore';
import {
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    Truck,
    Package,
    AlertCircle,
    Users,
    Plus,
    Search,
    ShoppingBag,
    DollarSign,
    Clock,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';

const Inventory = () => {
    const navigate = useNavigate();
    const { orderSuggestions } = useInventoryStore();
    const { vendors, addVendor } = useVendorStore();

    // Local state for UI interactions
    const [refreshing, setRefreshing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1); // 0: Analysis, 1: Selection, 2: Approval, 3: Ordering
    const [selectedVendorIds, setSelectedVendorIds] = useState([]);
    const [showAddVendor, setShowAddVendor] = useState(false);
    const [newVendor, setNewVendor] = useState({ name: '', category: 'General' });

    // Enriched vendor data (mocking fields not in store)
    const enrichedVendors = vendors.map(v => ({
        ...v,
        rating: (4.0 + Math.random()).toFixed(1),
        deliveryTime: ['1 Day', '2 Days', '3 Days', '5 Days'][Math.floor(Math.random() * 4)],
        price: ['$$', '$$$', '$'][Math.floor(Math.random() * 3)]
    }));

    // Derive items from store or use fallback
    const items = orderSuggestions?.suggested_items?.map((item, idx) => ({
        id: idx,
        name: item.item_name,
        qty: item.order_quantity,
        cost: `$${item.estimated_cost}`,
        urgency: item.urgency || 'medium'
    })) || [];

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const toggleVendor = (id) => {
        if (selectedVendorIds.includes(id)) {
            setSelectedVendorIds(selectedVendorIds.filter(v => v !== id));
        } else {
            setSelectedVendorIds([...selectedVendorIds, id]);
        }
    };

    const handleAddVendor = () => {
        if (newVendor.name) {
            addVendor({ ...newVendor, contact: 'N/A', email: 'N/A' });
            setNewVendor({ name: '', category: 'General' });
            setShowAddVendor(false);
        }
    };

    const handlePlaceOrder = () => {
        if (selectedVendorIds.length === 0) {
            alert("Please select at least one vendor.");
            return;
        }
        setCurrentStep(2);
        setTimeout(() => {
            setCurrentStep(3);
            alert("Orders placed successfully!");
        }, 1500);
    };

    const trackingSteps = [
        { label: "AI Analysis", time: "Completed", detail: `${items.length} Items Identified` },
        { label: "Vendor Selection", time: "In Progress", detail: `${selectedVendorIds.length} Vendors Selected` },
        { label: "Approval", time: "Pending", detail: "Waiting for Confirmation" },
        { label: "Ordering", time: "Next Step", detail: "Auto-Dispatch" }
    ];

    return (
        <div className="inventory-page">
            <header className="inventory-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/reasoning')}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1>Smart Inventory Management</h1>
                        <p>AI Action Items & Vendor Procurement</p>
                    </div>
                </div>
                <button
                    className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw size={20} />
                    {refreshing ? 'Syncing...' : 'Sync Data'}
                </button>
            </header>

            {/* Content Grid */}
            <div className="inventory-content">

                {/* Left Column: Action Items */}
                <div className="agent-card">
                    <div className="agent-header">
                        <div className="agent-icon order">
                            <ShoppingBag color="white" size={24} />
                        </div>
                        <div className="agent-title">
                            <h3>AI Action Items</h3>
                            <p>Items identified from Reasoning Analysis</p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            <p>No action items found.</p>
                            <button
                                onClick={() => navigate('/reasoning')}
                                style={{ marginTop: '1rem', background: 'transparent', border: '1px solid #64748b', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Go to AI Analysis
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-value warning">{items.length}</div>
                                    <div className="stat-label">Restock Items</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value success">{orderSuggestions?.critical_count || 0}</div>
                                    <div className="stat-label">Critical Priority</div>
                                </div>
                            </div>

                            <div className="ai-insights">
                                <div className="ai-insights-header">
                                    <TrendingUp size={16} />
                                    <span>REASONING INSIGHT</span>
                                </div>
                                <p>{orderSuggestions?.ai_reasoning || "AI analysis indicates these items require immediate restocking to avoid potential stockouts based on current velocity."}</p>
                            </div>

                            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#e2e8f0' }}>Suggested Orders</h4>
                            <div className="suggested-items">
                                {items.map(item => (
                                    <div key={item.id} className="order-item">
                                        <div className="details">
                                            <span className="name">{item.name}</span>
                                            <span className="qty">Order: {item.qty} units • Est: {item.cost}</span>
                                        </div>
                                        <span className={`urgency-badge ${item.urgency}`}>
                                            {item.urgency}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Vendors & Process */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Process Tracker */}
                    <section className="purchase-tracking-section" style={{ marginBottom: 0 }}>
                        <div className="tracking-header">
                            <div className="tracking-title">
                                <Truck color="#22c55e" size={20} style={{ marginRight: '0.5rem' }} />
                                <h2 style={{ fontSize: '1rem' }}>Procurement Flow</h2>
                            </div>
                        </div>
                        <div className="tracking-progress" style={{ marginBottom: 0 }}>
                            <div className={`step-connector ${currentStep >= 1 ? 'active' : ''}`} style={{ width: '33%', left: '16%' }}></div>
                            <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`} style={{ width: '33%', left: '50%' }}></div>
                            <div className={`step-connector ${currentStep >= 3 ? 'active' : ''}`} style={{ width: '33%', left: '83%' }}></div>

                            {trackingSteps.map((step, index) => (
                                <div key={index} className={`tracking-step ${index <= currentStep ? 'active' : ''} ${index === currentStep ? 'current' : ''}`}>
                                    <div className="step-icon" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                        {index < currentStep ? <CheckCircle2 size={16} /> :
                                            index === currentStep ? <Clock size={16} /> :
                                                <div style={{ width: 8, height: 8, background: '#64748b', borderRadius: '50%' }} />}
                                    </div>
                                    <div className="step-content">
                                        <span className="step-label" style={{ fontSize: '0.75rem' }}>{step.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Vendors Section */}
                    <div className="vendors-section" style={{ flex: 1 }}>
                        <div className="vendors-header">
                            <div className="vendors-title">
                                <Users color="#ec4899" size={20} style={{ marginRight: '0.5rem' }} />
                                <h3>Select Vendors</h3>
                            </div>
                            <button className="add-vendor-btn" onClick={() => setShowAddVendor(!showAddVendor)}>
                                <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                Add
                            </button>
                        </div>

                        {showAddVendor && (
                            <div className="add-vendor-form" style={{ display: 'block', marginBottom: '1rem' }}>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="Vendor Name"
                                        value={newVendor.name}
                                        onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                                    />
                                    <select
                                        value={newVendor.category}
                                        onChange={e => setNewVendor({ ...newVendor, category: e.target.value })}
                                    >
                                        <option>General</option>
                                        <option>Electronics</option>
                                        <option>Raw Materials</option>
                                        <option>Logistics</option>
                                    </select>
                                </div>
                                <button className="save-vendor-btn" onClick={handleAddVendor}>Save New Vendor</button>
                            </div>
                        )}

                        <div className="select-all-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedVendorIds.length === enrichedVendors.length && enrichedVendors.length > 0}
                                    onChange={() => {
                                        if (selectedVendorIds.length === enrichedVendors.length) setSelectedVendorIds([]);
                                        else setSelectedVendorIds(enrichedVendors.map(v => v.id));
                                    }}
                                />
                                <span>Select All</span>
                            </label>
                            <span className="selected-count">{selectedVendorIds.length} Selected</span>
                        </div>

                        <div className="vendors-list">
                            {enrichedVendors.map(vendor => (
                                <div
                                    key={vendor.id}
                                    className={`vendor-card ${selectedVendorIds.includes(vendor.id) ? 'selected' : ''}`}
                                    onClick={() => toggleVendor(vendor.id)}
                                >
                                    <div className="vendor-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedVendorIds.includes(vendor.id)}
                                            readOnly
                                        />
                                    </div>
                                    <div className="vendor-info">
                                        <div className="vendor-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            {vendor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ color: '#f1f5f9', fontWeight: '600' }}>{vendor.name}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{vendor.category}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#22c55e', fontWeight: '600' }}>{vendor.price}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{vendor.deliveryTime}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="place-order-btn"
                            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            onClick={handlePlaceOrder}
                            disabled={currentStep > 1}
                        >
                            <span>{currentStep > 1 ? 'Processing...' : 'Approve & Place Orders'}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
