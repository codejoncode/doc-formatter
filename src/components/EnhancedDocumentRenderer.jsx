/**
 * Enhanced Document Renderer
 * Preserves formatting, spacing, and structure
 * Uses HTMLNormalizer to maintain document integrity
 */

import React, { useState, useMemo } from 'react';
import HTMLNormalizer from '../services/htmlNormalizer';
import '../styles/documentPreservation.css';

export const EnhancedDocumentRenderer = ({ htmlContent, isEditing = false, onEdit, className = '' }) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  // Normalize and validate HTML
  const { processedHtml, validation } = useMemo(() => {
    if (!htmlContent) {
      return { processedHtml: '', validation: null };
    }

    try {
      // Validate FIRST (before processing changes structure)
      const validation = HTMLNormalizer.validate(htmlContent);
      if (!validation.isValid) {
        console.warn('HTML Validation Issues:', validation.issues);
      } else {
        console.log('HTML Validation Stats:', validation.stats);
      }

      // Sanitize
      let clean = HTMLNormalizer.sanitize(htmlContent);

      // Normalize - PRESERVE structure (fast path for large docs)
      clean = HTMLNormalizer.normalize(clean);

      return { processedHtml: clean, validation };
    } catch (error) {
      console.error('HTML Processing Error:', error);
      return { processedHtml: htmlContent, validation: null };
    }
  }, [htmlContent]);

  if (!htmlContent) {
    return (
      <div className="enhanced-document-container">
        <div className="document-viewer">
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No content to display. Please format a document to see the preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-document-container ${className}`}>
      {/* Toolbar */}
      <div className="document-toolbar">
        <div className="zoom-controls">
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            aria-label="Zoom out"
            title="Zoom Out"
          >
            −
          </button>
          <span>{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
            aria-label="Zoom in"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            aria-label="Reset zoom"
            title="Reset Zoom"
            style={{ marginLeft: '12px', fontSize: '14px' }}
          >
            Reset
          </button>
        </div>
        
        {validation && validation.stats && (
          <div style={{ marginLeft: 'auto', marginRight: '20px', fontSize: '13px', color: '#666' }}>
            <span style={{ marginRight: '12px' }}>📊 {validation.stats.paragraphs} paragraphs</span>
            <span style={{ marginRight: '12px' }}>📋 {validation.stats.tables} tables</span>
            <span style={{ marginRight: '12px' }}>💻 {validation.stats.codeBlocks} code blocks</span>
            <span>🏷️ {validation.stats.headings} headings</span>
          </div>
        )}
      </div>

      {/* Document Viewer */}
      <div
        className="document-viewer"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease',
          minHeight: '400px'
        }}
        dangerouslySetInnerHTML={{
          __html: processedHtml
        }}
      />
    </div>
  );
};

export default EnhancedDocumentRenderer;
