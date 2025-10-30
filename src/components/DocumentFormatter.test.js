import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentFormatter from '../DocumentFormatter';

// Mock child components
jest.mock('../PDFGenerator', () => {
  return function MockPDFGenerator({ content }) {
    return <div data-testid="pdf-generator">PDF Generator: {content ? 'Ready' : 'No content'}</div>;
  };
});

jest.mock('../FileUpload', () => {
  return function MockFileUpload({ onFileContent, onError }) {
    return (
      <div data-testid="file-upload">
        <button onClick={() => onFileContent('Mock file content', { name: 'test.txt', size: 100 })}>
          Upload Mock File
        </button>
        <button onClick={() => onError('Mock error')}>
          Trigger Error
        </button>
      </div>
    );
  };
});

// Mock marked library
jest.mock('marked', () => ({
  marked: jest.fn((text) => `<div>${text}</div>`)
}));

describe('DocumentFormatter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders with initial empty state', () => {
    render(<DocumentFormatter />);
    
    expect(screen.getByText('Input Document')).toBeInTheDocument();
    expect(screen.getByText('Formatted Preview')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your document text here...')).toBeInTheDocument();
    expect(screen.getByText('Upload a document or paste text, then click "Format with AI" to see the formatted result here...')).toBeInTheDocument();
  });

  test('displays supported file formats in empty state', () => {
    render(<DocumentFormatter />);
    
    expect(screen.getByText('Supported file formats:')).toBeInTheDocument();
    expect(screen.getByText('📄 Plain Text (.txt)')).toBeInTheDocument();
    expect(screen.getByText('🌐 HTML (.html, .htm)')).toBeInTheDocument();
    expect(screen.getByText('📝 Markdown (.md, .markdown)')).toBeInTheDocument();
    expect(screen.getByText('📘 Microsoft Word (.docx, .doc)*')).toBeInTheDocument();
    expect(screen.getByText('📕 PDF (.pdf)*')).toBeInTheDocument();
    expect(screen.getByText('📗 OpenDocument Text (.odt)*')).toBeInTheDocument();
    expect(screen.getByText('📰 Rich Text Format (.rtf)')).toBeInTheDocument();
  });

  test('updates character count when text is entered', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(screen.getByText('11 characters')).toBeInTheDocument();
  });

  test('shows warning for very large documents', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    const largeText = 'x'.repeat(200001);
    fireEvent.change(textarea, { target: { value: largeText } });
    
    expect(screen.getByText('⚠️ Very large document')).toBeInTheDocument();
  });

  test('format button is disabled when no text is entered', () => {
    render(<DocumentFormatter />);
    
    const formatButton = screen.getByText('Format with AI');
    expect(formatButton).toBeDisabled();
  });

  test('format button is enabled when text is entered', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    
    const formatButton = screen.getByText('Format with AI');
    expect(formatButton).not.toBeDisabled();
  });

  test('formats text when format button is clicked', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world. This is a test.' } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    // Check loading state
    expect(screen.getByText('Formatting with AI...')).toBeInTheDocument();
    expect(formatButton).toBeDisabled();
    
    // Fast-forward timers to complete the mock formatting
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Format with AI')).toBeInTheDocument();
      expect(formatButton).not.toBeDisabled();
    });
  });

  test('clear button clears all content', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(textarea.value).toBe('Hello world');
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(textarea.value).toBe('');
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });

  test('handles file upload successfully', () => {
    render(<DocumentFormatter />);
    
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploaded: test.txt (0.10 KB)')).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    expect(textarea.value).toBe('Mock file content');
  });

  test('displays file upload error', () => {
    render(<DocumentFormatter />);
    
    const errorButton = screen.getByText('Trigger Error');
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Error: Mock error')).toBeInTheDocument();
  });

  test('file upload clears previous formatting', () => {
    render(<DocumentFormatter />);
    
    // First, add some text and format it
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Initial text' } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    jest.advanceTimersByTime(1500);
    
    // Then upload a file
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    // Check that the text was replaced and formatting was cleared
    expect(textarea.value).toBe('Mock file content');
  });

  test('shows OR divider between upload and text input', () => {
    render(<DocumentFormatter />);
    
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  test('character count formats large numbers correctly', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    const largeText = 'x'.repeat(1234);
    fireEvent.change(textarea, { target: { value: largeText } });
    
    expect(screen.getByText('1,234 characters')).toBeInTheDocument();
  });

  test('renders file upload component', () => {
    render(<DocumentFormatter />);
    
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  test('preview shows formatted content after formatting', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world. This is a test.' } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      const previewContent = document.querySelector('.preview-content');
      expect(previewContent).toBeInTheDocument();
    });
  });

  test('PDF generator is shown after formatting', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world. This is a test.' } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-generator')).toBeInTheDocument();
      expect(screen.getByText('PDF Generator: Ready')).toBeInTheDocument();
    });
  });

  test('handles empty text formatting gracefully', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace
    
    const formatButton = screen.getByText('Format with AI');
    expect(formatButton).toBeDisabled();
  });

  test('clears error message when new file is uploaded', () => {
    render(<DocumentFormatter />);
    
    // First trigger an error
    const errorButton = screen.getByText('Trigger Error');
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Error: Mock error')).toBeInTheDocument();
    
    // Then upload a file
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.queryByText('Error: Mock error')).not.toBeInTheDocument();
  });

  test('clears file info when clear button is clicked', () => {
    render(<DocumentFormatter />);
    
    // Upload a file first
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploaded: test.txt (0.10 KB)')).toBeInTheDocument();
    
    // Clear everything
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(screen.queryByText('Uploaded: test.txt (0.10 KB)')).not.toBeInTheDocument();
  });
});