#!/usr/bin/env node

/**
 * Build-time validation script for video backgrounds
 * 
 * Checks for architectural issues that block video backgrounds:
 * - bg-background on App.tsx root component
 * - Incorrect z-index values
 * - Missing overlay elements
 * 
 * Run this script in CI/CD pipeline before deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let hasErrors = false;

console.log('🔍 Validating video background architecture...\n');

// Check App.tsx for bg-background on root
const appTsxPath = path.join(__dirname, '../src/App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appTsx = fs.readFileSync(appTsxPath, 'utf8');
  
  // Check for bg-background on root div
  const rootDivRegex = /<div\s+className=["']min-h-screen\s+bg-background["']/;
  if (rootDivRegex.test(appTsx)) {
    console.error('❌ ERROR: App.tsx root has bg-background. This blocks video backgrounds.');
    console.error('   Fix: Remove bg-background from root div in App.tsx');
    console.error('   Location: src/App.tsx');
    hasErrors = true;
  } else {
    console.log('✅ App.tsx root does not have bg-background');
  }
} else {
  console.warn('⚠️  WARNING: App.tsx not found');
}

// Check HeroSection for correct video background pattern
const heroSectionPath = path.join(__dirname, '../src/components/HeroSection.tsx');
if (fs.existsSync(heroSectionPath)) {
  const heroSection = fs.readFileSync(heroSectionPath, 'utf8');
  
  // Check for bg-background on parent container
  const parentBgRegex = /<div\s+className=["'][^"']*bg-background[^"']*min-h-\[100dvh\][^"']*["']/;
  if (parentBgRegex.test(heroSection)) {
    console.error('❌ ERROR: HeroSection parent has bg-background. This blocks video.');
    console.error('   Fix: Remove bg-background from parent div in HeroSection.tsx');
    hasErrors = true;
  } else {
    console.log('✅ HeroSection parent does not have bg-background');
  }
  
  // Check for correct video z-index
  if (!heroSection.includes('opacity-100') || !heroSection.includes('-z-20')) {
    console.error('❌ ERROR: HeroSection video must have opacity-100 and -z-20');
    console.error('   Fix: Add opacity-100 -z-20 to video className');
    hasErrors = true;
  } else {
    console.log('✅ HeroSection video has correct opacity and z-index');
  }
  
  // Check for overlay element
  if (!heroSection.includes('bg-black/50') || !heroSection.includes('-z-10')) {
    console.error('❌ ERROR: HeroSection missing overlay with bg-black/50 and -z-10');
    console.error('   Fix: Add overlay div with className="fixed inset-0 bg-black/50 -z-10 pointer-events-none"');
    hasErrors = true;
  } else {
    console.log('✅ HeroSection has correct overlay element');
  }
} else {
  console.warn('⚠️  WARNING: HeroSection.tsx not found');
}

console.log('');

if (hasErrors) {
  console.error('❌ Video background validation FAILED');
  console.error('   Please fix the errors above before deploying.');
  process.exit(1);
} else {
  console.log('✅ Video background validation PASSED');
  process.exit(0);
}
