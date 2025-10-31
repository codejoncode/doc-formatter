// Web Worker for processing large documents in background
// This prevents UI blocking during intensive formatting operations

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'PROCESS_CHUNK':
      processChunk(data);
      break;
    case 'FORMAT_TABLES':
      formatTables(data);
      break;
    case 'ANALYZE_DOCUMENT':
      analyzeDocument(data);
      break;
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown task type' });
  }
};

function processChunk({ chunk, chunkIndex, isFirst, isLast }) {
  try {
    let formatted = chunk;
    
    // Enterprise table formatting
    formatted = formatTablesInChunk(formatted);
    
    // Enhanced paragraph structure
    formatted = formatParagraphs(formatted);
    
    // Professional headings
    formatted = formatHeadings(formatted);
    
    // List optimization
    formatted = formatLists(formatted);
    
    // Code blocks and technical content
    formatted = formatCodeBlocks(formatted);
    
    // Citations and references
    formatted = formatCitations(formatted);
    
    self.postMessage({
      type: 'CHUNK_PROCESSED',
      data: {
        formattedChunk: formatted,
        chunkIndex,
        isComplete: isLast
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      chunkIndex
    });
  }
}

function formatTablesInChunk(text) {
  return text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g, (match) => {
    const lines = match.split('\n');
    const formattedLines = lines.map(line => {
      // Clean up cell spacing and alignment
      return line
        .replace(/\|\s*/g, '| ')
        .replace(/\s*\|/g, ' |')
        .replace(/\s+/g, ' ')
        .trim();
    });
    
    // Add separator row if missing
    if (formattedLines.length > 1 && !formattedLines[1].includes('---')) {
      const headerLine = formattedLines[0];
      const cellCount = (headerLine.match(/\|/g) || []).length - 1;
      
      if (cellCount > 0) {
        const separator = '|' + ' --- |'.repeat(cellCount);
        formattedLines.splice(1, 0, separator);
      }
    }
    
    // Ensure proper table spacing
    return '\n\n' + formattedLines.join('\n') + '\n\n';
  });
}

function formatParagraphs(text) {
  return text
    .replace(/\n{3,}/g, '\n\n') // Normalize spacing
    .replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2') // Paragraph breaks
    .replace(/([.!?])\s+(\d+\.)/g, '$1\n\n$2') // Before numbered lists
    .replace(/([.!?])\s+([-*+])/g, '$1\n\n$2') // Before bullet lists
    .replace(/([.!?])\s+(#{1,6}\s)/g, '$1\n\n$2'); // Before headings
}

function formatHeadings(text) {
  return text
    .replace(/^([A-Z][A-Z\s]{10,})$/gm, '\n# $1\n') // All caps titles
    .replace(/^(\d+\.\s+[A-Z][a-zA-Z\s]{5,})$/gm, '\n## $1\n') // Numbered sections
    .replace(/^\s*([A-Z][a-zA-Z\s]{3,}):?\s*$/gm, '\n### $1\n') // Section headers
    .replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
      // Ensure proper title case for headings
      const titleCase = text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      return `${hashes} ${titleCase}`;
    });
}

function formatLists(text) {
  return text
    .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ') // Normalize numbered lists
    .replace(/^\s*[-*+•]\s+/gm, '- ') // Normalize bullet lists
    .replace(/^(\s+)([a-z])[.)]\s+/gm, '$1$2. ') // Sub-lists
    .replace(/^(\s+)[-*+•]\s+/gm, '$1- '); // Sub-bullets
}

function formatCodeBlocks(text) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const cleanCode = code.trim();
      const language = lang || '';
      return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`;
    })
    .replace(/`([^`\n]+)`/g, '`$1`') // Inline code
    .replace(/^\s{4,}(.+)$/gm, '    $1'); // Indented code blocks
}

function formatCitations(text) {
  return text
    .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>') // Numbered citations
    .replace(/\(([^)]+,\s*\d{4})\)/g, '($1)') // Author-year citations
    .replace(/\b(et al\.)\b/g, '*$1*') // Italicize et al.
    .replace(/\b(ibid\.?)\b/gi, '*$1*'); // Italicize ibid
}

function analyzeDocument({ text }) {
  try {
    const analysis = {
      characters: text.length,
      words: text.split(/\s+/).filter(word => word.length > 0).length,
      paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      lines: text.split('\n').length,
      tables: (text.match(/\|.*\|/g) || []).length,
      headings: {
        h1: (text.match(/^#{1}\s/gm) || []).length,
        h2: (text.match(/^#{2}\s/gm) || []).length,
        h3: (text.match(/^#{3}\s/gm) || []).length,
        total: (text.match(/^#{1,6}\s/gm) || []).length
      },
      lists: {
        numbered: (text.match(/^\s*\d+\.\s/gm) || []).length,
        bulleted: (text.match(/^\s*[-*+]\s/gm) || []).length
      },
      codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
      inlineCode: (text.match(/`[^`\n]+`/g) || []).length,
      links: (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
      images: (text.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length,
      estimatedReadTime: Math.ceil(text.split(/\s+/).length / 250), // 250 words per minute
      complexity: calculateComplexity(text)
    };
    
    self.postMessage({
      type: 'DOCUMENT_ANALYZED',
      data: analysis
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}

function calculateComplexity(text) {
  let score = 0;
  
  // Sentence length complexity
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  if (avgSentenceLength > 20) score += 2;
  else if (avgSentenceLength > 15) score += 1;
  
  // Technical terms
  const technicalTerms = text.match(/\b(algorithm|implementation|framework|architecture|methodology|infrastructure|optimization|synchronization|serialization|virtualization)\b/gi) || [];
  score += Math.min(technicalTerms.length / 10, 3);
  
  // Nested structures
  const nestedLists = text.match(/^\s{4,}[-*+\d]/gm) || [];
  score += Math.min(nestedLists.length / 5, 2);
  
  // Tables and code blocks
  const tables = text.match(/\|.*\|/g) || [];
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  score += Math.min((tables.length + codeBlocks.length) / 5, 3);
  
  return Math.min(Math.round(score), 10); // Scale 0-10
}

function formatTables({ text }) {
  try {
    const formatted = formatTablesInChunk(text);
    self.postMessage({
      type: 'TABLES_FORMATTED',
      data: formatted
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}