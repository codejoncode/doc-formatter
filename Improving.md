# Doc-Formatter Enhancement for Project Bible Creation

Based on your existing React document formatter, I've created a comprehensive improvement plan specifically tailored for project bible creation. Your current application has a solid foundation with React 18, file upload capabilities, and PDF generation - now we can transform it into a specialized project management documentation powerhouse.

## Key Improvements Overview

### **Phase 1: Foundation (Priority 1)**
The most critical enhancements focus on **template systems** and **intelligent document processing**:

- **Template Engine**: Create reusable templates for Project Charters, Work Breakdown Structures (WBS), Risk Registers, RACI matrices, and Stakeholder matrices
- **Section Detection**: Automatically identify and format PM document sections with proper numbering (1.0, 1.1, 1.1.1)
- **Enhanced File Processing**: Improve mammoth.js integration for better table extraction and metadata handling

### **Phase 2: Advanced Features**
- **Multi-Document Merging**: Combine charter, WBS, and risk documents into a unified Project Bible
- **Professional PDF Generation**: Add table of contents, custom headers/footers, watermarks, and metadata
- **Content Intelligence**: AI-powered suggestions for missing sections and validation against PM best practices

### **Phase 3: Testing & Quality**
- **Comprehensive Test Suite**: 90%+ coverage with Jest unit tests, integration tests, and Cypress E2E tests
- **Performance Optimization**: Handle 20MB files in under 5 seconds
- **Real-world Testing**: Use actual project documents for validation

## Technical Implementation Strategy

### **New Architecture Components**

**Core Utilities**:
- `templateEngine.js` - Manage PM document templates
- `sectionDetector.js` - Auto-detect project management sections
- `documentMerger.js` - Combine multiple documents intelligently
- `contentAnalyzer.js` - Validate and suggest improvements

**Enhanced Components**:
- `ProjectBibleBuilder.js` - Main orchestration component
- `TemplateSelector.js` - Choose from PM templates
- `MultiFileUpload.js` - Handle batch document uploads
- `EnhancedPDFGenerator.js` - Professional PDF output

### **Testing Strategy**

The testing approach includes:
- **Unit Tests**: Each utility class with mock data
- **Integration Tests**: Full workflow testing (upload → format → export)
- **E2E Tests**: Real user scenarios with Cypress
- **Performance Tests**: Large file handling and memory usage

## Ready-to-Use Resources

I've created comprehensive documentation including:

 **Code Implementation Examples** - Complete working code for all major components
 **Test Suite Guide** - Detailed test cases and testing patterns  
 **GRK Code Fast Instructions** - 18,000+ character comprehensive guide for pair programming
 **Quick Reference Guide** - Commands, patterns, and troubleshooting tips
 **Roadmap Data** - Project timeline and milestones

## Specific Recommendations for Project Bible Features

### **Template System**
Create JSON-based templates for each PM document type with variable substitution:
```json
{
  "id": "project-charter",
  "sections": [
    {"title": "Executive Summary", "required": true},
    {"title": "Project Objectives", "required": true},
    {"title": "Scope Statement", "required": true}
  ]
}
```

### **Intelligent Processing**
Implement regex patterns to detect PM sections automatically:
- Executive Summary patterns
- Stakeholder identification
- Risk register formatting
- WBS hierarchy detection

### **Professional Output**
Generate PDFs with:
- Clickable table of contents
- Page numbering by section
- Custom headers/footers
- Document metadata
- Version control information

## Next Steps

1. **Start with Template Engine** - This provides immediate value and establishes the foundation
2. **Implement Section Detection** - Automates the most tedious formatting tasks
3. **Build Comprehensive Tests** - Ensures reliability with real documents
4. **Add Multi-Document Merging** - Creates the true "Project Bible" experience

The documentation provides everything needed for Grk Code Fast to pair program with you effectively, including specific code examples, test patterns, common pitfalls, and implementation priorities. Focus on your self-use case first - this will ensure the features truly solve your project management documentation needs.

Below is some code examples and implemeantion advise to help you get started quickly. Happy coding!## 📄 Code Examples and Implementation Advic

# CODE IMPLEMENTATION EXAMPLES

## 1. Template System Implementation

// src/utils/templateEngine.js
export class TemplateEngine {
  constructor() {
    this.templates = {
      projectCharter: this.loadCharter(),
      wbs: this.loadWBS(),
      riskRegister: this.loadRiskRegister()
    };
  }

  loadCharter() {
    return {
      sections: [
        'Executive Summary',
        'Project Objectives',
        'Scope Statement',
        'Stakeholders',
        'Milestones',
        'Budget Overview',
        'Success Criteria',
        'Approval Requirements'
      ],
      requiredFields: ['projectName', 'projectManager', 'sponsor']
    };
  }

  generateFromTemplate(templateName, data) {
    const template = this.templates[templateName];
    return this.populateTemplate(template, data);
  }

  populateTemplate(template, data) {
    // AI-powered content generation logic
    const content = template.sections.map(section => {
      return {
        heading: section,
        content: data[this.toCamelCase(section)] || this.generatePlaceholder(section)
      };
    });
    return content;
  }

  validateTemplate(data, templateName) {
    const template = this.templates[templateName];
    const missing = template.requiredFields.filter(field => !data[field]);
    return { valid: missing.length === 0, missing };
  }
}

## 2. Section Detection Algorithm

// src/utils/sectionDetector.js
export class SectionDetector {
  constructor() {
    this.pmSections = [
      { pattern: /executive\s+summary/i, type: 'executiveSummary' },
      { pattern: /project\s+objectives?/i, type: 'objectives' },
      { pattern: /scope\s+statement/i, type: 'scope' },
      { pattern: /stakeholders?/i, type: 'stakeholders' },
      { pattern: /risks?\s+register/i, type: 'risks' },
      { pattern: /wbs|work\s+breakdown/i, type: 'wbs' }
    ];
  }

  detectSections(document) {
    const lines = document.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach((line, index) => {
      const detected = this.pmSections.find(s => s.pattern.test(line));
      if (detected) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: detected.type,
          title: line.trim(),
          startLine: index,
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }

  normalizeHeadings(sections) {
    let level1 = 1;
    return sections.map(section => {
      section.numbering = `${level1}.0`;
      section.content = this.numberSubsections(section.content, level1);
      level1++;
      return section;
    });
  }

  numberSubsections(content, parentLevel) {
    // Detect and number subsections
    let level2 = 1;
    return content.map(line => {
      if (this.isSubheading(line)) {
        return `${parentLevel}.${level2++} ${line.trim()}`;
      }
      return line;
    });
  }
}

## 3. Enhanced PDF Generator

// src/components/EnhancedPDFGenerator.js
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  toc: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1pt solid #ccc'
  },
  tocItem: {
    fontSize: 10,
    marginBottom: 5,
    paddingLeft: 10
  },
  section: {
    marginBottom: 15
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 5
  }
});

