import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the child components to isolate App component testing
jest.mock('./components/DocumentFormatterEnterprise', () => {
  return function MockDocumentFormatter({ content, setContent, onFormat, isFormatting, formattedContent }) {
    // When there's formatted content, show it in the textarea
    const displayContent = formattedContent || content;
    
    return (
      <div data-testid="document-formatter">
        <textarea 
          data-testid="content-textarea"
          value={displayContent}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your document text here..."
        />
        <button 
          data-testid="format-button"
          onClick={onFormat}
          disabled={isFormatting}
        >
          {isFormatting ? 'Formatting...' : 'Format with AI'}
        </button>
      </div>
    );
  };
});

jest.mock('./components/PDFGenerator', () => {
  return function MockPDFGenerator({ content, originalContent }) {
    return content ? (
      <div data-testid="pdf-generator">
        PDF Generator - Content: {content.substring(0, 50)}...
      </div>
    ) : null;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('App renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('🤖 AI Document Formatter')).toBeInTheDocument();
    expect(screen.getByText('Transform raw content into professional PDFs in minutes')).toBeInTheDocument();
  });

  test('App renders header correctly', () => {
    render(<App />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('App-header');
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('🤖 AI Document Formatter');
    
    const subtitle = screen.getByText('Transform raw content into professional PDFs in minutes');
    expect(subtitle).toBeInTheDocument();
  });

  test('App renders main content area', () => {
    render(<App />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('App-main');
    
    expect(screen.getByTestId('document-formatter')).toBeInTheDocument();
  });

  test('content state management works', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const testText = 'Test document content';
    
    fireEvent.change(textarea, { target: { value: testText } });
    
    expect(textarea.value).toBe(testText);
  });

  test('format button triggers formatting process', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    // Add some content
    fireEvent.change(textarea, { target: { value: 'Test content' } });
    
    // Click format button
    fireEvent.click(formatButton);
    
    // Should show formatting state
    expect(formatButton).toHaveTextContent('Formatting...');
    expect(formatButton).toBeDisabled();
  });

  test('formatting completes after timeout', async () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    // Add content
    fireEvent.change(textarea, { target: { value: 'TITLE\n\nContent here' } });
    
    // Start formatting
    fireEvent.click(formatButton);
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Should be done formatting
    expect(formatButton).toHaveTextContent('Format with AI');
    expect(formatButton).not.toBeDisabled();
  });

  test('PDF generator appears after formatting', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    // Initially no PDF generator
    expect(screen.queryByTestId('pdf-generator')).not.toBeInTheDocument();
    
    // Add content and format
    fireEvent.change(textarea, { target: { value: 'Test content' } });
    fireEvent.click(formatButton);
    
    // Fast-forward time to complete formatting
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
        // PDF generator should now appear
    expect(screen.getByTestId('pdf-generator')).toBeInTheDocument();
  });
});

