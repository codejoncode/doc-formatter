import StreamingDocumentProcessor from './StreamingDocumentProcessor';

describe('StreamingDocumentProcessor', () => {
  describe('Code Block Processing', () => {
    test('preserves pre tags with code blocks', async () => {
      const html = '<pre>function test() { return true; }</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('<code>');
      expect(result.html).toContain('function test()');
    });

    test('wraps pre content in code tags', async () => {
      const html = '<pre>const x = 42;</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toMatch(/<pre[^>]*><code[^>]*>const x = 42;<\/code><\/pre>/);
    });

    test('preserves whitespace in code blocks', async () => {
      const html = '<pre>  function test() {\n    return true;\n  }</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('  function test()');
      expect(result.html).toContain('    return true;');
    });

    test('handles multiple code blocks', async () => {
      const html = `
        <pre>code block 1</pre>
        <p>Some text</p>
        <pre>code block 2</pre>
      `;
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      const preMatches = result.html.match(/<pre[^>]*>/g);
      expect(preMatches).toHaveLength(2);
    });

    test('preserves code block classes', async () => {
      const html = '<pre class="language-javascript">const x = 42;</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('language-javascript');
    });

    test('handles nested code elements', async () => {
      const html = '<pre><code>already wrapped</code></pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<code>already wrapped</code>');
      // Should not double-wrap
      expect(result.html).not.toContain('<code><code>');
    });

    test('handles inline code separately from blocks', async () => {
      const html = '<p>Text with <code>inline code</code> and</p><pre>block code</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<code>inline code</code>');
      expect(result.html).toContain('<pre');
    });

    test('preserves special characters in code blocks', async () => {
      const html = '<pre>&lt;div&gt;HTML example&lt;/div&gt;</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('&lt;');
      expect(result.html).toContain('&gt;');
    });
  });

  describe('Code Block Chunking', () => {
    test('does not split code blocks across chunks', async () => {
      const largeCode = 'x'.repeat(5000);
      const html = `<p>Before</p><pre>${largeCode}</pre><p>After</p>`;
      
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      // Code block should be intact
      expect(result.html).toContain(largeCode);
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('</pre>');
    });

    test('handles large documents with many code blocks', async () => {
      const codeBlocks = Array.from({ length: 10 }, (_, i) => 
        `<pre>code block ${i}</pre>`
      ).join('\n<p>Text between blocks</p>\n');
      
      const result = await StreamingDocumentProcessor.formatDocument(codeBlocks);
      
      const preMatches = result.html.match(/<pre[^>]*>/g);
      expect(preMatches?.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Word Counting with Code Blocks', () => {
    test('counts words in text but not code', async () => {
      const html = '<p>one two three</p><pre>code123 code456</pre><p>four five</p>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      // Should count: one, two, three, four, five = 5 words
      // Code should not inflate count
      expect(result.wordCount).toBeLessThanOrEqual(10);
    });

    test('handles documents with only code blocks', async () => {
      const html = '<pre>function test() { return 42; }</pre>';
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.html).toContain('<pre>');
    });
  });

  describe('Progress Tracking', () => {
    test('provides accurate progress through stages', async () => {
      const progressUpdates = [];
      const html = '<p>Test</p><pre>code</pre>'.repeat(50);
      
      await StreamingDocumentProcessor.formatDocument(html, (progress) => {
        progressUpdates.push({ ...progress });
      });
      
      // Should have chunking stage
      expect(progressUpdates.some(p => p.stage.includes('Chunking'))).toBe(true);
      
      // Should have processing stage
      expect(progressUpdates.some(p => p.stage.includes('Processing'))).toBe(true);
      
      // Should have combining stage
      expect(progressUpdates.some(p => p.stage.includes('Combining'))).toBe(true);
      
      // Should end at 100%
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    test('only reaches 100% when complete', async () => {
      let reached100 = false;
      let completedCalled = false;
      
      const html = '<p>Test</p>'.repeat(100);
      
      const result = await StreamingDocumentProcessor.formatDocument(html, (progress) => {
        if (progress.percentage === 100) {
          reached100 = true;
          completedCalled = progress.stage.includes('Complete');
        }
      });
      
      expect(reached100).toBe(true);
      expect(completedCalled).toBe(true);
      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
    });
  });

  describe('Table and Code Block Integration', () => {
    test('handles documents with both tables and code blocks', async () => {
      const html = `
        <table>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
        <pre>function test() { return true; }</pre>
        <table>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </table>
      `;
      
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<table');
      expect(result.html).toContain('<pre');
      expect(result.html).toContain('function test()');
    });

    test('ensures tables have thead and tbody', async () => {
      const html = `
        <table>
          <tr><td>Header 1</td><td>Header 2</td></tr>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </table>
      `;
      
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<thead>');
      expect(result.html).toContain('<tbody>');
    });
  });

  describe('HTML Sanitization', () => {
    test('removes dangerous scripts but keeps code blocks', async () => {
      const html = `
        <pre>const alert = () => console.log('safe');</pre>
        <script>alert('dangerous');</script>
        <p>Normal text</p>
      `;
      
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('const alert');
      expect(result.html).not.toContain('<script>');
    });

    test('preserves semantic HTML elements', async () => {
      const html = `
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <p>Paragraph</p>
        <ul><li>List item</li></ul>
        <pre>code block</pre>
      `;
      
      const result = await StreamingDocumentProcessor.formatDocument(html);
      
      expect(result.html).toContain('<h1>');
      expect(result.html).toContain('<h2>');
      expect(result.html).toContain('<p>');
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<pre>');
    });
  });

  describe('Quick Format Mode', () => {
    test('quickFormat provides fast preview', async () => {
      const html = '<p>Test</p>'.repeat(1000);
      const result = await StreamingDocumentProcessor.quickFormat(html);
      
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });

    test('quickFormat preserves code blocks', async () => {
      const html = '<pre>code block</pre>';
      const result = await StreamingDocumentProcessor.quickFormat(html);
      
      expect(result.html).toContain('<pre>');
      expect(result.html).toContain('code block');
    });
  });
});
