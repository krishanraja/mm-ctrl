/**
 * Main Entry Point
 * 
 * Application entry point with React 18 root.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { errorTracker } from '@/lib/errorTracking';

// Install global error handlers for uncaught errors and unhandled promise rejections
errorTracker.install();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
