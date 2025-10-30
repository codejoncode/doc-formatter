import React, { useState } from 'react';
import './App.css';
import DocumentFormatter from './components/DocumentFormatter';
import PDFGenerator from './components/PDFGenerator';

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

  const formatContentWithAI = (text, instructions) => {
    if (!text.trim()) return '';
    
    let formatted = text;
    const lines = formatted.split('\n');
    let result = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines but preserve them
      if (!trimmed) {
        if (!inCodeBlock) {
          result.push('');
        } else {
          codeBlockContent.push(line);
        }
        continue;
      }
      
      // Detect code blocks (lines with special programming characters)
      const isCode = /^(SELECT|FROM|WHERE|const|let|var|function|def |class |import |public |private |\{|\}|;$|=>)/.test(trimmed) ||
                     (/[{}();]/.test(trimmed) && trimmed.length < 100);
      
      if (isCode && !inCodeBlock) {
        inCodeBlock = true;
        codeBlockContent = [line];
      } else if (inCodeBlock && !isCode && trimmed) {
        // End code block
        result.push('```javascript');
        result.push(...codeBlockContent);
        result.push('```');
        result.push('');
        inCodeBlock = false;
        codeBlockContent = [];
        
        // Process current line
        if (isAllCaps(trimmed)) {
          result.push(`# ${trimmed}`);
        } else if (isTitleCase(trimmed) && trimmed.length < 60) {
          result.push(`## ${trimmed}`);
        } else {
          result.push(line);
        }
      } else if (inCodeBlock) {
        codeBlockContent.push(line);
      } else {
        // Format headers
        if (isAllCaps(trimmed) && trimmed.length < 60) {
          result.push(`# ${trimmed}`);
        } else if (isTitleCase(trimmed) && trimmed.length < 60 && !trimmed.includes('.')) {
          result.push(`## ${trimmed}`);
        } else if (/^\d+\.\s/.test(trimmed)) {
          // Numbered list
          result.push(line);
        } else if (/^[-*]\s/.test(trimmed)) {
          // Bullet list
          result.push(line);
        } else {
          // Regular paragraph - bold important terms
          let processedLine = line;
          const importantWords = ['Revenue', 'Growth', 'Key', 'Important', 'Critical', 'Summary'];
          importantWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            processedLine = processedLine.replace(regex, `**${word}**`);
          });
          result.push(processedLine);
        }
      }
    }
    
    // Close any remaining code block
    if (inCodeBlock) {
      result.push('```javascript');
      result.push(...codeBlockContent);
      result.push('```');
    }
    
    return result.join('\n');
  };

  const isAllCaps = (str) => {
    return str === str.toUpperCase() && /[A-Z]/.test(str);
  };

  const isTitleCase = (str) => {
    const words = str.split(' ');
    return words.length <= 6 && words.every(word => 
      word.length > 0 && word[0] === word[0].toUpperCase()
    );
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
