PASS  src/services/__tests__/StreamingDocumentProcessor.test.js
  StreamingDocumentProcessor
    constructor
      ✓ should initialize with default chunk size (5ms)
    countWords
      ✓ should count words in plain text (2ms)
      ✓ should count words in HTML (1ms)
    sanitizeHTML
      ✓ should call DOMPurify.sanitize with config (3ms)
      ✓ should return sanitized HTML (2ms)
    processDocument
      ✓ should process document successfully (10ms)
      ✓ should handle empty input (5ms)
      ✓ should call progress callback (8ms)

PASS  src/components/__tests__/DocumentFormatter.test.js
  DocumentFormatter Component
    ✓ should render without crashing (25ms)
    ✓ should accept file upload (150ms)
    ✓ should display formatted content (120ms)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Time:        3.456s
PASS  src/services/__tests__/StreamingDocumentProcessor.test.js
  StreamingDocumentProcessor
    constructor
      ✓ should initialize with default chunk size (5ms)
    countWords
      ✓ should count words in plain text (2ms)
      ✓ should count words in HTML (1ms)
    sanitizeHTML
      ✓ should call DOMPurify.sanitize with config (3ms)
      ✓ should return sanitized HTML (2ms)
    processDocument
      ✓ should process document successfully (10ms)
      ✓ should handle empty input (5ms)
      ✓ should call progress callback (8ms)

PASS  src/components/__tests__/DocumentFormatter.test.js
  DocumentFormatter Component
    ✓ should render without crashing (25ms)
    ✓ should accept file upload (150ms)
    ✓ should display formatted content (120ms)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Time:        3.456s


PASS  src/services/__tests__/StreamingDocumentProcessor.test.js
  StreamingDocumentProcessor
    constructor
      ✓ should initialize with default chunk size (5ms)
    countWords
      ✓ should count words in plain text (2ms)
      ✓ should count words in HTML (1ms)
    sanitizeHTML
      ✓ should call DOMPurify.sanitize with config (3ms)
      ✓ should return sanitized HTML (2ms)
    processDocument
      ✓ should process document successfully (10ms)
      ✓ should handle empty input (5ms)
      ✓ should call progress callback (8ms)

PASS  src/components/__tests__/DocumentFormatter.test.js
  DocumentFormatter Component
    ✓ should render without crashing (25ms)
    ✓ should accept file upload (150ms)
    ✓ should display formatted content (120ms)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Time:        3.456s
StreamingDocumentProcessor Test Failures - Complete Diagnostic & Fix Guide
🔍 PROBLEM ANALYSIS
Issue: StreamingDocumentProcessor works in its own tests but fails when called from components

Root Cause: Dependencies (DOMPurify, cheerio) not properly mocked in component tests

🎯 COMMON JEST MOCKING ISSUES
Issue 1: DOMPurify Mock Problems
Problem: DOMPurify.sanitize is not a function

DOMPurify works differently in Node vs Browser

Jest runs in Node environment (jsdom)

DOMPurify expects browser window object

Issue 2: Cheerio Mock Problems
Problem: cheerio.load fails or returns undefined

Cheerio is a server-side library

May not be available in test environment

Mock must replicate expected API

Issue 3: Async/Promise Issues
Problem: Tests timeout or hang

Streaming/async operations not properly awaited

Promises not resolved in tests

No proper cleanup

✅ SOLUTION 1: Fix DOMPurify Mocking
File: src/setupTests.js (or create if missing)
javascript
/**
 * Jest Setup for DOMPurify
 * CRITICAL: DOMPurify needs window object in Jest
 */

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create jsdom window for DOMPurify
const window = new JSDOM('').window;
global.DOMPurify = DOMPurify(window);

// Alternative: Mock DOMPurify entirely
jest.mock('dompurify', () => {
  const originalModule = jest.requireActual('dompurify');
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  return originalModule(window);
});

// Export for use in tests
export { window };
Update jest.config.js:
javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }],
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
};
✅ SOLUTION 2: Create Proper Mocks for Dependencies
File: src/__mocks__/dompurify.js
javascript
/**
 * DOMPurify Mock for Jest
 */

const DOMPurify = {
  sanitize: jest.fn((html, config) => {
    // Return sanitized HTML (simple mock)
    if (!html) return '';
    
    // Remove script tags (basic sanitization)
    let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // If config has ALLOWED_TAGS, filter (simplified)
    if (config?.ALLOWED_TAGS && Array.isArray(config.ALLOWED_TAGS)) {
      // For testing, just return the input
      // Real implementation would filter tags
      return cleaned;
    }
    
    return cleaned;
  }),
  
  // Reset mock between tests
  __reset: function() {
    this.sanitize.mockClear();
  }
};

export default DOMPurify;
File: src/__mocks__/cheerio.js
javascript
/**
 * Cheerio Mock for Jest
 */

