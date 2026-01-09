/**
 * HeroSection Video Background Tests
 * 
 * Verifies that video background is correctly configured:
 * - Video has correct opacity (1) and z-index (-20)
 * - Overlay element exists with correct opacity and z-index
 * - Parent container does not have bg-background
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HeroSection } from '../HeroSection';
import type { User } from '@supabase/supabase-js';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock getPersistedAssessmentId
vi.mock('@/utils/assessmentPersistence', () => ({
  getPersistedAssessmentId: () => ({ assessmentId: null }),
}));

const mockProps = {
  onStartVoice: vi.fn(),
  onStartQuiz: vi.fn(),
  onSignIn: vi.fn(),
  user: null as User | null,
  onSignOut: vi.fn(),
};

describe('HeroSection Video Background', () => {
  it('video element has correct opacity and z-index', () => {
    const { container } = render(
      <BrowserRouter>
        <HeroSection {...mockProps} />
      </BrowserRouter>
    );
    
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    
    if (video) {
      const styles = window.getComputedStyle(video);
      // Check that video has opacity-100 class (will be computed as opacity: 1)
      expect(video.className).toContain('opacity-100');
      expect(video.className).toContain('-z-20');
    }
  });

  it('overlay element exists with correct classes', () => {
    const { container } = render(
      <BrowserRouter>
        <HeroSection {...mockProps} />
      </BrowserRouter>
    );
    
    // Find overlay by bg-black/50 class
    const overlay = container.querySelector('[class*="bg-black"]');
    expect(overlay).toBeInTheDocument();
    
    if (overlay) {
      expect(overlay.className).toContain('bg-black/50');
      expect(overlay.className).toContain('-z-10');
      expect(overlay.className).toContain('pointer-events-none');
    }
  });

  it('parent container does not have bg-background', () => {
    const { container } = render(
      <BrowserRouter>
        <HeroSection {...mockProps} />
      </BrowserRouter>
    );
    
    // Find the main container div (first child of rendered component)
    const parent = container.firstChild as HTMLElement;
    expect(parent).toBeInTheDocument();
    
    if (parent) {
      const classes = parent.className || '';
      expect(classes).not.toContain('bg-background');
    }
  });

  it('video element has required attributes', () => {
    const { container } = render(
      <BrowserRouter>
        <HeroSection {...mockProps} />
      </BrowserRouter>
    );
    
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    
    if (video) {
      expect(video.hasAttribute('autoPlay')).toBe(true);
      expect(video.hasAttribute('loop')).toBe(true);
      expect(video.hasAttribute('muted')).toBe(true);
      expect(video.hasAttribute('playsInline')).toBe(true);
    }
  });

  it('video source element exists with correct src', () => {
    const { container } = render(
      <BrowserRouter>
        <HeroSection {...mockProps} />
      </BrowserRouter>
    );
    
    const source = container.querySelector('video source');
    expect(source).toBeInTheDocument();
    
    if (source) {
      expect(source.getAttribute('src')).toBe('/Mindmaker for Leaders - background video.mp4');
      expect(source.getAttribute('type')).toBe('video/mp4');
    }
  });
});
