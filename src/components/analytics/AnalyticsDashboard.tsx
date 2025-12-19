/**
 * Unified Analytics Dashboard
 * 
 * Displays comprehensive metrics from Supabase, Stripe, Resend, and Google Sheets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAnalyticsSummary, getTimeSeriesData, getConversionFunnel, type AnalyticsSummary } from '@/utils/analytics';
import { TrendingUp, Users, FileText, DollarSign, Mail, MousePointerClick, Clock, MessageSquare } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const data = await getAnalyticsSummary(startDate);
      setSummary(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded ${timeRange === '7d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded ${timeRange === '30d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-4 py-2 rounded ${timeRange === '90d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={summary.totalUsers}
          icon={Users}
          change={`${summary.newUsers} new`}
        />
        <MetricCard
          title="Assessments"
          value={summary.totalAssessments}
          icon={FileText}
          change={`${summary.completedAssessments} completed`}
        />
        <MetricCard
          title="Revenue"
          value={`$${summary.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          change={`${summary.conversionRate.toFixed(1)}% conversion`}
        />
        <MetricCard
          title="Email Open Rate"
          value={`${summary.openRate.toFixed(1)}%`}
          icon={Mail}
          change={`${summary.emailsOpened} opened`}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversion Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Assessments</span>
              <span className="font-semibold">{summary.paidAssessments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold">{summary.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Revenue/Assessment</span>
              <span className="font-semibold">${summary.averageRevenuePerAssessment.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emails Sent</span>
              <span className="font-semibold">{summary.emailsSent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Rate</span>
              <span className="font-semibold">{summary.openRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Click Rate</span>
              <span className="font-semibold">{summary.clickRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clicks</span>
              <span className="font-semibold">{summary.emailsClicked}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Users</span>
              <span className="font-semibold">{summary.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Session Duration</span>
              <span className="font-semibold">{summary.averageSessionDuration.toFixed(1)} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Messages/Session</span>
              <span className="font-semibold">{summary.averageMessagesPerSession.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Range Info */}
      <div className="text-sm text-muted-foreground text-center">
        Data from {new Date(summary.startDate).toLocaleDateString()} to {new Date(summary.endDate).toLocaleDateString()}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, change }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        )}
      </CardContent>
    </Card>
  );
};


