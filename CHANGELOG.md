# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `project-documentation/MASTER_INSTRUCTIONS.md` - Permanent project knowledge for AI behavior
- `CHANGELOG.md` - Change tracking for all significant updates
- `PROJECT_NOTES.md` - Running decisions and context
- `src/utils/pipelineGuards.ts` - Input validation utilities with safe defaults
- Error toast surfacing in `useGenerationProgress.ts`
- Assessment events storage in `runAssessment.ts`
- 10/10 quality checks in `ai-generate` edge function prompts

### Changed
- Updated `runAssessment.ts` to populate `assessment_events` table
- Enhanced `ai-generate` prompts with self-check quality instructions
- Updated `README.md` with project-specific documentation
- Improved `useGenerationProgress.ts` with error notifications

### Fixed
- Generation status flag merging (was overwriting, now merges)
- Progress bar erratic behavior (removed fake timer-based progress)
- Missing table population (`leader_dimension_scores`, `leader_prompt_sets`, `leader_first_moves`)

---

## [1.0.0] - 2024-12-09

### Initial Anti-Fragile Pipeline Implementation

#### Phase 1: Generation Status Flag Merging
- Fixed `runAssessment.ts` to fetch current status and merge flags
- Each successful DB insert now updates its corresponding flag
- Error log accumulates rather than overwrites

#### Phase 2: Populate Missing Tables
- Added dimension scores storage to `leader_dimension_scores`
- Added prompt sets storage to `leader_prompt_sets`
- Added first moves storage to `leader_first_moves`

#### Phase 3: AI Generate Response Structure
- Updated prompt to request comprehensive JSON response
- Added enum constraints for `risk.key`, `risk.level`, `scenario.key`, `prompt.category`
- Implemented `sanitizeEnums()` and `validateResponse()` functions
- Added retry logic with exponential backoff

#### Phase 4: Simplified Progress Tracking
- Removed fake timer-based progress from `UnifiedAssessment.tsx`
- Progress now relies solely on database-driven `useGenerationProgress` hook
- Single source of truth eliminates erratic behavior

#### Phase 5: Safety Guards
- LLM response validation before returning
- Enum sanitization to valid options
- Try/catch blocks around all DB operations
- Detailed error logging to `generation_status.error_log`

#### Phase 6: Audit & Logging
- Generation source tracking (`vertex-ai`, `openai`, `fallback`)
- Duration tracking for each generation
- Comprehensive console logging at each step

---

## Format Guide

### Types of changes
- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** for vulnerability fixes.

---

*Maintained by the development team. Update this file with every significant change.*
