/**
 * HTML Normalizer Service
 * Preserves document structure while cleaning and normalizing HTML
 * CRITICAL: Maintains page count, spacing, tables, and code blocks
 * OPTIMIZED: Fast processing for large documents
 */

export class HTMLNormalizer {
  /**
   * Normalize HTML to preserve structure - FAST VERSION
   */
  static normalize(html) {
    if (!html) return '';
    if (html.length < 1000) return html; // Skip normalization for tiny content

    // FAST PATH: For large documents, do minimal processing
    // Only sanitize and add basic classes
    return this.sanitize(html);
  }

  /**
   * LEGACY: Full normalization (slow, only use for small docs)
   */
  static normalizeFull(html) {
    if (!html) return '';

    let normalized = html;

    // 1. Preserve code blocks (protect them first)
    const codeBlocks = [];
    const codeBlockRegex = /<pre[^>]*>[\s\S]*?<\/pre>/gi;
    normalized = normalized.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 2. Preserve inline code
    const inlineCode = [];
    const inlineCodeRegex = /<code[^>]*>[\s\S]*?<\/code>/gi;
    normalized = normalized.replace(inlineCodeRegex, (match) => {
      inlineCode.push(match);
      return `__INLINE_CODE_${inlineCode.length - 1}__`;
    });

    // 3. Preserve tables (protect them)
    const tables = [];
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    normalized = normalized.replace(tableRegex, (match) => {
      tables.push(match);
      return `__TABLE_${tables.length - 1}__`;
    });

    // 4. Clean up excessive whitespace but PRESERVE structure
    // DO NOT collapse newlines - this destroys page count
    normalized = normalized.replace(/>\s+</g, '><');

    // 5. Ensure proper heading hierarchy
    normalized = this.normalizeHeadings(normalized);

    // 6. Ensure paragraphs are wrapped
    normalized = this.ensureParagraphWrapping(normalized);

    // 7. Fix list formatting
    normalized = this.fixListFormatting(normalized);

    // 8. Restore code blocks with proper formatting
    codeBlocks.forEach((block, index) => {
      normalized = normalized.replace(
        `__CODE_BLOCK_${index}__`,
        this.normalizeCodeBlock(block)
      );
    });

    // 9. Restore inline code
    inlineCode.forEach((code, index) => {
      normalized = normalized.replace(
        `__INLINE_CODE_${index}__`,
        this.normalizeInlineCode(code)
      );
    });

    // 10. Restore tables with proper formatting
    tables.forEach((table, index) => {
      normalized = normalized.replace(
        `__TABLE_${index}__`,
        this.normalizeTable(table)
      );
    });

    return normalized;
  }

