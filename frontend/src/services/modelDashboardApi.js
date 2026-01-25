/**
 * Model Dashboard API Service
 * Handles all API calls for model dashboard features
 */
import api from './api'

export const modelDashboardApi = {
    // Get model overview with all metrics
    getOverview: (modelId) => api.get(`/models/${modelId}/dashboard/overview`),

    // Get training data for data explorer
    getTrainingData: (modelId, params = {}) =>
        api.get(`/models/${modelId}/dashboard/data`, { params }),

    // Get data statistics (column stats, correlations)
    getDataStats: (modelId) => api.get(`/models/${modelId}/dashboard/data/stats`),

    // Get model analytics (confusion matrix, ROC, feature importance)
    getAnalytics: (modelId) => api.get(`/models/${modelId}/dashboard/analytics`),

    // Get feature importance
    getFeatureImportance: (modelId) =>
        api.get(`/models/${modelId}/dashboard/analytics/feature-importance`),

    // Get model comparison (all trained algorithms)
    getModelComparison: (modelId) =>
        api.get(`/models/${modelId}/dashboard/analytics/comparison`),

    // Get global SHAP values
    getGlobalShap: (modelId) => api.get(`/models/${modelId}/dashboard/shap/global`),

    // Get local SHAP explanation for specific input
    getLocalShap: (modelId, input) =>
        api.post(`/models/${modelId}/dashboard/shap/local`, { input }),

    // Get UI schema for prediction form
    getSchema: (modelId) => api.get(`/models/${modelId}/schema`),

    // Make prediction
    predict: (modelId, input) => api.post(`/predict/${modelId}`, { input }),

    // Get prediction with explanation
    predictWithExplanation: (modelId, input) =>
        api.post(`/predict/${modelId}/explain`, { input }),

    // Download model package
    downloadPackage: (modelId) =>
        api.get(`/models/${modelId}/download`, { responseType: 'blob' })
}

export default modelDashboardApi
