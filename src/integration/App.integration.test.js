import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock child components to focus on integration
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }) => <div data-testid="pdf-view">{children}</div>,
  StyleSheet: {
    create: (styles) => styles
  },
  Font: {
    register: jest.fn()
  },
  pdf: jest.fn(() => ({
    toBlob: jest.fn(() => Promise.resolve(new Blob(['mock pdf'], { type: 'application/pdf' })))
  }))
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and appendChild for download functionality
const mockLink = {
  href: '',
  download: '',
  click: jest.fn()
};

global.document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink;
  }
  return {
    innerHTML: '',
    textContent: 'Mock content',
    innerText: 'Mock content'
  };
});

global.document.body.appendChild = jest.fn();
global.document.body.removeChild = jest.fn();

describe('Full Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('complete user workflow: text input -> format -> PDF export', async () => {
    render(<App />);
    
    // Verify initial render
    expect(screen.getByText('AI Document Formatter')).toBeInTheDocument();
    expect(screen.getByText('Format your documents with AI and export to PDF')).toBeInTheDocument();
    
    // Step 1: Input text
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    const testText = `
      Business Report
      
      Executive Summary
      This quarter showed excellent growth. Revenue increased significantly.
      
      Key Points:
      - Sales up 25%
      - New customers: 150
      - Market expansion successful
      
      Conclusion
      We are well positioned for continued growth.
    `;
    
    fireEvent.change(textarea, { target: { value: testText } });
    
    // Verify character count
    expect(screen.getByText(`${testText.length.toLocaleString()} characters`)).toBeInTheDocument();
    
    // Step 2: Format with AI
    const formatButton = screen.getByText('Format with AI');
    expect(formatButton).not.toBeDisabled();
    
    fireEvent.click(formatButton);
    
    // Verify loading state
    expect(screen.getByText('Formatting with AI...')).toBeInTheDocument();
    expect(formatButton).toBeDisabled();
    
    // Complete the formatting process
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Format with AI')).toBeInTheDocument();
      expect(formatButton).not.toBeDisabled();
    }, { timeout: 3000 });
    
    // Step 3: Verify formatted content appears
    await waitFor(() => {
      const previewContent = document.querySelector('.preview-content');
      expect(previewContent).toBeInTheDocument();
    });
    
    // Step 4: Export to PDF
    const pdfButton = screen.getByText('Download PDF');
    expect(pdfButton).not.toBeDisabled();
    
    fireEvent.click(pdfButton);
    
    // Verify PDF generation process
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  test('file upload integration workflow', async () => {
    render(<App />);
    
    // Create a mock file
    const testFileContent = 'This is test file content for integration testing.';
    const mockFile = new File([testFileContent], 'test.txt', { 
      type: 'text/plain',
      size: testFileContent.length
    });
    
    // Mock FileReader for file upload
    const mockFileReader = {
      result: testFileContent,
      readAsText: jest.fn(function() {
        setTimeout(() => {
          this.onload({ target: this });
        }, 0);
      })
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Find the file input and upload file
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Uploaded:.*test\.txt/)).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText('Paste your document text here...');
      expect(textarea.value).toBe(testFileContent);
    });
    
    // Continue with formatting the uploaded content
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      const previewContent = document.querySelector('.preview-content');
      expect(previewContent).toBeInTheDocument();
    });
  });

  test('drag and drop file upload integration', async () => {
    render(<App />);
    
    const testFileContent = 'Drag and drop test content.';
    const mockFile = new File([testFileContent], 'dragged.txt', { 
      type: 'text/plain',
      size: testFileContent.length
    });
    
    // Mock FileReader
    const mockFileReader = {
      result: testFileContent,
      readAsText: jest.fn(function() {
        setTimeout(() => {
          this.onload({ target: this });
        }, 0);
      })
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Find upload area and simulate drag and drop
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    
    // Simulate drag over
    fireEvent.dragOver(uploadArea);
    expect(uploadArea).toHaveClass('drag-over');
    
    // Simulate drop
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [mockFile]
      }
    };
    
    fireEvent.drop(uploadArea, dropEvent);
    
    await waitFor(() => {
      expect(screen.getByText(/Uploaded:.*dragged\.txt/)).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText('Paste your document text here...');
      expect(textarea.value).toBe(testFileContent);
    });
  });

  test('error handling integration', async () => {
    render(<App />);
    
    // Test file validation error
    const oversizedFile = new File(['x'.repeat(21 * 1024 * 1024)], 'huge.txt', { 
      type: 'text/plain',
      size: 21 * 1024 * 1024
    });
    
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [oversizedFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:.*exceeds maximum allowed size/)).toBeInTheDocument();
    });
    
    // Test unsupported file type
    const unsupportedFile = new File(['test'], 'test.xyz', { 
      type: 'application/xyz',
      size: 100
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [unsupportedFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:.*not supported/)).toBeInTheDocument();
    });
  });

  test('clear functionality integration', async () => {
    render(<App />);
    
    // Input some text
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Test content to clear' } });
    
    // Upload a file
    const testFileContent = 'File content';
    const mockFile = new File([testFileContent], 'test.txt', { 
      type: 'text/plain',
      size: testFileContent.length
    });
    
    const mockFileReader = {
      result: testFileContent,
      readAsText: jest.fn(function() {
        setTimeout(() => {
          this.onload({ target: this });
        }, 0);
      })
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Uploaded:.*test\.txt/)).toBeInTheDocument();
    });
    
    // Format the content
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      const previewContent = document.querySelector('.preview-content');
      expect(previewContent).toBeInTheDocument();
    });
    
    // Clear everything
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // Verify everything is cleared
    expect(textarea.value).toBe('');
    expect(screen.getByText('0 characters')).toBeInTheDocument();
    expect(screen.queryByText(/Uploaded:/)).not.toBeInTheDocument();
    expect(screen.getByText('Upload a document or paste text, then click "Format with AI" to see the formatted result here...')).toBeInTheDocument();
  });

  test('responsive behavior integration', () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    render(<App />);
    
    // Verify mobile layout elements are present
    expect(screen.getByText('AI Document Formatter')).toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Formatted Preview')).toBeInTheDocument();
  });

  test('keyboard navigation integration', () => {
    render(<App />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Test tab navigation
    fireEvent.keyDown(textarea, { key: 'Tab' });
    
    // Test enter key in textarea (should add new line, not submit)
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
    
    expect(textarea.value).toBe('Line 1\nLine 2');
  });

  test('performance with large content integration', async () => {
    render(<App />);
    
    // Test with large content (should show warning)
    const largeContent = 'x'.repeat(300000);
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    fireEvent.change(textarea, { target: { value: largeContent } });
    
    expect(screen.getByText('300,000 characters')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Very large document')).toBeInTheDocument();
    
    // Verify formatting still works with large content
    const formatButton = screen.getByText('Format with AI');
    expect(formatButton).not.toBeDisabled();
    
    fireEvent.click(formatButton);
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Format with AI')).toBeInTheDocument();
    });
  });
});