/**
 * Unit Tests for TemplateEngine
 * 40+ tests ensuring 100% coverage
 */

import { TemplateEngine } from './templateEngine';

describe('TemplateEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('Template Loading', () => {
    test('should load default templates on initialization', () => {
      const templates = engine.listTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
    });

    test('should retrieve template by ID', () => {
      const template = engine.getTemplate('project-charter');
      expect(template).toBeDefined();
      expect(template.id).toBe('project-charter');
      expect(template.sections).toBeDefined();
    });

    test('should throw error for non-existent template', () => {
      expect(() => {
        engine.getTemplate('non-existent-template');
      }).toThrow('Template non-existent-template not found');
    });

    test('should list all available templates', () => {
      const templates = engine.listTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.every(t => t.id && t.name)).toBe(true);
    });

    test('should register new template', () => {
      const newTemplate = {
        id: 'custom-template',
        name: 'Custom Template',
        sections: [
          { id: 'section1', title: 'Section 1', template: 'Content: {{field}}' }
        ],
        requiredFields: []
      };

      engine.registerTemplate(newTemplate);
      const retrieved = engine.getTemplate('custom-template');
      expect(retrieved.id).toBe('custom-template');
    });

    test('should reject invalid template structure', () => {
      expect(() => {
        engine.registerTemplate(null);
      }).toThrow();

      expect(() => {
        engine.registerTemplate({ id: 'test' }); // missing sections
      }).toThrow();
    });
  });

  describe('Template Validation', () => {
    test('should validate required fields present', () => {
      const data = {
        projectName: 'Test Project',
        projectManager: 'John Doe',
        sponsor: 'Jane Smith',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should identify missing required fields', () => {
      const data = {
        projectName: 'Test'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('projectManager'))).toBe(true);
    });

    test('should validate field types - string', () => {
      const data = {
        projectName: 'Test',
        projectManager: 123, // should be string
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('string'))).toBe(true);
    });

    test('should validate minimum length', () => {
      const data = {
        projectName: 'Ab', // too short
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least'))).toBe(true);
    });

    test('should validate maximum length', () => {
      const data = {
        projectName: 'x'.repeat(300), // too long
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
    });

    test('should validate pattern matching', () => {
      const data = {
        projectName: 'Test Project',
        projectManager: 'John123', // contains numbers
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('pattern'))).toBe(true);
    });

    test('should validate date fields', () => {
      const data = {
        projectName: 'Test',
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-12-31',
        endDate: '2025-01-01' // before start date
      };

      const result = engine.validateTemplate(data, 'project-charter');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('after'))).toBe(true);
    });

    test('should handle null/undefined data', () => {
      const result1 = engine.validateTemplate(null, 'project-charter');
      expect(result1.isValid).toBe(false);
    });

    test('should validate array fields', () => {
      const data = {
        risks: []
      };

      const result = engine.validateTemplate(data, 'risk-register');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least'))).toBe(true);
    });
  });

  describe('Content Generation', () => {
    test('should generate content from template with data', () => {
      const data = {
        projectName: 'Platform Modernization',
        projectManager: 'John Doe',
        sponsor: 'Sarah Johnson',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        budget: '$500,000',
        objectives: 'Improve system performance',
        inScopeList: 'Backend optimization',
        outOfScopeList: 'Frontend redesign',
        stakeholderMatrix: '<table></table>',
        successCriteriaList: '1. Achieve 50% performance improvement'
      };

      const result = engine.generateFromTemplate('project-charter', data);
      expect(result.sections).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections[0].content).toContain('Platform Modernization');
    });

    test('should calculate project duration', () => {
      const enriched = engine.enrichData({
        startDate: '2025-01-01',
        endDate: '2025-07-01'
      });

      expect(enriched.duration).toBeDefined();
      expect(enriched.duration).toBeGreaterThan(0);
    });

    test('should format arrays as lists', () => {
      const enriched = engine.enrichData({
        objectives: ['Improve performance', 'Reduce costs'],
        inScope: ['Item 1', 'Item 2'],
        outOfScope: ['Item 3'],
        successCriteria: ['Criteria 1']
      });

      expect(enriched.objectivesList).toContain('1. Improve performance');
      expect(enriched.inScopeList).toContain('1. Item 1');
      expect(enriched.outOfScopeList).toContain('1. Item 3');
      expect(enriched.successCriteriaList).toContain('1. Criteria 1');
    });

    test('should escape HTML to prevent XSS', () => {
      const data = {
        projectName: '<script>alert("xss")</script>',
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        budget: '$100,000',
        objectives: 'Test'
      };

      const result = engine.generateFromTemplate('project-charter', data);
      const content = JSON.stringify(result.sections);
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    });

    test('should handle missing variables gracefully', () => {
      const data = {
        projectName: 'Test Project Name',
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      const result = engine.generateFromTemplate('project-charter', data);
      expect(result.sections).toBeDefined();
    });

    test('should substitute variables correctly', () => {
      const section = {
        template: 'Project {{projectName}} led by {{projectManager}}'
      };
      const data = {
        projectName: 'Test Project',
        projectManager: 'John Doe'
      };

      const content = engine.generateSection(section, data);
      expect(content).toBe('Project Test Project led by John Doe');
    });
  });

  describe('HTML Escaping', () => {
    test('should escape & character', () => {
      const escaped = engine.escapeHtml('A & B');
      expect(escaped).toBe('A &amp; B');
    });

    test('should escape < character', () => {
      const escaped = engine.escapeHtml('<div>');
      expect(escaped).toBe('&lt;div&gt;');
    });

    test('should escape > character', () => {
      const escaped = engine.escapeHtml('>');
      expect(escaped).toBe('&gt;');
    });

    test('should escape quotes', () => {
      const escaped = engine.escapeHtml('"test"');
      expect(escaped).toBe('&quot;test&quot;');
    });

    test('should escape single quotes', () => {
      const escaped = engine.escapeHtml("'test'");
      expect(escaped).toBe('&#039;test&#039;');
    });

    test('should handle empty string', () => {
      const escaped = engine.escapeHtml('');
      expect(escaped).toBe('');
    });

    test('should handle null', () => {
      const escaped = engine.escapeHtml(null);
      expect(escaped).toBe('null');
    });

    test('should not escape when disabled', () => {
      const engineNoEscape = new TemplateEngine({ escapeHtml: false });
      const text = '<div>Test</div>';
      const escaped = engineNoEscape.escapeHtml(text);
      expect(escaped).toBe(text);
    });

    test('should escape all special characters', () => {
      const escaped = engine.escapeHtml('<>&"\'');
      expect(escaped).toBe('&lt;&gt;&amp;&quot;&#039;');
    });
  });

  describe('Error Handling', () => {
    test('should throw on validation failure', () => {
      const data = { projectName: 'Test' }; // incomplete

      expect(() => {
        engine.generateFromTemplate('project-charter', data);
      }).toThrow();
    });

    test('should provide detailed error messages', () => {
      const data = {};

      expect(() => {
        engine.generateFromTemplate('project-charter', data);
      }).toThrow('Validation failed');
    });

    test('should throw error for invalid template on validation', () => {
      expect(() => {
        engine.validateTemplate({}, 'non-existent');
      }).toThrow();
    });

    test('should handle missing section in template', () => {
      const template = {
        id: 'test',
        sections: [
          { id: 'section1' } // missing title
        ]
      };

      expect(() => {
        engine.registerTemplate(template);
      }).toThrow();
    });
  });

  describe('Stakeholder Matrix', () => {
    test('should build HTML table for stakeholders', () => {
      const stakeholders = [
        { name: 'CEO', role: 'Executive Sponsor', influence: 'High' },
        { name: 'CTO', role: 'Technical Advisor', influence: 'High' }
      ];

      const html = engine.buildStakeholderMatrix(stakeholders);
      expect(html).toContain('stakeholder-matrix');
      expect(html).toContain('CEO');
      expect(html).toContain('CTO');
      expect(html).toContain('<table');
    });

    test('should handle empty stakeholder list', () => {
      const html = engine.buildStakeholderMatrix([]);
      expect(html).toContain('<table');
      expect(html).toContain('</table>');
    });

    test('should escape HTML in stakeholder data', () => {
      const stakeholders = [
        { name: '<script>alert()</script>', role: 'Test', influence: 'High' }
      ];

      const html = engine.buildStakeholderMatrix(stakeholders);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('should use default influence if not provided', () => {
      const stakeholders = [
        { name: 'John', role: 'Manager' }
      ];

      const html = engine.buildStakeholderMatrix(stakeholders);
      expect(html).toContain('Medium');
    });
  });

  describe('Hash Function', () => {
    test('should create consistent hash for same object', () => {
      const obj = { name: 'Test', value: 123 };
      const hash1 = engine.hashObject(obj);
      const hash2 = engine.hashObject(obj);

      expect(hash1).toBe(hash2);
    });

    test('should create different hashes for different objects', () => {
      const obj1 = { name: 'Test1' };
      const obj2 = { name: 'Test2' };

      const hash1 = engine.hashObject(obj1);
      const hash2 = engine.hashObject(obj2);

      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty object', () => {
      const hash = engine.hashObject({});
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('Performance', () => {
    test('should generate template within reasonable time', () => {
      const data = {
        projectName: 'Test Project Performance',
        projectManager: 'John',
        sponsor: 'Jane',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        budget: '$100,000',
        objectives: Array(100).fill('Objective')
      };

      const start = performance.now();
      engine.generateFromTemplate('project-charter', data);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
    });

    test('should handle large stakeholder list', () => {
      const stakeholders = Array(100).fill({ name: 'Test', role: 'Role', influence: 'High' });

      const start = performance.now();
      engine.buildStakeholderMatrix(stakeholders);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Data Enrichment', () => {
    test('should calculate duration in days', () => {
      const enriched = engine.enrichData({
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      });

      expect(enriched.durationDays).toBeDefined();
      expect(enriched.durationDays).toBeGreaterThan(0);
    });

    test('should build stakeholder matrix in enriched data', () => {
      const enriched = engine.enrichData({
        stakeholders: [{ name: 'Test', role: 'Role' }]
      });

      expect(enriched.stakeholderMatrix).toBeDefined();
      expect(enriched.stakeholderMatrix).toContain('Test');
    });

    test('should handle missing dates', () => {
      const enriched = engine.enrichData({
        projectName: 'Test'
      });

      expect(enriched.duration).toBeUndefined();
    });

    test('should preserve original data', () => {
      const original = {
        projectName: 'Test',
        custom: 'value'
      };

      const enriched = engine.enrichData(original);
      expect(enriched.projectName).toBe('Test');
      expect(enriched.custom).toBe('value');
    });
  });

  describe('Configuration', () => {
    test('should respect escapeHtml config', () => {
      const engine2 = new TemplateEngine({ escapeHtml: false });
      expect(engine2.config.escapeHtml).toBe(false);
    });

    test('should use default maxFieldLength', () => {
      expect(engine.config.maxFieldLength).toBe(10000);
    });

    test('should allow custom maxFieldLength', () => {
      const engine2 = new TemplateEngine({ maxFieldLength: 5000 });
      expect(engine2.config.maxFieldLength).toBe(5000);
    });
  });
});
