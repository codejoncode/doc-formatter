import React, { useState, useRef, useEffect } from 'react';
import './FloatingToolbar.css';

/**
 * FloatingToolbar - Contextual formatting toolbar that appears on hover
 * Provides per-section editing controls for professional document formatting
 */
const FloatingToolbar = ({ anchorRef, chunk, toolbarOptions = {}, onFormatChange }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef(null);

  // Update toolbar position based on anchor element
  useEffect(() => {
    if (!anchorRef) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      const anchorRect = anchorRef.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setPosition({
        top: anchorRect.top + scrollTop - 50, // Position above the chunk
        left: anchorRect.right + scrollLeft + 10 // Position to the right
      });
      setIsVisible(true);
    };

    updatePosition();

    // Update position on scroll/resize
    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [anchorRef]);

  if (!isVisible || !chunk) return null;

  // Toolbar configuration
  const typeOptions = toolbarOptions.showTypeSelector !== false ? [
    { value: 'paragraph', label: 'Paragraph', icon: '¶' },
    { value: 'heading', label: 'Heading', icon: 'H' },
    { value: 'list', label: 'List', icon: '•' },
    { value: 'code', label: 'Code', icon: '</>' },
    { value: 'blockquote', label: 'Quote', icon: '"' },
    { value: 'table', label: 'Table', icon: '⊞' }
  ] : [];

  const handleTypeChange = (newType) => {
    onFormatChange('type', newType);
  };

  const handleStyleChange = (styleType) => {
    onFormatChange(styleType, true);
  };

  const handleAlignmentChange = (alignment) => {
    onFormatChange('alignment', alignment);
  };

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000
      }}
    >
      {/* Type Selector */}
      {typeOptions.length > 0 && (
        <div className="toolbar-section">
          <label className="toolbar-label">Type:</label>
          <select
            className="toolbar-select"
            value={chunk.type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Style Buttons */}
      {toolbarOptions.showStyleButtons !== false && (
        <div className="toolbar-section toolbar-buttons">
          <button
            className="toolbar-button"
            onClick={() => handleStyleChange('bold')}
            title="Bold"
            aria-label="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleStyleChange('italic')}
            title="Italic"
            aria-label="Italic"
          >
            <em>I</em>
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleStyleChange('underline')}
            title="Underline"
            aria-label="Underline"
          >
            <u>U</u>
          </button>
        </div>
      )}

      {/* Alignment Buttons */}
      {toolbarOptions.showAlignmentButtons !== false && (
        <div className="toolbar-section toolbar-buttons">
          <button
            className="toolbar-button"
            onClick={() => handleAlignmentChange('left')}
            title="Align Left"
            aria-label="Align Left"
          >
            ⬅
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleAlignmentChange('center')}
            title="Align Center"
            aria-label="Align Center"
          >
            ⬌
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleAlignmentChange('right')}
            title="Align Right"
            aria-label="Align Right"
          >
            ➡
          </button>
        </div>
      )}

      {/* Heading Level Selector (only for headings) */}
      {chunk.type === 'heading' && toolbarOptions.showHeadingLevel !== false && (
        <div className="toolbar-section">
          <label className="toolbar-label">Level:</label>
          <select
            className="toolbar-select toolbar-select-small"
            value={chunk.metadata?.level || 2}
            onChange={(e) => onFormatChange('headingLevel', parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map(level => (
              <option key={level} value={level}>H{level}</option>
            ))}
          </select>
        </div>
      )}

      {/* Code Language Selector (only for code blocks) */}
      {chunk.type === 'code' && toolbarOptions.showLanguageSelector !== false && (
        <div className="toolbar-section">
          <label className="toolbar-label">Language:</label>
          <select
            className="toolbar-select"
            value={chunk.metadata?.language || 'plaintext'}
            onChange={(e) => onFormatChange('language', e.target.value)}
          >
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="sql">SQL</option>
            <option value="bash">Bash</option>
          </select>
        </div>
      )}

      {/* Delete Button */}
      {toolbarOptions.showDeleteButton !== false && (
        <div className="toolbar-section">
          <button
            className="toolbar-button toolbar-button-danger"
            onClick={() => onFormatChange('delete', true)}
            title="Delete Section"
            aria-label="Delete Section"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingToolbar;
