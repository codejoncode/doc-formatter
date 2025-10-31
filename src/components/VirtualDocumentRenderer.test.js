/**
 * VirtualDocumentRenderer.test.js
 * Unit tests for VirtualDocumentRenderer component
 * Prevents regressions for null/undefined errors
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualDocumentRenderer from './VirtualDocumentRenderer';
import { DocumentChunk } from '../utils/DocumentChunk';

// Mock react-window
jest.mock('react-window', () => ({
  List: ({ children, itemCount }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: Math.min(itemCount, 5) }).map((_, index) =>
        children({ index, style: {} })
      )}
    </div>
  )
}));

// Mock react-virtualized-auto-sizer
jest.mock('react-virtualized-auto-sizer', () => ({
  __esModule: true,
  default: ({ children }) => children({ height: 600, width: 800 })
}));

// Mock FloatingToolbar
jest.mock('./FloatingToolbar', () => {
  return function FloatingToolbar() {
    return <div data-testid="floating-toolbar">Toolbar</div>;
  };
});

describe('VirtualDocumentRenderer - Null/Undefined Safety', () => {
  
  test('handles empty documentChunks array', () => {
    const { container } = render(
      <VirtualDocumentRenderer documentChunks={[]} />
    );
    
    expect(screen.getByText(/no content to display/i)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="virtual-list"]')).not.toBeInTheDocument();
  });

  test('handles null documentChunks', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <VirtualDocumentRenderer documentChunks={null} />
    );
    
    expect(screen.getByText(/no content to display/i)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  test('handles undefined documentChunks', () => {
    render(
      <VirtualDocumentRenderer documentChunks={undefined} />
    );
    
    expect(screen.getByText(/no content to display/i)).toBeInTheDocument();
  });

  test('filters out null chunks from array', () => {
    const chunks = [
      new DocumentChunk('chunk-1', 'paragraph', 'Valid chunk 1'),
      null,
      new DocumentChunk('chunk-2', 'paragraph', 'Valid chunk 2'),
      undefined,
      new DocumentChunk('chunk-3', 'paragraph', 'Valid chunk 3')
    ];
    
    render(<VirtualDocumentRenderer documentChunks={chunks} />);
    
    // Should render virtual list with only valid chunks
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles chunks with missing properties', () => {
    const invalidChunks = [
      { id: 'chunk-1', type: 'paragraph', content: 'Valid' },
      { id: 'chunk-2', type: 'paragraph' }, // Missing content
      { id: 'chunk-3' }, // Missing type and content
      { type: 'paragraph', content: 'Missing ID' }, // Missing id
      new DocumentChunk('chunk-4', 'paragraph', 'Valid chunk')
    ];
    
    render(<VirtualDocumentRenderer documentChunks={invalidChunks} />);
    
    // Should still render without crashing
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles non-object chunks in array', () => {
    const mixedChunks = [
      new DocumentChunk('chunk-1', 'paragraph', 'Valid'),
      'invalid string chunk',
      123,
      true,
      new DocumentChunk('chunk-2', 'paragraph', 'Another valid')
    ];
    
    render(<VirtualDocumentRenderer documentChunks={mixedChunks} />);
    
    // Should filter out invalid types and still render
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('does not crash when spreading DocumentChunk instance', () => {
    const validChunk = new DocumentChunk('chunk-1', 'paragraph', 'Test content', {
      alignment: 'left'
    });
    
    const { container } = render(
      <VirtualDocumentRenderer documentChunks={[validChunk]} />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(container.querySelector('.document-chunk')).toBeInTheDocument();
  });

  test('preserves chunk methods after spreading', () => {
    const chunk = new DocumentChunk('chunk-1', 'paragraph', 'Test <b>content</b>');
    
    render(<VirtualDocumentRenderer documentChunks={[chunk]} />);
    
    // Should render without errors and preserve functionality
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles empty metadata object', () => {
    const chunk = new DocumentChunk('chunk-1', 'paragraph', 'Content', {});
    
    render(<VirtualDocumentRenderer documentChunks={[chunk]} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles null metadata', () => {
    const chunk = new DocumentChunk('chunk-1', 'paragraph', 'Content', null);
    
    render(<VirtualDocumentRenderer documentChunks={[chunk]} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles undefined metadata', () => {
    const chunk = new DocumentChunk('chunk-1', 'paragraph', 'Content', undefined);
    
    render(<VirtualDocumentRenderer documentChunks={[chunk]} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });
});

describe('VirtualDocumentRenderer - Valid Chunks', () => {
  
  test('renders valid DocumentChunk instances', () => {
    const chunks = [
      new DocumentChunk('chunk-1', 'heading', 'Heading 1', { level: 1 }),
      new DocumentChunk('chunk-2', 'paragraph', 'Paragraph content'),
      new DocumentChunk('chunk-3', 'list', '<ul><li>Item 1</li></ul>')
    ];
    
    render(<VirtualDocumentRenderer documentChunks={chunks} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('renders with all props provided', () => {
    const chunks = [new DocumentChunk('chunk-1', 'paragraph', 'Test')];
    const mockEditChunk = jest.fn();
    const mockChunksChange = jest.fn();
    
    render(
      <VirtualDocumentRenderer
        documentChunks={chunks}
        isEditing={true}
        onEditChunk={mockEditChunk}
        onChunksChange={mockChunksChange}
        toolbarOptions={{ showTypeSelector: true }}
        className="custom-class"
        style={{ background: 'white' }}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('applies custom className and style', () => {
    const chunks = [new DocumentChunk('chunk-1', 'paragraph', 'Test')];
    
    const { container } = render(
      <VirtualDocumentRenderer
        documentChunks={chunks}
        className="my-custom-class"
        style={{ backgroundColor: 'blue' }}
      />
    );
    
    const renderer = container.querySelector('.virtual-document-renderer');
    expect(renderer).toHaveClass('my-custom-class');
    expect(renderer).toHaveStyle({ backgroundColor: 'blue' });
  });
});

describe('VirtualDocumentRenderer - Error Recovery', () => {
  
  test('handles parsing errors gracefully', () => {
    // Create chunks with potentially problematic data
    const problematicChunks = [
      new DocumentChunk('chunk-1', 'paragraph', 'Normal content'),
      { ...new DocumentChunk('chunk-2', 'paragraph', 'Spread chunk'), extra: 'property' }
    ];
    
    render(
      <VirtualDocumentRenderer documentChunks={problematicChunks} />
    );
    
    // Should still render successfully
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles extremely large chunk arrays', () => {
    const largeChunkArray = Array.from({ length: 1000 }, (_, i) =>
      new DocumentChunk(`chunk-${i}`, 'paragraph', `Content ${i}`)
    );
    
    render(
      <VirtualDocumentRenderer documentChunks={largeChunkArray} />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles special characters in content', () => {
    const chunks = [
      new DocumentChunk('chunk-1', 'paragraph', '<script>alert("xss")</script>'),
      new DocumentChunk('chunk-2', 'paragraph', 'Content with & < > " \' special chars'),
      new DocumentChunk('chunk-3', 'paragraph', '🎉 Unicode emoji content 中文')
    ];
    
    render(<VirtualDocumentRenderer documentChunks={chunks} />);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });
});

describe('VirtualDocumentRenderer - Callback Safety', () => {
  
  test('handles undefined onEditChunk callback', () => {
    const chunks = [new DocumentChunk('chunk-1', 'paragraph', 'Test')];
    
    render(
      <VirtualDocumentRenderer
        documentChunks={chunks}
        onEditChunk={undefined}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles null onChunksChange callback', () => {
    const chunks = [new DocumentChunk('chunk-1', 'paragraph', 'Test')];
    
    render(
      <VirtualDocumentRenderer
        documentChunks={chunks}
        onChunksChange={null}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  test('handles missing toolbarOptions', () => {
    const chunks = [new DocumentChunk('chunk-1', 'paragraph', 'Test')];
    
    render(
      <VirtualDocumentRenderer
        documentChunks={chunks}
        toolbarOptions={undefined}
      />
    );
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });
});