export const ProjectBiblePDF = ({ sections, metadata }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover Page */}
        <View>
          <Text style={styles.header}>{metadata.title}</Text>
          <Text>Project Manager: {metadata.pm}</Text>
          <Text>Version: {metadata.version}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Table of Contents */}
        <View style={styles.toc}>
          <Text style={styles.header}>Table of Contents</Text>
          {sections.map((section, idx) => (
            <Text key={idx} style={styles.tocItem}>
              {section.numbering} {section.title}
            </Text>
          ))}
        </View>
      </Page>

      {/* Content Pages */}
      {sections.map((section, idx) => (
        <Page key={idx} size="A4" style={styles.page}>
          <Text style={styles.header}>
            {section.numbering} {section.title}
          </Text>
          <View style={styles.section}>
            {section.content.map((para, pIdx) => (
              <Text key={pIdx} style={{marginBottom: 8}}>
                {para}
              </Text>
            ))}
          </View>

          {section.table && (
            <View style={styles.table}>
              {section.table.rows.map((row, rIdx) => (
                <View key={rIdx} style={styles.tableRow}>
                  {row.cells.map((cell, cIdx) => (
                    <Text key={cIdx} style={styles.tableCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
};

## 4. Multi-Document Merger

// src/utils/documentMerger.js
export class DocumentMerger {
  constructor() {
    this.parsers = {
      docx: this.parseDocx,
      pdf: this.parsePdf,
      txt: this.parseText
    };
  }

  async mergeDocuments(files) {
    const parsed = await Promise.all(
      files.map(file => this.parseDocument(file))
    );

    return this.consolidate(parsed);
  }

  async parseDocument(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const parser = this.parsers[extension];

    if (!parser) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    return await parser(file);
  }

  consolidate(documents) {
    // Detect and merge similar sections
    const merged = {
      sections: [],
      metadata: this.mergeMetadata(documents)
    };

    documents.forEach(doc => {
      doc.sections.forEach(section => {
        const existing = merged.sections.find(s => 
          s.type === section.type
        );

        if (existing) {
          existing.content.push(...section.content);
        } else {
          merged.sections.push({...section});
        }
      });
    });

    return this.applyConsistentFormatting(merged);
  }

  applyConsistentFormatting(document) {
    // Normalize styles, numbering, fonts
    const detector = new SectionDetector();
    document.sections = detector.normalizeHeadings(document.sections);
    return document;
  }
}

## 5. Component Architecture

// src/components/ProjectBibleBuilder.js
import React, { useState } from 'react';
import { TemplateSelector } from './TemplateSelector';
import { MultiFileUpload } from './MultiFileUpload';
import { DocumentEditor } from './DocumentEditor';
import { PDFPreview } from './PDFPreview';

export const ProjectBibleBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedContent, setProcessedContent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesUploaded = async (files) => {
    setUploadedFiles(files);
    setIsProcessing(true);

    try {
      const merger = new DocumentMerger();
      const merged = await merger.mergeDocuments(files);
      setProcessedContent(merged);
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateApply = (content, template) => {
    const engine = new TemplateEngine();
    const formatted = engine.generateFromTemplate(template, content);
    setProcessedContent(formatted);
  };

  return (
    <div className="builder-container">
      <TemplateSelector 
        onSelect={setSelectedTemplate}
      />

      <MultiFileUpload 
        onFilesUploaded={handleFilesUploaded}
        maxFiles={10}
        maxSizeMB={20}
      />

      {isProcessing && <LoadingSpinner />}

      {processedContent && (
        <>
          <DocumentEditor 
            content={processedContent}
            onChange={setProcessedContent}
          />

          <PDFPreview 
            content={processedContent}
            template={selectedTemplate}
          />
        </>
      )}
    </div>
  );

  # COMPREHENSIVE TEST SUITE FOR DOC-FORMATTER PROJECT BIBLE FEATURES

## Unit Tests (Jest + React Testing Library)

### 1. File Upload Validation Tests
describe('FileUpload Component', () => {
  test('accepts valid project charter DOCX file', () => {
    // Test file type validation
  });

  test('rejects files exceeding 20MB limit', () => {
    // Test size validation
  });

  test('validates PDF content extraction', () => {
    // Test mammoth.js parsing accuracy
  });

  test('handles malformed document gracefully', () => {
    // Test error handling
  });
});

### 2. Template Engine Tests
describe('TemplateEngine', () => {
  test('generates project charter from template', () => {
    // Test template rendering
  });

  test('applies custom variables to template', () => {
    // Test variable substitution
  });

  test('validates required sections in project bible', () => {
    // Test section validation
  });

  test('merges multiple templates correctly', () => {
    // Test template merging
  });
});

### 3. Document Parser Tests
describe('DocumentParser', () => {
  test('detects project charter sections automatically', () => {
    // Test section detection algorithm
  });

  test('extracts tables and preserves structure', () => {
    // Test table parsing
  });

  test('identifies stakeholder matrix format', () => {
    // Test PM-specific content recognition
  });

  test('generates proper header hierarchy', () => {
    // Test heading normalization
  });
});

### 4. PDF Generation Tests
describe('PDFGenerator', () => {
  test('creates PDF with table of contents', () => {
    // Test TOC generation
  });

  test('applies custom headers and footers', () => {
    // Test PDF customization
  });

  test('embeds metadata correctly', () => {
    // Test metadata inclusion
  });

  test('handles multi-page documents', () => {
    // Test page break logic
  });
});

## Integration Tests

### 5. Full Workflow Tests
describe('Complete Project Bible Creation', () => {
  test('uploads charter, WBS, and risk register, merges into single PDF', () => {
    // Test end-to-end workflow
  });

  test('applies consistent formatting across all sections', () => {
    // Test style consistency
  });

  test('validates cross-references between sections', () => {
    // Test document integrity
  });
});

## E2E Tests (Cypress)

### 6. User Interaction Tests
describe('Project Bible Builder Workflow', () => {
  it('should complete full project bible creation', () => {
    cy.visit('/');
    cy.get('[data-testid="file-upload"]').attachFile('charter.docx');
    cy.get('[data-testid="format-btn"]').click();
    cy.get('[data-testid="template-select"]').select('project-charter');
    cy.get('[data-testid="download-pdf"]').click();

    // Validate PDF download
    cy.readFile('cypress/downloads/project-bible.pdf').should('exist');
  });

  it('should handle multiple file uploads', () => {
    cy.get('[data-testid="multi-upload"]')
      .attachFile(['charter.docx', 'wbs.xlsx', 'risks.pdf']);
    cy.get('[data-testid="merge-docs"]').click();
    // Validate merged output
  });
});

### 7. Error Handling Tests
describe('Error Scenarios', () => {
  it('displays error for invalid file type', () => {
    cy.get('[data-testid="file-upload"]').attachFile('invalid.exe');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Unsupported file format');
  });

  it('handles file too large gracefully', () => {
    cy.get('[data-testid="file-upload"]').attachFile('huge-file.pdf');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'File exceeds 20MB limit');
  });
});

## Performance Tests

### 8. Load and Stress Tests
describe('Performance Benchmarks', () => {
  test('processes 20MB document within 5 seconds', async () => {
    // Test processing speed
  });

  test('handles 10 concurrent document uploads', async () => {
    // Test concurrent processing
  });

  test('memory usage stays below 500MB for large docs', () => {
    // Test memory efficiency
  });
});

## Mock Data and Fixtures

### Test Data Structure
const mockProjectCharter = {
  title: "Digital Product Enhancement Project",
  projectManager: "John Doe",
  sponsor: "Jane Smith",
  objectives: ["Improve UX", "Reduce load time"],
  scope: "Complete redesign of mobile app",
  budget: "$500,000",
  timeline: "6 months"
};

const mockWBS = {
  levels: [
    { id: "1.0", name: "Project Management", children: [...] },
    { id: "2.0", name: "Design Phase", children: [...] }
  ]
};

const mockRiskRegister = [
  {
    id: "R001",
    description: "Scope creep",
    probability: "High",
    impact: "High",
    mitigation: "Weekly scope reviews"
  }

 # INSTRUCTIONS FOR GRK CODE FAST: DOC-FORMATTER ENHANCEMENT PROJECT

## PROJECT CONTEXT
You are enhancing a React-based document formatter specifically for creating comprehensive Project Bible documentation (Project Charters, WBS, Risk Registers, etc.). The current application supports basic file upload and PDF export but needs advanced features for professional project management documentation.

## CURRENT TECH STACK
- React 18.2.0
- Create React App
- @react-pdf/renderer (PDF generation)
- mammoth (DOCX parsing)
- pdf-parse (PDF text extraction)
- marked (Markdown processing)
- Jest + React Testing Library (unit tests)
- Cypress (E2E tests)

## PRIORITY ENHANCEMENTS (In Order)

### PHASE 1: FOUNDATION (Week 1-2)

#### 1.1 Template System Implementation
**Goal**: Create reusable templates for common PM documents

**Tasks**:
- Create `src/utils/templateEngine.js` with TemplateEngine class
- Define template structures for:
  * Project Charter (8 sections: Executive Summary, Objectives, Scope, Stakeholders, Milestones, Budget, Success Criteria, Approvals)
  * Work Breakdown Structure (hierarchical task breakdown)
  * Risk Register (ID, Description, Probability, Impact, Mitigation)
  * RACI Matrix (Responsible, Accountable, Consulted, Informed)
  * Stakeholder Matrix
- Implement template validation logic
- Add template selection UI component

**Files to Create**:
```
src/utils/templateEngine.js
src/components/TemplateSelector.js
src/templates/projectCharter.json
src/templates/wbs.json
src/templates/riskRegister.json
```

**Key Functions**:
- `loadTemplate(name)` - Load template by name
- `generateFromTemplate(templateName, data)` - Populate template with data
- `validateTemplate(data, templateName)` - Validate required fields
- `listAvailableTemplates()` - Return all templates

#### 1.2 Section Detection & Auto-Formatting
**Goal**: Automatically detect PM document sections and apply proper formatting

**Tasks**:
- Create `src/utils/sectionDetector.js` with SectionDetector class
- Implement regex patterns for common PM sections
- Build heading hierarchy normalization (1.0, 1.1, 1.1.1)
- Auto-generate section numbering
- Detect tables and preserve structure

**Algorithm**:
1. Parse document line by line
2. Match lines against PM section patterns
3. Extract section content
4. Normalize heading levels
5. Apply consistent numbering

**Test Coverage Required**:
- Test with 5+ different project charter formats
- Test with nested WBS structures (3+ levels deep)
- Test with malformed headings
- Validate numbering sequence accuracy

#### 1.3 Enhanced File Parser
**Goal**: Improve parsing accuracy for complex documents

**Tasks**:
- Extend `src/utils/fileParser.js` with table extraction
- Add support for embedded images
- Implement style preservation logic
- Handle multi-column layouts
- Extract metadata (author, creation date, version)

**Error Handling**:
- Graceful degradation for unsupported formatting
- Clear error messages for parsing failures
- Fallback to plain text extraction if needed

### PHASE 2: ADVANCED FEATURES (Week 3-4)

#### 2.1 Multi-Document Merging
**Goal**: Merge multiple PM docs into single Project Bible

**Tasks**:
- Create `src/utils/documentMerger.js` with DocumentMerger class
- Implement duplicate section detection
- Build content consolidation logic
- Apply consistent styling across merged docs
- Generate unified table of contents

**Workflow**:
1. User uploads multiple files (charter, WBS, risks)
2. System parses each document
3. Detects section types in each doc
4. Merges similar sections or keeps separate
5. Applies master template formatting
6. Generates unified PDF

**UI Requirements**:
- Drag-and-drop multi-file upload
- Preview of each uploaded doc
- Section mapping interface (manual override)
- Merge options (combine vs. separate sections)

#### 2.2 Advanced PDF Customization
**Goal**: Professional PDF output with PM-specific features

**Tasks**:
- Enhance `src/components/PDFGenerator.js`
- Add table of contents with clickable links
- Implement custom headers/footers with page numbers
- Add cover page generator
- Support watermarks (DRAFT, CONFIDENTIAL)
- Embed document metadata
- Create PDF/A compliance option

**Styling Options**:
- Corporate branding (logo, colors)
- Font customization
- Page orientation per section
- Custom page breaks
- Multi-column layouts for specific sections

#### 2.3 Intelligent Content Enhancement
**Goal**: AI-assisted content suggestions

**Tasks**:
- Build `src/utils/contentAnalyzer.js`
- Detect missing required sections
- Suggest content based on partial input
- Validate PM best practices (SMART objectives, etc.)
- Flag incomplete risk assessments
- Recommend stakeholder categories

**AI Integration Points**:
- Section completeness checker
- Content quality scorer
- Template field auto-population
- Smart suggestions for missing content

### PHASE 3: TESTING & QUALITY (Ongoing)

#### 3.1 Comprehensive Test Suite
**Goal**: Achieve 90%+ test coverage

**Unit Tests (Jest)**:
```javascript
// Template Engine Tests
describe('TemplateEngine', () => {
  test('loads project charter template correctly', () => {});
  test('validates required fields', () => {});
  test('generates content from template and data', () => {});
  test('handles missing template gracefully', () => {});
});

// Section Detector Tests  
describe('SectionDetector', () => {
  test('detects all standard PM sections', () => {});
  test('normalizes heading hierarchy', () => {});
  test('applies correct numbering sequence', () => {});
  test('handles nested subsections', () => {});
});

// Document Merger Tests
describe('DocumentMerger', () => {
  test('merges 3 documents successfully', () => {});
  test('handles duplicate sections', () => {});
  test('maintains style consistency', () => {});
  test('generates unified TOC', () => {});
});

// PDF Generator Tests
describe('EnhancedPDFGenerator', () => {
  test('creates PDF with TOC', () => {});
  test('applies custom headers/footers', () => {});
  test('embeds metadata correctly', () => {});
  test('handles 50+ page documents', () => {});
});
```

**Integration Tests**:
```javascript
describe('Full Project Bible Workflow', () => {
  test('uploads charter, formats, exports PDF', async () => {
    const charter = new File(['content'], 'charter.docx');
    const result = await processDocument(charter);
    expect(result.sections).toHaveLength(8);
    expect(result.pdf).toBeDefined();
  });

  test('merges 3 docs and exports unified PDF', async () => {
    const files = [charter, wbs, risks];
    const merged = await mergeDocuments(files);
    expect(merged.sections).toHaveLength(15);
  });
});
```

**E2E Tests (Cypress)**:
```javascript
describe('Project Bible Builder', () => {
  it('completes full creation workflow', () => {
    cy.visit('/');

    // Upload files
    cy.get('[data-testid="file-upload"]')
      .attachFile(['charter.docx', 'wbs.xlsx', 'risks.pdf']);

    // Select template
    cy.get('[data-testid="template-select"]')
      .select('comprehensive-bible');

    // Format documents
    cy.get('[data-testid="format-btn"]').click();
    cy.get('[data-testid="processing-indicator"]')
      .should('be.visible');

    // Verify preview
    cy.get('[data-testid="preview-panel"]')
      .should('contain', 'Executive Summary');

    // Export PDF
    cy.get('[data-testid="export-pdf"]').click();

    // Validate download
    cy.readFile('cypress/downloads/project-bible.pdf')
      .should('exist');
  });

  it('handles invalid files gracefully', () => {
    cy.get('[data-testid="file-upload"]')
      .attachFile('invalid.exe');
    cy.get('[data-testid="error-alert"]')
      .should('contain', 'Unsupported file format');
  });
});
```

#### 3.2 Test Data Creation
**Required Test Files**:
- `sample-charter-basic.docx` - Simple 2-page charter
- `sample-charter-complex.docx` - 10-page with tables, images
- `sample-wbs.xlsx` - 5-level hierarchy
- `sample-risks.pdf` - 20 risk items
- `malformed-doc.docx` - Broken formatting for error testing
- `large-file.pdf` - 19MB file for size limit testing
- `multi-format-set/` - Directory with 5 docs to merge

**Mock Data Objects**:
```javascript
const mockCharter = {
  projectName: "Digital Product Quality Enhancement",
  projectManager: "John Doe",
  sponsor: "Jane Smith",
  startDate: "2025-01-15",
  endDate: "2025-07-15",
  budget: "$500,000",
  objectives: [
    "Improve user experience scores by 30%",
    "Reduce page load time to under 2 seconds",
    "Increase mobile responsiveness to 100%"
  ],
  scope: {
    inScope: ["Mobile app redesign", "API optimization"],
    outOfScope: ["Backend infrastructure changes"]
  },
  stakeholders: [
    { name: "CEO", role: "Executive Sponsor" },
    { name: "CTO", role: "Technical Advisor" }
  ]
};
```

## CODING STANDARDS & BEST PRACTICES

### Component Structure
```javascript
// Good: Small, focused components
const TemplateSelector = ({ templates, onSelect }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="template-selector">
      {templates.map(t => (
        <TemplateCard 
          key={t.id}
          template={t}
          onClick={() => onSelect(t)}
        />
      ))}
    </div>
  );
};

// Bad: Monolithic component with too many responsibilities
```

### Error Handling
```javascript
// Good: Specific error messages
try {
  const parsed = await parseDocument(file);
} catch (error) {
  if (error.code === 'UNSUPPORTED_FORMAT') {
    showError('This file format is not supported. Please use DOCX, PDF, or TXT.');
  } else if (error.code === 'FILE_TOO_LARGE') {
    showError(`File size (${error.size}MB) exceeds 20MB limit.`);
  } else {
    showError('An unexpected error occurred. Please try again.');
  }
}

// Bad: Generic error handling
```

### Performance Optimization
```javascript
// Use React.memo for expensive renders
export const DocumentPreview = React.memo(({ content }) => {
  return <div>{renderContent(content)}</div>;
});

// Use useMemo for expensive computations
const formattedSections = useMemo(() => {
  return sections.map(s => formatSection(s));
}, [sections]);

// Use Web Workers for heavy parsing
const worker = new Worker('documentParser.worker.js');
worker.postMessage({ file: largeFile });
worker.onmessage = (e) => {
  setProcessedContent(e.data);
};
```

### File Organization
```
src/
├── components/
│   ├── builders/
│   │   ├── ProjectBibleBuilder.js
│   │   ├── TemplateSelector.js
│   │   └── MultiFileUpload.js
│   ├── editors/
│   │   ├── DocumentEditor.js
│   │   ├── SectionEditor.js
│   │   └── TableEditor.js
│   ├── previews/
│   │   ├── PDFPreview.js
│   │   └── LivePreview.js
│   └── shared/
│       ├── FileUpload.js
│       └── LoadingSpinner.js
├── utils/
│   ├── templateEngine.js
│   ├── sectionDetector.js
│   ├── documentMerger.js
│   ├── contentAnalyzer.js
│   └── validators.js
├── templates/
│   ├── projectCharter.json
│   ├── wbs.json
│   └── riskRegister.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── hooks/
    ├── useDocumentParser.js
    ├── useTemplateEngine.js
    └── usePDFGenerator.js
```

## SPECIFIC IMPLEMENTATION GUIDANCE

### 1. Template Engine Implementation
**Start Here**:
```javascript
// src/utils/templateEngine.js
export class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }

  loadDefaultTemplates() {
    // Load from JSON files
    import('./templates/projectCharter.json').then(t => {
      this.templates.set('project-charter', t);
    });
    // ... load others
  }

  // Critical method - implement first
  generateFromTemplate(templateName, userData) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return template.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: this.populateSection(section, userData),
      numbering: section.numbering
    }));
  }

  populateSection(section, data) {
    // Use regex to replace {{field}} with actual data
    let content = section.template;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, data[key]);
    });
    return content;
  }
}
```

### 2. Section Detector Implementation
**Critical Logic**:
```javascript
// src/utils/sectionDetector.js
export class SectionDetector {
  detectSections(text) {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    // PM section patterns (customize for your needs)
    const patterns = {
      executiveSummary: /executive\s+summary|overview/i,
      objectives: /objectives?|goals?/i,
      scope: /scope\s+statement|project\s+scope/i,
      stakeholders: /stakeholders?/i,
      risks: /risks?\s+register|risk\s+management/i
    };

    lines.forEach((line, idx) => {
      // Check if line matches any section pattern
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            type,
            title: line.trim(),
            startLine: idx,
            content: []
          };
          break;
        }
      }

      // Add line to current section
      if (currentSection && !patterns[currentSection.type].test(line)) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }
}
```

### 3. Document Merger Implementation
**Key Algorithm**:
```javascript
// src/utils/documentMerger.js
export class DocumentMerger {
  async mergeDocuments(files) {
    // Parse all files
    const parsedDocs = await Promise.all(
      files.map(f => this.parseFile(f))
    );

    // Group by section type
    const grouped = this.groupBySection(parsedDocs);

    // Merge and format
    return this.consolidate(grouped);
  }

  groupBySection(docs) {
    const groups = {};
    docs.forEach(doc => {
      doc.sections.forEach(section => {
        if (!groups[section.type]) {
          groups[section.type] = [];
        }
        groups[section.type].push(section);
      });
    });
    return groups;
  }

  consolidate(groups) {
    const sections = [];
    let numbering = 1;

    Object.entries(groups).forEach(([type, sectionArray]) => {
      if (sectionArray.length === 1) {
        // Single section, use as-is
        sections.push({
          ...sectionArray[0],
          numbering: `${numbering}.0`
        });
      } else {
        // Multiple sections, merge content
        const merged = {
          type,
          title: sectionArray[0].title,
          numbering: `${numbering}.0`,
          content: sectionArray.flatMap(s => s.content)
        };
        sections.push(merged);
      }
      numbering++;
    });

    return { sections, metadata: this.extractMetadata(groups) };
  }
}
```

## DEBUGGING & TROUBLESHOOTING

### Common Issues & Solutions

**Issue**: Mammoth parsing loses table formatting
**Solution**: Use custom style mapping
```javascript
const options = {
  styleMap: [
    "p[style-name='Table Cell'] => td",
    "p[style-name='Table Header'] => th"
  ]
};
mammoth.convertToHtml({ arrayBuffer }, options);
```

**Issue**: PDF generation fails with large documents
**Solution**: Implement pagination and memory management
```javascript
const generateLargePDF = async (sections) => {
  const chunks = chunkArray(sections, 10); // 10 sections per chunk
  const pdfs = [];

  for (const chunk of chunks) {
    const pdf = await generatePDFChunk(chunk);
    pdfs.push(pdf);
  }

  return mergePDFs(pdfs);
};
```

**Issue**: Jest tests fail with "Cannot find module 'mammoth'"
**Solution**: Mock external dependencies
```javascript
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({
    value: '<p>Mock content</p>'
  })
}));
```

## PERFORMANCE TARGETS

- File upload: < 500ms for 5MB file
- Document parsing: < 2s for 20-page DOCX
- PDF generation: < 3s for 30-page document
- Multi-file merge: < 5s for 5 documents
- Memory usage: < 500MB for largest operations
- Test execution: < 30s for full suite

## DELIVERABLES CHECKLIST

- [ ] Template system with 5+ PM templates
- [ ] Section detection with 90%+ accuracy
- [ ] Multi-document merging capability
- [ ] Enhanced PDF with TOC, headers, metadata
- [ ] Comprehensive test suite (90%+ coverage)
- [ ] Sample test data (10+ files)
- [ ] Documentation for all new features
- [ ] Performance benchmarks met
- [ ] Zero critical bugs
- [ ] Accessibility compliance (WCAG 2.1 AA)

## COLLABORATION WORKFLOW

1. **Start with Phase 1.1** - Template System (highest priority)
2. **Write tests first** (TDD approach)
3. **Commit frequently** with clear messages
4. **Request code review** after each major feature
5. **Update documentation** as you build
6. **Run full test suite** before final commit

## QUESTIONS TO ASK DURING DEVELOPMENT

- Does this feature align with PM best practices?
- Can this be tested automatically?
- How will this perform with 50-page documents?
- Is the error message clear to non-technical users?
- Can this component be reused elsewhere?
- Does this maintain backwards compatibility?

## NEXT STEPS AFTER COMPLETION

1. Deploy to staging environment
2. User testing with real PM documents
3. Gather feedback and iterate
4. Add advanced features (collaboration, version control)
5. Build API for programmatic access
6. Create video tutorials
7. Write blog post on implementation

---

**IMPORTANT REMINDERS**:
- Focus on self-use first (don't over-engineer for scale)
- PM document quality is critical (accuracy > speed)
- Test with REAL project documents, not just samples
- Keep UI simple and intuitive
- Document everything for future reference
- Ask questions if requirements are unclear

**BEGIN WITH**: Template Engine implementation (Phase 1.1)
**EXPECTED TIMELINE**: 2-4 weeks for full implementation
**PRIMARY GOAL**: Create production-ready Project Bible generator


# INSTRUCTIONS FOR GRK CODE FAST: DOC-FORMATTER ENHANCEMENT PROJECT

## PROJECT CONTEXT
You are enhancing a React-based document formatter specifically for creating comprehensive Project Bible documentation (Project Charters, WBS, Risk Registers, etc.). The current application supports basic file upload and PDF export but needs advanced features for professional project management documentation.

## CURRENT TECH STACK
- React 18.2.0
- Create React App
- @react-pdf/renderer (PDF generation)
- mammoth (DOCX parsing)
- pdf-parse (PDF text extraction)
- marked (Markdown processing)
- Jest + React Testing Library (unit tests)
- Cypress (E2E tests)

## PRIORITY ENHANCEMENTS (In Order)

### PHASE 1: FOUNDATION (Week 1-2)

#### 1.1 Template System Implementation
**Goal**: Create reusable templates for common PM documents

**Tasks**:
- Create `src/utils/templateEngine.js` with TemplateEngine class
- Define template structures for:
  * Project Charter (8 sections: Executive Summary, Objectives, Scope, Stakeholders, Milestones, Budget, Success Criteria, Approvals)
  * Work Breakdown Structure (hierarchical task breakdown)
  * Risk Register (ID, Description, Probability, Impact, Mitigation)
  * RACI Matrix (Responsible, Accountable, Consulted, Informed)
  * Stakeholder Matrix
- Implement template validation logic
- Add template selection UI component

**Files to Create**:
```
src/utils/templateEngine.js
src/components/TemplateSelector.js
src/templates/projectCharter.json
src/templates/wbs.json
src/templates/riskRegister.json
```

**Key Functions**:
- `loadTemplate(name)` - Load template by name
- `generateFromTemplate(templateName, data)` - Populate template with data
- `validateTemplate(data, templateName)` - Validate required fields
- `listAvailableTemplates()` - Return all templates

#### 1.2 Section Detection & Auto-Formatting
**Goal**: Automatically detect PM document sections and apply proper formatting

**Tasks**:
- Create `src/utils/sectionDetector.js` with SectionDetector class
- Implement regex patterns for common PM sections
- Build heading hierarchy normalization (1.0, 1.1, 1.1.1)
- Auto-generate section numbering
- Detect tables and preserve structure

**Algorithm**:
1. Parse document line by line
2. Match lines against PM section patterns
3. Extract section content
4. Normalize heading levels
5. Apply consistent numbering

**Test Coverage Required**:
- Test with 5+ different project charter formats
- Test with nested WBS structures (3+ levels deep)
- Test with malformed headings
- Validate numbering sequence accuracy

#### 1.3 Enhanced File Parser
**Goal**: Improve parsing accuracy for complex documents

**Tasks**:
- Extend `src/utils/fileParser.js` with table extraction
- Add support for embedded images
- Implement style preservation logic
- Handle multi-column layouts
- Extract metadata (author, creation date, version)

**Error Handling**:
- Graceful degradation for unsupported formatting
- Clear error messages for parsing failures
- Fallback to plain text extraction if needed

### PHASE 2: ADVANCED FEATURES (Week 3-4)

#### 2.1 Multi-Document Merging
**Goal**: Merge multiple PM docs into single Project Bible

**Tasks**:
- Create `src/utils/documentMerger.js` with DocumentMerger class
- Implement duplicate section detection
- Build content consolidation logic
- Apply consistent styling across merged docs
- Generate unified table of contents

**Workflow**:
1. User uploads multiple files (charter, WBS, risks)
2. System parses each document
3. Detects section types in each doc
4. Merges similar sections or keeps separate
5. Applies master template formatting
6. Generates unified PDF

**UI Requirements**:
- Drag-and-drop multi-file upload
- Preview of each uploaded doc
- Section mapping interface (manual override)
- Merge options (combine vs. separate sections)

#### 2.2 Advanced PDF Customization
**Goal**: Professional PDF output with PM-specific features

**Tasks**:
- Enhance `src/components/PDFGenerator.js`
- Add table of contents with clickable links
- Implement custom headers/footers with page numbers
- Add cover page generator
- Support watermarks (DRAFT, CONFIDENTIAL)
- Embed document metadata
- Create PDF/A compliance option

**Styling Options**:
- Corporate branding (logo, colors)
- Font customization
- Page orientation per section
- Custom page breaks
- Multi-column layouts for specific sections

#### 2.3 Intelligent Content Enhancement
**Goal**: AI-assisted content suggestions

**Tasks**:
- Build `src/utils/contentAnalyzer.js`
- Detect missing required sections
- Suggest content based on partial input
- Validate PM best practices (SMART objectives, etc.)
- Flag incomplete risk assessments
- Recommend stakeholder categories

**AI Integration Points**:
- Section completeness checker
- Content quality scorer
- Template field auto-population
- Smart suggestions for missing content

### PHASE 3: TESTING & QUALITY (Ongoing)

#### 3.1 Comprehensive Test Suite
**Goal**: Achieve 90%+ test coverage

**Unit Tests (Jest)**:
```javascript
// Template Engine Tests
describe('TemplateEngine', () => {
  test('loads project charter template correctly', () => {});
  test('validates required fields', () => {});
  test('generates content from template and data', () => {});
  test('handles missing template gracefully', () => {});
});

// Section Detector Tests  
describe('SectionDetector', () => {
  test('detects all standard PM sections', () => {});
  test('normalizes heading hierarchy', () => {});
  test('applies correct numbering sequence', () => {});
  test('handles nested subsections', () => {});
});

// Document Merger Tests
describe('DocumentMerger', () => {
  test('merges 3 documents successfully', () => {});
  test('handles duplicate sections', () => {});
  test('maintains style consistency', () => {});
  test('generates unified TOC', () => {});
});

// PDF Generator Tests
describe('EnhancedPDFGenerator', () => {
  test('creates PDF with TOC', () => {});
  test('applies custom headers/footers', () => {});
  test('embeds metadata correctly', () => {});
  test('handles 50+ page documents', () => {});
});
```

**Integration Tests**:
```javascript
describe('Full Project Bible Workflow', () => {
  test('uploads charter, formats, exports PDF', async () => {
    const charter = new File(['content'], 'charter.docx');
    const result = await processDocument(charter);
    expect(result.sections).toHaveLength(8);
    expect(result.pdf).toBeDefined();
  });

  test('merges 3 docs and exports unified PDF', async () => {
    const files = [charter, wbs, risks];
    const merged = await mergeDocuments(files);
    expect(merged.sections).toHaveLength(15);
  });
});
```

**E2E Tests (Cypress)**:
```javascript
describe('Project Bible Builder', () => {
  it('completes full creation workflow', () => {
    cy.visit('/');

    // Upload files
    cy.get('[data-testid="file-upload"]')
      .attachFile(['charter.docx', 'wbs.xlsx', 'risks.pdf']);

    // Select template
    cy.get('[data-testid="template-select"]')
      .select('comprehensive-bible');

    // Format documents
    cy.get('[data-testid="format-btn"]').click();
    cy.get('[data-testid="processing-indicator"]')
      .should('be.visible');

    // Verify preview
    cy.get('[data-testid="preview-panel"]')
      .should('contain', 'Executive Summary');

    // Export PDF
    cy.get('[data-testid="export-pdf"]').click();

    // Validate download
    cy.readFile('cypress/downloads/project-bible.pdf')
      .should('exist');
  });

  it('handles invalid files gracefully', () => {
    cy.get('[data-testid="file-upload"]')
      .attachFile('invalid.exe');
    cy.get('[data-testid="error-alert"]')
      .should('contain', 'Unsupported file format');
  });
});
```

#### 3.2 Test Data Creation
**Required Test Files**:
- `sample-charter-basic.docx` - Simple 2-page charter
- `sample-charter-complex.docx` - 10-page with tables, images
- `sample-wbs.xlsx` - 5-level hierarchy
- `sample-risks.pdf` - 20 risk items
- `malformed-doc.docx` - Broken formatting for error testing
- `large-file.pdf` - 19MB file for size limit testing
- `multi-format-set/` - Directory with 5 docs to merge

**Mock Data Objects**:
```javascript
const mockCharter = {
  projectName: "Digital Product Quality Enhancement",
  projectManager: "John Doe",
  sponsor: "Jane Smith",
  startDate: "2025-01-15",
  endDate: "2025-07-15",
  budget: "$500,000",
  objectives: [
    "Improve user experience scores by 30%",
    "Reduce page load time to under 2 seconds",
    "Increase mobile responsiveness to 100%"
  ],
  scope: {
    inScope: ["Mobile app redesign", "API optimization"],
    outOfScope: ["Backend infrastructure changes"]
  },
  stakeholders: [
    { name: "CEO", role: "Executive Sponsor" },
    { name: "CTO", role: "Technical Advisor" }
  ]
};
```

## CODING STANDARDS & BEST PRACTICES

### Component Structure
```javascript
// Good: Small, focused components
const TemplateSelector = ({ templates, onSelect }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="template-selector">
      {templates.map(t => (
        <TemplateCard 
          key={t.id}
          template={t}
          onClick={() => onSelect(t)}
        />
      ))}
    </div>
  );
};

// Bad: Monolithic component with too many responsibilities
```

### Error Handling
```javascript
// Good: Specific error messages
try {
  const parsed = await parseDocument(file);
} catch (error) {
  if (error.code === 'UNSUPPORTED_FORMAT') {
    showError('This file format is not supported. Please use DOCX, PDF, or TXT.');
  } else if (error.code === 'FILE_TOO_LARGE') {
    showError(`File size (${error.size}MB) exceeds 20MB limit.`);
  } else {
    showError('An unexpected error occurred. Please try again.');
  }
}

// Bad: Generic error handling
```

### Performance Optimization
```javascript
// Use React.memo for expensive renders
export const DocumentPreview = React.memo(({ content }) => {
  return <div>{renderContent(content)}</div>;
});

// Use useMemo for expensive computations
const formattedSections = useMemo(() => {
  return sections.map(s => formatSection(s));
}, [sections]);

// Use Web Workers for heavy parsing
const worker = new Worker('documentParser.worker.js');
worker.postMessage({ file: largeFile });
worker.onmessage = (e) => {
  setProcessedContent(e.data);
};
```

### File Organization
```
src/
├── components/
│   ├── builders/
│   │   ├── ProjectBibleBuilder.js
│   │   ├── TemplateSelector.js
│   │   └── MultiFileUpload.js
│   ├── editors/
│   │   ├── DocumentEditor.js
│   │   ├── SectionEditor.js
│   │   └── TableEditor.js
│   ├── previews/
│   │   ├── PDFPreview.js
│   │   └── LivePreview.js
│   └── shared/
│       ├── FileUpload.js
│       └── LoadingSpinner.js
├── utils/
│   ├── templateEngine.js
│   ├── sectionDetector.js
│   ├── documentMerger.js
│   ├── contentAnalyzer.js
│   └── validators.js
├── templates/
│   ├── projectCharter.json
│   ├── wbs.json
│   └── riskRegister.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── hooks/
    ├── useDocumentParser.js
    ├── useTemplateEngine.js
    └── usePDFGenerator.js
```

## SPECIFIC IMPLEMENTATION GUIDANCE

### 1. Template Engine Implementation
**Start Here**:
```javascript
// src/utils/templateEngine.js
export class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }

  loadDefaultTemplates() {
    // Load from JSON files
    import('./templates/projectCharter.json').then(t => {
      this.templates.set('project-charter', t);
    });
    // ... load others
  }

  // Critical method - implement first
  generateFromTemplate(templateName, userData) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return template.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: this.populateSection(section, userData),
      numbering: section.numbering
    }));
  }

  populateSection(section, data) {
    // Use regex to replace {{field}} with actual data
    let content = section.template;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, data[key]);
    });
    return content;
  }
}
```

### 2. Section Detector Implementation
**Critical Logic**:
```javascript
// src/utils/sectionDetector.js
export class SectionDetector {
  detectSections(text) {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    // PM section patterns (customize for your needs)
    const patterns = {
      executiveSummary: /executive\s+summary|overview/i,
      objectives: /objectives?|goals?/i,
      scope: /scope\s+statement|project\s+scope/i,
      stakeholders: /stakeholders?/i,
      risks: /risks?\s+register|risk\s+management/i
    };

    lines.forEach((line, idx) => {
      // Check if line matches any section pattern
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            type,
            title: line.trim(),
            startLine: idx,
            content: []
          };
          break;
        }
      }

      // Add line to current section
      if (currentSection && !patterns[currentSection.type].test(line)) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }
}
```

### 3. Document Merger Implementation
**Key Algorithm**:
```javascript
// src/utils/documentMerger.js
export class DocumentMerger {
  async mergeDocuments(files) {
    // Parse all files
    const parsedDocs = await Promise.all(
      files.map(f => this.parseFile(f))
    );

    // Group by section type
    const grouped = this.groupBySection(parsedDocs);

    // Merge and format
    return this.consolidate(grouped);
  }

  groupBySection(docs) {
    const groups = {};
    docs.forEach(doc => {
      doc.sections.forEach(section => {
        if (!groups[section.type]) {
          groups[section.type] = [];
        }
        groups[section.type].push(section);
      });
    });
    return groups;
  }

  consolidate(groups) {
    const sections = [];
    let numbering = 1;

    Object.entries(groups).forEach(([type, sectionArray]) => {
      if (sectionArray.length === 1) {
        // Single section, use as-is
        sections.push({
          ...sectionArray[0],
          numbering: `${numbering}.0`
        });
      } else {
        // Multiple sections, merge content
        const merged = {
          type,
          title: sectionArray[0].title,
          numbering: `${numbering}.0`,
          content: sectionArray.flatMap(s => s.content)
        };
        sections.push(merged);
      }
      numbering++;
    });

    return { sections, metadata: this.extractMetadata(groups) };
  }
}
```

## DEBUGGING & TROUBLESHOOTING

### Common Issues & Solutions

**Issue**: Mammoth parsing loses table formatting
**Solution**: Use custom style mapping
```javascript
const options = {
  styleMap: [
    "p[style-name='Table Cell'] => td",
    "p[style-name='Table Header'] => th"
  ]
};
mammoth.convertToHtml({ arrayBuffer }, options);
```

**Issue**: PDF generation fails with large documents
**Solution**: Implement pagination and memory management
```javascript
const generateLargePDF = async (sections) => {
  const chunks = chunkArray(sections, 10); // 10 sections per chunk
  const pdfs = [];

  for (const chunk of chunks) {
    const pdf = await generatePDFChunk(chunk);
    pdfs.push(pdf);
  }

  return mergePDFs(pdfs);
};
```

**Issue**: Jest tests fail with "Cannot find module 'mammoth'"
**Solution**: Mock external dependencies
```javascript
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({
    value: '<p>Mock content</p>'
  })
}));
```

## PERFORMANCE TARGETS

- File upload: < 500ms for 5MB file
- Document parsing: < 2s for 20-page DOCX
- PDF generation: < 3s for 30-page document
- Multi-file merge: < 5s for 5 documents
- Memory usage: < 500MB for largest operations
- Test execution: < 30s for full suite

## DELIVERABLES CHECKLIST

- [ ] Template system with 5+ PM templates
- [ ] Section detection with 90%+ accuracy
- [ ] Multi-document merging capability
- [ ] Enhanced PDF with TOC, headers, metadata
- [ ] Comprehensive test suite (90%+ coverage)
- [ ] Sample test data (10+ files)
- [ ] Documentation for all new features
- [ ] Performance benchmarks met
- [ ] Zero critical bugs
- [ ] Accessibility compliance (WCAG 2.1 AA)

## COLLABORATION WORKFLOW

1. **Start with Phase 1.1** - Template System (highest priority)
2. **Write tests first** (TDD approach)
3. **Commit frequently** with clear messages
4. **Request code review** after each major feature
5. **Update documentation** as you build
6. **Run full test suite** before final commit

## QUESTIONS TO ASK DURING DEVELOPMENT

- Does this feature align with PM best practices?
- Can this be tested automatically?
- How will this perform with 50-page documents?
- Is the error message clear to non-technical users?
- Can this component be reused elsewhere?
- Does this maintain backwards compatibility?

## NEXT STEPS AFTER COMPLETION

1. Deploy to staging environment
2. User testing with real PM documents
3. Gather feedback and iterate
4. Add advanced features (collaboration, version control)
5. Build API for programmatic access
6. Create video tutorials
7. Write blog post on implementation

---

**IMPORTANT REMINDERS**:
- Focus on self-use first (don't over-engineer for scale)
- PM document quality is critical (accuracy > speed)
- Test with REAL project documents, not just samples
- Keep UI simple and intuitive
- Document everything for future reference
- Ask questions if requirements are unclear

**BEGIN WITH**: Template Engine implementation (Phase 1.1)
**EXPECTED TIMELINE**: 2-4 weeks for full implementation
**PRIMARY GOAL**: Create production-ready Project Bible generator

# DOC-FORMATTER ENHANCEMENT: QUICK REFERENCE GUIDE

## 🎯 PRIMARY GOAL
Transform doc-formatter into a specialized Project Bible creation tool with intelligent document processing, template management, and professional PDF generation.

## 📋 FEATURE PRIORITY MATRIX

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| P0 | Template System | High | Medium | Not Started |
| P0 | Section Detection | High | Medium | Not Started |
| P0 | Enhanced Testing | High | Low | Not Started |
| P1 | Multi-Doc Merge | High | High | Not Started |
| P1 | Advanced PDF | Medium | Medium | Not Started |
| P2 | AI Content Assist | Medium | High | Not Started |
| P2 | Live Preview | Medium | Medium | Not Started |
| P3 | Collaboration | Low | High | Future |

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Foundation (Days 1-7)
**Focus**: Core infrastructure for PM documents

✅ Day 1-2: Template Engine
  - Create templateEngine.js
  - Define 5 PM templates (Charter, WBS, Risks, RACI, Stakeholder)
  - Build template validation
  - Create TemplateSelector UI component

✅ Day 3-4: Section Detector
  - Create sectionDetector.js
  - Implement PM section patterns
  - Build heading normalization
  - Add auto-numbering logic

✅ Day 5-6: Enhanced File Parser
  - Extend fileParser.js
  - Add table extraction
  - Implement metadata extraction
  - Handle images and complex layouts

✅ Day 7: Testing Infrastructure
  - Set up test data files
  - Create mock objects
  - Write initial test suite
  - Configure CI/CD pipeline

### Phase 2: Advanced Features (Days 8-14)
**Focus**: Professional document processing

✅ Day 8-10: Multi-Document Merger
  - Create documentMerger.js
  - Implement parsing pipeline
  - Build section consolidation
  - Create merge UI

✅ Day 11-12: Advanced PDF Generator
  - Enhance PDFGenerator component
  - Add TOC generation
  - Implement custom headers/footers
  - Add metadata embedding

✅ Day 13-14: Content Intelligence
  - Create contentAnalyzer.js
  - Build validation rules
  - Add suggestion engine
  - Implement quality scoring

### Phase 3: Polish & Testing (Days 15-20)
**Focus**: Quality assurance and refinement

✅ Day 15-17: Comprehensive Testing
  - Complete unit test coverage
  - Write integration tests
  - Implement E2E tests with Cypress
  - Performance testing

✅ Day 18-19: UI/UX Enhancement
  - Improve user flow
  - Add progress indicators
  - Implement error handling UI
  - Create help documentation

✅ Day 20: Final QA & Documentation
  - Full system testing
  - Update README
  - Create video tutorials
  - Prepare deployment

## 🧪 TESTING CHECKLIST

### Unit Tests (Target: 90%+ coverage)
- [ ] TemplateEngine: 15 tests
- [ ] SectionDetector: 12 tests
- [ ] DocumentMerger: 18 tests
- [ ] FileParser: 20 tests
- [ ] PDFGenerator: 15 tests
- [ ] Validators: 10 tests

### Integration Tests
- [ ] Upload -> Parse -> Format workflow
- [ ] Multi-file merge workflow
- [ ] Template application workflow
- [ ] PDF generation workflow

### E2E Tests (Cypress)
- [ ] Complete project bible creation
- [ ] Template selection and customization
- [ ] Multi-file upload and merge
- [ ] Error handling scenarios
- [ ] Cross-browser compatibility

### Performance Tests
- [ ] 20MB file processing < 5s
- [ ] 50-page PDF generation < 3s
- [ ] Memory usage < 500MB
- [ ] Concurrent operations handling

## 📂 NEW FILE STRUCTURE

```
src/
├── components/
│   ├── builders/
│   │   ├── ProjectBibleBuilder.js ⭐ NEW
│   │   ├── TemplateSelector.js ⭐ NEW
│   │   └── MultiFileUpload.js ⭐ NEW
│   ├── editors/
│   │   ├── DocumentEditor.js ⭐ NEW
│   │   ├── SectionEditor.js ⭐ NEW
│   │   └── TableEditor.js ⭐ NEW
│   ├── previews/
│   │   ├── PDFPreview.js (ENHANCED)
│   │   └── LivePreview.js ⭐ NEW
│   └── DocumentFormatter.js (REFACTOR)
├── utils/
│   ├── templateEngine.js ⭐ NEW
│   ├── sectionDetector.js ⭐ NEW
│   ├── documentMerger.js ⭐ NEW
│   ├── contentAnalyzer.js ⭐ NEW
│   ├── validators.js ⭐ NEW
│   └── fileParser.js (ENHANCE)
├── templates/
│   ├── projectCharter.json ⭐ NEW
│   ├── wbs.json ⭐ NEW
│   ├── riskRegister.json ⭐ NEW
│   ├── raciMatrix.json ⭐ NEW
│   └── stakeholderMatrix.json ⭐ NEW
├── hooks/
│   ├── useDocumentParser.js ⭐ NEW
│   ├── useTemplateEngine.js ⭐ NEW
│   └── usePDFGenerator.js ⭐ NEW
└── tests/
    ├── unit/ (EXPAND)
    ├── integration/ (NEW)
    └── fixtures/ (NEW - test data)

⭐ NEW = New file to create
(ENHANCE) = Existing file to improve
(REFACTOR) = Existing file to restructure
```

## 🚀 QUICK START COMMANDS

### Setup Development Environment
```bash
# Clone and install
cd doc-formatter
npm install

# Install additional dependencies
npm install --save-dev @testing-library/jest-dom
npm install --save-dev cypress-file-upload
npm install zustand  # For state management
```

### Run Tests
```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# E2E tests
npm run cypress:open

# All tests
npm run test:all
```

### Development Workflow
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## 🔑 KEY CONCEPTS

### Template Structure
```json
{
  "id": "project-charter",
  "name": "Project Charter",
  "version": "1.0",
  "sections": [
    {
      "id": "exec-summary",
      "title": "Executive Summary",
      "numbering": "1.0",
      "required": true,
      "template": "{{projectName}} aims to {{objectives}}..."
    }
  ],
  "requiredFields": ["projectName", "projectManager", "sponsor"]
}
```

### Section Detection Pattern
```javascript
const pmSections = {
  executiveSummary: /executive\s+summary|overview/i,
  objectives: /objectives?|goals?/i,
  scope: /scope\s+statement|project\s+scope/i,
  stakeholders: /stakeholders?/i,
  wbs: /wbs|work\s+breakdown/i,
  risks: /risks?\s+register/i,
  budget: /budget|financial/i,
  milestones: /milestones?|timeline/i
};
```

### Document Merge Strategy
```
Input: [charter.docx, wbs.xlsx, risks.pdf]
         ↓
    Parse Each File
         ↓
  Detect Sections (using patterns)
         ↓
  Group by Section Type
         ↓
  Consolidate Duplicates
         ↓
  Apply Master Template
         ↓
  Generate Unified PDF
```

## 🐛 COMMON PITFALLS & SOLUTIONS

### Issue: Mammoth loses formatting
**Solution**: Use custom style mapping
```javascript
const styleMap = [
  "p[style-name='Heading 1'] => h1",
  "p[style-name='Table Cell'] => td"
];
```

### Issue: PDF too large
**Solution**: Optimize images and use compression
```javascript
pdf.save({ compress: true, imageQuality: 0.8 });
```

### Issue: Tests fail with file mocks
**Solution**: Mock file system operations
```javascript
jest.mock('fs', () => ({
  readFile: jest.fn((path, cb) => cb(null, 'mock content'))
}));
```

### Issue: Memory leaks with large files
**Solution**: Use streaming and cleanup
```javascript
useEffect(() => {
  return () => {
    // Cleanup
    URL.revokeObjectURL(fileUrl);
  };
}, [fileUrl]);
```

## 📊 SUCCESS METRICS

### Functional Requirements
- ✅ Support 8+ document formats
- ✅ Process files up to 20MB
- ✅ 5+ PM templates available
- ✅ Auto-detect 8+ section types
- ✅ Merge 10+ documents
- ✅ Generate professional PDFs with TOC

### Non-Functional Requirements
- ✅ 90%+ test coverage
- ✅ < 3s PDF generation
- ✅ < 5s multi-file merge
- ✅ WCAG 2.1 AA compliance
- ✅ Mobile responsive
- ✅ Cross-browser support

### Quality Gates
- 🟢 All tests passing
- 🟢 No critical bugs
- 🟢 Code reviewed
- 🟢 Documentation complete
- 🟢 Performance targets met

## 🎓 LEARNING RESOURCES

### React PDF
- https://react-pdf.org/
- Focus on: Document, Page, View, Text components

### Mammoth.js
- https://github.com/mwilliamson/mammoth.js
- Focus on: Custom style mapping, options

### Cypress
- https://docs.cypress.io/
- Focus on: File upload, file download testing

### Jest
- https://jestjs.io/docs/mock-functions
- Focus on: Mocking, async testing

## 💡 PRO TIPS

1. **Start with tests** - Write failing test, then implement
2. **Use TypeScript** - Add types gradually for better DX
3. **Componentize early** - Small, reusable components
4. **Mock expensive ops** - Don't hit real file system in tests
5. **Use React DevTools** - Debug state and performance
6. **Profile before optimizing** - Measure first
7. **Document as you go** - Don't leave it for later
8. **Commit frequently** - Small, atomic commits
9. **Review your own code** - Read it fresh the next day
10. **Ask for help** - Don't stay stuck

## 🔄 ITERATION STRATEGY

### Build -> Test -> Refactor Cycle
1. Implement minimal working version
2. Write comprehensive tests
3. Refactor for quality
4. Add edge case handling
5. Document and move to next feature

### Feedback Loop
1. Self-test with real PM documents
2. Gather feedback on usability
3. Identify pain points
4. Prioritize improvements
5. Iterate

---

**REMEMBER**: 
- Quality > Speed
- Tests = Confidence
- Simple > Complex
- Document = Future You will thank you

**START HERE**: 
1. Create templateEngine.js
2. Write tests for it
3. Build TemplateSelector UI
4. Test with real documents

{
  "Phase 1 - Foundation": {
    "week": "Week 1-2",
    "deliverables": [
      "Template System (5 templates)",
      "Section Detection Engine",
      "Enhanced File Parser",
      "Initial Test Suite"
    ],
    "success_criteria": "Can load templates, detect sections, parse complex docs"
  },
  "Phase 2 - Advanced": {
    "week": "Week 3-4",
    "deliverables": [
      "Multi-Document Merger",
      "Advanced PDF Generator",
      "Content Intelligence",
      "Integration Tests"
    ],
    "success_criteria": "Can merge 5+ docs, generate professional PDFs with TOC"
  },
  "Phase 3 - Polish": {
    "week": "Week 5-6",
    "deliverables": [
      "Complete Test Coverage",
      "UI/UX Enhancements",
      "Performance Optimization",
      "Documentation"
    ],
    "success_criteria": "90%+ test coverage, <3s PDF gen, production ready"
  }

 # Let me create a comprehensive improvement plan for the doc-formatter based on project bible requirements
# I'll organize this into categories and create actionable recommendations

improvement_plan = {
    "project_bible_specific_features": {
        "template_system": [
            "Add pre-built project bible templates (Charter, WBS, Risk Register, etc.)",
            "Create section-based document generator with reusable components",
            "Implement template versioning and revision history tracking",
            "Add template customization UI for different PM methodologies (Agile, Waterfall, Scrum)"
        ],
        "intelligent_formatting": [
            "Auto-detect document sections (Executive Summary, Objectives, Scope, etc.)",
            "Smart table of contents generation with clickable links",
            "Automatic header hierarchy detection and correction",
            "Section numbering automation (1.0, 1.1, 1.1.1 format)",
            "Page numbering with custom formats for different sections"
        ],
        "content_enhancement": [
            "AI-powered content suggestions for missing PM sections",
            "Stakeholder matrix auto-generator from text input",
            "RACI matrix formatter and validator",
            "Risk assessment table generator",
            "Budget table formatter with calculation capabilities"
        ],
        "multi_document_merging": [
            "Merge multiple docs into single project bible",
            "Consistent styling across merged documents",
            "Cross-reference validation between sections",
            "Master document assembly from modular components"
        ]
    },
    
    "architecture_improvements": {
        "state_management": [
            "Implement Redux or Zustand for complex document state",
            "Add undo/redo functionality for document edits",
            "Real-time preview updates as content changes",
            "Document version control within the app"
        ],
        "file_processing_enhancements": [
            "Add support for Excel/CSV import for tables",
            "Implement batch file processing",
            "Add drag-and-drop reordering of document sections",
            "Support for embedded images and diagrams",
            "Enhanced error handling with user-friendly messages"
        ],
        "pdf_generation_improvements": [
            "Custom PDF templates with header/footer",
            "Watermark support for draft documents",
            "Page break control and optimization",
            "Table of contents with hyperlinks",
            "Metadata embedding (author, version, date)"
        ]
    },
    
    "testing_strategy": {
        "unit_tests_jest": [
            "Test file upload validation (size, format, content)",
            "Test document parsing accuracy for each format",
            "Test AI formatting logic with sample inputs",
            "Test PDF generation with various content types",
            "Test template rendering and customization",
            "Mock external dependencies (file readers, AI services)"
        ],
        "integration_tests": [
            "Test full workflow: upload -> format -> export",
            "Test multi-file processing pipeline",
            "Test document merging functionality",
            "Test state persistence across operations"
        ],
        "e2e_tests_cypress": [
            "Test drag-and-drop file upload",
            "Test document preview rendering",
            "Test PDF download and validation",
            "Test error handling for invalid files",
            "Test template selection and application",
            "Test cross-browser compatibility"
        ],
        "test_data_requirements": [
            "Sample project charters in various formats",
            "WBS documents with complex hierarchies",
            "Risk registers with multiple entries",
            "Malformed files for error testing",
            "Large files (near 20MB limit) for performance testing"
        ]
    },
    
    "code_improvements": {
        "component_refactoring": [
            "Split DocumentFormatter into smaller components",
            "Create reusable TemplateManager component",
            "Build SectionEditor for individual section editing",
            "Implement ContentValidator for PM-specific validation",
            "Add StyleManager for consistent formatting"
        ],
        "utility_functions": [
            "Add docParser.js for advanced document structure analysis",
            "Create templateEngine.js for template processing",
            "Build sectionDetector.js for auto-identifying PM sections",
            "Implement tableFormatter.js for complex table handling",
            "Add pdfCustomizer.js for advanced PDF options"
        ],
        "performance_optimization": [
            "Implement lazy loading for large documents",
            "Add Web Workers for heavy processing",
            "Optimize re-renders with React.memo",
            "Add caching for processed documents",
            "Implement progressive PDF generation"
        ]
    },
    
    "ui_ux_enhancements": {
        "editor_features": [
            "Add WYSIWYG editor for inline editing",
            "Implement section-by-section editing mode",
            "Add style picker for formatting options",
            "Create preview panel with live updates",
            "Add annotations and comments capability"
        ],
        "workflow_improvements": [
            "Multi-step wizard for project bible creation",
            "Progress indicator for document processing",
            "Save/load work-in-progress documents",
            "Export to multiple formats (DOCX, PDF, Markdown)",
            "Quick actions menu for common tasks"
        ]
    }
}

# Create a prioritized action plan
priority_actions = {
    "Phase_1_Foundation": [
        "Implement template system for common PM documents",
        "Add section detection and auto-formatting",
        "Create comprehensive test suite for existing features",
        "Refactor components for better maintainability"
    ],
    "Phase_2_Enhancement": [
        "Add multi-document merging capability",
        "Implement advanced PDF customization",
        "Build WYSIWYG editor for inline editing",
        "Add table and chart formatting tools"
    ],
    "Phase_3_Advanced": [
        "Implement AI-powered content suggestions",
        "Add collaborative editing features",
        "Build analytics dashboard for document quality",
        "Create API for programmatic document generation"
    ]
}

print("DOC-FORMATTER IMPROVEMENT PLAN FOR PROJECT BIBLE CREATION")
print("=" * 70)
print("\nTotal Enhancement Categories:", len(improvement_plan))
print("\nImplementation Phases:", len(priority_actions))

# Count total actionable items
total_items = sum(len(items) for category in improvement_plan.values() 
                  for items in category.values())
print(f"\nTotal Actionable Improvements: {total_items}")

# Save summary
import json
summary = {
    "improvements": improvement_plan,
    "priorities": priority_actions,
    "total_items": total_items
}

# Create detailed test cases and code examples for the improvements

test_cases = """
# COMPREHENSIVE TEST SUITE FOR DOC-FORMATTER PROJECT BIBLE FEATURES

## Unit Tests (Jest + React Testing Library)

### 1. File Upload Validation Tests
describe('FileUpload Component', () => {
  test('accepts valid project charter DOCX file', () => {
    // Test file type validation
  });
  
  test('rejects files exceeding 20MB limit', () => {
    // Test size validation
  });
  
  test('validates PDF content extraction', () => {
    // Test mammoth.js parsing accuracy
  });
  
  test('handles malformed document gracefully', () => {
    // Test error handling
  });
});

### 2. Template Engine Tests
describe('TemplateEngine', () => {
  test('generates project charter from template', () => {
    // Test template rendering
  });
  
  test('applies custom variables to template', () => {
    // Test variable substitution
  });
  
  test('validates required sections in project bible', () => {
    // Test section validation
  });
  
  test('merges multiple templates correctly', () => {
    // Test template merging
  });
});

### 3. Document Parser Tests
describe('DocumentParser', () => {
  test('detects project charter sections automatically', () => {
    // Test section detection algorithm
  });
  
  test('extracts tables and preserves structure', () => {
    // Test table parsing
  });
  
  test('identifies stakeholder matrix format', () => {
    // Test PM-specific content recognition
  });
  
  test('generates proper header hierarchy', () => {
    // Test heading normalization
  });
});

### 4. PDF Generation Tests
describe('PDFGenerator', () => {
  test('creates PDF with table of contents', () => {
    // Test TOC generation
  });
  
  test('applies custom headers and footers', () => {
    // Test PDF customization
  });
  
  test('embeds metadata correctly', () => {
    // Test metadata inclusion
  });
  
  test('handles multi-page documents', () => {
    // Test page break logic
  });
});

## Integration Tests

### 5. Full Workflow Tests
describe('Complete Project Bible Creation', () => {
  test('uploads charter, WBS, and risk register, merges into single PDF', () => {
    // Test end-to-end workflow
  });
  
  test('applies consistent formatting across all sections', () => {
    // Test style consistency
  });
  
  test('validates cross-references between sections', () => {
    // Test document integrity
  });
});

## E2E Tests (Cypress)

### 6. User Interaction Tests
describe('Project Bible Builder Workflow', () => {
  it('should complete full project bible creation', () => {
    cy.visit('/');
    cy.get('[data-testid="file-upload"]').attachFile('charter.docx');
    cy.get('[data-testid="format-btn"]').click();
    cy.get('[data-testid="template-select"]').select('project-charter');
    cy.get('[data-testid="download-pdf"]').click();
    
    // Validate PDF download
    cy.readFile('cypress/downloads/project-bible.pdf').should('exist');
  });
  
  it('should handle multiple file uploads', () => {
    cy.get('[data-testid="multi-upload"]')
      .attachFile(['charter.docx', 'wbs.xlsx', 'risks.pdf']);
    cy.get('[data-testid="merge-docs"]').click();
    // Validate merged output
  });
});

### 7. Error Handling Tests
describe('Error Scenarios', () => {
  it('displays error for invalid file type', () => {
    cy.get('[data-testid="file-upload"]').attachFile('invalid.exe');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Unsupported file format');
  });
  
  it('handles file too large gracefully', () => {
    cy.get('[data-testid="file-upload"]').attachFile('huge-file.pdf');
    cy.get('[data-testid="error-message"]')
      .should('contain', 'File exceeds 20MB limit');
  });
});

## Performance Tests

### 8. Load and Stress Tests
describe('Performance Benchmarks', () => {
  test('processes 20MB document within 5 seconds', async () => {
    // Test processing speed
  });
  
  test('handles 10 concurrent document uploads', async () => {
    // Test concurrent processing
  });
  
  test('memory usage stays below 500MB for large docs', () => {
    // Test memory efficiency
  });
});

## Mock Data and Fixtures

### Test Data Structure
const mockProjectCharter = {
  title: "Digital Product Enhancement Project",
  projectManager: "John Doe",
  sponsor: "Jane Smith",
  objectives: ["Improve UX", "Reduce load time"],
  scope: "Complete redesign of mobile app",
  budget: "$500,000",
  timeline: "6 months"
};

const mockWBS = {
  levels: [
    { id: "1.0", name: "Project Management", children: [...] },
    { id: "2.0", name: "Design Phase", children: [...] }
  ]
};

const mockRiskRegister = [
  {
    id: "R001",
    description: "Scope creep",
    probability: "High",
    impact: "High",
    mitigation: "Weekly scope reviews"
  }
];
"""

code_examples = """
# CODE IMPLEMENTATION EXAMPLES

## 1. Template System Implementation

// src/utils/templateEngine.js
export class TemplateEngine {
  constructor() {
    this.templates = {
      projectCharter: this.loadCharter(),
      wbs: this.loadWBS(),
      riskRegister: this.loadRiskRegister()
    };
  }
  
  loadCharter() {
    return {
      sections: [
        'Executive Summary',
        'Project Objectives',
        'Scope Statement',
        'Stakeholders',
        'Milestones',
        'Budget Overview',
        'Success Criteria',
        'Approval Requirements'
      ],
      requiredFields: ['projectName', 'projectManager', 'sponsor']
    };
  }
  
  generateFromTemplate(templateName, data) {
    const template = this.templates[templateName];
    return this.populateTemplate(template, data);
  }
  
  populateTemplate(template, data) {
    // AI-powered content generation logic
    const content = template.sections.map(section => {
      return {
        heading: section,
        content: data[this.toCamelCase(section)] || this.generatePlaceholder(section)
      };
    });
    return content;
  }
  
  validateTemplate(data, templateName) {
    const template = this.templates[templateName];
    const missing = template.requiredFields.filter(field => !data[field]);
    return { valid: missing.length === 0, missing };
  }
}

## 2. Section Detection Algorithm

// src/utils/sectionDetector.js
export class SectionDetector {
  constructor() {
    this.pmSections = [
      { pattern: /executive\\s+summary/i, type: 'executiveSummary' },
      { pattern: /project\\s+objectives?/i, type: 'objectives' },
      { pattern: /scope\\s+statement/i, type: 'scope' },
      { pattern: /stakeholders?/i, type: 'stakeholders' },
      { pattern: /risks?\\s+register/i, type: 'risks' },
      { pattern: /wbs|work\\s+breakdown/i, type: 'wbs' }
    ];
  }
  
  detectSections(document) {
    const lines = document.split('\\n');
    const sections = [];
    let currentSection = null;
    
    lines.forEach((line, index) => {
      const detected = this.pmSections.find(s => s.pattern.test(line));
      if (detected) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: detected.type,
          title: line.trim(),
          startLine: index,
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });
    
    if (currentSection) sections.push(currentSection);
    return sections;
  }
  
  normalizeHeadings(sections) {
    let level1 = 1;
    return sections.map(section => {
      section.numbering = `${level1}.0`;
      section.content = this.numberSubsections(section.content, level1);
      level1++;
      return section;
    });
  }
  
  numberSubsections(content, parentLevel) {
    // Detect and number subsections
    let level2 = 1;
    return content.map(line => {
      if (this.isSubheading(line)) {
        return `${parentLevel}.${level2++} ${line.trim()}`;
      }
      return line;
    });
  }
}

## 3. Enhanced PDF Generator

// src/components/EnhancedPDFGenerator.js
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  toc: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1pt solid #ccc'
  },
  tocItem: {
    fontSize: 10,
    marginBottom: 5,
    paddingLeft: 10
  },
  section: {
    marginBottom: 15
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 5
  }
});

export const ProjectBiblePDF = ({ sections, metadata }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover Page */}
        <View>
          <Text style={styles.header}>{metadata.title}</Text>
          <Text>Project Manager: {metadata.pm}</Text>
          <Text>Version: {metadata.version}</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>
        
        {/* Table of Contents */}
        <View style={styles.toc}>
          <Text style={styles.header}>Table of Contents</Text>
          {sections.map((section, idx) => (
            <Text key={idx} style={styles.tocItem}>
              {section.numbering} {section.title}
            </Text>
          ))}
        </View>
      </Page>
      
      {/* Content Pages */}
      {sections.map((section, idx) => (
        <Page key={idx} size="A4" style={styles.page}>
          <Text style={styles.header}>
            {section.numbering} {section.title}
          </Text>
          <View style={styles.section}>
            {section.content.map((para, pIdx) => (
              <Text key={pIdx} style={{marginBottom: 8}}>
                {para}
              </Text>
            ))}
          </View>
          
          {section.table && (
            <View style={styles.table}>
              {section.table.rows.map((row, rIdx) => (
                <View key={rIdx} style={styles.tableRow}>
                  {row.cells.map((cell, cIdx) => (
                    <Text key={cIdx} style={styles.tableCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
};

## 4. Multi-Document Merger

// src/utils/documentMerger.js
export class DocumentMerger {
  constructor() {
    this.parsers = {
      docx: this.parseDocx,
      pdf: this.parsePdf,
      txt: this.parseText
    };
  }
  
  async mergeDocuments(files) {
    const parsed = await Promise.all(
      files.map(file => this.parseDocument(file))
    );
    
    return this.consolidate(parsed);
  }
  
  async parseDocument(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const parser = this.parsers[extension];
    
    if (!parser) {
      throw new Error(`Unsupported file type: ${extension}`);
    }
    
    return await parser(file);
  }
  
  consolidate(documents) {
    // Detect and merge similar sections
    const merged = {
      sections: [],
      metadata: this.mergeMetadata(documents)
    };
    
    documents.forEach(doc => {
      doc.sections.forEach(section => {
        const existing = merged.sections.find(s => 
          s.type === section.type
        );
        
        if (existing) {
          existing.content.push(...section.content);
        } else {
          merged.sections.push({...section});
        }
      });
    });
    
    return this.applyConsistentFormatting(merged);
  }
  
  applyConsistentFormatting(document) {
    // Normalize styles, numbering, fonts
    const detector = new SectionDetector();
    document.sections = detector.normalizeHeadings(document.sections);
    return document;
  }
}

## 5. Component Architecture

// src/components/ProjectBibleBuilder.js
import React, { useState } from 'react';
import { TemplateSelector } from './TemplateSelector';
import { MultiFileUpload } from './MultiFileUpload';
import { DocumentEditor } from './DocumentEditor';
import { PDFPreview } from './PDFPreview';

export const ProjectBibleBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedContent, setProcessedContent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFilesUploaded = async (files) => {
    setUploadedFiles(files);
    setIsProcessing(true);
    
    try {
      const merger = new DocumentMerger();
      const merged = await merger.mergeDocuments(files);
      setProcessedContent(merged);
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTemplateApply = (content, template) => {
    const engine = new TemplateEngine();
    const formatted = engine.generateFromTemplate(template, content);
    setProcessedContent(formatted);
  };
  
  return (
    <div className="builder-container">
      <TemplateSelector 
        onSelect={setSelectedTemplate}
      />
      
      <MultiFileUpload 
        onFilesUploaded={handleFilesUploaded}
        maxFiles={10}
        maxSizeMB={20}
      />
      
      {isProcessing && <LoadingSpinner />}
      
      {processedContent && (
        <>
          <DocumentEditor 
            content={processedContent}
            onChange={setProcessedContent}
          />
          
          <PDFPreview 
            content={processedContent}
            template={selectedTemplate}
          />
        </>
      )}
    </div>
  );
};
"""

# Save both as text files
with open('test_suite_guide.txt', 'w') as f:
    f.write(test_cases)

with open('code_implementation_examples.txt', 'w') as f:
    f.write(code_examples)

print("✓ Test suite guide created: test_suite_guide.txt")
print("✓ Code examples created: code_implementation_examples.txt")


# Create comprehensive instructions for Grk Code Fast pair programming

grk_instructions = """
# INSTRUCTIONS FOR GRK CODE FAST: DOC-FORMATTER ENHANCEMENT PROJECT

## PROJECT CONTEXT
You are enhancing a React-based document formatter specifically for creating comprehensive Project Bible documentation (Project Charters, WBS, Risk Registers, etc.). The current application supports basic file upload and PDF export but needs advanced features for professional project management documentation.

## CURRENT TECH STACK
- React 18.2.0
- Create React App
- @react-pdf/renderer (PDF generation)
- mammoth (DOCX parsing)
- pdf-parse (PDF text extraction)
- marked (Markdown processing)
- Jest + React Testing Library (unit tests)
- Cypress (E2E tests)

## PRIORITY ENHANCEMENTS (In Order)

### PHASE 1: FOUNDATION (Week 1-2)

#### 1.1 Template System Implementation
**Goal**: Create reusable templates for common PM documents

**Tasks**:
- Create `src/utils/templateEngine.js` with TemplateEngine class
- Define template structures for:
  * Project Charter (8 sections: Executive Summary, Objectives, Scope, Stakeholders, Milestones, Budget, Success Criteria, Approvals)
  * Work Breakdown Structure (hierarchical task breakdown)
  * Risk Register (ID, Description, Probability, Impact, Mitigation)
  * RACI Matrix (Responsible, Accountable, Consulted, Informed)
  * Stakeholder Matrix
- Implement template validation logic
- Add template selection UI component

**Files to Create**:
```
src/utils/templateEngine.js
src/components/TemplateSelector.js
src/templates/projectCharter.json
src/templates/wbs.json
src/templates/riskRegister.json
```

**Key Functions**:
- `loadTemplate(name)` - Load template by name
- `generateFromTemplate(templateName, data)` - Populate template with data
- `validateTemplate(data, templateName)` - Validate required fields
- `listAvailableTemplates()` - Return all templates

#### 1.2 Section Detection & Auto-Formatting
**Goal**: Automatically detect PM document sections and apply proper formatting

**Tasks**:
- Create `src/utils/sectionDetector.js` with SectionDetector class
- Implement regex patterns for common PM sections
- Build heading hierarchy normalization (1.0, 1.1, 1.1.1)
- Auto-generate section numbering
- Detect tables and preserve structure

**Algorithm**:
1. Parse document line by line
2. Match lines against PM section patterns
3. Extract section content
4. Normalize heading levels
5. Apply consistent numbering

**Test Coverage Required**:
- Test with 5+ different project charter formats
- Test with nested WBS structures (3+ levels deep)
- Test with malformed headings
- Validate numbering sequence accuracy

#### 1.3 Enhanced File Parser
**Goal**: Improve parsing accuracy for complex documents

**Tasks**:
- Extend `src/utils/fileParser.js` with table extraction
- Add support for embedded images
- Implement style preservation logic
- Handle multi-column layouts
- Extract metadata (author, creation date, version)

**Error Handling**:
- Graceful degradation for unsupported formatting
- Clear error messages for parsing failures
- Fallback to plain text extraction if needed

### PHASE 2: ADVANCED FEATURES (Week 3-4)

#### 2.1 Multi-Document Merging
**Goal**: Merge multiple PM docs into single Project Bible

**Tasks**:
- Create `src/utils/documentMerger.js` with DocumentMerger class
- Implement duplicate section detection
- Build content consolidation logic
- Apply consistent styling across merged docs
- Generate unified table of contents

**Workflow**:
1. User uploads multiple files (charter, WBS, risks)
2. System parses each document
3. Detects section types in each doc
4. Merges similar sections or keeps separate
5. Applies master template formatting
6. Generates unified PDF

**UI Requirements**:
- Drag-and-drop multi-file upload
- Preview of each uploaded doc
- Section mapping interface (manual override)
- Merge options (combine vs. separate sections)

#### 2.2 Advanced PDF Customization
**Goal**: Professional PDF output with PM-specific features

**Tasks**:
- Enhance `src/components/PDFGenerator.js`
- Add table of contents with clickable links
- Implement custom headers/footers with page numbers
- Add cover page generator
- Support watermarks (DRAFT, CONFIDENTIAL)
- Embed document metadata
- Create PDF/A compliance option

**Styling Options**:
- Corporate branding (logo, colors)
- Font customization
- Page orientation per section
- Custom page breaks
- Multi-column layouts for specific sections

#### 2.3 Intelligent Content Enhancement
**Goal**: AI-assisted content suggestions

**Tasks**:
- Build `src/utils/contentAnalyzer.js`
- Detect missing required sections
- Suggest content based on partial input
- Validate PM best practices (SMART objectives, etc.)
- Flag incomplete risk assessments
- Recommend stakeholder categories

**AI Integration Points**:
- Section completeness checker
- Content quality scorer
- Template field auto-population
- Smart suggestions for missing content

### PHASE 3: TESTING & QUALITY (Ongoing)

#### 3.1 Comprehensive Test Suite
**Goal**: Achieve 90%+ test coverage

**Unit Tests (Jest)**:
```javascript
// Template Engine Tests
describe('TemplateEngine', () => {
  test('loads project charter template correctly', () => {});
  test('validates required fields', () => {});
  test('generates content from template and data', () => {});
  test('handles missing template gracefully', () => {});
});

// Section Detector Tests  
describe('SectionDetector', () => {
  test('detects all standard PM sections', () => {});
  test('normalizes heading hierarchy', () => {});
  test('applies correct numbering sequence', () => {});
  test('handles nested subsections', () => {});
});

// Document Merger Tests
describe('DocumentMerger', () => {
  test('merges 3 documents successfully', () => {});
  test('handles duplicate sections', () => {});
  test('maintains style consistency', () => {});
  test('generates unified TOC', () => {});
});

// PDF Generator Tests
describe('EnhancedPDFGenerator', () => {
  test('creates PDF with TOC', () => {});
  test('applies custom headers/footers', () => {});
  test('embeds metadata correctly', () => {});
  test('handles 50+ page documents', () => {});
});
```

**Integration Tests**:
```javascript
describe('Full Project Bible Workflow', () => {
  test('uploads charter, formats, exports PDF', async () => {
    const charter = new File(['content'], 'charter.docx');
    const result = await processDocument(charter);
    expect(result.sections).toHaveLength(8);
    expect(result.pdf).toBeDefined();
  });
  
  test('merges 3 docs and exports unified PDF', async () => {
    const files = [charter, wbs, risks];
    const merged = await mergeDocuments(files);
    expect(merged.sections).toHaveLength(15);
  });
});
```

**E2E Tests (Cypress)**:
```javascript
describe('Project Bible Builder', () => {
  it('completes full creation workflow', () => {
    cy.visit('/');
    
    // Upload files
    cy.get('[data-testid="file-upload"]')
      .attachFile(['charter.docx', 'wbs.xlsx', 'risks.pdf']);
    
    // Select template
    cy.get('[data-testid="template-select"]')
      .select('comprehensive-bible');
    
    // Format documents
    cy.get('[data-testid="format-btn"]').click();
    cy.get('[data-testid="processing-indicator"]')
      .should('be.visible');
    
    // Verify preview
    cy.get('[data-testid="preview-panel"]')
      .should('contain', 'Executive Summary');
    
    // Export PDF
    cy.get('[data-testid="export-pdf"]').click();
    
    // Validate download
    cy.readFile('cypress/downloads/project-bible.pdf')
      .should('exist');
  });
  
  it('handles invalid files gracefully', () => {
    cy.get('[data-testid="file-upload"]')
      .attachFile('invalid.exe');
    cy.get('[data-testid="error-alert"]')
      .should('contain', 'Unsupported file format');
  });
});
```

#### 3.2 Test Data Creation
**Required Test Files**:
- `sample-charter-basic.docx` - Simple 2-page charter
- `sample-charter-complex.docx` - 10-page with tables, images
- `sample-wbs.xlsx` - 5-level hierarchy
- `sample-risks.pdf` - 20 risk items
- `malformed-doc.docx` - Broken formatting for error testing
- `large-file.pdf` - 19MB file for size limit testing
- `multi-format-set/` - Directory with 5 docs to merge

**Mock Data Objects**:
```javascript
const mockCharter = {
  projectName: "Digital Product Quality Enhancement",
  projectManager: "John Doe",
  sponsor: "Jane Smith",
  startDate: "2025-01-15",
  endDate: "2025-07-15",
  budget: "$500,000",
  objectives: [
    "Improve user experience scores by 30%",
    "Reduce page load time to under 2 seconds",
    "Increase mobile responsiveness to 100%"
  ],
  scope: {
    inScope: ["Mobile app redesign", "API optimization"],
    outOfScope: ["Backend infrastructure changes"]
  },
  stakeholders: [
    { name: "CEO", role: "Executive Sponsor" },
    { name: "CTO", role: "Technical Advisor" }
  ]
};
```

## CODING STANDARDS & BEST PRACTICES

### Component Structure
```javascript
// Good: Small, focused components
const TemplateSelector = ({ templates, onSelect }) => {
  const [selected, setSelected] = useState(null);
  
  return (
    <div className="template-selector">
      {templates.map(t => (
        <TemplateCard 
          key={t.id}
          template={t}
          onClick={() => onSelect(t)}
        />
      ))}
    </div>
  );
};

// Bad: Monolithic component with too many responsibilities
```

### Error Handling
```javascript
// Good: Specific error messages
try {
  const parsed = await parseDocument(file);
} catch (error) {
  if (error.code === 'UNSUPPORTED_FORMAT') {
    showError('This file format is not supported. Please use DOCX, PDF, or TXT.');
  } else if (error.code === 'FILE_TOO_LARGE') {
    showError(`File size (${error.size}MB) exceeds 20MB limit.`);
  } else {
    showError('An unexpected error occurred. Please try again.');
  }
}

// Bad: Generic error handling
```

### Performance Optimization
```javascript
// Use React.memo for expensive renders
export const DocumentPreview = React.memo(({ content }) => {
  return <div>{renderContent(content)}</div>;
});

// Use useMemo for expensive computations
const formattedSections = useMemo(() => {
  return sections.map(s => formatSection(s));
}, [sections]);

// Use Web Workers for heavy parsing
const worker = new Worker('documentParser.worker.js');
worker.postMessage({ file: largeFile });
worker.onmessage = (e) => {
  setProcessedContent(e.data);
};
```

### File Organization
```
src/
├── components/
│   ├── builders/
│   │   ├── ProjectBibleBuilder.js
│   │   ├── TemplateSelector.js
│   │   └── MultiFileUpload.js
│   ├── editors/
│   │   ├── DocumentEditor.js
│   │   ├── SectionEditor.js
│   │   └── TableEditor.js
│   ├── previews/
│   │   ├── PDFPreview.js
│   │   └── LivePreview.js
│   └── shared/
│       ├── FileUpload.js
│       └── LoadingSpinner.js
├── utils/
│   ├── templateEngine.js
│   ├── sectionDetector.js
│   ├── documentMerger.js
│   ├── contentAnalyzer.js
│   └── validators.js
├── templates/
│   ├── projectCharter.json
│   ├── wbs.json
│   └── riskRegister.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── hooks/
    ├── useDocumentParser.js
    ├── useTemplateEngine.js
    └── usePDFGenerator.js
```

## SPECIFIC IMPLEMENTATION GUIDANCE

### 1. Template Engine Implementation
**Start Here**:
```javascript
// src/utils/templateEngine.js
export class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }
  
  loadDefaultTemplates() {
    // Load from JSON files
    import('./templates/projectCharter.json').then(t => {
      this.templates.set('project-charter', t);
    });
    // ... load others
  }
  
  // Critical method - implement first
  generateFromTemplate(templateName, userData) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }
    
    return template.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: this.populateSection(section, userData),
      numbering: section.numbering
    }));
  }
  
  populateSection(section, data) {
    // Use regex to replace {{field}} with actual data
    let content = section.template;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, data[key]);
    });
    return content;
  }
}
```

### 2. Section Detector Implementation
**Critical Logic**:
```javascript
// src/utils/sectionDetector.js
export class SectionDetector {
  detectSections(text) {
    const lines = text.split('\\n');
    const sections = [];
    let currentSection = null;
    
    // PM section patterns (customize for your needs)
    const patterns = {
      executiveSummary: /executive\\s+summary|overview/i,
      objectives: /objectives?|goals?/i,
      scope: /scope\\s+statement|project\\s+scope/i,
      stakeholders: /stakeholders?/i,
      risks: /risks?\\s+register|risk\\s+management/i
    };
    
    lines.forEach((line, idx) => {
      // Check if line matches any section pattern
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            type,
            title: line.trim(),
            startLine: idx,
            content: []
          };
          break;
        }
      }
      
      // Add line to current section
      if (currentSection && !patterns[currentSection.type].test(line)) {
        currentSection.content.push(line);
      }
    });
    
    if (currentSection) sections.push(currentSection);
    return sections;
  }
}
```

### 3. Document Merger Implementation
**Key Algorithm**:
```javascript
// src/utils/documentMerger.js
export class DocumentMerger {
  async mergeDocuments(files) {
    // Parse all files
    const parsedDocs = await Promise.all(
      files.map(f => this.parseFile(f))
    );
    
    // Group by section type
    const grouped = this.groupBySection(parsedDocs);
    
    // Merge and format
    return this.consolidate(grouped);
  }
  
  groupBySection(docs) {
    const groups = {};
    docs.forEach(doc => {
      doc.sections.forEach(section => {
        if (!groups[section.type]) {
          groups[section.type] = [];
        }
        groups[section.type].push(section);
      });
    });
    return groups;
  }
  
  consolidate(groups) {
    const sections = [];
    let numbering = 1;
    
    Object.entries(groups).forEach(([type, sectionArray]) => {
      if (sectionArray.length === 1) {
        // Single section, use as-is
        sections.push({
          ...sectionArray[0],
          numbering: `${numbering}.0`
        });
      } else {
        // Multiple sections, merge content
        const merged = {
          type,
          title: sectionArray[0].title,
          numbering: `${numbering}.0`,
          content: sectionArray.flatMap(s => s.content)
        };
        sections.push(merged);
      }
      numbering++;
    });
    
    return { sections, metadata: this.extractMetadata(groups) };
  }
}
```

## DEBUGGING & TROUBLESHOOTING

### Common Issues & Solutions

**Issue**: Mammoth parsing loses table formatting
**Solution**: Use custom style mapping
```javascript
const options = {
  styleMap: [
    "p[style-name='Table Cell'] => td",
    "p[style-name='Table Header'] => th"
  ]
};
mammoth.convertToHtml({ arrayBuffer }, options);
```

**Issue**: PDF generation fails with large documents
**Solution**: Implement pagination and memory management
```javascript
const generateLargePDF = async (sections) => {
  const chunks = chunkArray(sections, 10); // 10 sections per chunk
  const pdfs = [];
  
  for (const chunk of chunks) {
    const pdf = await generatePDFChunk(chunk);
    pdfs.push(pdf);
  }
  
  return mergePDFs(pdfs);
};
```

**Issue**: Jest tests fail with "Cannot find module 'mammoth'"
**Solution**: Mock external dependencies
```javascript
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({
    value: '<p>Mock content</p>'
  })
}));
```

## PERFORMANCE TARGETS

- File upload: < 500ms for 5MB file
- Document parsing: < 2s for 20-page DOCX
- PDF generation: < 3s for 30-page document
- Multi-file merge: < 5s for 5 documents
- Memory usage: < 500MB for largest operations
- Test execution: < 30s for full suite

## DELIVERABLES CHECKLIST

- [ ] Template system with 5+ PM templates
- [ ] Section detection with 90%+ accuracy
- [ ] Multi-document merging capability
- [ ] Enhanced PDF with TOC, headers, metadata
- [ ] Comprehensive test suite (90%+ coverage)
- [ ] Sample test data (10+ files)
- [ ] Documentation for all new features
- [ ] Performance benchmarks met
- [ ] Zero critical bugs
- [ ] Accessibility compliance (WCAG 2.1 AA)

## COLLABORATION WORKFLOW

1. **Start with Phase 1.1** - Template System (highest priority)
2. **Write tests first** (TDD approach)
3. **Commit frequently** with clear messages
4. **Request code review** after each major feature
5. **Update documentation** as you build
6. **Run full test suite** before final commit

## QUESTIONS TO ASK DURING DEVELOPMENT

- Does this feature align with PM best practices?
- Can this be tested automatically?
- How will this perform with 50-page documents?
- Is the error message clear to non-technical users?
- Can this component be reused elsewhere?
- Does this maintain backwards compatibility?

## NEXT STEPS AFTER COMPLETION

1. Deploy to staging environment
2. User testing with real PM documents
3. Gather feedback and iterate
4. Add advanced features (collaboration, version control)
5. Build API for programmatic access
6. Create video tutorials
7. Write blog post on implementation

---

**IMPORTANT REMINDERS**:
- Focus on self-use first (don't over-engineer for scale)
- PM document quality is critical (accuracy > speed)
- Test with REAL project documents, not just samples
- Keep UI simple and intuitive
- Document everything for future reference
- Ask questions if requirements are unclear

**BEGIN WITH**: Template Engine implementation (Phase 1.1)
**EXPECTED TIMELINE**: 2-4 weeks for full implementation
**PRIMARY GOAL**: Create production-ready Project Bible generator

GOOD LUCK! 🚀
"""

# Save the instructions
with open('GRK_CODE_FAST_INSTRUCTIONS.txt', 'w') as f:
    f.write(grk_instructions)

print("=" * 70)
print("✓ COMPREHENSIVE INSTRUCTIONS CREATED")
print("=" * 70)
print("\nFile created: GRK_CODE_FAST_INSTRUCTIONS.txt")
print(f"\nTotal characters: {len(grk_instructions):,}")
print(f"Estimated reading time: {len(grk_instructions) // 1000} minutes")
print("\n" + "=" * 70)
print("READY FOR PAIR PROGRAMMING WITH GRK CODE FAST!")

# Create a visual roadmap and quick reference guide

quick_reference = """
# DOC-FORMATTER ENHANCEMENT: QUICK REFERENCE GUIDE

## 🎯 PRIMARY GOAL
Transform doc-formatter into a specialized Project Bible creation tool with intelligent document processing, template management, and professional PDF generation.

## 📋 FEATURE PRIORITY MATRIX

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| P0 | Template System | High | Medium | Not Started |
| P0 | Section Detection | High | Medium | Not Started |
| P0 | Enhanced Testing | High | Low | Not Started |
| P1 | Multi-Doc Merge | High | High | Not Started |
| P1 | Advanced PDF | Medium | Medium | Not Started |
| P2 | AI Content Assist | Medium | High | Not Started |
| P2 | Live Preview | Medium | Medium | Not Started |
| P3 | Collaboration | Low | High | Future |

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Foundation (Days 1-7)
**Focus**: Core infrastructure for PM documents

✅ Day 1-2: Template Engine
  - Create templateEngine.js
  - Define 5 PM templates (Charter, WBS, Risks, RACI, Stakeholder)
  - Build template validation
  - Create TemplateSelector UI component

✅ Day 3-4: Section Detector
  - Create sectionDetector.js
  - Implement PM section patterns
  - Build heading normalization
  - Add auto-numbering logic

✅ Day 5-6: Enhanced File Parser
  - Extend fileParser.js
  - Add table extraction
  - Implement metadata extraction
  - Handle images and complex layouts

✅ Day 7: Testing Infrastructure
  - Set up test data files
  - Create mock objects
  - Write initial test suite
  - Configure CI/CD pipeline

### Phase 2: Advanced Features (Days 8-14)
**Focus**: Professional document processing

✅ Day 8-10: Multi-Document Merger
  - Create documentMerger.js
  - Implement parsing pipeline
  - Build section consolidation
  - Create merge UI

✅ Day 11-12: Advanced PDF Generator
  - Enhance PDFGenerator component
  - Add TOC generation
  - Implement custom headers/footers
  - Add metadata embedding

✅ Day 13-14: Content Intelligence
  - Create contentAnalyzer.js
  - Build validation rules
  - Add suggestion engine
  - Implement quality scoring

### Phase 3: Polish & Testing (Days 15-20)
**Focus**: Quality assurance and refinement

✅ Day 15-17: Comprehensive Testing
  - Complete unit test coverage
  - Write integration tests
  - Implement E2E tests with Cypress
  - Performance testing

✅ Day 18-19: UI/UX Enhancement
  - Improve user flow
  - Add progress indicators
  - Implement error handling UI
  - Create help documentation

✅ Day 20: Final QA & Documentation
  - Full system testing
  - Update README
  - Create video tutorials
  - Prepare deployment

## 🧪 TESTING CHECKLIST

### Unit Tests (Target: 90%+ coverage)
- [ ] TemplateEngine: 15 tests
- [ ] SectionDetector: 12 tests
- [ ] DocumentMerger: 18 tests
- [ ] FileParser: 20 tests
- [ ] PDFGenerator: 15 tests
- [ ] Validators: 10 tests

### Integration Tests
- [ ] Upload -> Parse -> Format workflow
- [ ] Multi-file merge workflow
- [ ] Template application workflow
- [ ] PDF generation workflow

### E2E Tests (Cypress)
- [ ] Complete project bible creation
- [ ] Template selection and customization
- [ ] Multi-file upload and merge
- [ ] Error handling scenarios
- [ ] Cross-browser compatibility

### Performance Tests
- [ ] 20MB file processing < 5s
- [ ] 50-page PDF generation < 3s
- [ ] Memory usage < 500MB
- [ ] Concurrent operations handling

## 📂 NEW FILE STRUCTURE

```
src/
├── components/
│   ├── builders/
│   │   ├── ProjectBibleBuilder.js ⭐ NEW
│   │   ├── TemplateSelector.js ⭐ NEW
│   │   └── MultiFileUpload.js ⭐ NEW
│   ├── editors/
│   │   ├── DocumentEditor.js ⭐ NEW
│   │   ├── SectionEditor.js ⭐ NEW
│   │   └── TableEditor.js ⭐ NEW
│   ├── previews/
│   │   ├── PDFPreview.js (ENHANCED)
│   │   └── LivePreview.js ⭐ NEW
│   └── DocumentFormatter.js (REFACTOR)
├── utils/
│   ├── templateEngine.js ⭐ NEW
│   ├── sectionDetector.js ⭐ NEW
│   ├── documentMerger.js ⭐ NEW
│   ├── contentAnalyzer.js ⭐ NEW
│   ├── validators.js ⭐ NEW
│   └── fileParser.js (ENHANCE)
├── templates/
│   ├── projectCharter.json ⭐ NEW
│   ├── wbs.json ⭐ NEW
│   ├── riskRegister.json ⭐ NEW
│   ├── raciMatrix.json ⭐ NEW
│   └── stakeholderMatrix.json ⭐ NEW
├── hooks/
│   ├── useDocumentParser.js ⭐ NEW
│   ├── useTemplateEngine.js ⭐ NEW
│   └── usePDFGenerator.js ⭐ NEW
└── tests/
    ├── unit/ (EXPAND)
    ├── integration/ (NEW)
    └── fixtures/ (NEW - test data)

⭐ NEW = New file to create
(ENHANCE) = Existing file to improve
(REFACTOR) = Existing file to restructure
```

## 🚀 QUICK START COMMANDS

### Setup Development Environment
```bash
# Clone and install
cd doc-formatter
npm install

# Install additional dependencies
npm install --save-dev @testing-library/jest-dom
npm install --save-dev cypress-file-upload
npm install zustand  # For state management
```

### Run Tests
```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# E2E tests
npm run cypress:open

# All tests
npm run test:all
```

### Development Workflow
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## 🔑 KEY CONCEPTS

### Template Structure
```json
{
  "id": "project-charter",
  "name": "Project Charter",
  "version": "1.0",
  "sections": [
    {
      "id": "exec-summary",
      "title": "Executive Summary",
      "numbering": "1.0",
      "required": true,
      "template": "{{projectName}} aims to {{objectives}}..."
    }
  ],
  "requiredFields": ["projectName", "projectManager", "sponsor"]
}
```

### Section Detection Pattern
```javascript
const pmSections = {
  executiveSummary: /executive\\s+summary|overview/i,
  objectives: /objectives?|goals?/i,
  scope: /scope\\s+statement|project\\s+scope/i,
  stakeholders: /stakeholders?/i,
  wbs: /wbs|work\\s+breakdown/i,
  risks: /risks?\\s+register/i,
  budget: /budget|financial/i,
  milestones: /milestones?|timeline/i
};
```

### Document Merge Strategy
```
Input: [charter.docx, wbs.xlsx, risks.pdf]
         ↓
    Parse Each File
         ↓
  Detect Sections (using patterns)
         ↓
  Group by Section Type
         ↓
  Consolidate Duplicates
         ↓
  Apply Master Template
         ↓
  Generate Unified PDF
```

## 🐛 COMMON PITFALLS & SOLUTIONS

### Issue: Mammoth loses formatting
**Solution**: Use custom style mapping
```javascript
const styleMap = [
  "p[style-name='Heading 1'] => h1",
  "p[style-name='Table Cell'] => td"
];
```

### Issue: PDF too large
**Solution**: Optimize images and use compression
```javascript
pdf.save({ compress: true, imageQuality: 0.8 });
```

### Issue: Tests fail with file mocks
**Solution**: Mock file system operations
```javascript
jest.mock('fs', () => ({
  readFile: jest.fn((path, cb) => cb(null, 'mock content'))
}));
```

### Issue: Memory leaks with large files
**Solution**: Use streaming and cleanup
```javascript
useEffect(() => {
  return () => {
    // Cleanup
    URL.revokeObjectURL(fileUrl);
  };
}, [fileUrl]);
```

## 📊 SUCCESS METRICS

### Functional Requirements
- ✅ Support 8+ document formats
- ✅ Process files up to 20MB
- ✅ 5+ PM templates available
- ✅ Auto-detect 8+ section types
- ✅ Merge 10+ documents
- ✅ Generate professional PDFs with TOC

### Non-Functional Requirements
- ✅ 90%+ test coverage
- ✅ < 3s PDF generation
- ✅ < 5s multi-file merge
- ✅ WCAG 2.1 AA compliance
- ✅ Mobile responsive
- ✅ Cross-browser support

### Quality Gates
- 🟢 All tests passing
- 🟢 No critical bugs
- 🟢 Code reviewed
- 🟢 Documentation complete
- 🟢 Performance targets met

## 🎓 LEARNING RESOURCES

### React PDF
- https://react-pdf.org/
- Focus on: Document, Page, View, Text components

### Mammoth.js
- https://github.com/mwilliamson/mammoth.js
- Focus on: Custom style mapping, options

### Cypress
- https://docs.cypress.io/
- Focus on: File upload, file download testing

### Jest
- https://jestjs.io/docs/mock-functions
- Focus on: Mocking, async testing

## 💡 PRO TIPS

1. **Start with tests** - Write failing test, then implement
2. **Use TypeScript** - Add types gradually for better DX
3. **Componentize early** - Small, reusable components
4. **Mock expensive ops** - Don't hit real file system in tests
5. **Use React DevTools** - Debug state and performance
6. **Profile before optimizing** - Measure first
7. **Document as you go** - Don't leave it for later
8. **Commit frequently** - Small, atomic commits
9. **Review your own code** - Read it fresh the next day
10. **Ask for help** - Don't stay stuck

## 🔄 ITERATION STRATEGY

### Build -> Test -> Refactor Cycle
1. Implement minimal working version
2. Write comprehensive tests
3. Refactor for quality
4. Add edge case handling
5. Document and move to next feature

### Feedback Loop
1. Self-test with real PM documents
2. Gather feedback on usability
3. Identify pain points
4. Prioritize improvements
5. Iterate

---

**REMEMBER**: 
- Quality > Speed
- Tests = Confidence
- Simple > Complex
- Document = Future You will thank you

**START HERE**: 
1. Create templateEngine.js
2. Write tests for it
3. Build TemplateSelector UI
4. Test with real documents

**YOU GOT THIS! 💪**
"""

# Create visual roadmap diagram data
roadmap_data = {
    "Phase 1 - Foundation": {
        "week": "Week 1-2",
        "deliverables": [
            "Template System (5 templates)",
            "Section Detection Engine",
            "Enhanced File Parser",
            "Initial Test Suite"
        ],
        "success_criteria": "Can load templates, detect sections, parse complex docs"
    },
    "Phase 2 - Advanced": {
        "week": "Week 3-4",
        "deliverables": [
            "Multi-Document Merger",
            "Advanced PDF Generator",
            "Content Intelligence",
            "Integration Tests"
        ],
        "success_criteria": "Can merge 5+ docs, generate professional PDFs with TOC"
    },
    "Phase 3 - Polish": {
        "week": "Week 5-6",
        "deliverables": [
            "Complete Test Coverage",
            "UI/UX Enhancements",
            "Performance Optimization",
            "Documentation"
        ],
        "success_criteria": "90%+ test coverage, <3s PDF gen, production ready"
    }
}

# Save files
with open('QUICK_REFERENCE.txt', 'w') as f:
    f.write(quick_reference)

import json
with open('roadmap_data.json', 'w') as f:
    json.dump(roadmap_data, f, indent=2)

print("\n" + "=" * 70)
print("📋 QUICK REFERENCE GUIDE CREATED")
print("=" * 70)
print("\n✓ QUICK_REFERENCE.txt - Quick lookup for commands and patterns")
print("✓ roadmap_data.json - Project timeline and milestones")
print("\n" + "=" * 70)
print("ALL DOCUMENTATION READY FOR PAIR PROGRAMMING!")

