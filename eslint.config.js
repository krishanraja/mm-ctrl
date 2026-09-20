import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Note: Video background architecture validation is enforced via
      // build-time script: npm run validate:video
      // This checks for bg-background on App.tsx root and verifies video background patterns
    },
  },
  {
    // These two reviewed ingress guards intentionally match ASCII control bytes.
    // The rule rejects that security pattern even though the behavior is deliberate.
    files: [
      "supabase/functions/critique-artefact/index.ts",
      "supabase/functions/generate-skill-export/index.ts",
    ],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    // This retired diagnostic mailer still accepts its original schemaless assessment payload.
    // Keep the exception isolated to this file instead of weakening typed product code.
    files: ["supabase/functions/send-diagnostic-email/index.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