const cheerio = {
  load: jest.fn((html, options) => {
    // Return a mock jQuery-like object
    const mockCheerioInstance = {
      html: jest.fn(() => html),
      text: jest.fn(() => html.replace(/<[^>]*>/g, '')),
      find: jest.fn(() => mockCheerioInstance),
      each: jest.fn((callback) => {
        // Mock iteration
        callback(0, { name: 'div' });
        return mockCheerioInstance;
      }),
      children: jest.fn(() => mockCheerioInstance),
      first: jest.fn(() => mockCheerioInstance),
      last: jest.fn(() => mockCheerioInstance),
      length: 1,
      clone: jest.fn(() => mockCheerioInstance),
      append: jest.fn(() => mockCheerioInstance),
      prepend: jest.fn(() => mockCheerioInstance),
      remove: jest.fn(() => mockCheerioInstance),
      replaceWith: jest.fn(() => mockCheerioInstance),
      attr: jest.fn(() => 'test-attr'),
      addClass: jest.fn(() => mockCheerioInstance),
      removeClass: jest.fn(() => mockCheerioInstance),
      hasClass: jest.fn(() => false),
    };

    // Add $ function that returns html
    const $ = jest.fn((selector) => mockCheerioInstance);
    
    // Copy methods to $ function
    Object.assign($, mockCheerioInstance);
    
    return $;
  }),
  
  __reset: function() {
    this.load.mockClear();
  }
};

export default cheerio;
✅ SOLUTION 3: Fix StreamingDocumentProcessor Tests
File: src/services/__tests__/StreamingDocumentProcessor.test.js
javascript
/**
 * StreamingDocumentProcessor Tests
 * FIXED: Proper mocking and async handling
 */

import StreamingDocumentProcessor from '../StreamingDocumentProcessor';
import DOMPurify from 'dompurify';
import cheerio from 'cheerio';

// Mock dependencies
jest.mock('dompurify');
jest.mock('cheerio');

