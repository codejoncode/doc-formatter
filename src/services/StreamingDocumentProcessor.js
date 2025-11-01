/**
 * STREAMING DOCUMENT PROCESSOR
 * Proper chunking + structure preservation
 * Based on "Targeted fixes for doc formatter.md"
 */

import * as cheerio from 'cheerio';
import DOMPurify from 'dompurify';

class StreamingDocumentProcessor {
  constructor() {
    this.chunkSize = 3000; // words per chunk
  }

  /**
   * CRITICAL: Count words WITHOUT HTML tags
   */
  countWordsInHTML(html) {
    const textOnly = html.replace(/<[^>]*>/g, '').trim();
    const words = textOnly.split(/\s+/).filter(w => w && w.length > 0);
    return words.length;
  }

  /**
   * CRITICAL: Smart chunking that preserves document structure
   */
  smartChunkHTML(html) {
    try {
      const $ = cheerio.load(html, { decodeEntities: false });
      const chunks = [];
      let currentChunk = [];
      let currentWords = 0;

      // Process block-level elements to preserve structure
      $('body, [role="main"], main, article').each((_, container) => {
        const $container = $(container);
        
        $container.children().each((_, element) => {
          const $el = $(element);
          const elementHTML = $.html($el);
          const wordCount = this.countWordsInHTML(elementHTML);

          // If adding this element exceeds chunk size AND we have content
          if (currentWords + wordCount > this.chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
            currentChunk = [];
            currentWords = 0;
          }

          currentChunk.push(elementHTML);
          currentWords += wordCount;
        });
      });

      // Don't forget remaining content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
      }

      // If no chunks (empty doc), return original
      return chunks.length > 0 ? chunks : [html];
    } catch (error) {
      console.error('Chunking error:', error);
      return [html]; // Fallback to original
    }
  }

  /**
   * CRITICAL: Safe sanitization that PRESERVES document structure
   */
  safelyCleanHTML(html) {
    const config = {
      ALLOWED_TAGS: [
        // Structure
        'div', 'section', 'article', 'main', 'aside',
        'header', 'footer', 'nav',
        // Text hierarchy
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'br',
        // Lists
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        // Formatting
        'strong', 'b', 'em', 'i', 'u', 'del', 's',
        'code', 'pre', 'blockquote',
        // Links & media
        'a', 'img',
        // Tables - CRITICAL
        'table', 'thead', 'tbody', 'tfoot',
        'tr', 'th', 'td', 'caption', 'col', 'colgroup',
        // Other
        'hr', 'figure', 'figcaption', 'mark'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title',
        'class', 'id', 'data-*',
        'colspan', 'rowspan', 'scope',
        'target', 'rel',
        'width', 'height'
      ],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    };

    return DOMPurify.sanitize(html, config);
  }

  /**
   * CRITICAL: Fix common HTML issues before processing
   */
  normalizeHTML(html) {
    let normalized = html;

    // Fix unclosed tags
    normalized = normalized.replace(/(<br)(?!>|\/)/g, '$1>');
    normalized = normalized.replace(/(<hr)(?!>|\/)/g, '$1>');
    normalized = normalized.replace(/(<img[^>]*)(?!>|\/)/g, '$1>');

    // Ensure tables have proper structure
    normalized = normalized.replace(
      /(<table[^>]*>)\s*(<tr[^>]*>)/gi,
      '$1<tbody>$2'
    );
    normalized = normalized.replace(
      /(<\/tr>)\s*(<\/table>)/gi,
      '$1</tbody></table>'
    );

    return normalized;
  }

  /**
   * Process single chunk - FAST and preserves structure
   */
  processChunk(chunk) {
    try {
      // 1. Normalize
      let processed = this.normalizeHTML(chunk);

      // 2. Clean (but preserve structure)
      processed = this.safelyCleanHTML(processed);

      // 3. Parse and fix with Cheerio
      const $ = cheerio.load(processed, { decodeEntities: false });

      // Ensure all tables have thead/tbody
      $('table').each((_, table) => {
        const $table = $(table);
        const $rows = $table.find('tr');
        
        if ($rows.length > 0 && !$table.find('thead').length) {
          const firstRow = $rows.first();
          if (firstRow.find('th').length > 0) {
            const $thead = $('<thead>');
            $thead.append(firstRow.clone());
            firstRow.remove();
            $table.prepend($thead);
          }
        }

        const bodyRows = $table.find('tr').not($table.find('thead tr'));
        if (bodyRows.length > 0 && !$table.find('tbody').length) {
          const $tbody = $('<tbody>');
          bodyRows.clone().appendTo($tbody);
          bodyRows.remove();
          $table.append($tbody);
        }
      });

      // Ensure code blocks are properly formatted
      $('pre').each((_, pre) => {
        const $pre = $(pre);
        let $code = $pre.find('code');
        
        if ($code.length === 0) {
          const content = $pre.html();
          $pre.html(`<code>${content}</code>`);
        }
      });

      return {
        success: true,
        html: $.html(),
        error: null
      };
    } catch (error) {
      console.error('Chunk processing error:', error);
      return {
        success: false,
        html: chunk,
        error: error.message
      };
    }
  }

  /**
   * Main format function - process document in chunks with REAL progress
   */
  async formatDocument(html, onProgress) {
    try {
      if (!html || html.trim().length === 0) {
        return { success: true, html: '', totalChunks: 0, processedChunks: 0 };
      }

      // Step 1: Chunk the document (10% progress)
      if (onProgress) {
        onProgress({ current: 0, total: 100, percentage: 10, stage: 'Chunking document...' });
      }
      
      const chunks = this.smartChunkHTML(html);
      let processedChunks = [];
      let totalProcessed = 0;

      // Step 2: Process each chunk (10-90% progress)
      for (let i = 0; i < chunks.length; i++) {
        const result = this.processChunk(chunks[i]);
        processedChunks.push(result.html);
        totalProcessed += this.countWordsInHTML(result.html);

        // Report progress (10% to 90%)
        if (onProgress) {
          const chunkProgress = 10 + Math.round(((i + 1) / chunks.length) * 80);
          onProgress({
            current: i + 1,
            total: chunks.length,
            percentage: chunkProgress,
            stage: `Processing chunk ${i + 1} of ${chunks.length}`,
            totalWords: totalProcessed
          });
        }

        // Yield to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Step 3: Combine chunks (90-95% progress)
      if (onProgress) {
        onProgress({ current: chunks.length, total: chunks.length, percentage: 95, stage: 'Combining chunks...' });
      }
      
      const finalHTML = processedChunks.join('\n');

      // Step 4: Done (100% progress) - ONLY when ACTUALLY done
      if (onProgress) {
        onProgress({ 
          current: chunks.length, 
          total: chunks.length, 
          percentage: 100, 
          stage: 'Complete!',
          totalWords: this.countWordsInHTML(finalHTML)
        });
      }

      return {
        success: true,
        html: finalHTML,
        totalChunks: chunks.length,
        processedChunks: processedChunks.length,
        wordCount: this.countWordsInHTML(finalHTML)
      };
    } catch (error) {
      console.error('Document formatting error:', error);
      return {
        success: false,
        html: html,
        error: error.message
      };
    }
  }

  /**
   * Quick format for preview (faster, less thorough)
   */
  quickFormat(html) {
    let processed = this.normalizeHTML(html);
    processed = this.safelyCleanHTML(processed);
    return processed;
  }
}

const processor = new StreamingDocumentProcessor();
export default processor;
