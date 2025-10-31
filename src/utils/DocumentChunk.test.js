/**
 * DocumentChunk.test.js
 * Unit tests for DocumentChunk utility and parseHtmlIntoChunks
 * Prevents regressions for null/undefined errors in parsing
 */

import { DocumentChunk, parseHtmlIntoChunks, chunksToHtml } from './DocumentChunk';

describe('DocumentChunk - Constructor Safety', () => {
  
  test('creates chunk with valid parameters', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', 'Test content');
    
    expect(chunk.id).toBe('id-1');
    expect(chunk.type).toBe('paragraph');
    expect(chunk.content).toBe('Test content');
    expect(chunk.metadata).toEqual({});
    expect(chunk.estimatedHeight).toBeGreaterThan(0);
  });

  test('handles null metadata gracefully', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', 'Content', null);
    
    expect(chunk.metadata).toBe(null);
    expect(chunk.estimatedHeight).toBeGreaterThan(0);
  });

  test('handles undefined metadata', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', 'Content', undefined);
    
    expect(chunk.metadata).toEqual({});
  });

  test('handles empty string content', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', '');
    
    expect(chunk.content).toBe('');
    expect(chunk.estimatedHeight).toBeGreaterThan(0);
  });

  test('handles special characters in content', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', '<>&"\' special chars');
    
    expect(chunk.content).toContain('<>&"\'');
  });
});

describe('parseHtmlIntoChunks - Null/Undefined Safety', () => {
  
  test('returns empty array for null input', () => {
    const chunks = parseHtmlIntoChunks(null);
    
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBe(0);
  });

  test('returns empty array for undefined input', () => {
    const chunks = parseHtmlIntoChunks(undefined);
    
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBe(0);
  });

  test('returns empty array for empty string', () => {
    const chunks = parseHtmlIntoChunks('');
    
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBe(0);
  });

  test('returns empty array for whitespace-only string', () => {
    const chunks = parseHtmlIntoChunks('   \n  \t  ');
    
    expect(Array.isArray(chunks)).toBe(true);
  });

  test('returns empty array for non-string input', () => {
    const chunks1 = parseHtmlIntoChunks(123);
    const chunks2 = parseHtmlIntoChunks({});
    const chunks3 = parseHtmlIntoChunks([]);
    
    expect(Array.isArray(chunks1)).toBe(true);
    expect(chunks1.length).toBe(0);
    expect(Array.isArray(chunks2)).toBe(true);
    expect(chunks2.length).toBe(0);
    expect(Array.isArray(chunks3)).toBe(true);
    expect(chunks3.length).toBe(0);
  });
});

describe('parseHtmlIntoChunks - Valid Parsing', () => {
  
  test('parses simple paragraph', () => {
    const html = '<p>Simple paragraph</p>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBe(1);
    expect(chunks[0].type).toBe('paragraph');
    expect(chunks[0].content).toContain('Simple paragraph');
    expect(chunks[0]).toBeInstanceOf(DocumentChunk);
  });

  test('parses multiple paragraphs', () => {
    const html = '<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBe(3);
    chunks.forEach(chunk => {
      expect(chunk).toBeInstanceOf(DocumentChunk);
      expect(chunk.type).toBe('paragraph');
    });
  });

  test('parses headings with levels', () => {
    const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBe(6);
    chunks.forEach((chunk, index) => {
      expect(chunk.type).toBe('heading');
      expect(chunk.metadata.level).toBe(index + 1);
    });
  });

  test('parses tables', () => {
    const html = `
      <table>
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Cell 1</td><td>Cell 2</td></tr>
      </table>
    `;
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(0);
    const tableChunk = chunks.find(c => c.type === 'table');
    expect(tableChunk).toBeDefined();
    expect(tableChunk.content).toContain('<table');
  });

  test('parses code blocks', () => {
    const html = '<pre><code class="language-javascript">const x = 1;</code></pre>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(0);
    const codeChunk = chunks.find(c => c.type === 'code');
    expect(codeChunk).toBeDefined();
    expect(codeChunk.metadata.language).toBe('javascript');
  });

  test('parses lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(0);
    const listChunk = chunks.find(c => c.type === 'list');
    expect(listChunk).toBeDefined();
  });

  test('parses blockquotes', () => {
    const html = '<blockquote>This is a quote</blockquote>';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(0);
    const quoteChunk = chunks.find(c => c.type === 'blockquote');
    expect(quoteChunk).toBeDefined();
  });
});