  /**
   * Normalize code blocks to preserve formatting
   */
  static normalizeCodeBlock(html) {
    // Extract language if present
    const langMatch = html.match(/class=["'](?:language-)?(\w+)["']/i);
    const language = langMatch ? langMatch[1] : '';

    // Extract content
    let content = html.replace(/<pre[^>]*>/i, '').replace(/<\/pre>/i, '');
    content = content.replace(/<code[^>]*>/i, '').replace(/<\/code>/i, '');

    // Preserve whitespace and line breaks - CRITICAL
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');

    // Trim only leading/trailing, preserve internal spacing
    content = content.trim();

    // Add language indicator
    const dataLang = language ? ` data-language="${language}"` : '';

    return `<pre${dataLang}><code>${content}</code></pre>`;
  }

  /**
   * Normalize inline code
   */
  static normalizeInlineCode(html) {
    let content = html.replace(/<code[^>]*>/i, '').replace(/<\/code>/i, '');
    // Unescape HTML entities
    content = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    return `<code>${content}</code>`;
  }

  /**
   * Normalize heading hierarchy
   */
  static normalizeHeadings(html) {
    // Don't force h1 if it doesn't exist - preserve original structure
    // Just ensure consistent formatting
    return html;
  }

  /**
   * Ensure proper paragraph wrapping
   */
  static ensureParagraphWrapping(html) {
    let content = html;

    // Just ensure proper spacing around block elements
    // DO NOT wrap everything in <p> tags - this destroys structure
    content = content.replace(/(<\/(p|div|h[1-6]|blockquote)>)(\S)/g, '$1\n<p>$3');

    return content;
  }

  /**
   * Fix list formatting
   */
  static fixListFormatting(html) {
    let content = html;

    // Ensure lists have proper structure
    content = content.replace(/<li>([\s\S]*?)<\/li>/gi, '<li>$1</li>\n');
    content = content.replace(/(<li>.*?<\/li>)/gi, function (match) {
      if (!match.includes('<ul') && !match.includes('<ol')) {
        return match.replace(/\n/g, '');
      }
      return match;
    });

    return content;
  }

  /**
   * Normalize table formatting - PRESERVE ALL TABLES
   */
  static normalizeTable(html) {
    let table = html;

    // Ensure table has proper thead/tbody if first row has th
    if (!/<thead/i.test(table) && /<tr/i.test(table)) {
      const firstTr = /<tr[^>]*>([\s\S]*?)<\/tr>/i.exec(table);
      if (firstTr && /<th/i.test(firstTr[0])) {
        table = table.replace(
          /<tr[^>]*>([\s\S]*?)<\/tr>/i,
          '<thead><tr>$1</tr></thead><tbody>'
        );
        table = table.replace(/<\/table>/i, '</tbody></table>');
      } else if (firstTr) {
        // No th tags, add tbody wrapper
        table = table.replace(/<table([^>]*)>/, '<table$1><tbody>');
        table = table.replace(/<\/table>/i, '</tbody></table>');
      }
    }

    // Preserve table formatting - don't collapse whitespace
    return table;
  }

  /**
   * Remove dangerous/malicious content - OPTIMIZED FOR SPEED
   */
  static sanitize(html) {
    if (!html) return '';
    
    // FAST PATH: If no dangerous patterns, return as-is
    if (!/<script|on\w+=|<iframe|<embed/i.test(html)) {
      return html;
    }

    let sanitized = html;

    // Remove script tags (fast)
    if (/<script/i.test(sanitized)) {
      sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    }

    // Remove event handlers (fast check first)
    if (/\son\w+=/i.test(sanitized)) {
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    }

    // Remove problematic tags (only if they exist)
    if (/<iframe|<embed|<object/i.test(sanitized)) {
      sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');
      sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
    }

    return sanitized;
  }

  /**
   * Validate document structure
   */
  static validate(html) {
    const issues = [];

    if (!html || html.trim().length === 0) {
      issues.push('Empty HTML content');
      return { isValid: false, issues };
    }

    // Check for basic structure
    if (!/<body|<div|<article|<main|<p|<h[1-6]/i.test(html)) {
      issues.push('Missing body/container element or content');
    }

    // Check for severely malformed HTML (unclosed tags)
    const openTags = (html.match(/<(?!\/)[^>]+>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]+>/g) || []).length;
    const selfClosing = (html.match(/<[^>]+\/>/g) || []).length;
    
    const expectedClose = openTags - selfClosing;
    const tolerance = Math.floor(expectedClose * 0.1); // 10% tolerance
    
    if (Math.abs(expectedClose - closeTags) > tolerance) {
      issues.push(`Possible unclosed tags (${openTags} open, ${closeTags} close, ${selfClosing} self-closing)`);
    }

    // Check for tables
    const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
    tables.forEach((table, idx) => {
      if (!/<tr/i.test(table)) {
        issues.push(`Table ${idx + 1}: Missing table rows`);
      }
    });

    // Check for code blocks
    const codeBlocks = html.match(/<pre[^>]*>[\s\S]*?<\/pre>/gi) || [];
    if (codeBlocks.length > 0) {
      console.log(`Found ${codeBlocks.length} code blocks`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      stats: {
        tables: tables.length,
        codeBlocks: codeBlocks.length,
        headings: (html.match(/<h[1-6][^>]*>/gi) || []).length,
        paragraphs: (html.match(/<p[^>]*>/gi) || []).length
      }
    };
  }

  /**
   * Detect language from code content
   */
  static detectLanguage(code) {
    // Simple language detection based on patterns
    if (/^(function|const|let|var|class|import|export)/m.test(code)) {
      return 'javascript';
    }
    if (/^(def |class |import |from )/m.test(code)) {
      return 'python';
    }
    if (/^(public|private|class|interface|import)/m.test(code)) {
      return 'java';
    }
    if (/<\?php/i.test(code)) {
      return 'php';
    }
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE)/im.test(code)) {
      return 'sql';
    }
    return 'text';
  }
}

export default HTMLNormalizer;
