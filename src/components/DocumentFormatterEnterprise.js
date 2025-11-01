import React, { useState, useCallback, useMemo, useRef, useEffect, Component } from 'react';
import { marked } from 'marked';
import './DocumentFormatterEnterprise.css';
import PDFGenerator from './PDFGenerator';
import FileUpload from './FileUpload';
import DocumentFormattingEngine from '../utils/DocumentFormattingEngine';
import VirtualDocumentRenderer from './VirtualDocumentRenderer';
import EnhancedDocumentRenderer from './EnhancedDocumentRenderer';
import { parseHtmlIntoChunks, chunksToHtml } from '../utils/DocumentChunk';
import { useDocumentStore } from '../db/documentStore';
import HTMLNormalizer from '../services/htmlNormalizer';

// Error Boundary for catching rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('================================');
    console.error('PREVIEW RENDERING ERROR:');
    console.error('Error:', error);
    console.error('Error Message:', error?.message);
    console.error('Error Stack:', error?.stack);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('================================');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

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
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  
  // Virtual rendering state
  const [documentChunks, setDocumentChunks] = useState([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [useVirtualRenderer, setUseVirtualRenderer] = useState(true);
  const [useEnhancedRenderer, setUseEnhancedRenderer] = useState(true); // Use EnhancedDocumentRenderer by default
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const documentStore = useDocumentStore();
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
  // eslint-disable-next-line no-unused-vars
  const [documentMetadata, setDocumentMetadata] = useState(null);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  
  const abortControllerRef = useRef(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  // Performance thresholds
  const LARGE_DOCUMENT_THRESHOLD = 100000; // 100k characters
  const CHUNK_SIZE = 10000; // Process in 10k character chunks
  const MAX_RENDER_LENGTH = 30000; // Very conservative for initial preview
  const FULL_RENDER_LENGTH = 100000; // Maximum for full preview
  const DISABLE_PREVIEW_THRESHOLD = 300000; // 300k - disable preview entirely

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
    setShowFullPreview(false); // Reset to limited preview for large docs
    
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
      
      // CRITICAL FIX: Update state in separate event loop to prevent UI freeze
      // First, immediately stop the processing indicator and show preparing state
      setIsFormatting(false);
      setProcessingProgress(0);
      setIsPreparingDownload(true);
      
      // Then, defer the formatted text update to next event loop
      // This prevents the massive re-render from blocking the UI
      setTimeout(() => {
        try {
          // Validate formatted text
          if (!formatted || typeof formatted !== 'string') {
            throw new Error('Invalid formatted text: expected non-empty string');
          }
          
          setFormattedText(formatted);
          setRenderError(null); // Clear any previous errors
          
          // Parse into chunks for virtual rendering (performance optimization)
          try {
            const chunks = parseHtmlIntoChunks(formatted);
            
            // Validate chunks
            if (!Array.isArray(chunks)) {
              throw new Error('parseHtmlIntoChunks did not return an array');
            }
            
            // Filter out invalid chunks
            const validChunks = chunks.filter(chunk => {
              if (!chunk || typeof chunk !== 'object') {
                console.warn('Filtered out invalid chunk:', chunk);
                return false;
              }
              if (!chunk.id || !chunk.type || chunk.content === undefined) {
                console.warn('Filtered out incomplete chunk:', chunk);
                return false;
              }
              return true;
            });
            
            console.log(`Parsed ${validChunks.length} valid chunks from ${chunks.length} total`);
            
            setDocumentChunks(validChunks);
            setUseVirtualRenderer(validChunks.length > 0); // Enable virtual renderer if we have valid chunks
          } catch (parseError) {
            console.error('Chunk parsing error:', parseError);
            setRenderError({
              type: 'parsing',
              message: 'Unable to parse document for editing. Download is still available.'
            });
            setDocumentChunks([]);
            setUseVirtualRenderer(false); // Fall back to standard renderer
          }
          
          // Save to IndexedDB for offline access and version control
          if (uploadedFileInfo?.name) {
            documentStore.saveDocument(uploadedFileInfo.name, documentChunks, {
              size: formatted.length,
              processedAt: new Date().toISOString()
            }).then(docId => {
              setCurrentDocumentId(docId);
              console.log('Document saved to IndexedDB:', docId);
            }).catch(err => {
              console.warn('Failed to save to IndexedDB:', err);
              // Non-critical error - document still works without offline storage
            });
          }
          
          setIsPreparingDownload(false);
        } catch (renderError) {
          console.error('Render error:', renderError);
          setRenderError({
            type: 'rendering',
            message: 'Preview unavailable. Your formatted document is ready for download below.'
          });
          setIsPreparingDownload(false);
          setUseVirtualRenderer(false);
        }
      }, 100); // Small delay to let UI update first
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Formatting error:', error);
        setUploadError('Failed to format document. Please try again.');
        setRenderError(null);
      }
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
      
      // Update progress (leave room for normalization)
      setProcessingProgress(Math.round(((i + 1) / chunks.length) * 90));
      
      // Yield control to prevent UI blocking (reduce delay for speed)
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    // Apply lightweight sanitization only (normalize is too slow)
    setProcessingProgress(98);
    const sanitized = HTMLNormalizer.sanitize(processedText);
    setProcessingProgress(100);
    
    // Final pass for cross-chunk formatting
    return finalizeFormatting(sanitized);
  };

  // Standard processing for smaller documents
  const processStandardDocument = async (text) => {
    setProcessingProgress(50);
    const formatted = await processChunk(text, true, true);
    setProcessingProgress(90);
    
    // Apply lightweight sanitization only (normalize is too slow for large docs)
    const sanitized = HTMLNormalizer.sanitize(formatted);
    setProcessingProgress(100);
    
    return finalizeFormatting(sanitized);
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

  // Performance-optimized preview rendering - DISABLE for very large docs
  const renderPreview = useMemo(() => {
    if (!formattedText) return '';
    
    // CRITICAL: For very large documents, don't render preview at all
    if (formattedText.length > DISABLE_PREVIEW_THRESHOLD && !showFullPreview) {
      return `
        <div style="text-align: center; padding: 60px 20px; background: #f8f9fa; border-radius: 12px;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ Preview Disabled for Performance</h2>
          <p style="font-size: 1.2rem; color: #495057; margin-bottom: 15px;">
            Document size: <strong>${(formattedText.length / 1024).toFixed(1)} KB</strong>
          </p>
          <p style="color: #6c757d; margin-bottom: 25px;">
            Preview disabled to prevent browser freezing.<br/>
            Your document has been formatted successfully.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 500px; border-left: 4px solid #10b981;">
            <p style="color: #10b981; font-weight: 600; margin-bottom: 10px;">✅ Formatting Complete</p>
            <p style="color: #6c757d; font-size: 0.95rem;">
              Click the <strong>Download PDF</strong> button above to get your formatted document.
            </p>
          </div>
        </div>
      `;
    }
    
    let previewText = formattedText;
    const renderLimit = showFullPreview ? FULL_RENDER_LENGTH : MAX_RENDER_LENGTH;
    
    // Truncate large documents for preview to prevent freezing
    if (previewText.length > renderLimit) {
      const truncatedLength = Math.min(renderLimit, previewText.length);
      previewText = previewText.slice(0, truncatedLength);
      
      const remainingChars = formattedText.length - truncatedLength;
      const remainingKB = (remainingChars / 1024).toFixed(1);
      
      previewText += `\n\n---\n\n**⚠️ Preview Truncated for Performance**\n\n`;
      previewText += `Showing ${(truncatedLength / 1024).toFixed(1)} KB of ${(formattedText.length / 1024).toFixed(1)} KB\n\n`;
      previewText += `${remainingKB} KB not shown (${remainingChars.toLocaleString()} characters)\n\n`;
      previewText += `**✅ Full content will be available in PDF export above**`;
    }
    
    try {
      // Use marked for markdown parsing - only for smaller chunks
      return marked(previewText);
    } catch (error) {
      console.error('Markdown parsing error:', error);
      // Fallback to plain text with basic HTML escaping
      return '<pre>' + previewText.replace(/[<>&]/g, c => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
      }[c])) + '</pre>';
    }
  }, [formattedText, showFullPreview, MAX_RENDER_LENGTH, FULL_RENDER_LENGTH, DISABLE_PREVIEW_THRESHOLD]);

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
    setDocumentChunks([]);
    setIsEditingMode(false);
  };

  // Handle chunk editing in virtual renderer
  const handleChunkEdit = useCallback((chunkId, newContent) => {
    console.log('Chunk edited:', chunkId, newContent);
    // Update will be handled by onChunksChange
  }, []);

  // Handle all chunks changing (from edits)
  const handleChunksChange = useCallback((updatedChunks) => {
    setDocumentChunks(updatedChunks);
    
    // Convert chunks back to HTML for download
    const updatedHtml = chunksToHtml(updatedChunks);
    setFormattedText(updatedHtml);
    
    // Auto-save to IndexedDB
    if (currentDocumentId) {
      documentStore.updateDocument(currentDocumentId, updatedChunks)
        .then(() => console.log('Document auto-saved'))
        .catch(err => console.warn('Auto-save failed:', err));
    }
  }, [currentDocumentId, documentStore]);

  // Toggle editing mode
  const toggleEditingMode = useCallback(() => {
    setIsEditingMode(prev => !prev);
  }, []);

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
          
          {/* Processing Progress Bar - Visible Above Buttons */}
          {isFormatting && (
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-icon">⚡</span>
                <span className="progress-label">Processing Document...</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                >
                  <span className="progress-percentage">{processingProgress}%</span>
                </div>
              </div>
              <span className="progress-text">{processingProgress}% Complete</span>
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              onClick={handleFormat} 
              disabled={!inputText.trim() || isFormatting}
              className={`format-button primary ${isFormatting ? 'processing' : ''}`}
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
        </div>

        <div className="output-section">
          <h2>Formatted Output</h2>
          
          {/* Preparing Download State */}
          {isPreparingDownload && (
            <div className="preparing-download">
              <div className="preparing-content">
                <div className="loading-spinner-large"></div>
                <h3>✅ Processing Complete!</h3>
                <p>Preparing your document for download...</p>
                <p className="preparing-note">(Large documents may take a moment)</p>
              </div>
            </div>
          )}
          
          {/* Render Error Message with Download Option */}
          {renderError && formattedText && !isPreparingDownload && (
            <div className="render-error-message">
              <div className="error-content">
                <div className="error-icon">⚠️</div>
                <div className="error-text">
                  <h3>Preview Temporarily Unavailable</h3>
                  <p>{renderError.message}</p>
                  <p className="error-apology">
                    We apologize for the inconvenience. Your document has been successfully formatted 
                    and is ready for download.
                  </p>
                  <div className="error-actions">
                    <PDFGenerator content={formattedText} />
                    <button 
                      className="retry-button"
                      onClick={() => {
                        setRenderError(null);
                        setUseVirtualRenderer(false);
                      }}
                    >
                      📄 Try Standard View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Export Section - Always Visible First for Large Docs */}
          {formattedText && !isPreparingDownload && !renderError && (
            <div className="export-section-top">
              <div className="export-info">
                <div className="export-stats">
                  <span className="stat-badge">
                    📄 {(formattedText.length / 1024).toFixed(1)} KB
                  </span>
                  <span className="stat-badge">
                    📝 {formattedText.split(/\s+/).length.toLocaleString()} words
                  </span>
                  {formattedText.length > MAX_RENDER_LENGTH && (
                    <span className="stat-badge warning">
                      ⚡ Large Document Mode
                    </span>
                  )}
                </div>
              </div>
              <div className="export-actions">
                <PDFGenerator content={formattedText} />
              </div>
            </div>
          )}
          
          {/* Preview Controls */}
          {formattedText && !isPreparingDownload && (
            <div className="preview-controls">
              <div className="preview-header">
                <h3>Document Preview</h3>
                <div className="preview-header-actions">
                  {/* Virtual Renderer Toggle */}
                  {documentChunks.length > 0 && (
                    <button 
                      className={`mode-toggle-btn ${useVirtualRenderer ? 'active' : ''}`}
                      onClick={() => setUseVirtualRenderer(!useVirtualRenderer)}
                      title="Toggle high-performance virtual renderer"
                    >
                      {useVirtualRenderer ? '⚡ Virtual Mode' : '📄 Standard Mode'}
                    </button>
                  )}
                  
                  {/* Edit Mode Toggle (only in virtual mode) */}
                  {useVirtualRenderer && documentChunks.length > 0 && (
                    <button 
                      className={`edit-toggle-btn ${isEditingMode ? 'active' : ''}`}
                      onClick={toggleEditingMode}
                      title="Enable in-place editing"
                    >
                      {isEditingMode ? '✏️ Editing' : '👁️ Viewing'}
                    </button>
                  )}
                  
                  {/* Show More Button (only in standard mode) */}
                  {!useVirtualRenderer && formattedText.length > MAX_RENDER_LENGTH && (
                    <button 
                      className="toggle-preview-btn"
                      onClick={() => {
                        setIsRenderingPreview(true);
                        setTimeout(() => {
                          setShowFullPreview(!showFullPreview);
                          setIsRenderingPreview(false);
                        }, 100);
                      }}
                      disabled={isRenderingPreview}
                    >
                      {isRenderingPreview ? (
                        <>
                          <span className="spinner-small"></span>
                          Loading...
                        </>
                      ) : showFullPreview ? (
                        <>📉 Show Less</>
                      ) : (
                        <>📈 Show More ({((formattedText.length - MAX_RENDER_LENGTH) / 1024).toFixed(1)} KB)</>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <span className="preview-info">
                {useVirtualRenderer && documentChunks.length > 0 ? (
                  `⚡ Virtual Renderer: ${documentChunks.length} sections, smooth 60fps scrolling${isEditingMode ? ', editable' : ''}`
                ) : formattedText.length > (showFullPreview ? FULL_RENDER_LENGTH : MAX_RENDER_LENGTH) ? 
                  `Displaying ${((showFullPreview ? FULL_RENDER_LENGTH : MAX_RENDER_LENGTH) / 1024).toFixed(1)} KB of ${(formattedText.length / 1024).toFixed(1)} KB` :
                  `Full document: ${(formattedText.length / 1024).toFixed(1)} KB`
                }
              </span>
            </div>
          )}
          
          {/* Preview Content - Enhanced, Virtual, or Standard Renderer */}
          {!isPreparingDownload && formattedText && !renderError && (
            <div className="preview-content-wrapper">
              {useEnhancedRenderer ? (
                <div className="enhanced-renderer-container">
                  <ErrorBoundary
                    fallback={
                      <div className="renderer-error-fallback">
                        <h3>⚠️ Preview Error</h3>
                        <p>The preview editor encountered an issue.</p>
                        <p className="error-apology">
                          We apologize for the inconvenience. Your document is still available for download.
                        </p>
                        <button 
                          className="fallback-button"
                          onClick={() => setUseEnhancedRenderer(false)}
                        >
                          Switch to Basic View
                        </button>
                      </div>
                    }
                  >
                    <EnhancedDocumentRenderer
                      htmlContent={formattedText}
                      isEditing={isEditingMode}
                      className="enterprise-document"
                    />
                  </ErrorBoundary>
                </div>
              ) : useVirtualRenderer && documentChunks.length > 0 ? (
                <div className="virtual-renderer-container" style={{ height: '800px' }}>
                  <ErrorBoundary
                    fallback={
                      <div className="renderer-error-fallback">
                        <h3>⚠️ Preview Error</h3>
                        <p>The preview editor encountered an issue.</p>
                        <p className="error-apology">
                          We apologize for the inconvenience. Your document is still available for download.
                        </p>
                        <button 
                          className="fallback-button"
                          onClick={() => setUseVirtualRenderer(false)}
                        >
                          Switch to Standard View
                        </button>
                      </div>
                    }
                  >
                    <VirtualDocumentRenderer
                      documentChunks={documentChunks}
                      isEditing={isEditingMode}
                      onEditChunk={handleChunkEdit}
                      onChunksChange={handleChunksChange}
                      toolbarOptions={{
                        showTypeSelector: true,
                        showStyleButtons: true,
                        showAlignmentButtons: true,
                        showHeadingLevel: true,
                        showLanguageSelector: true,
                        showDeleteButton: false
                      }}
                    />
                  </ErrorBoundary>
                </div>
              ) : (
                <div className={`preview-content ${isRenderingPreview ? 'rendering' : ''}`}>
                  {isRenderingPreview ? (
                    <div className="preview-loading">
                      <div className="loading-spinner"></div>
                      <p>Rendering preview...</p>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderPreview }} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default DocumentFormatter;