import React, { useState } from 'react';
import './App.css';
import DocumentFormatter from './components/DocumentFormatterEnterprise';
import PDFGenerator from './components/PDFGenerator';
import { formatContentWithAI } from './utils/formatContentWithAI';

function App() {
  const [content, setContent] = useState('');
  const [codeInstructions, setCodeInstructions] = useState('');
  const [formattedContent, setFormattedContent] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormat = () => {
    setIsFormatting(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const formatted = formatContentWithAI(content, codeInstructions);
      setFormattedContent(formatted);
      setIsFormatting(false);
    }, 2000);
  };



  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Document Formatter</h1>
        <p>Transform raw content into professional PDFs in minutes</p>
      </header>
      
      <main className="App-main">
        <DocumentFormatter
          content={content}
          setContent={setContent}
          codeInstructions={codeInstructions}
          setCodeInstructions={setCodeInstructions}
          formattedContent={formattedContent}
          isFormatting={isFormatting}
          onFormat={handleFormat}
        />
        
        {formattedContent && (
          <PDFGenerator 
            content={formattedContent}
            originalContent={content}
          />
        )}
      </main>
    </div>
  );
}

export default App;
