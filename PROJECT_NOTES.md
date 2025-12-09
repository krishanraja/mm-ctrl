# Project Notes

> Running decisions, context, and important notes for the Mindmaker AI Leadership Assessment project.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Supabase Project ID** | `bkyuxvschuwngtcdhsyg` |
| **Primary AI Provider** | Vertex AI (Gemini 2.0 Flash) |
| **Fallback AI Provider** | OpenAI (GPT-4o) |
| **Assessment Pipeline** | `runAssessment.ts` → `ai-generate` edge function |
| **Progress Tracking** | `useGenerationProgress.ts` (DB-driven) |

---

## Architecture Decisions

### 2024-12-09: Anti-Fragile Pipeline Redesign

**Decision:** Replace `orchestrateAssessmentV2.ts` with `runAssessment.ts`

**Rationale:**
- Single orchestrator file instead of split logic
- All DB writes in one place for consistency
- Easier to debug and maintain
- Generation status flags merged, not overwritten

**Impact:**
- Progress bar now stable (no erratic jumping)
- All tables populated correctly
- Clear error surfacing

---

### AI Generation Pipeline

**Call Graph:**
```
User clicks Submit → UnifiedAssessment.tsx → runAssessment.ts 
  → create-leader-assessment (edge function)
  → ai-generate (edge function) [Vertex AI → OpenAI → Fallback]
  → Store to tables: 
    - leader_dimension_scores
    - leader_tensions
    - leader_risk_signals
    - leader_org_scenarios
    - leader_prompt_sets
    - leader_first_moves
  → Update generation_status flags
  → useGenerationProgress polls for updates
  → UnifiedResults.tsx displays data via aggregateLeaderResults.ts
```

**Key Tables:**
| Table | Purpose |
|-------|---------|
| `leader_assessments` | Master assessment record with `generation_status` JSONB |
| `leader_dimension_scores` | AI-generated scores per dimension |
| `leader_tensions` | Strategic tensions identified |
| `leader_risk_signals` | Risk signals with levels |
| `leader_org_scenarios` | Organizational scenario recommendations |
| `leader_prompt_sets` | Personalized prompt library |
| `leader_first_moves` | Prioritized action items |
| `assessment_events` | Raw question/answer events |

---

## Known Issues & Solutions

### Issue: Progress bar jumping back and forth
**Root Cause:** Fake timer-based progress conflicting with DB-driven polling
**Solution:** Removed timer simulation, rely only on `useGenerationProgress` hook
**Status:** ✅ Fixed

### Issue: Tables not populating
**Root Cause:** `runAssessment.ts` wasn't storing data in all required tables
**Solution:** Added storage logic for `leader_dimension_scores`, `leader_prompt_sets`, `leader_first_moves`
**Status:** ✅ Fixed

### Issue: generation_status flags always false
**Root Cause:** Overwriting entire `generation_status` object instead of merging
**Solution:** Fetch current status first, then spread merge new flags
**Status:** ✅ Fixed

---

## LLM Prompt Standards

### Required Output Schema
All AI-generated responses must include:
```json
{
  "yourEdge": "string",
  "yourRisk": "string", 
  "yourNextMove": "string",
  "dimensionScores": [{ "key": "string", "score": 0-100, "label": "string", "summary": "string" }],
  "tensions": [{ "key": "string", "summary": "string" }],
  "risks": [{ "key": "enum", "level": "enum", "description": "string" }],
  "scenarios": [{ "key": "enum", "summary": "string" }],
  "prompts": [{ "category": "enum", "title": "string", "prompts": ["string"] }],
  "firstMoves": ["string", "string", "string"]
}
```

### Enum Constraints
- `risk.key`: `shadow_ai`, `skills_gap`, `roi_leakage`, `decision_friction`
- `risk.level`: `low`, `medium`, `high`
- `scenario.key`: `stagnation_loop`, `shadow_ai_instability`, `high_velocity_path`, `culture_capability_mismatch`
- `prompt.category`: `strategic_planning`, `daily_efficiency`, `team_enablement`, `stakeholder_management`

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_SERVICE_ACCOUNT_KEY` | Vertex AI authentication | Yes |
| `OPENAI_API_KEY` | OpenAI fallback | Yes |
| `SUPABASE_URL` | Database connection | Yes |
| `SUPABASE_ANON_KEY` | Public API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Yes |

---

## Testing Checklist

Before deploying changes:

- [ ] Assessment creation succeeds
- [ ] AI generation completes (check edge function logs)
- [ ] All 6 progress phases complete
- [ ] Results page shows data in all tabs
- [ ] PDF export works
- [ ] No console errors
- [ ] No erratic progress bar behavior

---

## Files to Watch

Critical files that affect the assessment pipeline:

1. `src/utils/runAssessment.ts` - Main orchestrator
2. `supabase/functions/ai-generate/index.ts` - AI content generation
3. `src/hooks/useGenerationProgress.ts` - Progress tracking
4. `src/utils/aggregateLeaderResults.ts` - Data aggregation for UI
5. `src/components/UnifiedResults.tsx` - Results display
6. `src/components/UnifiedAssessment.tsx` - Assessment form & submission

---

*Last Updated: 2024-12-09*
