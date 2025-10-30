import React, { useState, useRef } from 'react';
import './FileUpload.css';
import { validateFile, parseFile } from '../utils/fileParser';

const FileUpload = ({ onFileContent, onError, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const content = await parseFile(file);
      onFileContent(content, {
        name: file.name,
        size: file.size,
        type: file.type
      });
    } catch (error) {
      const errorMessage = error.message;
      setUploadError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload-container ${className}`}>
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.html,.md,.docx,.doc,.pdf,.odt,.rtf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {isUploading ? (
            <div className="uploading-state">
              <div className="spinner"></div>
              <p>Processing file...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <h3>Upload Document</h3>
                <p>Drag and drop your file here, or <span className="click-text">click to browse</span></p>
                <p className="file-info">
                  Supported formats: TXT, HTML, MD, DOCX, DOC, PDF, ODT, RTF
                  <br />
                  Maximum size: {formatFileSize(20 * 1024 * 1024)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{uploadError}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;