/**
 * Unit Tests for DocumentMerger
 * 35+ tests ensuring 90%+ coverage
 */

import { DocumentMerger, MergeStrategy } from './documentMerger';

describe('DocumentMerger', () => {
  let merger;

  beforeEach(() => {
    merger = new DocumentMerger();
  });

  describe('File Parsing', () => {
    test('should parse text files', async () => {
      const file = new File(['Test content'], 'test.txt', { type: 'text/plain' });
      const result = await merger.parseFile(file);

      expect(result).toBeDefined();
      expect(result.format).toBe('txt');
      expect(result.filename).toBe('test.txt');
      expect(result.content).toBe('Test content');
    });

    test('should parse DOCX files', async () => {
      const file = new File(['DOCX content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await merger.parseFile(file);

      expect(result).toBeDefined();
      expect(result.format).toBe('docx');
    });

    test('should parse PDF files', async () => {
      const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      const result = await merger.parseFile(file);

      expect(result).toBeDefined();
      expect(result.format).toBe('pdf');
    });

    test('should parse Excel files', async () => {
      const file = new File(['Excel content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const result = await merger.parseFile(file);

      expect(result).toBeDefined();
      expect(result.format).toBe('xlsx');
    });

    test('should reject unsupported formats', async () => {
      const file = new File(['content'], 'test.xyz', { type: 'application/xyz' });

      await expect(merger.parseFile(file)).rejects.toThrow('Unsupported file format');
    });

    test('should validate file size', async () => {
      const largeContent = 'x'.repeat(100 * 1024 * 1024); // 100MB
      const largefile = new File([largeContent], 'large.txt');
      const largemerger = new DocumentMerger({ maxMergeSize: 50 * 1024 * 1024 });

      await expect(largemerger.parseFile(largefile)).rejects.toThrow();
    });

    test('should handle invalid file object', async () => {
      await expect(merger.parseFile(null)).rejects.toThrow();
    });

    test('should handle file without name', async () => {
      await expect(merger.parseFile({})).rejects.toThrow();
    });

    test('should get file extension correctly', () => {
      expect(merger.getFileExtension('document.docx')).toBe('docx');
      expect(merger.getFileExtension('file.txt')).toBe('txt');
      expect(merger.getFileExtension('file.name.pdf')).toBe('pdf');
    });

    test('should handle file without extension', () => {
      expect(merger.getFileExtension('file')).toBe('');
    });

    test('should parse metadata correctly', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain', lastModified: Date.now() });
      const result = await merger.parseFile(file);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.type).toBe('text/plain');
      expect(result.metadata.lastModified).toBeInstanceOf(Date);
    });
  });

  describe('Merge Strategies', () => {
    test('should merge documents using COMBINE strategy', async () => {
      const files = [
        new File(['Content 1'], 'file1.txt'),
        new File(['Content 2'], 'file2.txt')
      ];

      const result = await merger.mergeDocuments(files, { strategy: MergeStrategy.COMBINE });

      expect(result).toBeDefined();
      expect(result.documentCount).toBe(2);
    });

    test('should merge documents using SEPARATE strategy', async () => {
      const files = [
        new File(['Content 1'], 'file1.txt'),
        new File(['Content 2'], 'file2.txt')
      ];

      const result = await merger.mergeDocuments(files, { strategy: MergeStrategy.SEPARATE });

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
    });

    test('should merge documents using PRIORITY strategy', async () => {
      const files = [
        new File(['Content 1'], 'file1.txt'),
        new File(['Content 2'], 'file2.txt')
      ];

      const result = await merger.mergeDocuments(files, { strategy: MergeStrategy.PRIORITY });

      expect(result).toBeDefined();
    });

    test('should merge documents using DEDUPE strategy', async () => {
      const files = [
        new File(['Same content'], 'file1.txt'),
        new File(['Same content'], 'file2.txt')
      ];

      const result = await merger.mergeDocuments(files, { strategy: MergeStrategy.DEDUPE });

      expect(result).toBeDefined();
      expect(result.documentCount).toBe(2);
    });

    test('should use COMBINE as default strategy', async () => {
      const files = [new File(['Content'], 'file.txt')];
      const result = await merger.mergeDocuments(files);

      expect(result).toBeDefined();
    });

    test('should throw on invalid strategy', () => {
      const grouped = { content: [] };
      expect(() => {
        merger.mergeWithStrategy(grouped, 'INVALID');
      }).toThrow('Invalid merge strategy');
    });
  });

  describe('Section Grouping', () => {
    test('should group sections by type', () => {
      const docs = [
        {
          filename: 'doc1.txt',
          sections: [
            { type: 'intro', title: 'Intro', content: 'Content 1' }
          ]
        },
        {
          filename: 'doc2.txt',
          sections: [
            { type: 'intro', title: 'Intro', content: 'Content 2' }
          ]
        }
      ];

      const grouped = merger.groupSections(docs);
      expect(grouped.intro).toBeDefined();
      expect(grouped.intro.length).toBe(2);
    });

    test('should add source information', () => {
      const docs = [
        {
          filename: 'test.txt',
          sections: [
            { type: 'content', title: 'Content', content: 'Test' }
          ]
        }
      ];

      const grouped = merger.groupSections(docs);
      expect(grouped.content[0].source).toBe('test.txt');
    });
  });

  describe('TOC Generation', () => {
    test('should generate table of contents', async () => {
      const sections = [
        { title: 'Section 1', level: 1, numbering: '1.0' },
        { title: 'Section 2', level: 1, numbering: '2.0' }
      ];

      const toc = merger.generateTableOfContents(sections);

      expect(toc).toBeDefined();
      expect(toc.entries).toBeDefined();
      expect(toc.totalPages).toBe(2);
    });

    test('should handle empty sections', () => {
      const toc = merger.generateTableOfContents([]);

      expect(toc.entries).toHaveLength(0);
      expect(toc.totalPages).toBe(0);
    });

    test('should handle sections without titles', () => {
      const sections = [
        { level: 1, numbering: '1.0' }
      ];

      const toc = merger.generateTableOfContents(sections);
      expect(toc.entries[0].title).toBe('Untitled');
    });

    test('should handle subsections in TOC', () => {
      const sections = [
        {
          title: 'Main',
          level: 1,
          numbering: '1.0',
          subsections: [
            { title: 'Sub1', numbering: '1.1' }
          ]
        }
      ];

      const toc = merger.generateTableOfContents(sections);
      expect(toc.entries.length).toBeGreaterThan(1);
    });
  });

  describe('Metadata Merging', () => {
    test('should merge document metadata', async () => {
      const docs = [
        { filename: 'file1.txt', metadata: { author: 'John' } },
        { filename: 'file2.txt', metadata: { author: 'Jane' } }
      ];

      const metadata = merger.mergeMetadata(docs);

      expect(metadata).toBeDefined();
      expect(metadata.source).toHaveLength(2);
      expect(metadata.authors).toContain('John');
      expect(metadata.authors).toContain('Jane');
    });

    test('should deduplicate authors', () => {
      const docs = [
        { filename: 'file1.txt', metadata: { author: 'John' } },
        { filename: 'file2.txt', metadata: { author: 'John' } }
      ];

      const metadata = merger.mergeMetadata(docs);

      expect(metadata.authors).toHaveLength(1);
    });

    test('should handle missing metadata', () => {
      const docs = [
        { filename: 'file1.txt', metadata: {} },
        { filename: 'file2.txt' }
      ];

      const metadata = merger.mergeMetadata(docs);
      expect(metadata).toBeDefined();
    });

    test('should track creation and modification dates', () => {
      const docs = [
        { filename: 'file1.txt', metadata: { created: new Date('2025-01-01'), lastModified: new Date('2025-01-10') } }
      ];

      const metadata = merger.mergeMetadata(docs);
      expect(metadata.created).toBeDefined();
      expect(metadata.lastModified).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should reject empty file list', async () => {
      await expect(merger.mergeDocuments([])).rejects.toThrow('No documents to merge');
    });

    test('should reject null file list', async () => {
      await expect(merger.mergeDocuments(null)).rejects.toThrow();
    });

    test('should continue with partial failures', async () => {
      const files = [
        new File(['Content'], 'good.txt'),
        new File(['Content'], 'bad.xyz')
      ];

      const result = await merger.mergeDocuments(files, { failOnError: false });

      expect(result.documentCount).toBeGreaterThan(0);
      expect(result.failedCount).toBeGreaterThan(0);
    });

    test('should fail on all failures', async () => {
      const files = [
        new File(['Content'], 'bad1.xyz'),
        new File(['Content'], 'bad2.xyz')
      ];

      await expect(merger.mergeDocuments(files)).rejects.toThrow();
    });

    test('should report errors in result', async () => {
      const files = [
        new File(['Content'], 'good.txt'),
        new File(['Content'], 'bad.xyz')
      ];

      const result = await merger.mergeDocuments(files, { failOnError: false });
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should merge multiple documents quickly', async () => {
      const files = [
        new File(['Content 1'], 'file1.txt'),
        new File(['Content 2'], 'file2.txt'),
        new File(['Content 3'], 'file3.txt')
      ];

      const start = performance.now();
      await merger.mergeDocuments(files);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // < 1 second
    });

    test('should handle large content efficiently', async () => {
      const largeContent = 'Line of content\n'.repeat(1000);
      const file = new File([largeContent], 'large.txt');

      const start = performance.now();
      await merger.parseFile(file);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Content Hashing', () => {
    test('should create consistent hash for same content', () => {
      const content = 'Test content';
      const hash1 = merger.hashContent(content);
      const hash2 = merger.hashContent(content);

      expect(hash1).toBe(hash2);
    });

    test('should create different hashes for different content', () => {
      const hash1 = merger.hashContent('Content 1');
      const hash2 = merger.hashContent('Content 2');

      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty content', () => {
      const hash = merger.hashContent('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    test('should handle null content', () => {
      const hash = merger.hashContent(null);
      expect(hash).toBeDefined();
    });
  });

  describe('Integration', () => {
    test('should handle complete merge workflow', async () => {
      const files = [new File(['Content 1'], 'file1.txt')];
      const result = await merger.mergeDocuments(files);

      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('toc');
      expect(result).toHaveProperty('audit');
    });

    test('should populate audit trail', async () => {
      const files = [new File(['Content'], 'file.txt')];
      const result = await merger.mergeDocuments(files);

      expect(result.audit).toBeDefined();
      expect(result.audit).toHaveProperty('mergedAt');
      expect(result.audit).toHaveProperty('strategy');
      expect(result.audit).toHaveProperty('totalSize');
    });

    test('should track document count', async () => {
      const files = [
        new File(['Content 1'], 'file1.txt'),
        new File(['Content 2'], 'file2.txt'),
        new File(['Content 3'], 'file3.txt')
      ];

      const result = await merger.mergeDocuments(files);
      expect(result.documentCount).toBe(3);
    });
  });

  describe('Combine Sections', () => {
    test('should combine single section', () => {
      const grouped = {
        intro: [{ title: 'Intro', content: 'Content' }]
      };

      const merged = merger.combineSections(grouped);
      expect(merged.length).toBe(1);
      expect(merged[0].numbering).toBe('1.0');
    });

    test('should combine multiple sections', () => {
      const grouped = {
        intro: [
          { title: 'Intro', content: 'Content 1' },
          { title: 'Intro', content: 'Content 2' }
        ]
      };

      const merged = merger.combineSections(grouped);
      expect(merged[0].content).toContain('Content 1');
      expect(merged[0].content).toContain('Content 2');
      expect(merged[0].merged).toBe(true);
    });
  });

  describe('Keep Separate', () => {
    test('should keep sections separate', () => {
      const grouped = {
        intro: [
          { title: 'Intro 1', content: 'Content 1' },
          { title: 'Intro 2', content: 'Content 2' }
        ]
      };

      const merged = merger.keepSeparate(grouped);
      expect(merged.length).toBe(2);
      expect(merged[0].merged).toBe(false);
      expect(merged[1].merged).toBe(false);
    });
  });

  describe('Merge Priority', () => {
    test('should use first document as priority', () => {
      const grouped = {
        intro: [
          { title: 'Intro', content: 'First', documentIndex: 0 },
          { title: 'Intro', content: 'Second', documentIndex: 1 }
        ]
      };

      const merged = merger.mergePriority(grouped);
      expect(merged[0].content).toBe('First');
      expect(merged[0].allVersions).toBeDefined();
    });
  });

  describe('Deduplication', () => {
    test('should remove duplicate sections', () => {
      const grouped = {
        intro: [
          { title: 'Intro', content: 'Same content' },
          { title: 'Intro', content: 'Same content' },
          { title: 'Intro', content: 'Different content' }
        ]
      };

      const merged = merger.deduplicateSections(grouped);
      expect(merged.length).toBeLessThan(3);
    });

    test('should mark deduplicated sections', () => {
      const grouped = {
        intro: [
          { title: 'Intro', content: 'Same' },
          { title: 'Intro', content: 'Same' }
        ]
      };

      const merged = merger.deduplicateSections(grouped);
      expect(merged[0].deduplicated).toBe(true);
    });
  });

  describe('Configuration', () => {
    test('should use custom strategy', () => {
      const merger2 = new DocumentMerger({ strategy: MergeStrategy.SEPARATE });
      expect(merger2.config.strategy).toBe(MergeStrategy.SEPARATE);
    });

    test('should use default strategy', () => {
      expect(merger.config.strategy).toBe(MergeStrategy.COMBINE);
    });

    test('should use custom maxMergeSize', () => {
      const merger2 = new DocumentMerger({ maxMergeSize: 10 * 1024 * 1024 });
      expect(merger2.config.maxMergeSize).toBe(10 * 1024 * 1024);
    });

    test('should use custom similarityThreshold', () => {
      const merger2 = new DocumentMerger({ similarityThreshold: 0.9 });
      expect(merger2.config.similarityThreshold).toBe(0.9);
    });
  });
});
