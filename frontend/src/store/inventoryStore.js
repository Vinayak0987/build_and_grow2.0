import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useInventoryStore = create(
    persist(
        (set, get) => ({
            // Order suggestions/action items from AI Reasoning
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
            }
        }),
        {
            name: 'inferx-inventory',
            partialize: (state) => ({
                orderSuggestions: state.orderSuggestions,
                stockAnalysis: state.stockAnalysis,
                expiryAnalysis: state.expiryAnalysis,
                trendsAnalysis: state.trendsAnalysis,
                fullReport: state.fullReport,
                lastUpdated: state.lastUpdated
            })
        }
    )
)
