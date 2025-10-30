import React, { useState } from 'react';
import { marked } from 'marked';
import './DocumentFormatter.css';
import PDFGenerator from './PDFGenerator';
import FileUpload from './FileUpload';

const DocumentFormatter = () => {
  const [inputText, setInputText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);

  // Mock AI formatting function - replace with actual AI service
  const formatWithAI = async (text) => {
    setIsFormatting(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock AI formatting - you can replace this with actual AI service
    let formatted = text;
    
    // Basic formatting improvements
    formatted = formatted
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Add paragraph breaks after sentences
      .replace(/(\w+):\s*/g, '**$1:**\n') // Format labels as bold
      .replace(/\b(important|note|warning)\b/gi, '**$1**') // Bold important words
      .replace(/\b(\d+\.)\s/g, '\n$1 ') // Format numbered lists
      .replace(/\b(-|\*)\s/g, '\n$1 ') // Format bullet lists
      .trim();
    
    // Add some structure
    if (formatted.length > 100) {
      formatted = `# Document\n\n${formatted}`;
    }
    
    setFormattedText(formatted);
    setIsFormatting(false);
  };

  const handleFormat = () => {
    if (inputText.trim()) {
      formatWithAI(inputText);
    }
  };

  const handleClear = () => {
    setInputText('');
    setFormattedText('');
    setUploadError('');
    setUploadedFileInfo(null);
  };

  const handleFileContent = (content, fileInfo) => {
    setInputText(content);
    setUploadedFileInfo(fileInfo);
    setUploadError('');
    
    // Clear any previous formatting when new file is uploaded
    setFormattedText('');
  };

  const handleFileError = (error) => {
    setUploadError(error);
    setUploadedFileInfo(null);
  };

  // Convert markdown to HTML for preview
  const getPreviewHTML = () => {
    if (!formattedText) return '';
    return marked(formattedText);
  };

  const characterCount = inputText.length;

  return (
    <div className="document-formatter">
      <div className="formatter-container">
        <div className="input-section">
          <h2>Input Document</h2>
          
          {/* File Upload Section */}
          <FileUpload 
            onFileContent={handleFileContent}
            onError={handleFileError}
          />
          
          {uploadError && (
            <div className="error-message">
              <strong>Error:</strong> {uploadError}
            </div>
          )}
          
          {uploadedFileInfo && (
            <div className="file-info">
              <strong>Uploaded:</strong> {uploadedFileInfo.name} 
              ({(uploadedFileInfo.size / 1024).toFixed(2)} KB)
            </div>
          )}
          
          {/* Text Input Section */}
          <div className="input-method-divider">
            <span>OR</span>
          </div>
          
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your document text here..."
            rows={15}
          />
          
          <div className="input-info">
            <span className="char-count">
              {characterCount.toLocaleString()} characters
            </span>
            {characterCount > 200000 && (
              <span className="warning"> ⚠️ Very large document</span>
            )}
          </div>
          
          <div className="button-group">
            <button 
              className="format-button"
              onClick={handleFormat}
              disabled={!inputText.trim() || isFormatting}
            >
              {isFormatting ? 'Formatting with AI...' : 'Format with AI'}
            </button>
            <button 
              className="clear-button"
              onClick={handleClear}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="output-section">
          <h2>Formatted Preview</h2>
          {formattedText ? (
            <div className="preview-container">
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
              />
              <PDFGenerator content={formattedText} />
            </div>
          ) : (
            <div className="empty-preview">
              <p>Upload a document or paste text, then click "Format with AI" to see the formatted result here...</p>
              <div className="supported-formats-info">
                <h4>Supported file formats:</h4>
                <ul>
                  <li>📄 Plain Text (.txt)</li>
                  <li>🌐 HTML (.html, .htm)</li>
                  <li>📝 Markdown (.md, .markdown)</li>
                  <li>📘 Microsoft Word (.docx, .doc)*</li>
                  <li>📕 PDF (.pdf)*</li>
                  <li>📗 OpenDocument Text (.odt)*</li>
                  <li>📰 Rich Text Format (.rtf)</li>
                </ul>
                <p className="format-note">
                  * Some formats may require additional libraries to be installed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentFormatter;