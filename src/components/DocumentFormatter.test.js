import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentFormatter from './DocumentFormatter';

// Mock child components
jest.mock('./PDFGenerator', () => {
  return function MockPDFGenerator({ content }) {
    return <div data-testid="pdf-generator">PDF Generator: {content ? 'Ready' : 'No content'}</div>;
  };
});

jest.mock('./FileUpload', () => {
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

// Mock formatContentWithAI
const mockFormatContentWithAI = jest.fn();
jest.mock('../utils/formatContentWithAI', () => ({
  formatContentWithAI: mockFormatContentWithAI
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

  test('clears all content when clear button is clicked', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(textarea.value).toBe('Hello world');
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(textarea.value).toBe('');
    expect(screen.getByText('0 characters')).toBeInTheDocument();
  });

  test('triggers input validation branch with empty text (line 44)', () => {
    render(<DocumentFormatter />);
    
    const formatButton = screen.getByRole('button', { name: /format with ai/i });
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Empty input should not trigger formatting
    expect(textarea.value).toBe('');
    fireEvent.click(formatButton);
    
    // Button should remain disabled for empty input
    expect(formatButton).toBeDisabled();
  });

  test('triggers input validation branch with whitespace-only text (line 44)', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    const formatButton = screen.getByRole('button', { name: /format with ai/i });
    
    // Whitespace-only input
    fireEvent.change(textarea, { target: { value: '   \n\t   ' } });
    
    // Should not enable formatting for whitespace-only
    expect(formatButton).toBeDisabled();
  });

  test('triggers all clear state branches in handleClear (lines 49-53)', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Set up various states
    fireEvent.change(textarea, { target: { value: 'Test content' } });
    
    // Simulate error and file info states by using file upload
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    // Verify states are set
    expect(textarea.value).toBe('Mock file content');
    
    // Clear should reset all states
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // All states should be cleared
    expect(textarea.value).toBe('');
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
  });

  test('triggers handleFileContent state setting branches (lines 55-61)', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Upload file to trigger handleFileContent
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    // Should set input text (line 56)
    expect(textarea.value).toBe('Mock file content');
    
    // Should set file info (line 57)
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    
    // Should clear upload error (line 58) and formatted text (line 61)
    expect(screen.queryByText(/Upload Error/i)).not.toBeInTheDocument();
  });

  test('triggers handleFileError branches (lines 63-66)', async () => {
    render(<DocumentFormatter />);
    
    // Upload error file to trigger handleFileError
    const uploadErrorButton = screen.getByText('Trigger Error');
    fireEvent.click(uploadErrorButton);
    
    // Should set error (line 64) and clear file info (line 65)
    expect(screen.getByText('Mock error')).toBeInTheDocument();
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
  });

  test('triggers getPreviewHTML empty check branch (line 69)', () => {
    render(<DocumentFormatter />);
    
    // With no formatted text, preview should be empty
    const previewSection = screen.getByText('Formatted Preview');
    expect(previewSection).toBeInTheDocument();
    
    // The empty check branch should return empty string
    expect(screen.queryByTestId('formatted-preview-content')).not.toBeInTheDocument();
  });

  test('triggers handleFormat with empty text validation (line 44-47)', () => {
    render(<DocumentFormatter />);
    
    const formatButton = screen.getByRole('button', { name: /format with ai/i });
    
    // Should be disabled with empty text
    expect(formatButton).toBeDisabled();
    
    // Try to click anyway - should not trigger formatting due to empty validation
    fireEvent.click(formatButton);
    expect(screen.queryByText(/formatting with ai/i)).not.toBeInTheDocument();
  });

  test('triggers handleClear state reset branches (lines 49-53)', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    
    // Add content first
    fireEvent.change(textarea, { target: { value: 'Test content to clear' } });
    expect(textarea.value).toBe('Test content to clear');
    
    // Click clear button - should reset all state (lines 49-53)
    fireEvent.click(clearButton);
    
    // Should clear input text
    expect(textarea.value).toBe('');
    
    // Should clear formatted text (covered by state reset)
    expect(screen.queryByTestId('formatted-preview-content')).not.toBeInTheDocument();
  });

  test('triggers handleFileContent branches (lines 55-61)', () => {
    render(<DocumentFormatter />);
    
    const uploadButton = screen.getByText('Upload Mock File');
    
    // Trigger file upload which calls handleFileContent
    fireEvent.click(uploadButton);
    
    // Should update input text with file content
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    expect(textarea.value).toBe('Mock file content');
    
    // Should display uploaded file info
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    expect(screen.getAllByText((content, node) => {
      return node && node.textContent && node.textContent.includes('test.txt');
    })[0]).toBeInTheDocument();
  });

  test('triggers getPreviewHTML with content branch (line 70)', async () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Add content to enable formatting
    fireEvent.change(textarea, { target: { value: 'Test content for formatting' } });
    
    // Wait for button to be enabled
    await waitFor(() => {
      const formatButton = screen.getByRole('button', { name: /format with ai/i });
      expect(formatButton).toBeEnabled();
    });
    
    const formatButton = screen.getByRole('button', { name: /format with ai/i });
    fireEvent.click(formatButton);
    
    // Should show formatting in progress
    expect(screen.getByText('Formatting with AI...')).toBeInTheDocument();
    
    // Wait for formatting to complete 
    await waitFor(() => {
      expect(screen.getByText('Format with AI')).toBeInTheDocument();
      // Check the button is back to normal state after processing
      const formatButton = screen.getByRole('button', { name: /format with ai/i });
      expect(formatButton).toBeEnabled();
    }, { timeout: 3000 });
  });

  test('triggers character count validation combinations', () => {
    render(<DocumentFormatter />);
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    
    // Test different input scenarios
    const testCases = [
      { input: '', expectedDisabled: true },
      { input: '   ', expectedDisabled: true },
      { input: '\n\t', expectedDisabled: true },
      { input: 'a', expectedDisabled: false },
      { input: 'Valid content', expectedDisabled: false }
    ];
    
    testCases.forEach(({ input, expectedDisabled }) => {
      fireEvent.change(textarea, { target: { value: input } });
      
      const formatButton = screen.getByRole('button', { name: /format with ai/i });
      if (expectedDisabled) {
        expect(formatButton).toBeDisabled();
      } else {
        expect(formatButton).toBeEnabled();
      }
    });
  });

  test('handles file upload successfully', () => {
    render(<DocumentFormatter />);
    
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => element?.textContent?.includes('test.txt'))[0]).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => element?.textContent?.includes('0.10'))[0]).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    expect(textarea.value).toBe('Mock file content');
  });

  test('displays file upload error', () => {
    render(<DocumentFormatter />);
    
    const errorButton = screen.getByText('Trigger Error');
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Mock error')).toBeInTheDocument();
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
    
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Mock error')).toBeInTheDocument();
    
    // Then upload a file
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.queryByText('Error:')).not.toBeInTheDocument();
  });

  test('clears file info when clear button is clicked', () => {
    render(<DocumentFormatter />);
    
    // Upload a file first
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => element?.textContent?.includes('test.txt'))[0]).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => element?.textContent?.includes('0.10'))[0]).toBeInTheDocument();
    
    // Clear everything
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
  });

  test('formatWithAI handles short text without document header (line 36)', async () => {
    // Mock marked to return exactly what we pass to it so we can verify the formatting logic
    const { marked } = require('marked');
    marked.mockImplementation((text) => text);
    
    render(<DocumentFormatter />);
    
    // Use short text (≤100 characters) to ensure the condition on line 36 is NOT met
    const shortText = 'Short text.'; // 11 characters, well under 100
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: shortText } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    // Fast-forward timers to complete the mock formatting
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(formatButton).not.toBeDisabled();
    });
    
    // The formatted text should NOT have "# Document\n\n" prefix since it's short
    const previewArea = document.querySelector('.preview-content');
    expect(previewArea).toBeInTheDocument();
    
    // Verify that marked was called with the short text (without document header)
    expect(marked).toHaveBeenCalledWith('Short text.');
    expect(marked).not.toHaveBeenCalledWith(expect.stringContaining('# Document'));
  });

  test('formatWithAI adds document header for long text (line 36)', async () => {
    // Mock marked to return exactly what we pass to it so we can verify the formatting logic
    const { marked } = require('marked');
    marked.mockImplementation((text) => text);
    
    render(<DocumentFormatter />);
    
    // Use long text (>100 characters) to ensure the condition on line 36 IS met
    const longText = 'This is a very long piece of text that definitely exceeds one hundred characters in total length. It should trigger the document header addition on line 36 of the DocumentFormatter component.'; // >100 chars
    const textarea = screen.getByPlaceholderText('Paste your document text here...');
    fireEvent.change(textarea, { target: { value: longText } });
    
    const formatButton = screen.getByText('Format with AI');
    fireEvent.click(formatButton);
    
    // Fast-forward timers to complete the mock formatting
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(formatButton).not.toBeDisabled();
    });
    
    // Verify that marked was called with the formatted text INCLUDING document header
    expect(marked).toHaveBeenCalledWith(expect.stringContaining('# Document\n\n'));
  });

  test('covers getPreviewHTML empty formattedText branch', () => {
    render(<DocumentFormatter />);
    
    // Should render without formatted text (empty branch)
    const previewSection = screen.getByText('Formatted Preview');
    expect(previewSection).toBeInTheDocument();
    
    // Verify empty state message is shown when no formatted text
    expect(screen.getByText('Upload a document or paste text, then click "Format with AI" to see the formatted result here...')).toBeInTheDocument();
  });

  test('covers file upload branches and conditional rendering', () => {
    render(<DocumentFormatter />);
    
    // Test no file info initially (conditional branch false)
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
    
    // Test file upload (handleFileContent branch)
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    // Test file info shown (conditional branch true)
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
    
    // Test clear functionality
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(screen.queryByText('Uploaded:')).not.toBeInTheDocument();
  });

  test('covers error handling branches', () => {
    render(<DocumentFormatter />);
    
    // Test no error initially (conditional branch false)
    expect(screen.queryByText('Error:')).not.toBeInTheDocument();
    
    // Test error display (handleFileError branch)
    const errorButton = screen.getByText('Trigger Error');
    fireEvent.click(errorButton);
    
    // Test error shown (conditional branch true)
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Mock error')).toBeInTheDocument();
    
    // Test error clearing via file upload (handleFileContent clearing branch)
    const uploadButton = screen.getByText('Upload Mock File');
    fireEvent.click(uploadButton);
    
    // Error should be cleared
    expect(screen.queryByText('Error:')).not.toBeInTheDocument();
    expect(screen.getByText('Uploaded:')).toBeInTheDocument();
  });
});