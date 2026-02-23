# Action Pathways Implementation Plan

## Overview
Build the complete Action Pathways feature set from scratch for Mindmaker for Leaders.

## Phase 1: Database Infrastructure
1. Create migration: `leader_missions` table
2. Create migration: `leader_progress_snapshots` table
3. Create migration: `leader_check_ins` table
4. Apply all migrations via Supabase CLI

## Phase 2: Types & Utilities
5. Add TypeScript types for missions, progress, check-ins
6. Create `useMissions` hook for mission CRUD
7. Create `useProgress` hook for progress data
8. Create `useCheckIns` hook for check-in data

## Phase 3: Core Components
9. Build `FirstMoveSelector.tsx` - modal for post-assessment mission selection
10. Build `MissionsDashboard.tsx` - active mission card + momentum
11. Build `ProgressChart.tsx` - Recharts dimension line chart

## Phase 4: Pages
12. Build `MissionCheckIn.tsx` page - email-linked check-in flow
13. Build `MissionHistory.tsx` page - completed missions list
14. Build `Progress.tsx` page - progress chart wrapper
15. Build `Booking.tsx` page - Calendly integration
16. Enhance `WeeklyCheckin.tsx` - add text input + AI response cards

## Phase 5: Integration
17. Add routes to `router.tsx`
18. Integrate FirstMoveSelector into SingleScrollResults
19. Add MissionsDashboard to Mobile/Desktop dashboards
20. Update navigation (BottomNav + Sidebar)
21. Update DashboardProvider with missions data

## Phase 6: Edge Functions
22. Build `send-mission-check-in` edge function
23. Build `generate-progress-snapshot` edge function

## Phase 7: Skipped Features
24. Adaptive Prompt Evolution
25. Peer Benchmarking enhancements
26. Voice Recording for check-ins

## Phase 8: Testing & Polish
27. Run build, fix TypeScript errors
28. Test all routes in browser
29. Commit and push
