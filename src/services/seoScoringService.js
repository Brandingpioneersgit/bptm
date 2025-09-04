/**
 * SEO Scoring Service
 * Implements the comprehensive SEO scoring logic as per product specifications
 * Total Score: 100 points distributed across 5 components
 */

import { supabase } from '@/shared/lib/supabase';

class SEOScoringService {
  constructor() {
    this.config = null;
  }

  /**
   * Load SEO configuration from database
   */
  async loadConfig() {
    if (this.config) return this.config;

    const { data, error } = await supabase
      .from('seo_config')
      .select('config_key, config_value');

    if (error) throw new Error(`Failed to load SEO config: ${error.message}`);

    this.config = {};
    data.forEach(item => {
      this.config[item.config_key] = item.config_value;
    });

    return this.config;
  }

  /**
   * Calculate complete SEO month score (0-100)
   * @param {Object} entry - SEO monthly entry data
   * @param {Object} client - Client information
   * @param {Array} previousEntries - Previous entries for penalty calculations
   * @returns {Object} Detailed scoring breakdown
   */
  async calculateMonthScore(entry, client, previousEntries = []) {
    await this.loadConfig();

    const scoring = {
      trafficImpact: this.calculateTrafficImpact(entry),
      rankings: this.calculateRankings(entry, client),
      technicalHealth: this.calculateTechnicalHealth(entry),
      deliveryScope: this.calculateDeliveryScope(entry, client),
      relationshipQuality: this.calculateRelationshipQuality(entry)
    };

    // Calculate base score
    let totalScore = 
      scoring.trafficImpact.points +
      scoring.rankings.points +
      scoring.technicalHealth.points +
      scoring.deliveryScope.points +
      scoring.relationshipQuality.points;

    // Apply penalties
    const penalties = this.calculatePenalties(entry, client, previousEntries);
    totalScore = Math.max(0, totalScore - penalties.total);

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: scoring,
      penalties,
      maxScore: 100
    };
  }

  /**
   * A. Traffic Impact - 35 points
   * A1. Organic Growth % (0-20) + A2. Total Traffic Growth % (0-15)
   */
  calculateTrafficImpact(entry) {
    const organicGrowth = this.calculateGrowthPercentage(
      entry.gsc_organic_prev_30d,
      entry.gsc_organic_curr_30d
    );

    const totalTrafficGrowth = this.calculateGrowthPercentage(
      entry.ga_total_prev_30d,
      entry.ga_total_curr_30d
    );

    const organicPoints = this.mapGrowthToPoints(organicGrowth, {
      30: 20, 15: 16, 5: 12, 0: 8, [-10]: 4, [-Infinity]: 0
    });

    const trafficPoints = this.mapGrowthToPoints(totalTrafficGrowth, {
      30: 15, 15: 12, 5: 9, 0: 6, [-10]: 3, [-Infinity]: 0
    });

    return {
      points: organicPoints + trafficPoints,
      maxPoints: 35,
      details: {
        organicGrowth: { percentage: organicGrowth, points: organicPoints },
        totalTrafficGrowth: { percentage: totalTrafficGrowth, points: trafficPoints }
      }
    };
  }

  /**
   * B. Rankings - 20 points
   * B1. SERP: Top3 + Top10 (0-12) + B2. GMB Top3 (0-8)
   */
  calculateRankings(entry, client) {
    const targets = this.config.ranking_targets[client.type];
    
    // SERP Score calculation
    const serpScore = (entry.serp_top3_count * 1.5 + entry.serp_top10_count * 0.5) / targets.serp_target * 12;
    const serpPoints = Math.min(12, Math.max(0, serpScore));

    // GMB Score calculation
    const gmb_score = entry.gmb_top3_count / targets.gmb_target * 8;
    const gmb_points = Math.min(8, Math.max(0, gmb_score));

    return {
      points: serpPoints + gmb_points,
      maxPoints: 20,
      details: {
        serp: { 
          top3: entry.serp_top3_count, 
          top10: entry.serp_top10_count, 
          points: serpPoints,
          target: targets.serp_target
        },
        gmb: { 
          top3: entry.gmb_top3_count, 
          points: gmb_points,
          target: targets.gmb_target
        }
      }
    };
  }

  /**
   * C. Technical Health - 20 points
   * C1. PageSpeed (0-10) + C2. Search Console Errors (0-10)
   */
  calculateTechnicalHealth(entry) {
    // PageSpeed average
    const avgPageSpeed = (entry.pagespeed_home + entry.pagespeed_service + entry.pagespeed_location) / 3;
    const pageSpeedPoints = this.mapPageSpeedToPoints(avgPageSpeed);

    // Search Console Errors
    const totalErrors = entry.sc_errors_home + entry.sc_errors_service + entry.sc_errors_location;
    const errorPoints = this.mapErrorsToPoints(totalErrors);

    return {
      points: pageSpeedPoints + errorPoints,
      maxPoints: 20,
      details: {
        pageSpeed: { 
          average: Math.round(avgPageSpeed), 
          points: pageSpeedPoints,
          breakdown: {
            home: entry.pagespeed_home,
            service: entry.pagespeed_service,
            location: entry.pagespeed_location
          }
        },
        errors: { 
          total: totalErrors, 
          points: errorPoints,
          breakdown: {
            home: entry.sc_errors_home,
            service: entry.sc_errors_service,
            location: entry.sc_errors_location
          }
        }
      }
    };
  }

  /**
   * D. Delivery vs Scope - 15 points
   * Based on client type and delivery targets
   */
  calculateDeliveryScope(entry, client) {
    const targets = this.config.delivery_targets[client.type];
    const deliverables = {
      blogs: entry.deliverables_blogs,
      backlinks: entry.deliverables_backlinks,
      onpage: entry.deliverables_onpage,
      techfixes: entry.deliverables_techfixes
    };

    const streamPoints = 15 / 4; // Equal share for each stream
    let totalPoints = 0;
    const details = {};

    Object.keys(targets).forEach(stream => {
      const achieved = deliverables[stream] || 0;
      const target = targets[stream];
      const percentage = (achieved / target) * 100;
      
      let multiplier = 0;
      if (percentage >= 100) multiplier = 1;
      else if (percentage >= 75) multiplier = 0.75;
      else if (percentage >= 50) multiplier = 0.5;
      else multiplier = 0;

      const points = streamPoints * multiplier;
      totalPoints += points;

      details[stream] = {
        achieved,
        target,
        percentage: Math.round(percentage),
        points: Math.round(points * 100) / 100
      };
    });

    return {
      points: Math.round(totalPoints * 100) / 100,
      maxPoints: 15,
      details
    };
  }

  /**
   * E. Relationship & Quality - 10 points
   * E1. NPS (0-6) + E2. Interactions & Meeting (0-2) + E3. Mentor Score (0-2)
   */
  calculateRelationshipQuality(entry) {
    // NPS Score (1-10 scale to 0-6 points)
    const npsPoints = entry.nps_client ? (entry.nps_client / 10) * 6 : 0;

    // Interactions & Meeting hygiene
    const hasMonthlyMeeting = entry.client_meeting_date ? 1 : 0;
    const hasEnoughInteractions = (entry.interactions_count || 0) >= 4 ? 1 : 0;
    const interactionPoints = hasMonthlyMeeting && hasEnoughInteractions ? 2 : 
                             (hasMonthlyMeeting || hasEnoughInteractions) ? 1.5 : 0;

    // Mentor Score (1-10 scale to 0-2 points)
    const mentorPoints = entry.mentor_score ? (entry.mentor_score / 10) * 2 : 0;

    return {
      points: npsPoints + interactionPoints + mentorPoints,
      maxPoints: 10,
      details: {
        nps: { score: entry.nps_client, points: Math.round(npsPoints * 100) / 100 },
        interactions: { 
          count: entry.interactions_count, 
          hasMeeting: hasMonthlyMeeting,
          points: interactionPoints 
        },
        mentor: { score: entry.mentor_score, points: Math.round(mentorPoints * 100) / 100 }
      }
    };
  }

  /**
   * Calculate penalties based on guardrails
   */
  calculatePenalties(entry, client, previousEntries) {
    const penalties = [];
    let total = 0;

    // Two consecutive negative organic growth months: -5 penalty
    if (previousEntries.length >= 1) {
      const currentGrowth = this.calculateGrowthPercentage(
        entry.gsc_organic_prev_30d,
        entry.gsc_organic_curr_30d
      );
      const lastGrowth = this.calculateGrowthPercentage(
        previousEntries[0].gsc_organic_prev_30d,
        previousEntries[0].gsc_organic_curr_30d
      );

      if (currentGrowth < 0 && lastGrowth < 0) {
        penalties.push({ type: 'consecutive_negative_growth', points: 5 });
        total += 5;
      }
    }

    // Missing mandatory deliverables for scope: -5
    const targets = this.config.delivery_targets[client.type];
    const hasMinimumDeliverables = Object.keys(targets).some(stream => {
      const achieved = entry[`deliverables_${stream}`] || 0;
      return achieved > 0;
    });

    if (!hasMinimumDeliverables) {
      penalties.push({ type: 'missing_mandatory_deliverables', points: 5 });
      total += 5;
    }

    return { penalties, total };
  }

  /**
   * Helper method to calculate growth percentage
   */
  calculateGrowthPercentage(prev, curr) {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  /**
   * Map growth percentage to points based on thresholds
   */
  mapGrowthToPoints(growth, thresholds) {
    const sortedThresholds = Object.keys(thresholds)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of sortedThresholds) {
      if (growth >= threshold) {
        return thresholds[threshold];
      }
    }
    return 0;
  }

  /**
   * Map PageSpeed score to points
   */
  mapPageSpeedToPoints(speed) {
    if (speed >= 90) return 10;
    if (speed >= 80) return 8;
    if (speed >= 70) return 6;
    if (speed >= 60) return 4;
    return 2;
  }

  /**
   * Map error count to points
   */
  mapErrorsToPoints(errors) {
    if (errors === 0) return 10;
    if (errors <= 5) return 8;
    if (errors <= 15) return 5;
    if (errors <= 40) return 2;
    return 0;
  }

  /**
   * Calculate employee month score (weighted average across clients)
   */
  async calculateEmployeeMonthScore(employeeId, month) {
    const { data: entries, error } = await supabase
      .from('seo_monthly_entries')
      .select(`
        *,
        clients!inner(*)
      `)
      .eq('employee_id', employeeId)
      .eq('month', month)
      .eq('status', 'approved');

    if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
    if (!entries.length) return null;

    await this.loadConfig();
    const clientWeights = this.config.client_weights;

    let weightedSum = 0;
    let totalWeight = 0;

    entries.forEach(entry => {
      const weight = clientWeights[entry.clients.type] || 1;
      weightedSum += entry.month_score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate appraisal period score
   */
  async calculateAppraisalScore(employeeId, periodStart, periodEnd) {
    const { data: entries, error } = await supabase
      .from('seo_monthly_entries')
      .select('month_score')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('month', periodStart)
      .lte('month', periodEnd);

    if (error) throw new Error(`Failed to fetch appraisal entries: ${error.message}`);
    if (!entries.length) return null;

    const avgScore = entries.reduce((sum, entry) => sum + entry.month_score, 0) / entries.length;
    
    // Determine rating band
    await this.loadConfig();
    const bands = this.config.appraisal_bands;
    
    let ratingBand = 'D';
    let incrementPct = 0;

    ['A', 'B', 'C', 'D'].forEach(band => {
      if (avgScore >= bands[band].min_score) {
        ratingBand = band;
        incrementPct = bands[band].increment_pct;
      }
    });

    return {
      avgScore: Math.round(avgScore * 100) / 100,
      ratingBand,
      incrementPct,
      entryCount: entries.length
    };
  }
}

export default new SEOScoringService();