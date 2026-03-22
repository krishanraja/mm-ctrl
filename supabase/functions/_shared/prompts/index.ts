/**
 * Centralized Prompt Registry
 *
 * All system prompts used across edge functions are exported from here.
 * This makes prompt iteration fast — change one file, affect all functions.
 *
 * Usage:
 *   import { COGNITIVE_FRAMEWORKS_ANCHOR } from "../_shared/prompts/index.ts";
 *   import { WEEKLY_CHECKIN_SYSTEM_PROMPT } from "../_shared/prompts/index.ts";
 */

export { COGNITIVE_FRAMEWORKS_ANCHOR } from "./cognitive-frameworks.ts";
export { WEEKLY_CHECKIN_SYSTEM_PROMPT } from "./weekly-checkin.ts";