describe('StreamingDocumentProcessor', () => {
  let processor;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create fresh processor instance
    processor = new StreamingDocumentProcessor();
    
    // Setup default mock implementations
    DOMPurify.sanitize.mockImplementation((html) => html);
    cheerio.load.mockImplementation((html) => {
      const $ = jest.fn(() => ({ 
        html: () => html,
        text: () => html.replace(/<[^>]*>/g, '')
      }));
      $.html = () => html;
      return $;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processDocument', () => {
    it('should process HTML successfully', async () => {
      const html = '<p>Test content</p>';
      
      const result = await processor.processDocument(html);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.html).toBeDefined();
    });

    it('should handle empty HTML', async () => {
      const result = await processor.processDocument('');
      
      expect(result.success).toBe(true);
      expect(result.html).toBe('');
    });

    it('should handle null input', async () => {
      const result = await processor.processDocument(null);
      
      expect(result.success).toBe(true);
      expect(result.html).toBe('');
    });

    it('should call DOMPurify.sanitize', async () => {
      const html = '<p>Test</p>';
      
      await processor.processDocument(html);
      
      expect(DOMPurify.sanitize).toHaveBeenCalled();
    });

    it('should call cheerio.load', async () => {
      const html = '<p>Test</p>';
      
      await processor.processDocument(html);
      
      expect(cheerio.load).toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      // Force an error
      DOMPurify.sanitize.mockImplementation(() => {
        throw new Error('Sanitization failed');
      });
      
      const html = '<p>Test</p>';
      const result = await processor.processDocument(html);
      
      // Should return fallback with original HTML
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.html).toBe(html); // Fallback to original
    });

    it('should track progress', async () => {
      const html = '<p>Test</p>';
      const progressCallback = jest.fn();
      
      await processor.processDocument(html, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: expect.any(Number)
        })
      );
    });
  });

  describe('chunkHTML', () => {
    it('should chunk large HTML', () => {
      const largeHTML = '<p>' + 'word '.repeat(5000) + '</p>';
      
      const chunks = processor.chunkHTML(largeHTML);
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should not chunk small HTML', () => {
      const smallHTML = '<p>Short content</p>';
      
      const chunks = processor.chunkHTML(smallHTML);
      
      expect(chunks.length).toBe(1);
      expect(chunks).toBe(smallHTML);
    });
  });

  describe('sanitizeHTML', () => {
    it('should sanitize HTML', () => {
      const html = '<p>Safe content</p><script>alert("xss")</script>';
      
      const result = processor.sanitizeHTML(html);
      
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        html,
        expect.objectContaining({
          ALLOWED_TAGS: expect.any(Array),
          KEEP_CONTENT: true
        })
      );
    });
  });
});
✅ SOLUTION 4: Fix Component Tests
File: src/components/__tests__/DocumentFormatter.test.js
javascript
/**
 * DocumentFormatter Component Tests
 * FIXED: Proper dependency mocking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentFormatter from '../DocumentFormatter';
import StreamingDocumentProcessor from '../../services/StreamingDocumentProcessor';

// Mock the processor
jest.mock('../../services/StreamingDocumentProcessor');

describe('DocumentFormatter Component', () => {
  let mockProcessor;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock processor instance
    mockProcessor = {
      processDocument: jest.fn().mockResolvedValue({
        success: true,
        html: '<p>Formatted content</p>',
        chunks: 1
      }),
      chunkHTML: jest.fn().mockReturnValue(['<p>Test</p>']),
      sanitizeHTML: jest.fn().mockImplementation(html => html),
    };

    // Mock the constructor to return our mock instance
    StreamingDocumentProcessor.mockImplementation(() => mockProcessor);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render upload area', () => {
    render(<DocumentFormatter />);
    
    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    render(<DocumentFormatter />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { name: /upload/i }).querySelector('input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockProcessor.processDocument).toHaveBeenCalled();
    });
  });

  it('should display formatted content', async () => {
    const { container } = render(<DocumentFormatter />);
    
    const file = new File(['<p>Test</p>'], 'test.html', { type: 'text/html' });
    const input = container.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/formatted content/i)).toBeInTheDocument();
    });
  });

  it('should handle processing errors', async () => {
    // Mock error
    mockProcessor.processDocument.mockResolvedValue({
      success: false,
      error: 'Processing failed',
      html: '<p>Original</p>'
    });

    const { container } = render(<DocumentFormatter />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
    });
  });

  it('should show progress during processing', async () => {
    // Mock progress callback
    mockProcessor.processDocument.mockImplementation((html, progressCallback) => {
      progressCallback({ progress: 50 });
      return Promise.resolve({
        success: true,
        html: '<p>Done</p>'
      });
    });

    const { container } = render(<DocumentFormatter />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(container.querySelector('.progress-bar')).toBeInTheDocument();
    });
  });
});
✅ SOLUTION 5: Install Required Test Dependencies
Update package.json:
json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "babel-jest": "^29.7.0",
    "jsdom": "^23.0.0",
    "identity-obj-proxy": "^3.0.0"
  }
}
Install:
bash
npm install --save-dev jsdom identity-obj-proxy
✅ SOLUTION 6: Fix Async/Promise Handling
Common Issues:
Issue: Tests timeout or don't wait for async operations

Fix: Ensure all async operations are properly awaited

javascript
// BAD: Not waiting for promise
it('processes document', () => {
  processor.processDocument(html); // ❌ No await
  expect(result).toBeDefined(); // ❌ Runs immediately
});

// GOOD: Proper async handling
it('processes document', async () => {
  const result = await processor.processDocument(html); // ✅ Await
  expect(result).toBeDefined(); // ✅ Runs after completion
});

// GOOD: Using waitFor for React components
it('displays result', async () => {
  render(<Component />);
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
✅ SOLUTION 7: Debug Failing Tests
Add Debug Logging:
javascript
describe('StreamingDocumentProcessor', () => {
  it('debugs mocking issues', async () => {
    console.log('DOMPurify mock:', DOMPurify);
    console.log('DOMPurify.sanitize:', DOMPurify.sanitize);
    console.log('cheerio mock:', cheerio);
    console.log('cheerio.load:', cheerio.load);
    
    const html = '<p>Test</p>';
    const result = await processor.processDocument(html);
    
    console.log('Result:', result);
    console.log('DOMPurify called:', DOMPurify.sanitize.mock.calls.length);
    console.log('cheerio called:', cheerio.load.mock.calls.length);
    
    expect(result.success).toBe(true);
  });
});
Run tests with verbose:
bash
npm test -- --verbose --no-coverage
✅ SOLUTION 8: Common Jest Configuration Issues
Fix jest.config.js:
javascript
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module name mapper for CSS
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  
  // Timeout for async operations
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
};
📊 TESTING CHECKLIST
After implementing fixes:

 npm test runs without errors

 StreamingDocumentProcessor tests pass

 Component tests pass

 DOMPurify is properly mocked

 cheerio is properly mocked

 Async operations are awaited

 Progress callbacks work

 Error handling works

 Coverage > 80%

🐛 DEBUGGING COMMANDS
bash
# Run specific test file
npm test -- StreamingDocumentProcessor.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u
📋 QUICK FIX SUMMARY
Create src/setupTests.js with DOMPurify setup

Create src/__mocks__/dompurify.js

Create src/__mocks__/cheerio.js

Update jest.config.js with proper config

Fix async handling in tests (use async/await)

Mock StreamingDocumentProcessor in component tests

Install jsdom and identity-obj-proxy

Run npm test to verify

All tests should now pass! 🎉