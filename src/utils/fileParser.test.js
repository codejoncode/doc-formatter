// Core functionality tests - comprehensive coverage

// Mock File constructor for testing
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = options.size || bits.join('').length;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader for testing
global.FileReader = class MockFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file) {
    setTimeout(() => {
      if (file.name.includes('error')) {
        this.error = new Error('Mock file read error');
        if (this.onerror) this.onerror({ target: this });
      } else {
        this.result = file.bits ? file.bits.join('') : 'Mock file content';
        if (this.onload) this.onload({ target: this });
      }
    }, 0);
  }
};

describe('fileParser utilities', () => {
  describe('validateFile', () => {
    test('should return error for no file', () => {
      const result = validateFile(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file selected');
    });

    test('should return error for oversized file', () => {
      const oversizedFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'test.txt', {
        type: 'text/plain',
        size: MAX_FILE_SIZE + 1
      });
      
      const result = validateFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum allowed size');
    });

    test('should return error for unsupported file type', () => {
      const unsupportedFile = new File(['test'], 'test.xyz', {
        type: 'application/xyz',
        size: 100
      });
      
      const result = validateFile(unsupportedFile);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('not supported');
    });

    test('should validate supported text file', () => {
      const validFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
        size: 100
      });
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fileInfo).toEqual({
        name: 'test.txt',
        size: 100,
        type: 'text/plain',
        extension: '.txt'
      });
    });

    test('should validate all supported file types', () => {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).flat();
      
      supportedExtensions.forEach(ext => {
        const file = new File(['test'], `test${ext}`, {
          size: 100
        });
        
        const result = validateFile(file);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('parseFile', () => {
    test('should throw error for invalid file', async () => {
      const oversizedFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'test.txt', {
        size: MAX_FILE_SIZE + 1
      });
      
      await expect(parseFile(oversizedFile)).rejects.toThrow();
    });

    test('should parse text file successfully', async () => {
      const textFile = new File(['Hello world'], 'test.txt', {
        type: 'text/plain',
        size: 11
      });
      
      const result = await parseFile(textFile);
      expect(result).toBe('Hello world');
    });

    test('should parse markdown file successfully', async () => {
      const mdFile = new File(['# Title\nContent'], 'test.md', {
        type: 'text/markdown',
        size: 15
      });
      
      const result = await parseFile(mdFile);
      expect(result).toBe('# Title\nContent');
    });

    test('should handle file read errors', async () => {
      const errorFile = new File(['error'], 'error.txt', {
        type: 'text/plain',
        size: 5
      });
      
      await expect(parseFile(errorFile)).rejects.toThrow('Failed to parse file');
    });

    test('should throw error for unsupported DOCX files without mammoth', async () => {
      const docxFile = new File(['test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 100
      });
      
      await expect(parseFile(docxFile)).rejects.toThrow('mammoth library');
    });

    test('should throw error for PDF files without pdf-parse', async () => {
      const pdfFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
        size: 100
      });
      
      await expect(parseFile(pdfFile)).rejects.toThrow('pdf-parse library');
    });

    test('should parse HTML file and extract text', async () => {
      const htmlFile = new File(['<html><body><h1>Title</h1><p>Content</p></body></html>'], 'test.html', {
        type: 'text/html',
        size: 50
      });
      
      // Mock document.createElement for HTML parsing
      const mockDiv = {
        innerHTML: '',
        textContent: 'Title Content',
        innerText: 'Title Content'
      };
      
      global.document = {
        createElement: jest.fn(() => mockDiv)
      };
      
      const result = await parseFile(htmlFile);
      expect(result).toBe('Title Content');
    });

    test('should parse RTF file and remove control codes', async () => {
      const rtfContent = '{\\rtf1\\ansi\\b Bold text\\b0 normal text}';
      const rtfFile = new File([rtfContent], 'test.rtf', {
        type: 'application/rtf',
        size: rtfContent.length
      });
      
      const result = await parseFile(rtfFile);
      expect(result).toContain('Bold text');
      expect(result).not.toContain('\\rtf1');
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });
  });

  describe('getFileIcon', () => {
    test('should return correct icons for different file types', () => {
      expect(getFileIcon('.txt')).toBe('📄');
      expect(getFileIcon('.html')).toBe('🌐');
      expect(getFileIcon('.htm')).toBe('🌐');
      expect(getFileIcon('.md')).toBe('📝');
      expect(getFileIcon('.markdown')).toBe('📝');
      expect(getFileIcon('.docx')).toBe('📘');
      expect(getFileIcon('.doc')).toBe('📘');
      expect(getFileIcon('.pdf')).toBe('📕');
      expect(getFileIcon('.odt')).toBe('📗');
      expect(getFileIcon('.rtf')).toBe('📰');
      expect(getFileIcon('.unknown')).toBe('📄');
    });
  });

  describe('SUPPORTED_FILE_TYPES constant', () => {
    test('should contain all expected file types', () => {
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('text/plain');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('text/html');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('text/markdown');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('application/msword');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('application/pdf');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('application/vnd.oasis.opendocument.text');
      expect(SUPPORTED_FILE_TYPES).toHaveProperty('application/rtf');
    });

    test('should have correct file extensions for each type', () => {
      expect(SUPPORTED_FILE_TYPES['text/plain']).toContain('.txt');
      expect(SUPPORTED_FILE_TYPES['text/html']).toContain('.html');
      expect(SUPPORTED_FILE_TYPES['text/html']).toContain('.htm');
      expect(SUPPORTED_FILE_TYPES['text/markdown']).toContain('.md');
      expect(SUPPORTED_FILE_TYPES['text/markdown']).toContain('.markdown');
    });
  });

  describe('MAX_FILE_SIZE constant', () => {
    test('should be set to 20MB', () => {
      expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024);
    });
  });
});