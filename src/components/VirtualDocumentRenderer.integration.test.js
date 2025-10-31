/**
 * VirtualDocumentRenderer.integration.test.js
 * Integration test to verify null/undefined error fix
 * Tests actual formatting workflow that caused the original error
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualDocumentRenderer from './VirtualDocumentRenderer';
import { parseHtmlIntoChunks } from '../utils/DocumentChunk';

// Mock react-window and related components
jest.mock('react-window', () => ({
  List: ({ children, itemCount }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 10) }).map((_, index) =>
        children({ index, style: {} })
      )}
    </div>
  )
}));

jest.mock('react-virtualized-auto-sizer', () => ({
  __esModule: true,
  default: ({ children }) => children({ height: 600, width: 800 })
}));

jest.mock('./FloatingToolbar', () => {
  return function FloatingToolbar() {
    return <div data-testid="floating-toolbar">Toolbar</div>;
  };
});

describe('VirtualDocumentRenderer - Integration Tests for Null/Undefined Fix', () => {
  
  test('renders formatted HTML without Object.values error', async () => {
    // Simulate HTML that would be returned from formatting
    const formattedHtml = `
      <h1>Test Document</h1>
      <p>This is a paragraph with <strong>bold</strong> text.</p>
      <h2>Section 2</h2>
      <p>Another paragraph.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <pre><code class="language-javascript">const x = 1;</code></pre>
    `;
    
    // Parse HTML into chunks (this is what DocumentFormatterEnterprise does)
    const chunks = parseHtmlIntoChunks(formattedHtml);
    
    // Should not throw "Cannot convert undefined or null to object"
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
    
    await waitFor(() => {
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  test('handles chunks with various metadata configurations', () => {
    const formattedHtml = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <p style="text-align: center">Centered paragraph</p>
      <p>Normal paragraph</p>
      <table>
        <tr><th>Header</th></tr>
        <tr><td>Cell</td></tr>
      </table>
    `;
    
    const chunks = parseHtmlIntoChunks(formattedHtml);
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles empty formatted document', () => {
    const formattedHtml = '';
    const chunks = parseHtmlIntoChunks(formattedHtml);
    
    render(<VirtualDocumentRenderer documentChunks={chunks} />);
    
    expect(screen.getByText(/no content to display/i)).toBeInTheDocument();
  });

  test('handles malformed HTML from formatter', () => {
    const malformedHtml = '<p>Unclosed paragraph <div>Nested';
    const chunks = parseHtmlIntoChunks(malformedHtml);
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
  });

  test('handles very large document with many chunks', () => {
    // Generate large HTML document
    const paragraphs = Array.from({ length: 100 }, (_, i) => 
      `<p>Paragraph ${i + 1} with some content that should be rendered in the virtual list.</p>`
    );
    const largeHtml = paragraphs.join('\n');
    
    const chunks = parseHtmlIntoChunks(largeHtml);
    
    expect(chunks.length).toBeGreaterThan(50);
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles document with mixed content types', () => {
    const mixedHtml = `
      <h1>Title</h1>
      <p>Intro paragraph</p>
      <blockquote>A quote</blockquote>
      <pre><code>const code = true;</code></pre>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
      <table>
        <tr><td>Table cell</td></tr>
      </table>
      <p>Final paragraph</p>
    `;
    
    const chunks = parseHtmlIntoChunks(mixedHtml);
    
    // Verify we have different chunk types
    const types = chunks.map(c => c.type);
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles chunks with special characters', () => {
    const specialCharsHtml = `
      <p>Text with &lt; &gt; &amp; &quot; &apos; entities</p>
      <p>Unicode: café, naïve, 日本語</p>
      <p>Emoji: 🚀 ⚡ ✅</p>
    `;
    
    const chunks = parseHtmlIntoChunks(specialCharsHtml);
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={chunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('re-renders correctly when chunks update', () => {
    const initialHtml = '<p>Initial content</p>';
    const initialChunks = parseHtmlIntoChunks(initialHtml);
    
    const { rerender } = render(
      <VirtualDocumentRenderer documentChunks={initialChunks} />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    
    // Update with new chunks
    const updatedHtml = '<p>Initial content</p><p>New paragraph</p>';
    const updatedChunks = parseHtmlIntoChunks(updatedHtml);
    
    expect(() => {
      rerender(<VirtualDocumentRenderer documentChunks={updatedChunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles editing mode without errors', () => {
    const html = '<p>Editable content</p>';
    const chunks = parseHtmlIntoChunks(html);
    
    const mockOnEdit = jest.fn();
    const mockOnChange = jest.fn();
    
    expect(() => {
      render(
        <VirtualDocumentRenderer 
          documentChunks={chunks}
          isEditing={true}
          onEditChunk={mockOnEdit}
          onChunksChange={mockOnChange}
        />
      );
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles chunks array that gets modified externally', () => {
    const html = '<p>Test 1</p><p>Test 2</p>';
    const chunks = parseHtmlIntoChunks(html);
    
    // Simulate external modification (like what might happen in state management)
    const modifiedChunks = chunks.map(chunk => ({
      ...chunk,
      metadata: { ...chunk.metadata, modified: true }
    }));
    
    expect(() => {
      render(<VirtualDocumentRenderer documentChunks={modifiedChunks} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });
});
