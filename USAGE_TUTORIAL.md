# Usage Tutorial - Project Bible Utilities

## 📖 Complete Guide to Using the PM Document Tools

This tutorial walks you through using the three core utilities: **Template Engine**, **Section Detector**, and **Document Merger**. Follow along with practical examples and real-world scenarios.

---

## 🎯 Table of Contents

1. [Getting Started](#getting-started)
2. [Template Engine Tutorial](#template-engine-tutorial)
3. [Section Detector Tutorial](#section-detector-tutorial)
4. [Document Merger Tutorial](#document-merger-tutorial)
5. [Complete Workflow Example](#complete-workflow-example)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

The utilities are already included in your doc-formatter project. No additional installation required!

### Import the Utilities

```javascript
// Import individual utilities
import { TemplateEngine } from './utils/templateEngine';
import { SectionDetector, SectionType } from './utils/sectionDetector';
import { DocumentMerger, MergeStrategy } from './utils/documentMerger';
```

---

## Template Engine Tutorial

### 🎓 Lesson 1: Loading and Viewing Templates

**Goal**: Understand available templates and their structure.

```javascript
// Step 1: Create a template engine instance
const engine = new TemplateEngine();

// Step 2: List all available templates
const templates = engine.listTemplates();
console.log('Available templates:', templates);
// Output:
// [
//   { id: 'project-charter', name: 'Project Charter', ... },
//   { id: 'risk-register', name: 'Risk Register', ... },
//   { id: 'wbs', name: 'Work Breakdown Structure', ... },
//   { id: 'raci-matrix', name: 'RACI Matrix', ... }
// ]

// Step 3: Get a specific template
const charterTemplate = engine.getTemplate('project-charter');
console.log('Charter sections:', charterTemplate.sections);
```

**💡 Pro Tip**: Use `listTemplates()` to populate a dropdown in your UI for template selection.

---

### 🎓 Lesson 2: Validating Data Against Templates

**Goal**: Ensure your data meets template requirements before generation.

```javascript
const engine = new TemplateEngine();

// Example: Validate project charter data
const projectData = {
  projectName: 'Website Redesign',
  projectManager: 'Jane Smith',
  startDate: '2024-01-15',
  endDate: '2024-06-30',
  budget: 50000,
  description: 'Complete redesign of company website with modern UI/UX'
};

// Validate the data
const validation = engine.validateTemplate(projectData, 'project-charter');

if (validation.valid) {
  console.log('✅ Data is valid!');
} else {
  console.log('❌ Validation errors:', validation.errors);
  validation.errors.forEach(error => {
    console.log(`- ${error.field}: ${error.message}`);
  });
}
```

**Common Validation Errors**:
- Missing required fields
- Wrong data types (e.g., string instead of number)
- Values outside min/max ranges
- Invalid date formats
- Pattern mismatch (e.g., invalid email)

---

### 🎓 Lesson 3: Generating Documents from Templates

**Goal**: Create formatted documents using templates and data.

```javascript
const engine = new TemplateEngine();

// Complete project charter data
const charterData = {
  projectName: 'Mobile App Development',
  projectManager: 'John Doe',
  startDate: '2024-02-01',
  endDate: '2024-08-31',
  budget: 150000,
  description: 'Native mobile app for iOS and Android platforms',
  objectives: [
    'Launch by Q3 2024',
    'Achieve 10,000 downloads in first month',
    'Maintain 4.5+ star rating'
  ],
  stakeholders: [
    { name: 'CEO', role: 'Executive Sponsor', influence: 'high' },
    { name: 'CTO', role: 'Technical Lead', influence: 'high' },
    { name: 'Marketing Director', role: 'Marketing Lead', influence: 'medium' }
  ]
};

// Generate the document
const document = engine.generateFromTemplate('project-charter', charterData);
console.log(document);

// The output will be formatted HTML with all sections populated
```

**💡 Pro Tip**: The generated content uses HTML formatting. You can:
- Display it in a web view
- Convert to PDF using a library like `@react-pdf/renderer`
- Export to Word using `html-docx-js`

---

### 🎓 Lesson 4: Variable Substitution

**Goal**: Use template variables for dynamic content.

Templates support variable substitution using `{{variableName}}` syntax:

```javascript
const engine = new TemplateEngine();

const data = {
  projectName: 'E-commerce Platform',
  projectManager: 'Alice Johnson',
  startDate: '2024-03-01',
  // Variables will be substituted in template text
  companyName: 'TechCorp Inc.',
  department: 'IT Department'
};

// In the template, text like:
// "This project for {{companyName}} is managed by {{projectManager}}"
// 
// Will become:
// "This project for TechCorp Inc. is managed by Alice Johnson"

const document = engine.generateFromTemplate('project-charter', data);
```

---

### 🎓 Lesson 5: Creating Custom Templates

**Goal**: Register your own templates for specific needs.

```javascript
const engine = new TemplateEngine();

// Define a custom template
const customTemplate = {
  id: 'sprint-plan',
  name: 'Sprint Planning Document',
  description: 'Template for Agile sprint planning',
  sections: [
    {
      id: 'sprint-info',
      title: 'Sprint Information',
      template: `
        Sprint Number: {{sprintNumber}}
        Sprint Goal: {{sprintGoal}}
        Duration: {{duration}} weeks
      `,
      required: true,
      fields: [
        {
          name: 'sprintNumber',
          type: 'number',
          label: 'Sprint Number',
          required: true,
          min: 1
        },
        {
          name: 'sprintGoal',
          type: 'string',
          label: 'Sprint Goal',
          required: true,
          minLength: 10
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Duration (weeks)',
          required: true,
          min: 1,
          max: 4
        }
      ]
    }
  ]
};

// Register the custom template
engine.registerTemplate(customTemplate);

// Now you can use it like any other template
const sprintDoc = engine.generateFromTemplate('sprint-plan', {
  sprintNumber: 5,
  sprintGoal: 'Complete user authentication module',
  duration: 2
});
```

---

## Section Detector Tutorial

### 🎓 Lesson 1: Basic Section Detection

**Goal**: Automatically identify sections in existing documents.

```javascript
const detector = new SectionDetector();

// Sample document text
const documentText = `
Executive Summary
This project aims to modernize our infrastructure.

Project Objectives
1. Reduce operating costs by 30%
2. Improve system reliability
3. Enhance security posture

Scope Statement
In Scope:
- Server migration
- Database optimization

Out of Scope:
- Application rewrites
- New feature development

Risk Register
R001: Budget overrun - High probability, High impact
R002: Timeline delays - Medium probability, Medium impact
`;

// Detect sections
const sections = detector.detectSections(documentText);

console.log(`Found ${sections.length} sections:`);
sections.forEach(section => {
  console.log(`- ${section.type}: "${section.title}" (confidence: ${section.confidence})`);
});

// Output:
// Found 4 sections:
// - executiveSummary: "Executive Summary" (confidence: 1.0)
// - objectives: "Project Objectives" (confidence: 1.0)
// - scope: "Scope Statement" (confidence: 1.0)
// - risks: "Risk Register" (confidence: 1.0)
```

---

### 🎓 Lesson 2: Understanding Confidence Scores

**Goal**: Use confidence scores to filter detection results.

```javascript
const detector = new SectionDetector({
  confidenceThreshold: 0.7  // Only return sections with 70%+ confidence
});

const sections = detector.detectSections(documentText);

// Filter by confidence
const highConfidenceSections = sections.filter(s => s.confidence >= 0.9);
const mediumConfidenceSections = sections.filter(s => s.confidence >= 0.7 && s.confidence < 0.9);

console.log(`High confidence (90%+): ${highConfidenceSections.length} sections`);
console.log(`Medium confidence (70-89%): ${mediumConfidenceSections.length} sections`);

// Display sections with confidence indicators
sections.forEach(section => {
  const indicator = section.confidence >= 0.9 ? '✅' : 
                   section.confidence >= 0.7 ? '⚠️' : '❓';
  console.log(`${indicator} ${section.title} (${section.confidence * 100}%)`);
});
```

**Confidence Score Meaning**:
- **1.0**: Exact match (e.g., "Executive Summary")
- **0.9**: Strong partial match with context
- **0.8**: Partial match with supporting indicators
- **0.7**: Weak match, multiple indicators

---

### 🎓 Lesson 3: Auto-Numbering and Hierarchy

**Goal**: Normalize document structure with proper numbering.

```javascript
const detector = new SectionDetector({
  autoNumber: true  // Enable auto-numbering
});

const documentText = `
Project Overview
This section describes the project.

Background
Historical context goes here.

Objectives
Primary Objective
Deliver on time and within budget.

Secondary Objectives
Maintain quality standards.
Minimize risks.
`;

// Detect and normalize
const sections = detector.detectSections(documentText);
const normalized = detector.normalizeHeadings(sections);

normalized.forEach(section => {
  const indent = '  '.repeat(section.level);
  console.log(`${indent}${section.heading} ${section.title}`);
});

// Output:
// 1.0 Project Overview
// 2.0 Background
// 3.0 Objectives
//   3.1 Primary Objective
//   3.2 Secondary Objectives
```

---

### 🎓 Lesson 4: Extracting Tables

**Goal**: Preserve table structures during processing.

```javascript
const detector = new SectionDetector();

const documentWithTable = `
Budget Overview

| Category | Q1 | Q2 | Q3 | Q4 |
|----------|----|----|----|----|
| Personnel | 50k | 50k | 50k | 50k |
| Equipment | 20k | 10k | 10k | 10k |
| Software | 15k | 15k | 15k | 15k |
`;

const sections = detector.detectSections(documentWithTable);
const budgetSection = sections.find(s => s.type === SectionType.BUDGET);

// Extract tables from the section
const tables = detector.extractTables(budgetSection.content);

console.log(`Found ${tables.length} table(s)`);
tables.forEach((table, index) => {
  console.log(`Table ${index + 1}: ${table.rows.length} rows, ${table.headers.length} columns`);
  console.log('Headers:', table.headers);
  console.log('Data:', table.rows);
});
```

---

### 🎓 Lesson 5: Working with Section Types

**Goal**: Filter and process specific section types.

```javascript
import { SectionType } from './utils/sectionDetector';

const detector = new SectionDetector();
const sections = detector.detectSections(documentText);

// Find all risk sections
const riskSections = sections.filter(s => s.type === SectionType.RISKS);
console.log(`Found ${riskSections.length} risk section(s)`);

// Find all stakeholder sections
const stakeholderSections = sections.filter(s => s.type === SectionType.STAKEHOLDERS);

// Get executive summary
const execSummary = sections.find(s => s.type === SectionType.EXECUTIVE_SUMMARY);
if (execSummary) {
  console.log('Executive Summary:', execSummary.content);
}

// Process WBS sections
const wbsSections = sections.filter(s => s.type === SectionType.WBS);
wbsSections.forEach(section => {
  const subsections = detector.detectSubsections(section.content);
  console.log(`WBS has ${subsections.length} subsections`);
});
```

**Available Section Types**:
- `EXECUTIVE_SUMMARY`
- `OBJECTIVES`
- `SCOPE`
- `STAKEHOLDERS`
- `RISKS`
- `WBS`
- `TIMELINE`
- `BUDGET`
- `APPROVALS`

---

## Document Merger Tutorial

### 🎓 Lesson 1: Merging Multiple Files

**Goal**: Combine multiple PM documents into one unified document.

```javascript
const merger = new DocumentMerger();

// Assume we have file inputs from a form
const files = [
  charterFile,    // project-charter.docx
  wbsFile,        // work-breakdown.xlsx
  riskFile        // risk-register.pdf
];

// Merge with default COMBINE strategy
const result = await merger.mergeDocuments(files);

console.log('Merge completed!');
console.log(`Combined ${result.documentCount} documents`);
console.log(`Total sections: ${result.sections.length}`);
console.log(`Merge strategy used: ${result.strategy}`);

// Display the merged content
console.log('\nMerged Content:');
console.log(result.content);
```

---

### 🎓 Lesson 2: Using Different Merge Strategies

**Goal**: Choose the right strategy for your use case.

#### Strategy 1: COMBINE (Merge Similar Sections)

```javascript
import { MergeStrategy } from './utils/documentMerger';

const merger = new DocumentMerger();

// COMBINE: Merge sections by type
const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.COMBINE,
  includeTOC: true
});

// Result: All "Objectives" sections combined, all "Risks" sections combined, etc.
```

**Best for**: 
- Consolidating multiple drafts
- Combining input from different teams
- Creating comprehensive documents from parts

---

#### Strategy 2: SEPARATE (Keep Documents Distinct)

```javascript
const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.SEPARATE,
  includeTOC: true
});

// Result: Documents kept separate with clear dividers between them
```

**Best for**:
- Appendix creation
- Document collections
- Maintaining document identity

---

#### Strategy 3: PRIORITY (First Document Wins)

```javascript
const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.PRIORITY,
  includeTOC: true
});

// Result: First document is base, missing sections filled from subsequent docs
```

**Best for**:
- Using a master template
- Filling gaps in primary document
- Maintaining primary document structure

---

#### Strategy 4: DEDUPE (Remove Duplicates)

```javascript
const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.DEDUPE,
  includeTOC: true,
  similarityThreshold: 0.8  // 80% similarity threshold
});

// Result: Duplicate content removed, keeping only first occurrence
```

**Best for**:
- Removing redundant content
- Cleaning up merged documents
- Optimizing document size

---

### 🎓 Lesson 3: Generating Table of Contents

**Goal**: Create navigable TOC for merged documents.

```javascript
const merger = new DocumentMerger();

const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.COMBINE,
  includeTOC: true  // Enable TOC generation
});

// The result includes a formatted TOC
console.log('Table of Contents:');
console.log(result.tableOfContents);

// TOC structure:
// 1.0 Executive Summary ........................ Page 1
// 2.0 Project Objectives ....................... Page 3
//   2.1 Primary Goals .......................... Page 3
//   2.2 Secondary Goals ........................ Page 4
// 3.0 Scope Statement .......................... Page 5
// ...
```

---

### 🎓 Lesson 4: Error Handling and Partial Merges

**Goal**: Handle file errors gracefully and continue with successful files.

```javascript
const merger = new DocumentMerger();

// Some files might be corrupted or unsupported
const files = [
  validFile1,
  corruptedFile,    // This will fail
  validFile2,
  unsupportedFile   // This will fail
];

try {
  const result = await merger.mergeDocuments(files, {
    failOnError: false  // Continue on errors
  });

  console.log(`✅ Successfully merged: ${result.documentCount} documents`);
  console.log(`❌ Failed: ${result.failedCount} documents`);

  if (result.errors && result.errors.length > 0) {
    console.log('\nErrors encountered:');
    result.errors.forEach(error => {
      console.log(`- ${error.filename}: ${error.message}`);
    });
  }

} catch (error) {
  console.error('Merge failed completely:', error.message);
}
```

---

### 🎓 Lesson 5: Working with Merge Results

**Goal**: Process and use merged document data.

```javascript
const merger = new DocumentMerger();
const result = await merger.mergeDocuments(files, {
  strategy: MergeStrategy.COMBINE
});

// Access sections
result.sections.forEach(section => {
  console.log(`Section: ${section.title}`);
  console.log(`Type: ${section.type}`);
  console.log(`Source: ${section.source}`);
  console.log(`Content length: ${section.content.length} characters`);
  console.log('---');
});

// Access metadata
console.log('\nDocument Metadata:');
console.log('Authors:', result.metadata.authors);
console.log('Creation Date:', result.metadata.creationDate);
console.log('Tags:', result.metadata.tags);

// Access audit trail
console.log('\nAudit Trail:');
result.auditTrail.forEach(entry => {
  console.log(`[${entry.timestamp}] ${entry.action}: ${entry.details}`);
});

// Export to different formats
const htmlContent = result.content;
const plainText = result.content.replace(/<[^>]*>/g, '');
```

---

## Complete Workflow Example

### 🎯 Real-World Scenario: Creating a Project Bible

Let's walk through a complete workflow combining all three utilities:

```javascript
import { TemplateEngine } from './utils/templateEngine';
import { SectionDetector } from './utils/sectionDetector';
import { DocumentMerger, MergeStrategy } from './utils/documentMerger';

async function createProjectBible(existingFiles, newProjectData) {
  
  // Step 1: Generate a new project charter from template
  console.log('Step 1: Generating project charter...');
  const engine = new TemplateEngine();
  
  const charterHtml = engine.generateFromTemplate('project-charter', newProjectData);
  
  // Step 2: Parse existing documents and detect sections
  console.log('Step 2: Analyzing existing documents...');
  const detector = new SectionDetector();
  
  const parsedDocs = [];
  for (const file of existingFiles) {
    const text = await file.text();
    const sections = detector.detectSections(text);
    parsedDocs.push({
      filename: file.name,
      sections: sections
    });
  }
  
  console.log(`Detected sections in ${parsedDocs.length} documents`);
  
  // Step 3: Merge all documents including the new charter
  console.log('Step 3: Merging documents...');
  const merger = new DocumentMerger();
  
  // Create a File object from the generated charter
  const charterFile = new File([charterHtml], 'new-charter.html', {
    type: 'text/html'
  });
  
  const allFiles = [charterFile, ...existingFiles];
  
  const mergeResult = await merger.mergeDocuments(allFiles, {
    strategy: MergeStrategy.COMBINE,
    includeTOC: true
  });
  
  // Step 4: Generate final output
  console.log('Step 4: Generating final Project Bible...');
  
  const projectBible = {
    title: `Project Bible: ${newProjectData.projectName}`,
    generatedDate: new Date().toISOString(),
    tableOfContents: mergeResult.tableOfContents,
    content: mergeResult.content,
    sections: mergeResult.sections,
    metadata: mergeResult.metadata,
    statistics: {
      totalDocuments: mergeResult.documentCount,
      totalSections: mergeResult.sections.length,
      totalPages: Math.ceil(mergeResult.content.length / 3000), // Estimate
      generatedBy: 'Doc-Formatter PM Tools'
    }
  };
  
  console.log('✅ Project Bible created successfully!');
  console.log(`- ${projectBible.statistics.totalSections} sections`);
  console.log(`- ${projectBible.statistics.totalDocuments} source documents`);
  console.log(`- ~${projectBible.statistics.totalPages} pages`);
  
  return projectBible;
}

// Usage
const projectData = {
  projectName: 'Digital Transformation Initiative',
  projectManager: 'Sarah Chen',
  startDate: '2024-04-01',
  endDate: '2024-12-31',
  budget: 500000,
  description: 'Enterprise-wide digital transformation project',
  objectives: [
    'Modernize legacy systems',
    'Improve operational efficiency',
    'Enhance customer experience'
  ],
  stakeholders: [
    { name: 'CEO', role: 'Executive Sponsor', influence: 'high' },
    { name: 'CIO', role: 'Project Sponsor', influence: 'high' }
  ]
};

const existingFiles = [
  wbsFile,
  riskRegisterFile,
  stakeholderAnalysisFile
];

const projectBible = await createProjectBible(existingFiles, projectData);

// Now you can:
// - Display projectBible.content in your UI
// - Export to PDF
// - Save to database
// - Send to stakeholders
```

---

## Common Patterns

### Pattern 1: Validate-Then-Generate

```javascript
const engine = new TemplateEngine();

function safeGenerate(templateId, data) {
  // Always validate first
  const validation = engine.validateTemplate(data, templateId);
  
  if (!validation.valid) {
    // Show errors to user
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  // Generate if valid
  const content = engine.generateFromTemplate(templateId, data);
  return {
    success: true,
    content: content
  };
}
```

### Pattern 2: Progressive Enhancement

```javascript
const detector = new SectionDetector();

function enhanceDocument(rawText) {
  // Step 1: Detect sections
  const sections = detector.detectSections(rawText);
  
  // Step 2: Normalize headings
  const normalized = detector.normalizeHeadings(sections);
  
  // Step 3: Extract tables
  const enhanced = normalized.map(section => ({
    ...section,
    tables: detector.extractTables(section.content)
  }));
  
  return enhanced;
}
```

### Pattern 3: Batch Processing

```javascript
const merger = new DocumentMerger();

async function processMultipleProjects(projectFiles) {
  const results = [];
  
  for (const project of projectFiles) {
    try {
      const result = await merger.mergeDocuments(project.files, {
        strategy: MergeStrategy.COMBINE,
        failOnError: false
      });
      
      results.push({
        projectName: project.name,
        success: true,
        data: result
      });
    } catch (error) {
      results.push({
        projectName: project.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

---

## Troubleshooting

### Issue: Validation Fails with "Field is required"

**Solution**: Check that all required fields are present in your data object.

```javascript
// ❌ Wrong - missing required fields
const data = {
  projectName: 'My Project'
};

// ✅ Correct - all required fields present
const data = {
  projectName: 'My Project',
  projectManager: 'John Doe',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  budget: 100000,
  description: 'Project description here'
};
```

### Issue: Section Detection Returns Empty Array

**Solution**: Check document format and content structure.

```javascript
// ❌ Document without clear sections
const text = 'This is just a paragraph of text.';

// ✅ Document with clear section headings
const text = `
Executive Summary
This is the summary.

Project Objectives
These are the objectives.
`;
```

### Issue: File Merge Fails with "Unsupported format"

**Solution**: Check file extensions and ensure files are valid.

```javascript
const merger = new DocumentMerger();

// Validate files before merging
const validFiles = files.filter(file => {
  const ext = merger.getFileExtension(file.name);
  return ['txt', 'docx', 'doc', 'pdf', 'xlsx', 'xls'].includes(ext);
});

if (validFiles.length < files.length) {
  console.warn(`Skipped ${files.length - validFiles.length} unsupported file(s)`);
}

const result = await merger.mergeDocuments(validFiles);
```

### Issue: Generated Content Contains HTML Tags

**Solution**: This is expected! You can strip HTML or convert to other formats.

```javascript
const htmlContent = engine.generateFromTemplate('project-charter', data);

// Remove HTML tags for plain text
const plainText = htmlContent.replace(/<[^>]*>/g, '');

// Or render as HTML in your UI
document.getElementById('preview').innerHTML = htmlContent;
```

### Issue: Performance Slow with Large Documents

**Solution**: Use configuration options to optimize performance.

```javascript
// Optimize section detector for large docs
const detector = new SectionDetector({
  confidenceThreshold: 0.8,  // Higher threshold = faster processing
  autoNumber: false          // Disable if not needed
});

// Limit merge size
const merger = new DocumentMerger({
  maxFileSize: 10 * 1024 * 1024  // Limit to 10MB
});
```

---

## Next Steps

Now that you understand the utilities, you can:

1. **Integrate into React Components**: Create UI components that use these utilities
2. **Add PDF Export**: Use `@react-pdf/renderer` to export merged documents
3. **Build Workflows**: Combine utilities for end-to-end document processing
4. **Customize Templates**: Create templates specific to your organization
5. **Extend Functionality**: Add new section types or merge strategies

For implementation details, see [FEATURES.md](./FEATURES.md).

For troubleshooting and support, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md).

---

**Happy Document Processing! 📄✨**
