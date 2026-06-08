/**
 * Web Copy Dictionary (English - Premium Tier)
 * Premium tier includes additional messaging for wealth management features
 */

import { copyEN } from "./en";

/**
 * Premium copy extends standard copy with additional messaging
 * Overrides and additions for premium features only
 */
export const copyPremiumEN = {
  ...copyEN,

  // Override or extend specific sections
  atrium: {
    ...copyEN.atrium,

    // Enhanced copy for premium exclusive features
    assetsManagement: "Advanced Assets Management",
    yieldOptimization: "AI-Powered Yield Optimization",
    riskAssessment: "Advanced Risk Assessment",
    taxPlanning: "Tax Planning & Optimization",
    reporting: "Professional Reporting Suite",
    benchmarking: "Benchmark Analytics",
    goalTracking: "Financial Goal Planning",
    scenarioPlanning: "Advanced Scenario Modeling",
    advisory: "Personal Financial Advisory",

    ai: {
      insights: "AI-Powered Insights",
      recommendation: "Personalized AI Recommendation",
      riskAnalysis: "Advanced Risk Analysis",
      taxOpportunity: "AI-Detected Tax Saving Opportunity",
    },

    assets: {
      ...copyEN.atrium.assets,
      reorder: "Reorder & Prioritize Assets",
    },

    yield: {
      ...copyEN.atrium.yield,
      strategies: "Premium Yield Strategies",
      recommended: "AI-Recommended Strategies",
      compounding: "Automated Compounding & Reinvestment",
    },

    risk: {
      ...copyEN.atrium.risk,
      score: "AI-Calculated Risk Score",
      recommendations: "Expert Recommendations",
    },

    tax: {
      ...copyEN.atrium.tax,
      harvestingOpportunity: "AI-Detected Tax-Loss Harvesting Opportunity",
      taxReport: "Generate Professional Tax Report",
    },

    rebalance: {
      ...copyEN.atrium.rebalance,
      strategy: "AI-Optimized Rebalancing Strategy",
      execute: "Execute AI-Recommended Rebalancing",
    },

    advisory: {
      ...copyEN.atrium.advisory,
      connect: "Connect with Our Financial Advisor",
      schedule: "Schedule Private Advisory Call",
      chat: "Chat with Financial Advisor (Priority)",
      call: "Schedule Premium Video Call",
      email: "Priority Email Support",
    },
  },

  // Additional premium features
  premiumFeatures: {
    // Premium-only messaging
    premiumHeader: "Premium Features",
    unlockPremium: "Unlock Premium Features",
    premiumDescription:
      "Get access to advanced analytics, AI insights, and personalized financial advice",

    // Premium alerts
    premiumAlerts: "Advanced Alerts",
    multiAlerts: "Create unlimited price & portfolio alerts",
    customNotifications: "Customized notification preferences",

    // Premium reports
    premiumReports: "Professional Reports",
    taxReports: "Tax-optimized reporting",
    detailedAnalytics: "Deep portfolio analytics",
    exportFormats: "Multiple export formats (PDF, Excel, CSV)",

    // Premium insights
    premiumInsights: "Advanced Analytics",
    aiAnalyzer: "AI Portfolio Analyzer",
    predictiveAnalytics: "Predictive performance modeling",
    riskOptimization: "Risk optimization recommendations",

    // Premium security
    premiumSecurity: "Enhanced Security",
    advancedMonitoring: "24/7 Portfolio Monitoring",
    fraudDetection: "Advanced Fraud Detection",
    prioritySupport: "Priority Support",

    // Premium performance
    benchmarkComparison: "Professional Benchmarking",
    indexTracking: "Track against multiple indices",
    performanceAnalysis: "Deep performance analysis",
  },
};

export type CopyKeyWebPremium = keyof typeof copyPremiumEN;