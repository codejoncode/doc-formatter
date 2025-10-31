// Performance monitoring and optimization utilities for enterprise documents

export class DocumentPerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.thresholds = {
      renderTime: 100, // ms
      processingTime: 5000, // ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
      documentSize: 1000000 // 1MB characters
    };
  }

  startTimer(operation) {
    this.metrics[operation] = {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    };
  }

  endTimer(operation) {
    if (!this.metrics[operation]) return null;
    
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    const result = {
      duration: endTime - this.metrics[operation].startTime,
      memoryDelta: endMemory - this.metrics[operation].startMemory,
      operation
    };
    
    this.logPerformance(result);
    return result;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  logPerformance(result) {
    const { operation, duration, memoryDelta } = result;
    
    if (duration > this.thresholds.renderTime) {
      console.warn(`Performance Warning: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    if (memoryDelta > this.thresholds.memoryUsage) {
      console.warn(`Memory Warning: ${operation} used ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  optimizeTextArea(element, textLength) {
    if (textLength > this.thresholds.documentSize) {
      // Optimize for large documents
      element.style.contain = 'layout style paint';
      element.style.overflowAnchor = 'none';
      element.style.willChange = 'scroll-position';
    }
  }

  getRecommendations(documentStats) {
    const recommendations = [];
    
    if (documentStats.characters > 500000) {
      recommendations.push({
        type: 'performance',
        message: 'Consider splitting document into sections for better performance',
        severity: 'warning'
      });
    }
    
    if (documentStats.tables > 50) {
      recommendations.push({
        type: 'formatting',
        message: 'Large number of tables detected - consider table optimization',
        severity: 'info'
      });
    }
    
    if (documentStats.complexity > 7) {
      recommendations.push({
        type: 'readability',
        message: 'Document complexity is high - consider simplifying structure',
        severity: 'info'
      });
    }
    
    return recommendations;
  }
}

export class ChunkedRenderer {
  constructor(container, chunkSize = 50000) {
    this.container = container;
    this.chunkSize = chunkSize;
    this.renderedChunks = new Map();
    this.observer = null;
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderChunk(entry.target.dataset.chunkId);
        } else {
          this.unrenderChunk(entry.target.dataset.chunkId);
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.1
    });
  }

  render(content) {
    this.clear();
    const chunks = this.createChunks(content);
    
    chunks.forEach((chunk, index) => {
      const placeholder = document.createElement('div');
      placeholder.className = 'chunk-placeholder';
      placeholder.dataset.chunkId = index;
      placeholder.style.minHeight = '100px';
      
      this.container.appendChild(placeholder);
      this.observer.observe(placeholder);
    });
  }

  createChunks(content) {
    const chunks = [];
    for (let i = 0; i < content.length; i += this.chunkSize) {
      chunks.push(content.slice(i, i + this.chunkSize));
    }
    return chunks;
  }

  renderChunk(chunkId) {
    if (this.renderedChunks.has(chunkId)) return;
    
    const placeholder = this.container.querySelector(`[data-chunk-id="${chunkId}"]`);
    if (!placeholder) return;
    
    const chunk = this.chunks[chunkId];
    const renderedContent = this.processChunkContent(chunk);
    
    placeholder.innerHTML = renderedContent;
    placeholder.classList.add('rendered');
    this.renderedChunks.set(chunkId, true);
  }

  unrenderChunk(chunkId) {
    const placeholder = this.container.querySelector(`[data-chunk-id="${chunkId}"]`);
    if (!placeholder || !this.renderedChunks.has(chunkId)) return;
    
    placeholder.innerHTML = '';
    placeholder.classList.remove('rendered');
    this.renderedChunks.delete(chunkId);
  }

  processChunkContent(chunk) {
    // Apply markdown processing or other content transformation
    return chunk;
  }

  clear() {
    this.container.innerHTML = '';
    this.renderedChunks.clear();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.clear();
  }
}

export class TableOptimizer {
  static optimizeTable(tableHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableHtml, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) return tableHtml;
    
    // Add responsive wrapper
    const wrapper = doc.createElement('div');
    wrapper.className = 'table-responsive';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    
    // Optimize large tables
    const rows = table.querySelectorAll('tr');
    if (rows.length > 100) {
      this.addVirtualScrolling(table);
    }
    
    // Add column sorting indicators
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
      header.setAttribute('data-sort-column', index);
      header.style.cursor = 'pointer';
      header.title = 'Click to sort';
    });
    
    return doc.body.innerHTML;
  }
  
  static addVirtualScrolling(table) {
    table.style.maxHeight = '400px';
    table.style.overflowY = 'auto';
    table.style.display = 'block';
    
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.style.display = 'block';
      tbody.style.maxHeight = '350px';
      tbody.style.overflowY = 'auto';
    }
  }
  
  static formatTableData(text) {
    return text.replace(/(\|[^|\n]*\|(?:\n\|[^|\n]*\|)*)/g, (match) => {
      const lines = match.split('\n').filter(line => line.trim());
      if (lines.length < 2) return match;
      
      // Parse table structure
      const rows = lines.map(line => {
        return line.split('|')
          .slice(1, -1) // Remove empty first/last elements
          .map(cell => cell.trim());
      });
      
      // Check if second row is separator
      const hasSeparator = lines[1].includes('---');
      const headerRow = rows[0];
      const dataRows = hasSeparator ? rows.slice(2) : rows.slice(1);
      
      // Generate optimized HTML table
      let html = '<div class="table-container">\n<table class="enterprise-table">\n';
      
      // Header
      html += '<thead>\n<tr>\n';
      headerRow.forEach(cell => {
        html += `<th>${this.escapeHtml(cell)}</th>\n`;
      });
      html += '</tr>\n</thead>\n';
      
      // Body
      html += '<tbody>\n';
      dataRows.forEach((row, index) => {
        html += '<tr>\n';
        row.forEach(cell => {
          html += `<td>${this.escapeHtml(cell)}</td>\n`;
        });
        html += '</tr>\n';
      });
      html += '</tbody>\n';
      
      html += '</table>\n</div>\n';
      return html;
    });
  }
  
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 10; // Number of items
    this.cleanupInterval = null;
    this.startCleanup();
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Update timestamp
    item.timestamp = Date.now();
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > maxAge) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Run every minute
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export default {
  DocumentPerformanceMonitor,
  ChunkedRenderer,
  TableOptimizer,
  MemoryManager
};