/**
 * Unified Analytics Utilities
 * 
 * Aggregates data from Supabase, Stripe, Resend, and Google Sheets
 * for comprehensive business intelligence
 */

import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsSummary {
  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  
  // Assessment metrics
  totalAssessments: number;
  completedAssessments: number;
  paidAssessments: number;
  
  // Revenue metrics
  totalRevenue: number;
  averageRevenuePerAssessment: number;
  conversionRate: number;
  
  // Email metrics
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
  
  // Engagement metrics
  averageSessionDuration: number;
  averageMessagesPerSession: number;
  
  // Time range
  startDate: string;
  endDate: string;
}

export interface TimeSeriesData {
  date: string;
  assessments: number;
  revenue: number;
  emailsSent: number;
  emailsOpened: number;
  users: number;
}

/**
 * Get comprehensive analytics summary
 */
export async function getAnalyticsSummary(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsSummary> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  // Get user metrics
  const { data: users, count: totalUsers } = await supabase
    .from('leaders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lte('created_at', end);

  const { count: activeUsers } = await supabase
    .from('conversation_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', start)
    .lte('started_at', end);

  // Get assessment metrics
  const { data: assessments, count: totalAssessments } = await supabase
    .from('leader_assessments')
    .select('*', { count: 'exact' })
    .gte('created_at', start)
    .lte('created_at', end);

  const completedAssessments = assessments?.filter(a => 
    a.generation_status && 
    (a.generation_status as any).insights_generated
  ).length || 0;

  const paidAssessments = assessments?.filter(a => a.has_full_diagnostic).length || 0;

  // Get revenue metrics (from conversion_analytics)
  const { data: conversions } = await supabase
    .from('conversion_analytics')
    .select('conversion_value')
    .eq('conversion_type', 'consultation_scheduled')
    .gte('created_at', start)
    .lte('created_at', end);

  const totalRevenue = conversions?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
  const averageRevenuePerAssessment = paidAssessments > 0 ? totalRevenue / paidAssessments : 0;
  const conversionRate = totalAssessments > 0 ? (paidAssessments / totalAssessments) * 100 : 0;

  // Get email metrics
  const { data: emailStats } = await supabase.rpc('get_email_statistics', {
    p_email_type: null,
    p_start_date: start,
    p_end_date: end,
  });

  const emailData = emailStats?.[0] || {};
  const emailsSent = emailData.total_sent || 0;
  const emailsOpened = emailData.total_opened || 0;
  const emailsClicked = emailData.total_clicked || 0;
  const openRate = emailData.open_rate || 0;
  const clickRate = emailData.click_rate || 0;

  // Get engagement metrics
  const { data: sessions } = await supabase
    .from('conversation_sessions')
    .select('business_context, started_at, completed_at')
    .gte('started_at', start)
    .lte('started_at', end)
    .limit(100);

  const durations = sessions
    ?.map(s => {
      const start = new Date(s.started_at).getTime();
      const end = s.completed_at ? new Date(s.completed_at).getTime() : Date.now();
      return (end - start) / 1000 / 60; // minutes
    })
    .filter(d => d > 0) || [];

  const averageSessionDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const messageCounts = sessions
    ?.map(s => (s.business_context as any)?.message_count || 0)
    .filter(c => c > 0) || [];

  const averageMessagesPerSession = messageCounts.length > 0
    ? messageCounts.reduce((a, b) => a + b, 0) / messageCounts.length
    : 0;

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    newUsers: totalUsers || 0,
    totalAssessments: totalAssessments || 0,
    completedAssessments,
    paidAssessments,
    totalRevenue,
    averageRevenuePerAssessment,
    conversionRate,
    emailsSent,
    emailsOpened,
    emailsClicked,
    openRate,
    clickRate,
    averageSessionDuration,
    averageMessagesPerSession,
    startDate: start,
    endDate: end,
  };
}

/**
 * Get time series data for charts
 */
export async function getTimeSeriesData(
  startDate?: string,
  endDate?: string,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesData[]> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  // This is a simplified version - in production, use database functions for better performance
  const { data: assessments } = await supabase
    .from('leader_assessments')
    .select('created_at, has_full_diagnostic')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true });

  const { data: conversions } = await supabase
    .from('conversion_analytics')
    .select('created_at, conversion_value')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true });

  const { data: emails } = await supabase
    .from('email_analytics')
    .select('event_timestamp, event_type')
    .gte('event_timestamp', start)
    .lte('event_timestamp', end)
    .order('event_timestamp', { ascending: true });

  // Group by date (simplified - use database aggregation for production)
  const dateMap = new Map<string, TimeSeriesData>();

  assessments?.forEach(a => {
    const date = new Date(a.created_at).toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        assessments: 0,
        revenue: 0,
        emailsSent: 0,
        emailsOpened: 0,
        users: 0,
      });
    }
    const entry = dateMap.get(date)!;
    entry.assessments++;
  });

  conversions?.forEach(c => {
    const date = new Date(c.created_at).toISOString().split('T')[0];
    if (dateMap.has(date)) {
      dateMap.get(date)!.revenue += c.conversion_value || 0;
    }
  });

  emails?.forEach(e => {
    const date = new Date(e.event_timestamp).toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        assessments: 0,
        revenue: 0,
        emailsSent: 0,
        emailsOpened: 0,
        users: 0,
      });
    }
    const entry = dateMap.get(date)!;
    if (e.event_type === 'sent') entry.emailsSent++;
    if (e.event_type === 'opened') entry.emailsOpened++;
  });

  return Array.from(dateMap.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

/**
 * Get top performing email campaigns
 */
export async function getTopEmailCampaigns(limit: number = 10) {
  const { data } = await supabase.rpc('get_email_statistics');
  
  return data?.slice(0, limit) || [];
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel() {
  const { data: sessions } = await supabase
    .from('conversation_sessions')
    .select('id, status')
    .limit(1000);

  const { data: assessments } = await supabase
    .from('leader_assessments')
    .select('id, has_full_diagnostic')
    .limit(1000);

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status')
    .limit(1000);

  return {
    sessions: sessions?.length || 0,
    assessments: assessments?.length || 0,
    paidAssessments: assessments?.filter(a => a.has_full_diagnostic).length || 0,
    bookings: bookings?.length || 0,
    completedBookings: bookings?.filter(b => b.status === 'completed').length || 0,
  };
}


