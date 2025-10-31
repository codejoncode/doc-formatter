import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { marked } from 'marked';
import './DocumentFormatterEnterprise.css';
import PDFGenerator from './PDFGenerator';
import FileUpload from './FileUpload';
import DocumentFormattingEngine from '../utils/DocumentFormattingEngine';

// Enterprise-level Document Formatter with AI-powered formatting
const DocumentFormatter = () => {
  const [inputText, setInputText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isLargeDocument, setIsLargeDocument] = useState(false);
  const [documentStats, setDocumentStats] = useState(null);
  const [formattingRules, setFormattingRules] = useState({
    headers: {
      detectAllCaps: true,
      detectColons: true,
      detectNumbers: true,
      enforceHierarchy: true,
      titleCase: true
    },
    lists: {
      normalizeMarkers: true,
      enforceIndentation: true,
      smartSpacing: true
    },
    tables: {
      autoAlign: true,
      addSeparators: true,
      enforceStructure: true
    },
    code: {
      autoDetectLanguage: true,
      syntaxHighlighting: true,
      properIndentation: true
    },
    references: {
      autoLink: true,
      generateAppendix: true,
      crossReference: true
    },
    typography: {
      smartQuotes: true,
      properSpacing: true,
      paragraphBreaks: true
    }
  });
  const [documentMetadata, setDocumentMetadata] = useState(null);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  
  const abortControllerRef = useRef(null);

  // Performance thresholds
  const LARGE_DOCUMENT_THRESHOLD = 100000; // 100k characters
  const CHUNK_SIZE = 10000; // Process in 10k character chunks
  const MAX_RENDER_LENGTH = 500000; // Limit preview rendering

  // Helper function to update rules
  const updateRule = useCallback((section, key, value) => {
    setFormattingRules(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  }, []);

  // Preset rule configurations
  const applyDefaultRules = useCallback(() => {
    setFormattingRules({
      headers: {
        detectAllCaps: true,
        detectColons: true,
        detectNumbers: true,
        enforceHierarchy: true,
        titleCase: true
      },
      lists: {
        normalizeMarkers: true,
        enforceIndentation: true,
        smartSpacing: true
      },
      tables: {
        autoAlign: true,
        addSeparators: true,
        enforceStructure: true
      },
      code: {
        autoDetectLanguage: true,
        syntaxHighlighting: true,
        properIndentation: true
      },
      references: {
        autoLink: true,
        generateAppendix: true,
        crossReference: true
      },
      typography: {
        smartQuotes: true,
        properSpacing: true,
        paragraphBreaks: true
      }
    });
  }, []);

  const applyMinimalRules = useCallback(() => {
    setFormattingRules({
      headers: {
        detectAllCaps: false,
        detectColons: false,
        detectNumbers: false,
        enforceHierarchy: true,
        titleCase: false
      },
      lists: {
        normalizeMarkers: true,
        enforceIndentation: true,
        smartSpacing: false
      },
      tables: {
        autoAlign: true,
        addSeparators: false,
        enforceStructure: false
      },
      code: {
        autoDetectLanguage: false,
        syntaxHighlighting: false,
        properIndentation: true
      },
      references: {
        autoLink: false,
        generateAppendix: false,
        crossReference: false
      },
      typography: {
        smartQuotes: false,
        properSpacing: true,
        paragraphBreaks: true
      }
    });
  }, []);

  const applyAcademicRules = useCallback(() => {
    setFormattingRules({
      headers: {
        detectAllCaps: true,
        detectColons: true,
        detectNumbers: true,
        enforceHierarchy: true,
        titleCase: true
      },
      lists: {
        normalizeMarkers: true,
        enforceIndentation: true,
        smartSpacing: true
      },
      tables: {
        autoAlign: true,
        addSeparators: true,
        enforceStructure: true
      },
      code: {
        autoDetectLanguage: true,
        syntaxHighlighting: false,
        properIndentation: true
      },
      references: {
        autoLink: true,
        generateAppendix: true,
        crossReference: true
      },
      typography: {
        smartQuotes: true,
        properSpacing: true,
        paragraphBreaks: true
      }
    });
  }, []);

  // Document analysis for enterprise insights
  const analyzeDocument = useCallback((text) => {
    const stats = {
      characters: text.length,
      words: text.split(/\s+/).filter(word => word.length > 0).length,
      paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      lines: text.split('\n').length,
      tables: (text.match(/\|.*\|/g) || []).length,
      headings: (text.match(/^#{1,6}\s/gm) || []).length,
      lists: (text.match(/^[\s]*[-*+]\s/gm) || []).length,
      estimatedReadTime: Math.ceil(text.split(/\s+/).length / 250) // 250 words per minute
    };
    
    setDocumentStats(stats);
    setIsLargeDocument(stats.characters > LARGE_DOCUMENT_THRESHOLD);
  }, [LARGE_DOCUMENT_THRESHOLD]);

  // Input handler for large documents
  const handleInputChange = useCallback((text) => {
    setInputText(text);
    analyzeDocument(text);
  }, [analyzeDocument]);

  // Enterprise-level formatting with chunked processing
  const formatWithAI = async (text) => {
    if (!text.trim()) return;
    
    setIsFormatting(true);
    setProcessingProgress(0);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      let formatted = '';
      
      if (text.length > LARGE_DOCUMENT_THRESHOLD) {
        // Process large documents in chunks
        formatted = await processLargeDocument(text);
      } else {
        // Process small documents normally
        formatted = await processStandardDocument(text);
      }
      
      setFormattedText(formatted);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Formatting error:', error);
        setUploadError('Failed to format document. Please try again.');
      }
    } finally {
      setIsFormatting(false);
      setProcessingProgress(0);
    }
  };

  // Chunked processing for large documents
  const processLargeDocument = async (text) => {
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }
    
    let processedText = '';
    
    for (let i = 0; i < chunks.length; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing cancelled');
      }
      
      const chunk = chunks[i];
      const formattedChunk = await processChunk(chunk, i === 0, i === chunks.length - 1);
      processedText += formattedChunk;
      
      // Update progress
      setProcessingProgress(Math.round(((i + 1) / chunks.length) * 100));
      
      // Yield control to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Final pass for cross-chunk formatting
    return finalizeFormatting(processedText);
  };

  // Standard processing for smaller documents
  const processStandardDocument = async (text) => {
    setProcessingProgress(50);
    const formatted = await processChunk(text, true, true);
    setProcessingProgress(100);
    return finalizeFormatting(formatted);
  };

  // Enhanced chunk processing with AI-powered formatting engine
  const processChunk = async (chunk, isFirst, isLast) => {
    const engine = new DocumentFormattingEngine({
      strictMode: true,
      autoDetectLanguages: true,
      enterpriseMode: true,
      generateTOC: isFirst,
      linkReferences: isLast
    });
    
    try {
      const result = await engine.formatDocument(chunk, formattingRules);
      
      // Update metadata on last chunk
      if (isLast) {
        setDocumentMetadata(result.metadata);
      }
      
      return result.formattedText;
    } catch (error) {
      console.error('Formatting engine error:', error);
      // Fallback to basic formatting
      return await processChunkFallback(chunk);
    }
  };

  // Fallback formatting for error cases
  const processChunkFallback = async (chunk) => {
    let formatted = chunk;
    
    // Basic enterprise formatting
    formatted = formatTables(formatted);
    formatted = formatParagraphs(formatted);
    formatted = formatHeadings(formatted);
    formatted = formatLists(formatted);
    formatted = formatCodeBlocks(formatted);
    formatted = formatCitations(formatted);
    
    return formatted;
  };

  // Enterprise table formatting
  const formatTables = (text) => {
    return text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g, (match) => {
      const lines = match.split('\n');
      const formattedLines = lines.map(line => {
        // Clean up cell spacing
        return line.replace(/\|\s*/g, '| ').replace(/\s*\|/g, ' |');
      });
      
      // Add separator row if missing
      if (formattedLines.length > 1 && !formattedLines[1].includes('---')) {
        const headerCols = (formattedLines[0].match(/\|/g) || []).length - 1;
        const separator = '|' + ' --- |'.repeat(headerCols);
        formattedLines.splice(1, 0, separator);
      }
      
      return '\n' + formattedLines.join('\n') + '\n';
    });
  };

  // Enhanced paragraph formatting
  const formatParagraphs = (text) => {
    return text
      .replace(/\n{3,}/g, '\n\n') // Normalize spacing
      .replace(/([.!?])\s*([A-Z][a-z])/g, '$1\n\n$2') // Paragraph breaks
      .replace(/([.!?])\s*(\d+\.)/g, '$1\n\n$2') // Before numbered lists
      .replace(/([.!?])\s*([-*+])/g, '$1\n\n$2'); // Before bullet lists
  };

  // Professional heading structure
  const formatHeadings = (text) => {
    return text
      .replace(/^([A-Z][A-Z\s]{10,})$/gm, '# $1') // All caps titles
      .replace(/^(\d+\.\s+[A-Z][a-zA-Z\s]{5,})$/gm, '## $1') // Numbered sections
      .replace(/^\s*([A-Z][a-zA-Z\s]{3,}):?\s*$/gm, '### $1') // Section headers
      .replace(/^#{1,6}\s+/gm, (match) => match.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())); // Title case
  };

  // List optimization
  const formatLists = (text) => {
    return text
      .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ') // Normalize numbered lists
      .replace(/^\s*[-*+•]\s+/gm, '- ') // Normalize bullet lists
      .replace(/^(\s*)([a-z])[.)]\s+/gm, '$1$2. '); // Sub-lists
  };

  // Code block formatting
  const formatCodeBlocks = (text) => {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return '```' + (lang || '') + '\n' + code.trim() + '\n```';
      })
      .replace(/`([^`\n]+)`/g, '`$1`'); // Inline code
  };

  // Citation formatting
  const formatCitations = (text) => {
    return text
      .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>') // Numbered citations
      .replace(/\(([^)]+,\s*\d{4})\)/g, '($1)'); // Author-year citations
  };

  // Final formatting pass
  const finalizeFormatting = (text) => {
    let final = text;
    
    // Add document header if large
    if (text.length > LARGE_DOCUMENT_THRESHOLD) {
      const date = new Date().toLocaleDateString();
      final = `# Enterprise Document\n\n*Formatted on ${date}*\n\n---\n\n${final}`;
    }
    
    // Clean up extra whitespace
    final = final
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces
      .replace(/\n{4,}/g, '\n\n\n') // Limit consecutive newlines
      .trim();
    
    return final;
  };

  // Performance-optimized preview rendering
  const renderPreview = useMemo(() => {
    if (!formattedText) return '';
    
    let previewText = formattedText;
    
    // Truncate extremely large documents for preview
    if (previewText.length > MAX_RENDER_LENGTH) {
      previewText = previewText.slice(0, MAX_RENDER_LENGTH) + '\n\n*[Document truncated for performance - full content will be in PDF export]*';
    }
    
    try {
      return marked(previewText);
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return '<pre>' + previewText + '</pre>';
    }
  }, [formattedText]);

  // Cancel processing
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsFormatting(false);
    setProcessingProgress(0);
  };

  // File content handler
  const handleFileContent = (content, fileInfo) => {
    setInputText(content);
    setUploadedFileInfo(fileInfo);
    setUploadError('');
    setFormattedText('');
    analyzeDocument(content);
  };

  const handleFileError = (error) => {
    setUploadError(error);
    setUploadedFileInfo(null);
  };

  const handleFormat = () => {
    if (inputText.trim()) {
      formatWithAI(inputText);
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setInputText('');
    setFormattedText('');
    setUploadedFileInfo(null);
    setUploadError('');
    setIsFormatting(false);
    setProcessingProgress(0);
    setDocumentStats(null);
    setIsLargeDocument(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="document-formatter enterprise-mode">
      <div className="formatter-container">
        <div className="input-section">
          <h2>Input Document</h2>
          
          {/* Enterprise Document Stats */}
          {documentStats && (
            <div className="document-stats">
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-value">{documentStats.characters.toLocaleString()}</span>
                  <span className="stat-label">Characters</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{documentStats.words.toLocaleString()}</span>
                  <span className="stat-label">Words</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{documentStats.estimatedReadTime}</span>
                  <span className="stat-label">Min Read</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{documentStats.tables}</span>
                  <span className="stat-label">Tables</span>
                </div>
              </div>
              {isLargeDocument && (
                <div className="large-doc-warning">
                  <span className="warning-icon">⚡</span>
                  <span>Enterprise document detected - using optimized processing</span>
                </div>
              )}
            </div>
          )}
          
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
          
          <div className="text-input-container">
            <textarea
              value={inputText}
              onChange={(e) => {
                const text = e.target.value;
                handleInputChange(text);
              }}
              placeholder="Paste your document text here... (supports large documents up to 1M+ characters)"
              aria-label="Document text input area"
              className={`text-input ${isLargeDocument ? 'large-document' : ''}`}
              rows={isLargeDocument ? 25 : 15}
            />
            
            {isLargeDocument && (
              <div className="performance-indicator">
                <span className="perf-icon">🚀</span>
                <span>Performance mode active</span>
              </div>
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={handleFormat} 
              disabled={!inputText.trim() || isFormatting}
              className="format-button primary"
            >
              {isFormatting ? (
                <>
                  <span className="spinner"></span>
                  Processing... {processingProgress}%
                </>
              ) : (
                <>
                  <span className="ai-icon">🤖</span>
                  Smart Format
                </>
              )}
            </button>
            
            <button 
              onClick={() => setShowRulesPanel(!showRulesPanel)} 
              className="rules-button secondary"
              disabled={isFormatting}
            >
              <span className="gear-icon">⚙️</span>
              Formatting Rules
            </button>
            
            {isFormatting && (
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            )}
            
            <button 
              onClick={handleClear} 
              className="clear-button secondary"
              disabled={isFormatting}
            >
              Clear All
            </button>
          </div>

          {/* Formatting Rules Panel */}
          {showRulesPanel && (
            <div className="formatting-rules-panel">
              <h3>🎯 Enterprise Formatting Rules</h3>
              <div className="rules-grid">
                
                {/* Header Rules */}
                <div className="rule-section">
                  <h4>📋 Headers & Structure</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.headers.detectAllCaps}
                      onChange={(e) => updateRule('headers', 'detectAllCaps', e.target.checked)}
                    />
                    <span>Auto-detect ALL CAPS headers</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.headers.enforceHierarchy}
                      onChange={(e) => updateRule('headers', 'enforceHierarchy', e.target.checked)}
                    />
                    <span>Enforce proper header hierarchy</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.headers.titleCase}
                      onChange={(e) => updateRule('headers', 'titleCase', e.target.checked)}
                    />
                    <span>Convert to title case</span>
                  </label>
                </div>

                {/* List Rules */}
                <div className="rule-section">
                  <h4>📝 Lists & Bullets</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.lists.normalizeMarkers}
                      onChange={(e) => updateRule('lists', 'normalizeMarkers', e.target.checked)}
                    />
                    <span>Normalize bullet points</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.lists.enforceIndentation}
                      onChange={(e) => updateRule('lists', 'enforceIndentation', e.target.checked)}
                    />
                    <span>Fix indentation</span>
                  </label>
                </div>

                {/* Code Rules */}
                <div className="rule-section">
                  <h4>💻 Code & Technical</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.code.autoDetectLanguage}
                      onChange={(e) => updateRule('code', 'autoDetectLanguage', e.target.checked)}
                    />
                    <span>Auto-detect code language</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.code.syntaxHighlighting}
                      onChange={(e) => updateRule('code', 'syntaxHighlighting', e.target.checked)}
                    />
                    <span>Enable syntax highlighting</span>
                  </label>
                </div>

                {/* References Rules */}
                <div className="rule-section">
                  <h4>🔗 References & Links</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.references.generateAppendix}
                      onChange={(e) => updateRule('references', 'generateAppendix', e.target.checked)}
                    />
                    <span>Generate section appendix</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.references.autoLink}
                      onChange={(e) => updateRule('references', 'autoLink', e.target.checked)}
                    />
                    <span>Auto-link cross-references</span>
                  </label>
                </div>

                {/* Table Rules */}
                <div className="rule-section">
                  <h4>📊 Tables & Data</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.tables.autoAlign}
                      onChange={(e) => updateRule('tables', 'autoAlign', e.target.checked)}
                    />
                    <span>Auto-align table columns</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.tables.addSeparators}
                      onChange={(e) => updateRule('tables', 'addSeparators', e.target.checked)}
                    />
                    <span>Add missing separators</span>
                  </label>
                </div>

                {/* Typography Rules */}
                <div className="rule-section">
                  <h4>✏️ Typography</h4>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.typography.smartQuotes}
                      onChange={(e) => updateRule('typography', 'smartQuotes', e.target.checked)}
                    />
                    <span>Use smart quotes</span>
                  </label>
                  <label className="rule-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formattingRules.typography.properSpacing}
                      onChange={(e) => updateRule('typography', 'properSpacing', e.target.checked)}
                    />
                    <span>Fix spacing issues</span>
                  </label>
                </div>
              </div>
              
              <div className="rules-actions">
                <button onClick={applyDefaultRules} className="preset-button">
                  🎯 Enterprise Preset
                </button>
                <button onClick={applyMinimalRules} className="preset-button">
                  📄 Minimal Formatting
                </button>
                <button onClick={applyAcademicRules} className="preset-button">
                  🎓 Academic Style
                </button>
              </div>
            </div>
          )}
          
          {/* Processing Progress Bar */}
          {isFormatting && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{processingProgress}% Complete</span>
            </div>
          )}
        </div>

        <div className="output-section">
          <h2>Formatted Preview</h2>
          
          {formattedText && (
            <div className="preview-controls">
              <span className="preview-info">
                {formattedText.length > MAX_RENDER_LENGTH ? 
                  `Showing first ${MAX_RENDER_LENGTH.toLocaleString()} characters` :
                  `${formattedText.length.toLocaleString()} characters`
                }
              </span>
            </div>
          )}
          
          <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderPreview }} />
          
          {formattedText && (
            <div className="export-section">
              <PDFGenerator content={formattedText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default DocumentFormatter;