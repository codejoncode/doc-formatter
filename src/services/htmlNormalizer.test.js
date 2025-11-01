/**
 * HTMLNormalizer Tests
 * Tests for structure-preserving HTML normalization
 */

import HTMLNormalizer from './htmlNormalizer';

describe('HTMLNormalizer', () => {
  describe('sanitize', () => {
    it('should remove script tags', () => {
      const html = '<div>Safe content</div><script>alert("xss")</script>';
      const result = HTMLNormalizer.sanitize(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const html = '<div onclick="alert()">Click me</div>';
      const result = HTMLNormalizer.sanitize(html);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('should preserve safe HTML structure', () => {
      const html = '<div><p>Paragraph</p><strong>Bold</strong></div>';
      const result = HTMLNormalizer.sanitize(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should preserve data attributes', () => {
      const html = '<div data-id="123">Content</div>';
      const result = HTMLNormalizer.sanitize(html);
      expect(result).toContain('data-id="123"');
    });
  });

  describe('normalizeCodeBlock', () => {
    it('should preserve whitespace in code blocks', () => {
      const html = '<pre><code>  function test() {\n    return true;\n  }</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('  function test()');
      expect(result).toContain('    return true;');
    });

    it('should detect JavaScript', () => {
      const html = '<pre><code>const x = 123;</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('data-language="javascript"');
    });

    it('should detect Python', () => {
      const html = '<pre><code>def hello():\n    print("world")</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('data-language="python"');
    });

    it('should detect Java', () => {
      const html = '<pre><code>public class Test {}</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('data-language="java"');
    });

    it('should unescape HTML entities in code', () => {
      const html = '<pre><code>&lt;div&gt;test&lt;/div&gt;</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('<div>test</div>');
    });

    it('should add code-block class', () => {
      const html = '<pre><code>test</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('class="code-block');
    });

    it('should preserve existing classes', () => {
      const html = '<pre class="existing"><code>test</code></pre>';
      const result = HTMLNormalizer.normalizeCodeBlock(html);
      expect(result).toContain('existing');
      expect(result).toContain('code-block');
    });
  });

  describe('normalizeTable', () => {
    it('should ensure proper table structure', () => {
      const html = '<table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>';
      const result = HTMLNormalizer.normalizeTable(html);
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('class="normalized-table"');
    });

    it('should preserve all table content', () => {
      const html = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
      const result = HTMLNormalizer.normalizeTable(html);
      expect(result).toContain('<th>A</th>');
      expect(result).toContain('<th>B</th>');
      expect(result).toContain('<td>1</td>');
      expect(result).toContain('<td>2</td>');
    });

    it('should handle tables without headers', () => {
      const html = '<table><tr><td>Data</td></tr></table>';
      const result = HTMLNormalizer.normalizeTable(html);
      expect(result).toContain('<tbody>');
      expect(result).toContain('<td>Data</td>');
    });

    it('should preserve existing table classes', () => {
      const html = '<table class="custom-table"><tr><td>Data</td></tr></table>';
      const result = HTMLNormalizer.normalizeTable(html);
      expect(result).toContain('custom-table');
      expect(result).toContain('normalized-table');
    });
  });

  describe('normalize', () => {
    it('should normalize complete HTML documents', () => {
      const html = `
        <h1>Title</h1>
        <p>Paragraph</p>
        <pre><code>const x = 1;</code></pre>
        <table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>
      `;
      const result = HTMLNormalizer.normalize(html);
      
      expect(result).toContain('<h1>');
      expect(result).toContain('code-block');
      expect(result).toContain('normalized-table');
    });

    it('should preserve code blocks during normalization', () => {
      const html = '<p>Text</p><pre><code>  indented code</code></pre>';
      const result = HTMLNormalizer.normalize(html);
      expect(result).toContain('  indented code');
    });

    it('should preserve tables during normalization', () => {
      const html = '<p>Text</p><table><tr><td>Data</td></tr></table>';
      const result = HTMLNormalizer.normalize(html);
      expect(result).toContain('<table');
      expect(result).toContain('<td>Data</td>');
    });

    it('should handle empty input', () => {
      const result = HTMLNormalizer.normalize('');
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = HTMLNormalizer.normalize(null);
      expect(result).toBe('');
    });

    it('should clean up excessive whitespace', () => {
      const html = '<p>Text    with    spaces</p>';
      const result = HTMLNormalizer.normalize(html);
      expect(result).not.toContain('    ');
    });
  });

  describe('validate', () => {
    it('should validate and return stats', () => {
      const html = `
        <h1>Title</h1>
        <h2>Section</h2>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
        <pre><code>code</code></pre>
        <table><tr><td>data</td></tr></table>
      `;
      const result = HTMLNormalizer.validate(html);
      
      expect(result.isValid).toBe(true);
      expect(result.stats.headings).toBe(2);
      expect(result.stats.paragraphs).toBe(2);
      expect(result.stats.codeBlocks).toBe(1);
      expect(result.stats.tables).toBe(1);
    });

    it('should detect unclosed tags', () => {
      const html = '<div><p>Unclosed';
      const result = HTMLNormalizer.validate(html);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle valid HTML', () => {
      const html = '<div><p>Valid content</p></div>';
      const result = HTMLNormalizer.validate(html);
      
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should count multiple elements correctly', () => {
      const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><p>P1</p><p>P2</p><p>P3</p>';
      const result = HTMLNormalizer.validate(html);
      
      expect(result.stats.headings).toBe(3);
      expect(result.stats.paragraphs).toBe(3);
    });
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript patterns', () => {
      expect(HTMLNormalizer.detectLanguage('const x = 123;')).toBe('javascript');
      expect(HTMLNormalizer.detectLanguage('function test() {}')).toBe('javascript');
      expect(HTMLNormalizer.detectLanguage('let arr = [];')).toBe('javascript');
    });

    it('should detect Python patterns', () => {
      expect(HTMLNormalizer.detectLanguage('def test():')).toBe('python');
      expect(HTMLNormalizer.detectLanguage('import sys')).toBe('python');
      expect(HTMLNormalizer.detectLanguage('print("hello")')).toBe('python');
    });

    it('should detect Java patterns', () => {
      expect(HTMLNormalizer.detectLanguage('public class Test {}')).toBe('java');
      expect(HTMLNormalizer.detectLanguage('private void method() {}')).toBe('java');
      expect(HTMLNormalizer.detectLanguage('String str = "test";')).toBe('java');
    });

    it('should detect PHP patterns', () => {
      expect(HTMLNormalizer.detectLanguage('<?php echo $var; ?>')).toBe('php');
      expect(HTMLNormalizer.detectLanguage('$variable = 123;')).toBe('php');
    });

    it('should detect SQL patterns', () => {
      expect(HTMLNormalizer.detectLanguage('SELECT * FROM users')).toBe('sql');
      expect(HTMLNormalizer.detectLanguage('INSERT INTO table VALUES')).toBe('sql');
    });

    it('should return unknown for unrecognized code', () => {
      expect(HTMLNormalizer.detectLanguage('random text here')).toBe('unknown');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested structures', () => {
      const html = '<div><div><div><div><p>Deep</p></div></div></div></div>';
      const result = HTMLNormalizer.normalize(html);
      expect(result).toContain('Deep');
    });

    it('should handle mixed content', () => {
      const html = `
        <h1>Title</h1>
        Text outside tags
        <p>Paragraph</p>
        <pre><code>code</code></pre>
        More text
        <table><tr><td>data</td></tr></table>
      `;
      const result = HTMLNormalizer.normalize(html);
      expect(result).toBeTruthy();
    });

    it('should handle special characters', () => {
      const html = '<p>Special: &amp; &lt; &gt; &quot; &#39;</p>';
      const result = HTMLNormalizer.normalize(html);
      expect(result).toContain('Special:');
    });

    it('should handle large documents efficiently', () => {
      let largeHtml = '<div>';
      for (let i = 0; i < 1000; i++) {
        largeHtml += `<p>Paragraph ${i}</p>`;
      }
      largeHtml += '</div>';
      
      const start = Date.now();
      const result = HTMLNormalizer.normalize(largeHtml);
      const duration = Date.now() - start;
      
      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
