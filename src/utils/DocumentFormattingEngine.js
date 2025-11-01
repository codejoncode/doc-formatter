// Intelligent Document Formatting Engine with AI-powered analysis
import { DocumentPerformanceMonitor } from './performanceUtils';

export class DocumentFormattingEngine {
  constructor(options = {}) {
    this.options = {
      strictMode: true,
      autoDetectLanguages: true,
      enterpriseMode: true,
      generateTOC: true,
      linkReferences: true,
      ...options
    };
    
    this.performanceMonitor = new DocumentPerformanceMonitor();
    this.documentStructure = null;
    this.formattingRules = this.initializeFormattingRules();
  }

  // Initialize enterprise formatting rules
  initializeFormattingRules() {
    return {
      headers: {
        detectAllCaps: true,
        detectColons: true,
        detectNumbers: true,
        detectKeywords: true,
        enforceHierarchy: true,
        titleCase: true
      },
      lists: {
        normalizeMarkers: true,
        enforceIndentation: true,
        detectSubLists: true,
        smartSpacing: true
      },
      tables: {
        autoAlign: true,
        addSeparators: true,
        enforceStructure: true,
        responsiveDesign: true
      },
      code: {
        autoDetectLanguage: true,
        syntaxHighlighting: true,
        properIndentation: true,
        blockDetection: true
      },
      references: {
        autoLink: true,
        generateAppendix: true,
        crossReference: true,
        citationFormat: 'academic'
      },
      typography: {
        smartQuotes: true,
        properSpacing: true,
        paragraphBreaks: true,
        lineBreaks: true
      }
    };
  }

  // Main formatting function with AI analysis
  async formatDocument(text, customRules = {}) {
    // Validate input
    if (text === null || text === undefined) {
      throw new Error('Text input cannot be null or undefined');
    }
    
    // Convert to string if needed
    text = String(text);
    
    this.performanceMonitor.startTimer('documentFormatting');
    
    try {
      // Merge custom rules
      const rules = { ...this.formattingRules, ...customRules };
      
      // Step 1: Analyze document structure
      this.documentStructure = await this.analyzeDocumentStructure(text);
      
      // Step 2: Apply intelligent formatting
      let formattedText = await this.applyIntelligentFormatting(text, rules);
      
      // Step 3: Generate table of contents
      if (rules.references.generateAppendix) {
        formattedText = this.generateTableOfContents(formattedText);
      }
      
      // Step 4: Create cross-references and appendix
      if (rules.references.autoLink) {
        formattedText = this.createCrossReferences(formattedText);
      }
      
      // Step 5: Final cleanup and validation
      formattedText = this.finalCleanup(formattedText);
      
      this.performanceMonitor.endTimer('documentFormatting');
      
      return {
        formattedText,
        structure: this.documentStructure,
        metadata: this.generateMetadata(formattedText)
      };
      
    } catch (error) {
      console.error('Formatting error:', error);
      throw new Error(`Document formatting failed: ${error.message}`);
    }
  }

  // AI-powered document structure analysis
  async analyzeDocumentStructure(text) {
    const structure = {
      sections: [],
      headers: [],
      lists: [],
      tables: [],
      codeBlocks: [],
      references: [],
      appendices: [],
      metadata: {}
    };

    // Detect headers using multiple patterns
    structure.headers = this.detectHeaders(text);
    
    // Detect code blocks and inline code
    structure.codeBlocks = this.detectCodeBlocks(text);
    
    // Detect lists and their hierarchy
    structure.lists = this.detectLists(text);
    
    // Detect tables
    structure.tables = this.detectTables(text);
    
    // Detect references and citations
    structure.references = this.detectReferences(text);
    
    // Detect appendices and sections
    structure.appendices = this.detectAppendices(text);
    
    // Build document hierarchy
    structure.sections = this.buildDocumentHierarchy(structure.headers);
    
    return structure;
  }