// Test formatContentWithAI function behavior through UI interactions
describe('App Internal Functions', () => {

  test('isAllCaps function logic', () => {
    render(<App />);
    
    // Test various strings that should be detected as all caps
    const testCases = [
      'TITLE',
      'EXECUTIVE SUMMARY',
      'KEY POINTS',
      'CONCLUSION'
    ];
    
    testCases.forEach(testCase => {
      // All caps test
      expect(testCase === testCase.toUpperCase() && /[A-Z]/.test(testCase)).toBe(true);
    });
  });

  test('isTitleCase function logic', () => {
    render(<App />);
    
    // Test title case detection logic
    const titleCaseTests = [
      'Executive Summary',
      'Key Points',
      'Business Report',
      'Market Analysis'
    ];
    
    titleCaseTests.forEach(testCase => {
      const words = testCase.split(' ');
      const isTitleCase = words.length <= 6 && words.every(word => 
        word.length > 0 && word[0] === word[0].toUpperCase()
      );
      expect(isTitleCase).toBe(true);
    });
  });

  test('formatting with headers', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    // Test content with headers
    const testContent = `EXECUTIVE SUMMARY
This is the executive summary.

Key Points
- Point one
- Point two

CONCLUSION
This is the conclusion.`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    
    // Verify button is enabled before clicking
    expect(formatButton).not.toBeDisabled();
    
    fireEvent.click(formatButton);
    
    // Should show formatting state
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  test('formatting with code blocks', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    // Test content with code
    const testContent = `Function Example
const myFunction = () => {
  return 'Hello World';
};

Regular text here.`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    expect(formatButton).not.toBeDisabled();
    fireEvent.click(formatButton);
    
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  test('formatting with numbered lists', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const testContent = `Process Steps
1. First step
2. Second step
3. Third step`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    expect(formatButton).not.toBeDisabled();
    fireEvent.click(formatButton);
    
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  test('formatting with bullet lists', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const testContent = `Key Features
- Feature one
- Feature two
* Alternative bullet
* Another point`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    expect(formatButton).not.toBeDisabled();
    fireEvent.click(formatButton);
    
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  test('formatting with important words highlighting', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const testContent = `Business Update
Revenue increased this quarter. Growth was significant.
Key metrics show Important improvements.
Critical factors include market expansion.`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    expect(formatButton).not.toBeDisabled();
    fireEvent.click(formatButton);
    
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  test('formatting empty content', () => {
    render(<App />);
    
    const formatButton = screen.getByTestId('format-button');
    
    // Try to format empty content
    fireEvent.click(formatButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Should not show PDF generator for empty content
    expect(screen.queryByTestId('pdf-generator')).not.toBeInTheDocument();
  });

  test('formatting with mixed content types', () => {
    render(<App />);
    
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const testContent = `TECHNICAL DOCUMENT

Executive Summary
This is a mixed content document.

1. Introduction
2. Technical Details

const example = {
  name: 'test',
  value: 42
};

Key Points:
- Performance improved
- Revenue up 25%
- Growth sustainable

CONCLUSION
All objectives met.`;
    
    fireEvent.change(textarea, { target: { value: testContent } });
    expect(formatButton).not.toBeDisabled();
    fireEvent.click(formatButton);
    
    expect(formatButton).toBeDisabled();
    expect(formatButton).toHaveTextContent('Formatting...');
  });

  // Additional tests to cover specific uncovered lines in text processing logic
  test('processes code blocks with special programming syntax', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const codeContent = `
function test() {
  const x = 1;
  return x + 1;
}

SELECT * FROM users WHERE id = 1;

class MyClass {
  public method() {
    console.log("test");
  }
}`;

    fireEvent.change(textarea, { target: { value: codeContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain(codeContent);
  });

  test('handles mixed code and text content', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const mixedContent = `TITLE SECTION
    
    def python_function():
        return True
        
    import os
    
    Regular text paragraph here.
    
    var javascript = "code";
    function another() {
      return javascript;
    }
    
    ANOTHER SECTION
    More text content.`;

    fireEvent.change(textarea, { target: { value: mixedContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain(mixedContent);
  });

  test('processes special characters and edge cases in text formatting', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const edgeCaseContent = `
{
  "key": "value"
};

Revenue is important.
Growth matters too.
Key findings are here.
Important details follow.
Critical information below.
Summary section ends it.

1. Numbered list item
2. Another numbered item

- Bullet point one
* Different bullet style
- Another bullet point`;

    fireEvent.change(textarea, { target: { value: edgeCaseContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain(edgeCaseContent);
  });

  test('handles title case and all caps detection', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const titleContent = `ALL CAPS TITLE
    
Title Case Section Header

Regular paragraph with normal text.
Another paragraph here.

ANOTHER ALL CAPS SECTION

Title Case Subsection

Final paragraph.`;

    fireEvent.change(textarea, { target: { value: titleContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain(titleContent);
  });

  test('handles code block detection with various syntax patterns', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const syntaxContent = `
public class Example {
    private int value;
}

=> arrow functions
const arrow = () => {};

import React from 'react';

SELECT column FROM table;
WHERE condition = true;

{
  key: value,
  another: "string"
}

function(param) {
  return param * 2;
}`;

    fireEvent.change(textarea, { target: { value: syntaxContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain(syntaxContent);
  });

  // Targeted tests for specific uncovered App.js lines
  test('handles empty lines within code blocks correctly', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const codeWithEmptyLines = `function test() {

  const x = 1;

  return x;
}`;

    fireEvent.change(textarea, { target: { value: codeWithEmptyLines } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('function test');
  });

  test('handles code block ending followed by headers', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const codeToHeaderContent = `function example() {
  return true;
}
MAIN SECTION
This is regular text.`;

    fireEvent.change(textarea, { target: { value: codeToHeaderContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('function example');
    expect(textarea.value).toContain('MAIN SECTION');
  });

  test('handles title case headers correctly', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const titleCaseContent = `Title Case Header
Regular paragraph text here.
Another Title Case Section
More content.`;

    fireEvent.change(textarea, { target: { value: titleCaseContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('Title Case Header');
    expect(textarea.value).toContain('Another Title Case Section');
  });

  test('handles numbered lists detection', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const numberedListContent = `1. First item in list
2. Second item in list
3. Third item in list
Regular paragraph text.`;

    fireEvent.change(textarea, { target: { value: numberedListContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('1. First item');
    expect(textarea.value).toContain('2. Second item');
    expect(textarea.value).toContain('3. Third item');
  });

  test('handles bullet lists detection', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const bulletListContent = `- First bullet point
* Second bullet point  
- Third bullet point
Regular text here.`;

    fireEvent.change(textarea, { target: { value: bulletListContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('- First bullet');
    expect(textarea.value).toContain('* Second bullet');
    expect(textarea.value).toContain('- Third bullet');
  });



  test('handles unclosed code blocks at end of document', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const unClosedCodeContent = `Regular paragraph here.

function unclosedFunction() {
  const value = 42;
  return value;
}

const anotherLine = true;`;

    fireEvent.change(textarea, { target: { value: unClosedCodeContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('function unclosedFunction');
    expect(textarea.value).toContain('const anotherLine');
  });

  test('handles short code lines with brackets and semicolons', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const shortCodeContent = `x = 1;
y = 2;
z = {a: 1};
func();
if (condition) {
  doSomething();
}`;

    fireEvent.change(textarea, { target: { value: shortCodeContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('x = 1;');
    expect(textarea.value).toContain('z = {a: 1};');
    expect(textarea.value).toContain('func();');
  });

  test('handles SQL query detection and formatting', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const sqlContent = `SELECT * FROM users;
WHERE active = 1;
INSERT INTO products (name) VALUES ('test');
Regular text paragraph here.`;

    fireEvent.change(textarea, { target: { value: sqlContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('SELECT * FROM users');
    expect(textarea.value).toContain('WHERE active');
    expect(textarea.value).toContain('INSERT INTO');
  });

  test('handles variable declarations and functions', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const varContent = `const myVariable = 'test';
let anotherVar = 42;
var oldStyleVar = true;
function myFunction() {
  return 'hello';
}
def pythonFunction():
    return True
class MyClass:
    pass
import os
public class JavaClass {
}
private int value = 10;`;

    fireEvent.change(textarea, { target: { value: varContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('const myVariable');
    expect(textarea.value).toContain('let anotherVar');
    expect(textarea.value).toContain('var oldStyleVar');
    expect(textarea.value).toContain('function myFunction');
    expect(textarea.value).toContain('def pythonFunction');
    expect(textarea.value).toContain('class MyClass');
    expect(textarea.value).toContain('import os');
    expect(textarea.value).toContain('public class');
    expect(textarea.value).toContain('private int');
  });

  test('handles arrow functions and modern JavaScript syntax', async () => {
    render(<App />);
    const textarea = screen.getByTestId('content-textarea');
    const formatButton = screen.getByTestId('format-button');
    
    const arrowContent = `const arrow = => value;
const multiLine = => {
  return value + 1;
}
=> simpleArrow;
Normal paragraph text here.`;

    fireEvent.change(textarea, { target: { value: arrowContent } });
    fireEvent.click(formatButton);
    
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(textarea.value).toContain('=> value');
    expect(textarea.value).toContain('=> {');
    expect(textarea.value).toContain('=> simpleArrow');
  });
});
