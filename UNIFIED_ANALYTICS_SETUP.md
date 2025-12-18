# Unified Analytics Dashboard Setup

## Overview

A unified analytics system has been created to aggregate data from Supabase, Stripe, Resend, and Google Sheets into a single dashboard.

## Components

### 1. Analytics Utilities (`src/utils/analytics.ts`)

Provides functions to aggregate data from multiple sources:

- `getAnalyticsSummary()` - Comprehensive metrics summary
- `getTimeSeriesData()` - Time-series data for charts
- `getTopEmailCampaigns()` - Top performing email campaigns
- `getConversionFunnel()` - Conversion funnel metrics

### 2. Analytics Dashboard (`src/components/analytics/AnalyticsDashboard.tsx`)

React component displaying:

- Key metrics (Users, Assessments, Revenue, Email Open Rate)
- Conversion metrics
- Email performance
- Engagement metrics
- Time range selector (7d, 30d, 90d)

## Metrics Tracked

### User Metrics
- Total users
- Active users
- New users

### Assessment Metrics
- Total assessments
- Completed assessments
- Paid assessments

### Revenue Metrics
- Total revenue
- Average revenue per assessment
- Conversion rate

### Email Metrics
- Emails sent
- Emails opened
- Emails clicked
- Open rate
- Click rate

### Engagement Metrics
- Average session duration
- Average messages per session

## Usage

### In a Component

```typescript
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

function AdminPage() {
  return <AnalyticsDashboard />;
}
```

### Programmatic Access

```typescript
import { getAnalyticsSummary } from '@/utils/analytics';

const summary = await getAnalyticsSummary(
  '2025-01-01T00:00:00Z',
  '2025-01-31T23:59:59Z'
);

console.log('Total revenue:', summary.totalRevenue);
console.log('Conversion rate:', summary.conversionRate);
```

## Data Sources

1. **Supabase Database**:
   - `leaders` - User data
   - `leader_assessments` - Assessment data
   - `conversation_sessions` - Session data
   - `conversion_analytics` - Revenue data
   - `email_analytics` - Email metrics

2. **Stripe** (via `conversion_analytics`):
   - Payment data
   - Revenue tracking

3. **Resend** (via `email_analytics`):
   - Email sent/delivered/opened/clicked events

4. **Google Sheets** (future):
   - Lead data
   - Booking data

## Performance Considerations

- Analytics queries can be slow on large datasets
- Consider adding database indexes on frequently queried columns
- For production, implement:
  - Materialized views for common aggregations
  - Scheduled jobs to pre-calculate metrics
  - Caching for dashboard data

## Future Enhancements

- [ ] Add charts/graphs using Recharts
- [ ] Export to CSV/PDF
- [ ] Real-time updates with Supabase Realtime
- [ ] Custom date range picker
- [ ] Drill-down into specific metrics
- [ ] Comparison with previous periods
- [ ] Goal tracking and alerts

