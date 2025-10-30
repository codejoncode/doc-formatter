// File parsing utilities for different document formats
import mammoth from 'mammoth';

// Note: pdf-parse is imported dynamically to avoid bundle size issues
let pdfParse = null;

export const SUPPORTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'text/html': ['.html', '.htm'],
  'text/markdown': ['.md', '.markdown'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/pdf': ['.pdf'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/rtf': ['.rtf']
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }

  // Check file type
  const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
  const isSupportedType = Object.values(SUPPORTED_FILE_TYPES).some(extensions => 
    extensions.includes(fileExtension)
  );

  if (!isSupportedType) {
    errors.push(`File type "${fileExtension}" is not supported. Supported types: ${Object.values(SUPPORTED_FILE_TYPES).flat().join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExtension
    }
  };
};

export const parseFile = async (file) => {
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
  
  try {
    switch (fileExtension) {
      case '.txt':
      case '.md':
      case '.markdown':
        return await parseTextFile(file);
      
      case '.html':
      case '.htm':
        return await parseHtmlFile(file);
      
      case '.docx':
        return await parseDocxFile(file);
      
      case '.doc':
        return await parseDocFile(file);
      
      case '.pdf':
        return await parsePdfFile(file);
      
      case '.odt':
        return await parseOdtFile(file);
      
      case '.rtf':
        return await parseRtfFile(file);
      
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

const parseTextFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

const parseHtmlFile = async (file) => {
  const htmlContent = await parseTextFile(file);
  // Simple HTML to text conversion
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  return tempDiv.textContent || tempDiv.innerText || '';
};

const parseDocxFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
};

const parseDocFile = async (file) => {
  // DOC files are more complex and typically require server-side processing
  throw new Error('DOC file parsing is not yet implemented. Please convert to DOCX or use copy/paste.');
};

const parsePdfFile = async (file) => {
  try {
    // Dynamic import to avoid bundle size issues
    if (!pdfParse) {
      pdfParse = (await import('pdf-parse')).default;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await pdfParse(arrayBuffer);
    return result.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF file: ${error.message}`);
  }
};

const parseOdtFile = async (file) => {
  // ODT files require specialized parsing
  throw new Error('ODT file parsing is not yet implemented. Please convert to DOCX or use copy/paste.');
};

const parseRtfFile = async (file) => {
  try {
    const rtfContent = await parseTextFile(file);
    
    // Enhanced RTF to text conversion
    let text = rtfContent
      // Remove RTF header and font table
      .replace(/\\rtf\d+.*?\\fs\d+/g, '')
      // Remove control words with parameters
      .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
      // Remove control symbols
      .replace(/\\[^a-zA-Z]/g, '')
      // Remove braces
      .replace(/[{}]/g, '')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Remove any remaining backslashes
      .replace(/\\/g, '')
      .trim();
    
    return text || 'Unable to extract readable text from RTF file';
  } catch (error) {
    throw new Error(`Failed to parse RTF file: ${error.message}`);
  }
};

export const getFileIcon = (fileExtension) => {
  switch (fileExtension) {
    case '.txt':
      return '📄';
    case '.html':
    case '.htm':
      return '🌐';
    case '.md':
    case '.markdown':
      return '📝';
    case '.docx':
    case '.doc':
      return '📘';
    case '.pdf':
      return '📕';
    case '.odt':
      return '📗';
    case '.rtf':
      return '📰';
    default:
      return '📄';
  }
};