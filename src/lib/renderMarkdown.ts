/**
 * Simple markdown → HTML renderer for Edge artifacts.
 * Handles headings, bold, italic, lists, and paragraphs.
 */
export function renderMarkdown(md: string): string {
  const html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-sm text-foreground/90 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-foreground/90 leading-relaxed">$1</li>')
    // Paragraphs (lines that aren't already tagged)
    .replace(/^(?!<[hlu]|<li)(.+)$/gm, '<p class="text-sm text-foreground/90 leading-relaxed mb-2">$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-1 mb-3">$&</ul>');

  return html;
}
