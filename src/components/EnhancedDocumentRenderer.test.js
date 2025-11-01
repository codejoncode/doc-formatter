/**
 * EnhancedDocumentRenderer Tests
 * Tests for the enhanced document preview renderer
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedDocumentRenderer from './EnhancedDocumentRenderer';
import HTMLNormalizer from '../services/htmlNormalizer';

// Mock HTMLNormalizer
jest.mock('../services/htmlNormalizer', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((html) => html),
    normalize: jest.fn((html) => html),
    validate: jest.fn((html) => ({
      isValid: true,
      issues: [],
      stats: {
        headings: 2,
        paragraphs: 5,
        codeBlocks: 1,
        tables: 1
      }
    }))
  }
}));

describe('EnhancedDocumentRenderer', () => {
  const mockHtml = `
    <h1>Test Document</h1>
    <p>This is a test paragraph.</p>
    <pre><code>const x = 123;</code></pre>
    <table>
      <thead><tr><th>Header</th></tr></thead>
      <tbody><tr><td>Data</td></tr></tbody>
    </table>
  `;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      expect(screen.getByText(/Test Document/)).toBeInTheDocument();
    });

    it('should display empty state when no content', () => {
      render(<EnhancedDocumentRenderer htmlContent="" />);
      expect(screen.getByText(/No content to display/)).toBeInTheDocument();
    });

    it('should process HTML through HTMLNormalizer', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(HTMLNormalizer.sanitize).toHaveBeenCalledWith(mockHtml);
      expect(HTMLNormalizer.normalize).toHaveBeenCalled();
      expect(HTMLNormalizer.validate).toHaveBeenCalled();
    });

    it('should render zoom controls', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display validation stats', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(screen.getByText(/2 headings/)).toBeInTheDocument();
      expect(screen.getByText(/5 paragraphs/)).toBeInTheDocument();
      expect(screen.getByText(/1 code blocks/)).toBeInTheDocument();
      expect(screen.getByText(/1 tables/)).toBeInTheDocument();
    });
  });

  describe('zoom functionality', () => {
    it('should start at 100% zoom', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should increase zoom when zoom in is clicked', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomIn = screen.getByTitle('Zoom In');
      fireEvent.click(zoomIn);
      
      expect(screen.getByText('110%')).toBeInTheDocument();
    });

    it('should decrease zoom when zoom out is clicked', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomOut = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOut);
      
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('should not zoom below 50%', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomOut = screen.getByTitle('Zoom Out');
      // Click many times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOut);
      }
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not zoom above 200%', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomIn = screen.getByTitle('Zoom In');
      // Click many times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomIn);
      }
      
      expect(screen.getByText('200%')).toBeInTheDocument();
    });

    it('should reset zoom to 100%', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomIn = screen.getByTitle('Zoom In');
      const reset = screen.getByTitle('Reset Zoom');
      
      // Zoom in first
      fireEvent.click(zoomIn);
      fireEvent.click(zoomIn);
      expect(screen.getByText('120%')).toBeInTheDocument();
      
      // Reset
      fireEvent.click(reset);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should apply zoom transform to document viewer', () => {
      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const viewer = container.querySelector('.document-viewer');
      expect(viewer).toHaveStyle({ transform: 'scale(1)' });
      
      const zoomIn = screen.getByTitle('Zoom In');
      fireEvent.click(zoomIn);
      
      expect(viewer).toHaveStyle({ transform: 'scale(1.1)' });
    });
  });

  describe('error handling', () => {
    it('should handle HTML processing errors gracefully', () => {
      HTMLNormalizer.sanitize.mockImplementation(() => {
        throw new Error('Processing error');
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(consoleError).toHaveBeenCalledWith(
        'HTML Processing Error:',
        expect.any(Error)
      );
      
      consoleError.mockRestore();
    });

    it('should display original HTML on processing error', () => {
      HTMLNormalizer.normalize.mockImplementation(() => {
        throw new Error('Normalize error');
      });

      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      // Should still render something
      const viewer = container.querySelector('.document-viewer');
      expect(viewer).toBeInTheDocument();
    });

    it('should warn on validation issues', () => {
      HTMLNormalizer.validate.mockReturnValue({
        isValid: false,
        issues: ['Unclosed tag', 'Missing attribute'],
        stats: { headings: 0, paragraphs: 0, codeBlocks: 0, tables: 0 }
      });

      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(consoleWarn).toHaveBeenCalledWith(
        'HTML Validation Issues:',
        ['Unclosed tag', 'Missing attribute']
      );
      
      consoleWarn.mockRestore();
    });

    it('should log validation stats on success', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(consoleLog).toHaveBeenCalledWith(
        'HTML Validation Stats:',
        expect.objectContaining({
          headings: 2,
          paragraphs: 5,
          codeBlocks: 1,
          tables: 1
        })
      );
      
      consoleLog.mockRestore();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <EnhancedDocumentRenderer htmlContent={mockHtml} className="custom-class" />
      );
      
      const containerDiv = container.querySelector('.enhanced-document-container');
      expect(containerDiv).toHaveClass('custom-class');
    });

    it('should work without custom className', () => {
      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const containerDiv = container.querySelector('.enhanced-document-container');
      expect(containerDiv).toBeInTheDocument();
      expect(containerDiv).toHaveClass('enhanced-document-container');
    });
  });

  describe('HTML content rendering', () => {
    it('should render HTML content with dangerouslySetInnerHTML', () => {
      render(<EnhancedDocumentRenderer htmlContent="<strong>Bold Text</strong>" />);
      
      const boldElement = screen.getByText('Bold Text');
      expect(boldElement.tagName).toBe('STRONG');
    });

    it('should update when htmlContent prop changes', () => {
      const { rerender } = render(<EnhancedDocumentRenderer htmlContent="<p>First</p>" />);
      expect(screen.getByText('First')).toBeInTheDocument();
      
      rerender(<EnhancedDocumentRenderer htmlContent="<p>Second</p>" />);
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('should memoize processed HTML', () => {
      const { rerender } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const callCount = HTMLNormalizer.normalize.mock.calls.length;
      
      // Re-render with same HTML
      rerender(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      // Should not call normalize again (memoized)
      expect(HTMLNormalizer.normalize.mock.calls.length).toBe(callCount);
    });

    it('should reprocess when HTML changes', () => {
      const { rerender } = render(<EnhancedDocumentRenderer htmlContent="<p>First</p>" />);
      
      const firstCallCount = HTMLNormalizer.normalize.mock.calls.length;
      
      rerender(<EnhancedDocumentRenderer htmlContent="<p>Second</p>" />);
      
      // Should call normalize again
      expect(HTMLNormalizer.normalize.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });

  describe('null/undefined handling', () => {
    it('should handle null htmlContent', () => {
      render(<EnhancedDocumentRenderer htmlContent={null} />);
      expect(screen.getByText(/No content to display/)).toBeInTheDocument();
    });

    it('should handle undefined htmlContent', () => {
      render(<EnhancedDocumentRenderer htmlContent={undefined} />);
      expect(screen.getByText(/No content to display/)).toBeInTheDocument();
    });

    it('should handle empty string', () => {
      render(<EnhancedDocumentRenderer htmlContent="" />);
      expect(screen.getByText(/No content to display/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible zoom button labels', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });

    it('should have proper button titles', () => {
      render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const zoomOut = screen.getByTitle('Zoom Out');
      const zoomIn = screen.getByTitle('Zoom In');
      const reset = screen.getByTitle('Reset Zoom');
      
      expect(zoomOut).toBeInTheDocument();
      expect(zoomIn).toBeInTheDocument();
      expect(reset).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('should apply proper container structure', () => {
      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      expect(container.querySelector('.enhanced-document-container')).toBeInTheDocument();
      expect(container.querySelector('.document-toolbar')).toBeInTheDocument();
      expect(container.querySelector('.zoom-controls')).toBeInTheDocument();
      expect(container.querySelector('.document-viewer')).toBeInTheDocument();
    });

    it('should apply transition to zoom transform', () => {
      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const viewer = container.querySelector('.document-viewer');
      expect(viewer).toHaveStyle({
        transition: 'transform 0.2s ease',
        transformOrigin: 'top center'
      });
    });

    it('should have minimum height for document viewer', () => {
      const { container } = render(<EnhancedDocumentRenderer htmlContent={mockHtml} />);
      
      const viewer = container.querySelector('.document-viewer');
      expect(viewer).toHaveStyle({ minHeight: '400px' });
    });
  });
});
