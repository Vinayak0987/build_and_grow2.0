import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useInventoryStore = create(
    persist(
        (set, get) => ({
            // ==========================================
            // EXISTING SHARED ANALYSIS STATE
            // ==========================================
            orderSuggestions: null,
            stockAnalysis: null,
            expiryAnalysis: null,
            trendsAnalysis: null,
            fullReport: null,

            // Last updated timestamp
            lastUpdated: null,

            // Set order suggestions from AI analysis
            setOrderSuggestions: (data) => {
                set({
                    orderSuggestions: data,
                    lastUpdated: new Date().toISOString()
                })
            },

            // Set all analysis data
            setAllAnalysis: ({ stock, expiry, orders, trends, report }) => {
                set({
                    stockAnalysis: stock || null,
                    expiryAnalysis: expiry || null,
                    orderSuggestions: orders || null,
                    trendsAnalysis: trends || null,
                    fullReport: report || null,
                    lastUpdated: new Date().toISOString()
                })
            },

            // Clear all data
            clearAnalysis: () => {
                set({
                    orderSuggestions: null,
                    stockAnalysis: null,
                    expiryAnalysis: null,
                    trendsAnalysis: null,
                    fullReport: null,
                    lastUpdated: null
                })
            },

            // Check if data is available
            hasData: () => {
                const state = get()
                return state.orderSuggestions !== null
            },

            // ==========================================
            // REASONING PAGE STATE
            // ==========================================
            reasoningState: {
                models: [],
                datasets: [],
                selectedModel: null,
                selectedDataset: null,
                activeTab: 'overview'
            },
            setReasoningState: (updates) => set((state) => ({
                reasoningState: { ...state.reasoningState, ...updates }
            })),

            // ==========================================
            // INVENTORY PAGE STATE
            // ==========================================
            inventoryState: {
                vendors: [],
                selectedVendorIds: [],
                showAddVendor: false,
                purchaseOrder: null,
                trackingStep: null,
                finalVendor: null,
                isInitialized: false
            },
            setInventoryState: (updates) => set((state) => ({
                inventoryState: { ...state.inventoryState, ...updates }
            })),

            // ==========================================
            // SALES PAGE STATE
            // ==========================================
            salesState: {
                dailySales: null,
                salesHistory: null,
                datasets: [],
                activeTab: 'today',
                categoryFilter: '',
                selectedDate: null,
                formData: {
                    product_name: '',
                    category: '',
                    quantity_sold: 1,
                    unit_price: 0
                }
            },
            setSalesState: (updates) => set((state) => ({
                salesState: { ...state.salesState, ...updates }
            })),
        }),
        {
            name: 'inferx-inventory',
            partialize: (state) => ({
                orderSuggestions: state.orderSuggestions,
                stockAnalysis: state.stockAnalysis,
                expiryAnalysis: state.expiryAnalysis,
                trendsAnalysis: state.trendsAnalysis,
                fullReport: state.fullReport,
                lastUpdated: state.lastUpdated,
                reasoningState: state.reasoningState,
                inventoryState: state.inventoryState,
                salesState: state.salesState
            })
        }
    )
)
