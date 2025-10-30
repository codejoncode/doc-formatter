import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../FileUpload';

import { validateFile, parseFile, getFileIcon } from '../../utils/fileParser';

// Mock the fileParser utility
jest.mock('../../utils/fileParser', () => ({
  validateFile: jest.fn(),
  parseFile: jest.fn(),
  getFileIcon: jest.fn(() => '📄')
}));

describe('FileUpload Component', () => {
  const mockOnFileContent = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFileUpload = () => {
    return render(
      <FileUpload 
        onFileContent={mockOnFileContent}
        onError={mockOnError}
      />
    );
  };

  test('renders upload area with correct text', () => {
    renderFileUpload();
    
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop a file here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size:/)).toBeInTheDocument();
  });

  test('displays supported file formats', () => {
    renderFileUpload();
    
    expect(screen.getByText('.txt, .html, .md, .docx, .doc, .pdf, .odt, .rtf')).toBeInTheDocument();
    expect(screen.getByText('20MB')).toBeInTheDocument();
  });

  test('calls file input click when upload area is clicked', () => {
    renderFileUpload();
    
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    const fileInput = uploadArea.querySelector('input[type=\"file\"]');
    
    // Mock the click method
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});
    
    fireEvent.click(uploadArea);
    
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  test('handles drag over events correctly', () => {
    renderFileUpload();
    
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    
    fireEvent.dragOver(uploadArea);
    
    expect(uploadArea).toHaveClass('drag-over');
  });

  test('handles drag leave events correctly', () => {
    renderFileUpload();
    
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    
    fireEvent.dragOver(uploadArea);
    expect(uploadArea).toHaveClass('drag-over');
    
    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).not.toHaveClass('drag-over');
  });

  test('handles successful file upload via drag and drop', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: true,
      errors: [],
      fileInfo: {
        name: 'test.txt',
        size: 12,
        type: 'text/plain',
        extension: '.txt'
      }
    });
    
    parseFile.mockResolvedValue('test content');
    getFileIcon.mockReturnValue('📄');
    
    renderFileUpload();
    
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [mockFile]
      }
    };
    
    fireEvent.drop(uploadArea, dropEvent);
    
    expect(dropEvent.preventDefault).toHaveBeenCalled();
    expect(dropEvent.stopPropagation).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(validateFile).toHaveBeenCalledWith(mockFile);
      expect(parseFile).toHaveBeenCalledWith(mockFile);
      expect(mockOnFileContent).toHaveBeenCalledWith('test content', {
        name: 'test.txt',
        size: 12,
        type: 'text/plain',
        extension: '.txt'
      });
    });
  });

  test('handles file validation errors', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: false,
      errors: ['File too large'],
      fileInfo: null
    });
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('File too large');
    });
  });

  test('handles file parsing errors', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: true,
      errors: [],
      fileInfo: {
        name: 'test.txt',
        size: 12,
        type: 'text/plain',
        extension: '.txt'
      }
    });
    
    parseFile.mockRejectedValue(new Error('Parsing failed'));
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Parsing failed');
    });
  });

  test('displays processing state during file upload', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: true,
      errors: [],
      fileInfo: {
        name: 'test.txt',
        size: 12,
        type: 'text/plain',
        extension: '.txt'
      }
    });
    
    // Make parseFile hang to test processing state
    parseFile.mockImplementation(() => new Promise(() => {}));
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('Processing file...')).toBeInTheDocument();
      expect(screen.getByText('Upload Document').closest('.file-upload-area')).toHaveClass('processing');
    });
  });

  test('displays uploaded file info after successful upload', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: true,
      errors: [],
      fileInfo: {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain',
        extension: '.txt'
      }
    });
    
    parseFile.mockResolvedValue('test content');
    getFileIcon.mockReturnValue('📄');
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('1.00 KB')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
    });
  });

  test('removes uploaded file when remove button is clicked', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: true,
      errors: [],
      fileInfo: {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain',
        extension: '.txt'
      }
    });
    
    parseFile.mockResolvedValue('test content');
    getFileIcon.mockReturnValue('📄');
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByTitle('Remove file');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(mockOnFileContent).toHaveBeenLastCalledWith('', null);
  });

  test('has correct file input accept attribute', () => {
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    expect(fileInput).toHaveAttribute('accept', '.txt,.html,.htm,.md,.markdown,.docx,.doc,.pdf,.odt,.rtf');
  });

  test('handles empty file array in drag and drop', () => {
    renderFileUpload();
    
    const uploadArea = screen.getByText('Upload Document').closest('.file-upload-area');
    
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: []
      }
    };
    
    fireEvent.drop(uploadArea, dropEvent);
    
    expect(validateFile).not.toHaveBeenCalled();
    expect(parseFile).not.toHaveBeenCalled();
  });

  test('handles multiple file validation errors', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    validateFile.mockReturnValue({
      isValid: false,
      errors: ['File too large', 'Unsupported format'],
      fileInfo: null
    });
    
    renderFileUpload();
    
    const fileInput = screen.getByText('Upload Document').closest('.file-upload-area').querySelector('input[type=\"file\"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('File too large, Unsupported format');
    });
  });
});