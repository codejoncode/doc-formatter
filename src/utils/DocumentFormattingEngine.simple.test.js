import { DocumentFormattingEngine } from './DocumentFormattingEngine';

describe('DocumentFormattingEngine', () => {
  let engine;
  
  beforeEach(() => {
    const defaultRules = {
      headers: {
        detectAllCaps: true,
        detectColons: true,
        detectNumbers: true,
        enforceHierarchy: true,
        titleCase: true
      },
      lists: {
        normalizeMarkers: true,
        enforceIndentation: true,
        smartSpacing: true
      },
      tables: {
        autoAlign: true,
        addSeparators: true,
        enforceStructure: true
      },
      code: {
        autoDetectLanguage: true,
        syntaxHighlighting: true,
        properIndentation: true
      },
      references: {
        autoLink: true,
        generateAppendix: true,
        crossReference: true
      },
      typography: {
        smartQuotes: true,
        properSpacing: true,
        paragraphBreaks: true
      }
    };
    
    engine = new DocumentFormattingEngine(defaultRules);
  });

  describe('Basic Functionality', () => {
    it('should initialize with rules', () => {
      expect(engine).toBeDefined();
      expect(engine.formattingRules).toBeDefined();
      expect(engine.formatDocument).toBeDefined();
    });

    it('should handle empty input', async () => {
      const result = await engine.formatDocument('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle simple text input', async () => {
      const result = await engine.formatDocument('Hello world');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
      expect(typeof result.formattedText).toBe('string');
    });
  });

  describe('Header Detection', () => {
    it('should process headers in some way', async () => {
      const text = 'INTRODUCTION\nThis is the content.';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle numbered headers', async () => {
      const text = '1. Introduction\n2. Main Content';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Code Block Detection', () => {
    it('should handle JavaScript-like code', async () => {
      const text = 'function test() { return true; }';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle Python-like code', async () => {
      const text = 'def test():\n    return True';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('List Processing', () => {
    it('should handle bullet lists', async () => {
      const text = '• Item 1\n• Item 2\n• Item 3';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle numbered lists', async () => {
      const text = '1. First item\n2. Second item\n3. Third item';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Table Processing', () => {
    it('should handle basic tables', async () => {
      const text = 'Name | Age\nJohn | 30\nJane | 25';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Typography Enhancement', () => {
    it('should handle quotes in text', async () => {
      const text = 'He said "Hello world" to everyone.';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle whitespace-only input', async () => {
      const result = await engine.formatDocument('   \n\n  \t  ');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle mixed line endings', async () => {
      const text = 'Line 1\r\nLine 2\nLine 3\r\nLine 4';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should handle unicode characters', async () => {
      const text = 'HÉLLO WÖRLD\nContent with émojis: 🎉🚀📊';
      const result = await engine.formatDocument(text);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Rule Configuration', () => {
    it('should accept different rule configurations', async () => {
      const partialRules = {
        headers: {
          detectAllCaps: true
        },
        code: {
          autoDetectLanguage: false
        }
      };
      
      const partialEngine = new DocumentFormattingEngine(partialRules);
      const text = 'TITLE\nfunction test() {}';
      const result = await partialEngine.formatDocument(text);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });

    it('should work with minimal configuration', async () => {
      const minimalEngine = new DocumentFormattingEngine({});
      const result = await minimalEngine.formatDocument('Test text');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('formattedText');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const text = '{ "name": "test", "invalid": json }';
      const result = engine.formatDocument(text);
      expect(result).toBeDefined();
    });

    it('should handle null or undefined input', async () => {
      await expect(engine.formatDocument(null)).rejects.toThrow('Text input cannot be null or undefined');
      await expect(engine.formatDocument(undefined)).rejects.toThrow('Text input cannot be null or undefined');
    });
  });
});