  // Advanced header detection with AI patterns
  detectHeaders(text) {
    const headers = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      let level = 0;
      let headerText = trimmed;
      let confidence = 0;
      
      // Pattern 1: Existing markdown headers
      const markdownMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (markdownMatch) {
        level = markdownMatch[1].length;
        headerText = markdownMatch[2];
        confidence = 0.95;
      }
      
      // Pattern 2: ALL CAPS (likely headers)
      else if (trimmed.match(/^[A-Z][A-Z\s]{8,}[A-Z]$/) && trimmed.length < 100) {
        level = this.determineHeaderLevel(trimmed, index, lines);
        headerText = this.toTitleCase(trimmed);
        confidence = 0.85;
      }
      
      // Pattern 3: Numbered sections (1.1, 2.3.1, etc.)
      // eslint-disable-next-line no-useless-escape
      else if (trimmed.match(/^\d+(\.\d+)*[\.\)]\s+[A-Z].{5,80}$/)) {
        const numbering = trimmed.match(/^(\d+(?:\.\d+)*)/)[1];
        level = numbering.split('.').length;
        // eslint-disable-next-line no-useless-escape
        headerText = trimmed.replace(/^\d+(\.\d+)*[\.\)]\s+/, '');
        confidence = 0.90;
      }
      
      // Pattern 4: Colon endings (Section Headers:)
      else if (trimmed.match(/^[A-Z][a-zA-Z\s]{5,50}:$/) && !trimmed.includes('.')) {
        level = this.determineHeaderLevel(trimmed, index, lines);
        headerText = trimmed.replace(/:$/, '');
        confidence = 0.75;
      }
      
      // Pattern 5: Bold indicators (**Header**)
      else if (trimmed.match(/^\*\*[^*]+\*\*$/) && trimmed.length < 80) {
        level = this.determineHeaderLevel(trimmed, index, lines);
        headerText = trimmed.replace(/\*\*/g, '');
        confidence = 0.80;
      }
      
      // Pattern 6: Underlined headers
      else if (index < lines.length - 1) {
        const nextLine = lines[index + 1].trim();
        // eslint-disable-next-line no-useless-escape
        if (nextLine.match(/^[=\-]{3,}$/) && nextLine.length >= trimmed.length * 0.8) {
          level = nextLine[0] === '=' ? 1 : 2;
          headerText = trimmed;
          confidence = 0.90;
        }
      }
      
      // Pattern 7: Key document sections
      else if (this.isKeyDocumentSection(trimmed)) {
        level = this.determineHeaderLevel(trimmed, index, lines);
        headerText = this.toTitleCase(trimmed);
        confidence = 0.88;
      }
      
      if (confidence > 0.7) {
        headers.push({
          text: headerText,
          level,
          line: index,
          confidence,
          originalText: trimmed
        });
      }
    });
    
    return this.refineHeaderHierarchy(headers);
  }

  // Intelligent code block detection
  detectCodeBlocks(text) {
    const codeBlocks = [];
    
    // Pattern 1: Fenced code blocks
    const fencedPattern = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = fencedPattern.exec(text)) !== null) {
      codeBlocks.push({
        type: 'fenced',
        language: match[1] || this.detectLanguage(match[2]),
        code: match[2],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Pattern 2: Indented code blocks
    const lines = text.split('\n');
    let inCodeBlock = false;
    let currentBlock = [];
    let blockStart = -1;
    
    lines.forEach((line, index) => {
      // eslint-disable-next-line no-regex-spaces
      const isCodeLine = line.match(/^    [^\s]/) || line.match(/^\t[^\s]/);
      
      if (isCodeLine && !inCodeBlock) {
        inCodeBlock = true;
        blockStart = index;
        currentBlock = [line];
      } else if (isCodeLine && inCodeBlock) {
        currentBlock.push(line);
      } else if (!isCodeLine && inCodeBlock) {
        if (currentBlock.length >= 2) {
          // eslint-disable-next-line no-regex-spaces
          const codeContent = currentBlock.join('\n').replace(/^    /gm, '');
          codeBlocks.push({
            type: 'indented',
            language: this.detectLanguage(codeContent),
            code: codeContent,
            startLine: blockStart,
            endLine: index - 1
          });
        }
        inCodeBlock = false;
        currentBlock = [];
      }
    });
    
    // Pattern 3: Inline code
    const inlinePattern = /`([^`\n]+)`/g;
    const inlineMatches = [];
    while ((match = inlinePattern.exec(text)) !== null) {
      inlineMatches.push({
        type: 'inline',
        code: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return { blocks: codeBlocks, inline: inlineMatches };
  }

  // Advanced language detection for code blocks
  detectLanguage(code) {
    const patterns = {
      javascript: [
        /\b(function|const|let|var|=>|async|await)\b/,
        /\.(map|filter|reduce|forEach)\(/,
        /require\(['"][^'"]+['"]\)/,
        /import.*from\s+['"].+['"]/
      ],
      python: [
        /\b(def|class|import|from|if __name__|print)\b/,
        /\.(append|extend|split|join)\(/,
        /#.*$/m,
        /\bself\b/
      ],
      java: [
        /\b(public|private|protected|class|interface)\b/,
        /System\.out\.println/,
        /\bstatic\s+void\s+main\b/,
        /@Override/
      ],
      csharp: [
        /\b(using|namespace|class|public|private)\b/,
        /Console\.WriteLine/,
        /\bstring\b/,
        /\[.*\]/
      ],
      sql: [
        /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE)\b/i,
        /\bJOIN\b/i,
        /\bGROUP BY\b/i,
        /\bORDER BY\b/i
      ],
      html: [
        /<\/?[a-z][\s\S]*>/i,
        /<!DOCTYPE/i,
        /<html>/i,
        /<head>/i
      ],
      css: [
        /\{[^}]*\}/,
        /\.[a-zA-Z-]+\s*\{/,
        /#[a-zA-Z-]+\s*\{/,
        /@media/
      ],
      json: [
        /^\s*\{[\s\S]*\}\s*$/,
        /^\s*\[[\s\S]*\]\s*$/,
        /"[^"]*"\s*:/,
        /\{[\s\S]*"[^"]*"[\s\S]*\}/
      ]
    };
    
    for (const [language, regexes] of Object.entries(patterns)) {
      const matches = regexes.filter(regex => regex.test(code)).length;
      if (matches >= 2) {
        return language;
      }
    }
    
    return 'text';
  }

  // Apply intelligent formatting based on rules
  async applyIntelligentFormatting(text, rules) {
    let formatted = text;
    
    // Step 1: Format headers
    if (rules.headers) {
      formatted = this.formatHeaders(formatted, rules.headers);
    }
    
    // Step 2: Format lists
    if (rules.lists) {
      formatted = this.formatLists(formatted, rules.lists);
    }
    
    // Step 3: Format tables
    if (rules.tables) {
      formatted = this.formatTables(formatted, rules.tables);
    }
    
    // Step 4: Format code blocks
    if (rules.code) {
      formatted = this.formatCodeBlocks(formatted, rules.code);
    }
    
    // Step 5: Apply typography rules
    if (rules.typography) {
      formatted = this.applyTypographyRules(formatted, rules.typography);
    }
    
    return formatted;
  }

  // Advanced header formatting
  formatHeaders(text, rules) {
    const lines = text.split('\n');
    // eslint-disable-next-line no-unused-vars
    const formattedLines = [];
    
    this.documentStructure.headers.forEach(header => {
      const lineIndex = header.line;
      // eslint-disable-next-line no-unused-vars
      const originalLine = lines[lineIndex];
      
      if (rules.enforceHierarchy && rules.titleCase) {
        const hashes = '#'.repeat(header.level);
        const titleCaseText = this.toTitleCase(header.text);
        lines[lineIndex] = `${hashes} ${titleCaseText}`;
      }
    });
    
    return lines.join('\n');
  }

  // Enhanced list formatting
  formatLists(text, rules) {
    if (!rules.normalizeMarkers) return text;
    
    return text
      .replace(/^\s*[-*+•]\s+/gm, '- ') // Normalize bullet points
      .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ') // Normalize numbered lists
      .replace(/^(\s+)[-*+•]\s+/gm, '$1- ') // Sub-bullets
      .replace(/^(\s+)(\d+)[.)]\s+/gm, '$1$2. '); // Sub-numbers
  }

  // Generate table of contents
  generateTableOfContents(text) {
    if (!this.documentStructure.headers.length) return text;
    
    const toc = ['# Table of Contents\n'];
    
    this.documentStructure.headers.forEach(header => {
      const indent = '  '.repeat(header.level - 1);
      const anchor = this.createAnchor(header.text);
      toc.push(`${indent}- [${header.text}](#${anchor})`);
    });
    
    toc.push('\n---\n');
    
    return toc.join('\n') + text;
  }

  // Create cross-references and appendix
  createCrossReferences(text) {
    // Find all references in the document
    // eslint-disable-next-line no-unused-vars
    const references = this.documentStructure.references;
    const appendixItems = [];
    
    // Generate appendix for sections
    this.documentStructure.headers.forEach((header, index) => {
      if (header.level <= 2) {
        const anchor = this.createAnchor(header.text);
        appendixItems.push(`[${index + 1}]: #${anchor} "${header.text}"`);
      }
    });
    
    // Add appendix at the end
    if (appendixItems.length > 0) {
      text += '\n\n---\n\n## Appendix - Section References\n\n';
      text += appendixItems.join('\n');
    }
    
    return text;
  }

  // Utility functions
  toTitleCase(text) {
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  createAnchor(text) {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  determineHeaderLevel(text, index, lines) {
    // Simple heuristic based on context and formatting
    if (text.length < 20 && text.toUpperCase() === text) return 1;
    if (text.match(/^\d+\.\s/)) return 2;
    if (text.match(/^\d+\.\d+\s/)) return 3;
    if (text.includes(':')) return 4;
    return 2; // Default
  }

  isKeyDocumentSection(text) {
    const keywordPatterns = [
      /^(abstract|introduction|methodology|results|conclusion|references|appendix|summary|overview)$/i,
      /^(background|literature review|discussion|limitations|future work)$/i,
      /^(executive summary|table of contents|acknowledgments)$/i
    ];
    
    return keywordPatterns.some(pattern => pattern.test(text));
  }

  refineHeaderHierarchy(headers) {
    // Ensure proper hierarchy (no level jumps)
    const refined = [];
    let currentLevel = 0;
    
    headers.forEach(header => {
      if (header.level > currentLevel + 1) {
        header.level = currentLevel + 1;
      }
      currentLevel = header.level;
      refined.push(header);
    });
    
    return refined;
  }

  detectLists(text) {
    // Implementation for list detection
    return [];
  }

  detectTables(text) {
    // Enhanced table detection
    const tables = [];
    const tablePattern = /(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g;
    let match;
    
    while ((match = tablePattern.exec(text)) !== null) {
      tables.push({
        content: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return tables;
  }

  detectReferences(text) {
    // Implementation for reference detection
    return [];
  }

  detectAppendices(text) {
    // Implementation for appendix detection
    return [];
  }

  buildDocumentHierarchy(headers) {
    // Build nested structure of document sections
    const sections = [];
    const stack = [];
    
    headers.forEach(header => {
      while (stack.length > 0 && stack[stack.length - 1].level >= header.level) {
        stack.pop();
      }
      
      const section = {
        ...header,
        children: [],
        parent: stack.length > 0 ? stack[stack.length - 1] : null
      };
      
      if (section.parent) {
        section.parent.children.push(section);
      } else {
        sections.push(section);
      }
      
      stack.push(section);
    });
    
    return sections;
  }

  formatTables(text, rules) {
    return text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g, (match) => {
      const lines = match.split('\n');
      const formattedLines = lines.map(line => {
        return line.replace(/\|\s*/g, '| ').replace(/\s*\|/g, ' |');
      });
      
      // Add separator if missing
      if (formattedLines.length > 1 && !formattedLines[1].includes('---')) {
        const headerCols = (formattedLines[0].match(/\|/g) || []).length - 1;
        const separator = '|' + ' --- |'.repeat(headerCols);
        formattedLines.splice(1, 0, separator);
      }
      
      return '\n' + formattedLines.join('\n') + '\n';
    });
  }

  formatCodeBlocks(text, rules) {
    // Format fenced code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || this.detectLanguage(code);
      const cleanCode = code.trim();
      return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`;
    });
    
    return text;
  }

  applyTypographyRules(text, rules) {
    if (rules.smartQuotes) {
      text = text
        .replace(/"/g, '\u201C')
        .replace(/"/g, '\u201D')
        .replace(/'/g, '\u2018')
        .replace(/'/g, '\u2019');
    }
    
    if (rules.properSpacing) {
      text = text
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/([.!?])\s*([A-Z])/g, '$1  $2');
    }
    
    return text;
  }

  finalCleanup(text) {
    return text
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces
      .replace(/\n{4,}/g, '\n\n\n') // Limit consecutive newlines
      .trim();
  }

  generateMetadata(text) {
    return {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      headerCount: this.documentStructure.headers.length,
      codeBlockCount: this.documentStructure.codeBlocks.blocks?.length || 0,
      tableCount: this.documentStructure.tables.length,
      readingTime: Math.ceil(text.split(/\s+/).length / 250),
      formattingRulesApplied: Object.keys(this.formattingRules).length
    };
  }
}

export default DocumentFormattingEngine;