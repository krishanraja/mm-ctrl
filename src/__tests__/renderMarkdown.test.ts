/**
 * Markdown Renderer Tests
 *
 * Tests basic markdown rendering (headings, bold, italic, lists),
 * XSS prevention, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/lib/renderMarkdown';

describe('renderMarkdown', () => {
  // ----------------------------------------------------------------
  // Basic rendering
  // ----------------------------------------------------------------
  describe('headings', () => {
    it('should render h1 headings', () => {
      const result = renderMarkdown('# Hello World');
      expect(result).toContain('<h1');
      expect(result).toContain('Hello World');
      expect(result).toContain('</h1>');
    });

    it('should render h2 headings', () => {
      const result = renderMarkdown('## Section Title');
      expect(result).toContain('<h2');
      expect(result).toContain('Section Title');
      expect(result).toContain('</h2>');
    });

    it('should render h3 headings', () => {
      const result = renderMarkdown('### Subsection');
      expect(result).toContain('<h3');
      expect(result).toContain('Subsection');
      expect(result).toContain('</h3>');
    });

    it('should not convert mid-line hashes to headings', () => {
      const result = renderMarkdown('This is not # a heading');
      expect(result).not.toContain('<h1');
      expect(result).toContain('<p');
    });
  });

  describe('bold and italic', () => {
    it('should render bold text', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toContain('<strong');
      expect(result).toContain('bold');
      expect(result).toContain('</strong>');
    });

    it('should render italic text', () => {
      const result = renderMarkdown('This is *italic* text');
      expect(result).toContain('<em>');
      expect(result).toContain('italic');
      expect(result).toContain('</em>');
    });

    it('should handle bold and italic together', () => {
      const result = renderMarkdown('**bold** and *italic*');
      expect(result).toContain('<strong');
      expect(result).toContain('<em>');
    });
  });

  describe('lists', () => {
    it('should render unordered list items with dash', () => {
      const result = renderMarkdown('- First item\n- Second item');
      expect(result).toContain('<li');
      expect(result).toContain('First item');
      expect(result).toContain('Second item');
      expect(result).toContain('<ul');
    });

    it('should render unordered list items with asterisk', () => {
      const result = renderMarkdown('* Item one\n* Item two');
      expect(result).toContain('<li');
      expect(result).toContain('Item one');
    });

    it('should render ordered list items', () => {
      const result = renderMarkdown('1. First\n2. Second\n3. Third');
      expect(result).toContain('<li');
      expect(result).toContain('list-decimal');
      expect(result).toContain('First');
      expect(result).toContain('Third');
    });

    it('should wrap consecutive list items in ul', () => {
      const result = renderMarkdown('- A\n- B\n- C');
      expect(result).toContain('<ul');
      expect(result).toContain('</ul>');
    });
  });

  describe('paragraphs', () => {
    it('should wrap plain text in paragraph tags', () => {
      const result = renderMarkdown('Just some text');
      expect(result).toContain('<p');
      expect(result).toContain('Just some text');
      expect(result).toContain('</p>');
    });

    it('should render multiple paragraphs', () => {
      const result = renderMarkdown('First paragraph\nSecond paragraph');
      // Each line becomes its own <p>
      expect(result).toContain('First paragraph');
      expect(result).toContain('Second paragraph');
    });
  });

  // ----------------------------------------------------------------
  // XSS Prevention
  // ----------------------------------------------------------------
  describe('XSS prevention', () => {
    it('should escape script tags', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape inline event handlers', () => {
      const result = renderMarkdown('<img onerror="alert(1)" src="x">');
      // The key security check: raw <img> tag is escaped so browser won't parse it
      expect(result).not.toContain('<img ');
      expect(result).toContain('&lt;img');
    });

    it('should escape href with javascript protocol', () => {
      const result = renderMarkdown('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('href="javascript');
      expect(result).toContain('&lt;a');
    });

    it('should escape nested HTML tags', () => {
      const result = renderMarkdown('<div><iframe src="evil.com"></iframe></div>');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<div>');
      expect(result).toContain('&lt;div&gt;');
      expect(result).toContain('&lt;iframe');
    });

    it('should escape HTML entities in headings', () => {
      const result = renderMarkdown('# Title <script>alert(1)</script>');
      expect(result).toContain('<h1');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML entities in list items', () => {
      const result = renderMarkdown('- Item <img onerror="hack">');
      expect(result).toContain('<li');
      // Raw <img> tag is escaped so browser won't parse it
      expect(result).not.toContain('<img ');
      expect(result).toContain('&lt;img');
    });

    it('should escape double quotes', () => {
      const result = renderMarkdown('" onclick="alert(1)"');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('" onclick=');
    });

    it('should escape single quotes', () => {
      const result = renderMarkdown("' onmouseover='alert(1)'");
      expect(result).toContain('&#39;');
    });

    it('should escape ampersands', () => {
      const result = renderMarkdown('Tom & Jerry');
      expect(result).toContain('&amp;');
    });
  });

  // ----------------------------------------------------------------
  // Edge cases
  // ----------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = renderMarkdown('');
      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = renderMarkdown('   ');
      // Whitespace-only line still gets processed
      expect(result).toBeDefined();
    });

    it('should handle special characters (angle brackets as text)', () => {
      const result = renderMarkdown('5 > 3 and 2 < 4');
      expect(result).toContain('&gt;');
      expect(result).toContain('&lt;');
      // Should not produce actual HTML tags from these
      expect(result).not.toMatch(/<[0-9]/);
    });

    it('should handle markdown with mixed content', () => {
      const md = `# Title

This is a **bold** paragraph with *italic* text.

## List section

- First item
- Second item

1. Ordered one
2. Ordered two`;

      const result = renderMarkdown(md);
      expect(result).toContain('<h1');
      expect(result).toContain('<h2');
      expect(result).toContain('<strong');
      expect(result).toContain('<em>');
      expect(result).toContain('<li');
      expect(result).toContain('<ul');
    });

    it('should handle asterisks that are not bold/italic markers', () => {
      // Single asterisk without a closing one shouldn't break
      const result = renderMarkdown('Use * as a wildcard');
      expect(result).toBeDefined();
      // Should still be wrapped in a paragraph
      expect(result).toContain('<p');
    });

    it('should preserve text content accurately', () => {
      const result = renderMarkdown('The quick brown fox jumps over the lazy dog');
      expect(result).toContain('The quick brown fox jumps over the lazy dog');
    });
  });
});
