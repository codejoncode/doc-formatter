/**
 * DocumentChunk - Represents a chunk of document content for virtual rendering
 * Each chunk can be a paragraph, heading, table, list, code block, etc.
 */
export class DocumentChunk {
  constructor(id, type, content, metadata = {}) {
    this.id = id;
    this.type = type; // 'paragraph', 'heading', 'table', 'list', 'code', 'blockquote', etc.
    this.content = content;
    this.metadata = metadata; // { level, rows, language, etc. }
    this.estimatedHeight = this.calculateHeight();
  }

  /**
   * Calculate estimated height for virtualization
   * This helps react-window optimize rendering
   */
  calculateHeight() {
    const baseLineHeight = 24; // pixels
    const basePadding = 32; // top + bottom padding
    
    switch (this.type) {
      case 'heading':
        // Headings have fixed heights based on level
        const level = this.metadata.level || 1;
        return [56, 48, 40, 36, 32, 28][level - 1] || 32;
      
      case 'table':
        // Tables: estimate based on row count
        const rows = this.metadata.rows || this.content.split('\n').length;
        return Math.min(rows * 40 + 60, 600); // Cap at 600px
      
      case 'code':
        // Code blocks: count lines
        const codeLines = this.content.split('\n').length;
        return codeLines * 20 + 40; // monospace is tighter
      
      case 'list':
        // Lists: count items
        const items = this.content.split('\n').filter(line => line.trim()).length;
        return items * 28 + 20;
      
      case 'blockquote':
        // Blockquotes: similar to paragraphs but with border
        const quoteLines = Math.ceil(this.content.length / 80);
        return quoteLines * baseLineHeight + basePadding + 20;
      
      case 'paragraph':
      default:
        // Paragraphs: estimate based on character count
        // Assume ~80 characters per line on average
        const estimatedLines = Math.max(1, Math.ceil(this.content.length / 80));
        return Math.min(estimatedLines * baseLineHeight + basePadding, 410);
    }
  }

  /**
   * Check if chunk matches a search query
   */
  matches(query, isRegex = false) {
    if (!query) return false;
    
    try {
      if (isRegex) {
        const regex = new RegExp(query, 'gi');
        return regex.test(this.content);
      }
      return this.content.toLowerCase().includes(query.toLowerCase());
    } catch (error) {
      return false;
    }
  }

  /**
   * Get plain text content (strip HTML)
   */
  getPlainText() {
    return this.content.replace(/<[^>]*>/g, '');
  }

  /**
   * Clone chunk with modifications
   */
  clone(updates = {}) {
    return new DocumentChunk(
      updates.id || this.id,
      updates.type || this.type,
      updates.content || this.content,
      { ...this.metadata, ...updates.metadata }
    );
  }
}

/**
 * Parse HTML content into document chunks
 * This is the key function that converts formatted HTML into manageable chunks
 */
export function parseHtmlIntoChunks(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const chunks = [];
  let chunkId = 0;

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Process each direct child element
  const processNode = (node, parentType = null) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Skip whitespace-only text nodes
      if (node.textContent.trim()) {
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'paragraph',
          node.textContent.trim()
        ));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = node.tagName.toLowerCase();
    const content = node.innerHTML || node.textContent;

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'heading',
          content,
          { level: parseInt(tagName[1]), html: node.outerHTML }
        ));
        break;

      case 'table':
        const rows = node.querySelectorAll('tr').length;
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'table',
          node.outerHTML,
          { rows, html: node.outerHTML }
        ));
        break;

      case 'pre':
        const codeElement = node.querySelector('code');
        const language = codeElement?.className?.match(/language-(\w+)/)?.[1] || 'plaintext';
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'code',
          codeElement?.textContent || node.textContent,
          { language, html: node.outerHTML }
        ));
        break;

      case 'ul':
      case 'ol':
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'list',
          node.outerHTML,
          { ordered: tagName === 'ol', html: node.outerHTML }
        ));
        break;

      case 'blockquote':
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'blockquote',
          content,
          { html: node.outerHTML }
        ));
        break;

      case 'p':
        // Only add non-empty paragraphs
        if (content.trim()) {
          chunks.push(new DocumentChunk(
            `chunk-${chunkId++}`,
            'paragraph',
            content,
            { html: node.outerHTML }
          ));
        }
        break;

      case 'div':
        // Recursively process div contents
        Array.from(node.childNodes).forEach(child => processNode(child, 'div'));
        break;

      case 'hr':
        chunks.push(new DocumentChunk(
          `chunk-${chunkId++}`,
          'separator',
          '<hr>',
          { html: node.outerHTML }
        ));
        break;

      default:
        // For other elements, treat as paragraph if they have content
        if (content.trim()) {
          chunks.push(new DocumentChunk(
            `chunk-${chunkId++}`,
            'paragraph',
            content,
            { html: node.outerHTML }
          ));
        }
    }
  };

  // Process all child nodes
  Array.from(tempDiv.childNodes).forEach(child => processNode(child));

  // If no chunks were created, create a single paragraph chunk
  if (chunks.length === 0 && html.trim()) {
    chunks.push(new DocumentChunk(
      `chunk-0`,
      'paragraph',
      html,
      { html }
    ));
  }

  return chunks;
}

/**
 * Convert chunks back to HTML
 */
export function chunksToHtml(chunks) {
  return chunks.map(chunk => chunk.metadata.html || chunk.content).join('\n');
}

/**
 * Smart chunking algorithm for very large documents
 * Splits on semantic boundaries (paragraphs, sections)
 */
export function smartChunkDocument(text, maxChunkSize = 5000) {
  const chunks = [];
  let currentChunk = '';
  let chunkId = 0;

  // Split on paragraph boundaries
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    // If adding this paragraph would exceed max size, start new chunk
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(new DocumentChunk(
        `chunk-${chunkId++}`,
        'paragraph',
        currentChunk.trim()
      ));
      currentChunk = '';
    }

    currentChunk += para + '\n\n';
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push(new DocumentChunk(
      `chunk-${chunkId++}`,
      'paragraph',
      currentChunk.trim()
    ));
  }

  return chunks;
}

export default DocumentChunk;
