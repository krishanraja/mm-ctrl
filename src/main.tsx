import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/ui/theme-provider'
import ErrorBoundary from '@/components/ErrorBoundary'

// Import test utility for browser console access
// Usage: window.testEmailDelivery() in browser console
import '@/utils/testEmailDelivery'

// SECURITY: Migrate any URL-based assessment IDs to localStorage
// This is a one-time cleanup to prevent assessment ID exposure in URLs
import { migrateUrlAssessmentId } from '@/utils/assessmentPersistence'
migrateUrlAssessmentId()

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light" storageKey="mindmaker-theme">
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);
