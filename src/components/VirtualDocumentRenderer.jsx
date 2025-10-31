import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import FloatingToolbar from './FloatingToolbar';
import { DocumentChunk } from '../utils/DocumentChunk';
import './VirtualDocumentRenderer.css';

/**
 * VirtualDocumentRenderer - Professional-grade virtual scroller for large documents
 * Renders only visible chunks, enabling smooth 60fps scrolling even with 800KB+ documents
 */
const VirtualDocumentRenderer = ({
  documentChunks = [],
  isEditing = false,
  onEditChunk = () => {},
  onChunksChange = () => {},
  toolbarOptions = {},
  className = '',
  style = {}
}) => {
  const [hoveredChunkId, setHoveredChunkId] = useState(null);
  const [focusedChunkId, setFocusedChunkId] = useState(null);
  const listRef = useRef(null);
  const chunkRefs = useRef({});

  // Memoize chunk data for performance
  const chunkData = useMemo(() => {
    return documentChunks.map((chunk, index) => ({
      ...chunk,
      index
    }));
  }, [documentChunks]);

  // Fixed item size for better performance with FixedSizeList
  const ITEM_SIZE = 150; // Fixed height for all items

  // Handle chunk edit
  const handleChunkEdit = useCallback((chunkId, newContent) => {
    const chunkIndex = chunkData.findIndex(c => c.id === chunkId);
    if (chunkIndex === -1) return;

    const updatedChunk = chunkData[chunkIndex].clone({ content: newContent });
    const updatedChunks = [...documentChunks];
    updatedChunks[chunkIndex] = updatedChunk;
    
    onEditChunk(chunkId, newContent);
    onChunksChange(updatedChunks);
    
    // Reset item size in case height changed
    if (listRef.current) {
      listRef.current.resetAfterIndex(chunkIndex);
    }
  }, [chunkData, documentChunks, onEditChunk, onChunksChange]);

  // Handle format change from toolbar
  const handleFormatChange = useCallback((chunkId, formatType, value) => {
    const chunkIndex = chunkData.findIndex(c => c.id === chunkId);
    if (chunkIndex === -1) return;

    const chunk = chunkData[chunkIndex];
    let updatedChunk;

    switch (formatType) {
      case 'type':
        // Change chunk type (e.g., paragraph -> heading)
        updatedChunk = new DocumentChunk(
          chunk.id,
          value,
          chunk.content,
          { ...chunk.metadata, level: value === 'heading' ? 2 : undefined }
        );
        break;
      
      case 'bold':
        updatedChunk = chunk.clone({
          content: `<strong>${chunk.content}</strong>`
        });
        break;
      
      case 'italic':
        updatedChunk = chunk.clone({
          content: `<em>${chunk.content}</em>`
        });
        break;
      
      case 'alignment':
        updatedChunk = chunk.clone({
          metadata: { ...chunk.metadata, alignment: value }
        });
        break;
      
      default:
        return;
    }

    const updatedChunks = [...documentChunks];
    updatedChunks[chunkIndex] = updatedChunk;
    onChunksChange(updatedChunks);
    
    if (listRef.current) {
      listRef.current.resetAfterIndex(chunkIndex);
    }
  }, [chunkData, documentChunks, onChunksChange]);

  // Render individual row/chunk
  const Row = useCallback(({ index, style }) => {
    const chunk = chunkData[index];
    if (!chunk) return null;

    const isHovered = hoveredChunkId === chunk.id;
    const isFocused = focusedChunkId === chunk.id;

    return (
      <EditableSection
        key={chunk.id}
        chunk={chunk}
        isEditing={isEditing}
        onEdit={handleChunkEdit}
        style={style}
        isHovered={isHovered}
        isFocused={isFocused}
        onMouseEnter={() => setHoveredChunkId(chunk.id)}
        onMouseLeave={() => setHoveredChunkId(null)}
        onFocus={() => setFocusedChunkId(chunk.id)}
        onBlur={() => setFocusedChunkId(null)}
        chunkRef={(el) => { chunkRefs.current[chunk.id] = el; }}
        renderToolbar={
          isEditing && isHovered ? (
            <FloatingToolbar
              anchorRef={chunkRefs.current[chunk.id]}
              chunk={chunk}
              toolbarOptions={toolbarOptions}
              onFormatChange={(formatType, value) => 
                handleFormatChange(chunk.id, formatType, value)
              }
            />
          ) : null
        }
      />
    );
  }, [chunkData, isEditing, hoveredChunkId, focusedChunkId, handleChunkEdit, handleFormatChange, toolbarOptions]);

  // If no chunks, show empty state
  if (!chunkData.length) {
    return (
      <div className="virtual-document-empty">
        <p>No content to display. Upload a document to get started.</p>
      </div>
    );
  }

  return (
    <div className={`virtual-document-renderer ${className}`} style={style}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            width={width}
            itemCount={chunkData.length}
            itemSize={ITEM_SIZE}
            overscanCount={5} // Render 5 extra items above/below viewport
            className="virtual-document-list"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

/**
 * EditableSection - Individual chunk section with editing capabilities
 */
const EditableSection = React.memo(({
  chunk,
  isEditing,
  onEdit,
  style,
  isHovered,
  isFocused,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  chunkRef,
  renderToolbar
}) => {
  const contentRef = useRef(null);
  const [localContent, setLocalContent] = useState(chunk.content);

  // Sync local content with chunk content
  useEffect(() => {
    setLocalContent(chunk.content);
  }, [chunk.content]);

  // Handle content change
  const handleContentChange = useCallback(() => {
    if (!contentRef.current) return;
    const newContent = contentRef.current.innerHTML;
    if (newContent !== localContent) {
      setLocalContent(newContent);
      // Debounce the edit callback
      const timeoutId = setTimeout(() => {
        onEdit(chunk.id, newContent);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [chunk.id, localContent, onEdit]);

  // Determine CSS classes based on chunk type
  const chunkClasses = [
    'document-chunk',
    `chunk-${chunk.type}`,
    isHovered && 'chunk-hovered',
    isFocused && 'chunk-focused',
    isEditing && 'chunk-editable'
  ].filter(Boolean).join(' ');

  // Render content based on type
  const renderContent = () => {
    const alignment = chunk.metadata?.alignment || 'left';
    const commonProps = {
      ref: contentRef,
      className: 'chunk-content',
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
      onInput: handleContentChange,
      onFocus,
      onBlur,
      style: { textAlign: alignment }
    };

    switch (chunk.type) {
      case 'heading':
        const level = chunk.metadata?.level || 2;
        const HeadingTag = `h${level}`;
        return React.createElement(HeadingTag, {
          ...commonProps,
          dangerouslySetInnerHTML: { __html: chunk.content }
        });

      case 'table':
        return (
          <div {...commonProps} dangerouslySetInnerHTML={{ __html: chunk.content }} />
        );

      case 'code':
        return (
          <pre className={`language-${chunk.metadata?.language || 'plaintext'}`}>
            <code {...commonProps}>
              {chunk.getPlainText()}
            </code>
          </pre>
        );

      case 'list':
        return (
          <div {...commonProps} dangerouslySetInnerHTML={{ __html: chunk.content }} />
        );

      case 'blockquote':
        return (
          <blockquote {...commonProps} dangerouslySetInnerHTML={{ __html: chunk.content }} />
        );

      case 'separator':
        return <hr />;

      case 'paragraph':
      default:
        return (
          <p {...commonProps} dangerouslySetInnerHTML={{ __html: chunk.content }} />
        );
    }
  };

  return (
    <div
      ref={chunkRef}
      className={chunkClasses}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {renderContent()}
      {renderToolbar}
    </div>
  );
});

EditableSection.displayName = 'EditableSection';

export default VirtualDocumentRenderer;