describe('parseHtmlIntoChunks - Edge Cases', () => {
  
  test('handles malformed HTML', () => {
    const html = '<p>Unclosed paragraph <div>Nested without close';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(Array.isArray(chunks)).toBe(true);
    // Should not throw error
  });

  test('handles HTML with no wrapper', () => {
    const html = 'Plain text without tags';
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].type).toBe('paragraph');
  });

  test('handles mixed content types', () => {
    const html = `
      <h1>Title</h1>
      <p>Paragraph 1</p>
      <ul><li>List item</li></ul>
      <p>Paragraph 2</p>
      <table><tr><td>Table</td></tr></table>
    `;
    const chunks = parseHtmlIntoChunks(html);
    
    expect(chunks.length).toBeGreaterThan(3);
    const types = chunks.map(c => c.type);
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    expect(types).toContain('list');
  });

  test('all chunks have required properties', () => {
    const html = '<p>Test 1</p><p>Test 2</p><h1>Header</h1>';
    const chunks = parseHtmlIntoChunks(html);
    
    chunks.forEach(chunk => {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('type');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('metadata');
      expect(chunk).toHaveProperty('estimatedHeight');
      
      expect(typeof chunk.id).toBe('string');
      expect(chunk.id.length).toBeGreaterThan(0);
      expect(typeof chunk.type).toBe('string');
      expect(chunk.content !== undefined).toBe(true);
    });
  });

  test('chunk IDs are unique', () => {
    const html = '<p>Test 1</p><p>Test 2</p><p>Test 3</p>';
    const chunks = parseHtmlIntoChunks(html);
    
    const ids = chunks.map(c => c.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe('chunksToHtml - Safety', () => {
  
  test('handles empty array', () => {
    const html = chunksToHtml([]);
    
    expect(typeof html).toBe('string');
    expect(html).toBe('');
  });

  test('handles null array', () => {
    expect(() => chunksToHtml(null)).not.toThrow();
  });

  test('handles array with null chunks', () => {
    const chunks = [
      new DocumentChunk('id-1', 'paragraph', 'Content 1'),
      null,
      new DocumentChunk('id-2', 'paragraph', 'Content 2')
    ];
    
    expect(() => chunksToHtml(chunks)).not.toThrow();
  });

  test('converts valid chunks back to HTML', () => {
    const original = '<p>Test</p>';
    const chunks = parseHtmlIntoChunks(original);
    const html = chunksToHtml(chunks);
    
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });
});

describe('DocumentChunk - Methods', () => {
  
  test('clone method works correctly', () => {
    const original = new DocumentChunk('id-1', 'paragraph', 'Original', { meta: 'data' });
    const cloned = original.clone({ content: 'Cloned' });
    
    expect(cloned.id).toBe(original.id);
    expect(cloned.type).toBe(original.type);
    expect(cloned.content).toBe('Cloned');
    expect(cloned.metadata).toEqual(original.metadata);
  });

  test('getPlainText strips HTML', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', '<b>Bold</b> <i>italic</i> text');
    const plain = chunk.getPlainText();
    
    expect(plain).toBe('Bold italic text');
    expect(plain).not.toContain('<');
  });

  test('matches method finds text', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', 'Hello world');
    
    expect(chunk.matches('world')).toBe(true);
    expect(chunk.matches('WORLD')).toBe(true); // Case insensitive
    expect(chunk.matches('missing')).toBe(false);
  });

  test('matches method handles regex', () => {
    const chunk = new DocumentChunk('id-1', 'paragraph', 'Test 123');
    
    expect(chunk.matches('\\d+', true)).toBe(true);
    expect(chunk.matches('test', true)).toBe(true);
  });
});

describe('DocumentChunk - Height Calculation', () => {
  
  test('calculates height for paragraphs', () => {
    const shortChunk = new DocumentChunk('id-1', 'paragraph', 'Short');
    const longChunk = new DocumentChunk('id-2', 'paragraph', 'A'.repeat(1000));
    
    expect(shortChunk.estimatedHeight).toBeGreaterThan(0);
    expect(longChunk.estimatedHeight).toBeGreaterThan(shortChunk.estimatedHeight);
  });

  test('calculates height for headings', () => {
    const h1 = new DocumentChunk('id-1', 'heading', 'Title', { level: 1 });
    const h6 = new DocumentChunk('id-2', 'heading', 'Subtitle', { level: 6 });
    
    expect(h1.estimatedHeight).toBeGreaterThan(h6.estimatedHeight);
  });

  test('calculates height for tables', () => {
    const smallTable = new DocumentChunk('id-1', 'table', '<tr><td>1</td></tr>', { rows: 1 });
    const largeTable = new DocumentChunk('id-2', 'table', '<tr><td>1</td></tr>', { rows: 50 });
    
    expect(largeTable.estimatedHeight).toBeGreaterThan(smallTable.estimatedHeight);
    expect(largeTable.estimatedHeight).toBeLessThanOrEqual(600); // Cap at 600px
  });
});
