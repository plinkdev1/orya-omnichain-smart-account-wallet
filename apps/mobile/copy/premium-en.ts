/**
 * Mobile Copy Dictionary (English - Premium Tier)
 * Mobile-optimized microcopy with concise labels for smaller screens
 * Premium tier includes additional messaging for wealth management features
 */

import { copyMobileEN } from "./en";

/**
 * Premium copy extends standard copy with additional messaging
 * Overrides and additions for premium features only
 */
export const copyMobilePremiumEN = {
  ...copyMobileEN,

  // Enhanced premium atrium
  atrium: {
    ...copyMobileEN.atrium,

    assetsManagement: "Smart Assets",
    defiMonitoring: "DeFi Pro",
    yieldOptimization: "AI Yield",
    riskAssessment: "AI Risk",
    taxPlanning: "Tax Save",
    reporting: "Pro Reports",
    benchmarking: "AI Bench",
    goalTracking: "Goal Plan",
    scenarioPlanning: "Scenarios",
    advisory: "Advisor+",

    ai: {
      insights: "AI Tips",
      recommendation: "AI Suggest",
      riskAnalysis: "AI Risk",
      taxOpportunity: "Tax Save AI",
    },

    yield: {
      ...copyMobileEN.atrium.yield,
      strategies: "Premium",
      recommended: "AI Pick",
      compounding: "Auto Compound",
    },

    risk: {
      ...copyMobileEN.atrium.risk,
      score: "AI Score",
      recommendations: "AI Tips",
    },

    advisory: {
      ...copyMobileEN.atrium.advisory,
      connect: "Advisor",
      schedule: "Book",
      chat: "Priority",
      call: "Premium",
      email: "Priority",
    },
  },

  // Premium features section
  premiumFeatures: {
    premiumHeader: "Premium",
    unlockPremium: "Upgrade",
    premiumDescription: "Advanced + AI insights + Support",

    premiumAlerts: "Smart Alerts",
    multiAlerts: "Unlimited",
    customNotifications: "Custom",

    premiumReports: "Pro Reports",
    taxReports: "Tax Ready",
    detailedAnalytics: "Deep Analytics",
    exportFormats: "Export All",

    premiumInsights: "AI Analytics",
    aiAnalyzer: "AI Analyzer",
    predictiveAnalytics: "Predict",
    riskOptimization: "AI Risk",

    premiumSecurity: "Protected",
    advancedMonitoring: "24/7 Watch",
    fraudDetection: "Fraud Check",
    prioritySupport: "Priority",

    premiumPerformance: "Benchmark+",
    benchmarkComparison: "AI Compare",
    indexTracking: "Multi-Index",
    performanceAnalysis: "Deep",
  },
};

export type CopyKeyMobilePremium = keyof typeof copyMobilePremiumEN;
