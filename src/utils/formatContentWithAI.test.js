import { formatContentWithAI } from './formatContentWithAI';

describe('formatContentWithAI Function Tests', () => {
  test('handles empty input', () => {
    expect(formatContentWithAI('')).toBe('');
    expect(formatContentWithAI('   ')).toBe('');
  });

  test('handles important word bolding in paragraphs', () => {
    const input = `Revenue increased significantly this quarter.
Growth was steady across all sectors.
Key findings show positive trends.
Important metrics demonstrate success.
Critical analysis reveals opportunities.
Summary of results is promising.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('**Revenue**');
    expect(result).toContain('**Growth**');
    expect(result).toContain('**Key**');
    expect(result).toContain('**Important**');
    expect(result).toContain('**Critical**');
    expect(result).toContain('**Summary**');
  });

  test('handles code block detection and formatting', () => {
    const input = `function test() {
  const x = 1;
  return x;
}
This is regular text after code.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('function test()');
    expect(result).toContain('const x = 1');
    expect(result).toContain('return x');
    expect(result).toContain('This is regular text after code');
  });

  test('handles SQL queries', () => {
    const input = `SELECT * FROM users;
WHERE active = 1;
Regular text here.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('SELECT * FROM users');
    expect(result).toContain('WHERE active = 1');
  });

  test('handles variable declarations', () => {
    const input = `const myVariable = 'test';
let anotherVar = 42;
var oldStyleVar = true;`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('const myVariable');
    expect(result).toContain('let anotherVar');
    expect(result).toContain('var oldStyleVar');
  });

  test('handles function declarations', () => {
    const input = `function myFunction() {
  return 'hello';
}
def pythonFunction():
    return True`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('function myFunction');
    expect(result).toContain('def pythonFunction');
  });

  test('handles class declarations', () => {
    const input = `class MyClass:
    pass
public class JavaClass {
}
private int value = 10;`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('class MyClass');
    expect(result).toContain('public class JavaClass');
    expect(result).toContain('private int value');
  });

  test('handles import statements', () => {
    const input = `import os
Regular text here.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('import os');
  });

  test('handles bracket and semicolon detection', () => {
    const input = `{
}
;
func();`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('{');
    expect(result).toContain('}');
    expect(result).toContain(';');
    expect(result).toContain('func()');
  });

  test('handles arrow functions', () => {
    const input = `const arrow => value;
=> simpleArrow;`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('=> value');
    expect(result).toContain('=> simpleArrow');
  });

  test('handles all caps headers', () => {
    const input = `INTRODUCTION
This is some text.
METHODOLOGY
More text here.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('# INTRODUCTION');
    expect(result).toContain('# METHODOLOGY');
    expect(result).toContain('This is some text');
    expect(result).toContain('More text here');
  });

  test('handles title case headers', () => {
    const input = `Title Case Header
Regular paragraph text here.
Another Title Case Section
More content.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('## Title Case Header');
    expect(result).toContain('Regular paragraph text here');
    expect(result).toContain('## Another Title Case Section');
    expect(result).toContain('More content');
  });

  test('covers title case header conversion (line 56)', () => {
    const input = `Introduction Overview
This is regular content.
Executive Summary
This is paragraph text.
Key Findings Report
More regular text here.`;

    const result = formatContentWithAI(input);
    
    // These should trigger line 56: result.push(`## ${trimmed}`)
    // Each title case line should be converted to ## header
    expect(result).toContain('## Introduction Overview');
    expect(result).toContain('## Executive Summary');
    expect(result).toContain('## Key Findings Report');
    expect(result).toContain('This is regular content');
    expect(result).toContain('This is paragraph text');
    expect(result).toContain('More regular text here');
  });

  test('targets exact line 56 with precise title case conditions', () => {
    // Create content that exactly meets isTitleCase conditions:
    // - words.length <= 6 
    // - every word starts with uppercase
    // - trimmed.length < 60
    // - NOT in code block
    const preciseInput = `Some content before

Title Case Header
Regular paragraph content here.

Another Title Header  
More content follows.

Short Title
Final content here.`;

    const result = formatContentWithAI(preciseInput);
    
    // These should hit line 56 exactly: result.push(\`## \${trimmed}\`)
    expect(result).toContain('## Title Case Header');
    expect(result).toContain('## Another Title Header');  
    expect(result).toContain('## Short Title');
    
    // Verify non-title case content is preserved
    expect(result).toContain('Some content before');
    expect(result).toContain('Regular paragraph content');
    expect(result).toContain('More content follows');
    expect(result).toContain('Final content here');
  });

  test('hits line 56 via code block exit path', () => {
    // Line 56 is in the "else if (inCodeBlock && !isCode && trimmed)" branch
    // This means we need to exit a code block and have title case text
    const codeBlockExitInput = `Regular content here.

function test() {
  return true;
}

Title Case Header After Code

More content follows.`;

    const result = formatContentWithAI(codeBlockExitInput);
    
    // Should detect the code block and then process the title case header on exit
    // This should hit line 56: result.push(\`## \${trimmed}\`) in the code block exit branch
    expect(result).toContain('```javascript');
    expect(result).toContain('function test()');
    expect(result).toContain('## Title Case Header After Code');
    expect(result).toContain('More content follows');
  });

  test('handles numbered lists', () => {
    const input = `1. First item in list
2. Second item in list
3. Third item in list`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('1. First item');
    expect(result).toContain('2. Second item');
    expect(result).toContain('3. Third item');
  });

  test('handles bullet lists', () => {
    const input = `- First bullet point
* Second bullet point  
- Third bullet point`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('- First bullet');
    expect(result).toContain('* Second bullet');
    expect(result).toContain('- Third bullet');
  });

  test('handles unclosed code blocks at end', () => {
    const input = `Regular paragraph here.
function unclosedFunction() {
  const value = 42;
  return value;
}
const anotherLine = true;`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('function unclosedFunction');
    expect(result).toContain('const anotherLine');
    // Should end with closing backticks
    expect(result).toMatch(/```$/);
  });

  test('handles empty lines in code blocks', () => {
    const input = `function test() {

  const x = 1;

  return x;
}`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('function test()');
    expect(result).toContain('const x = 1');
    expect(result).toContain('return x');
  });

  test('handles code block ending followed by headers', () => {
    const input = `function example() {
  return true;
}
MAIN SECTION
This is regular text.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('function example');
    expect(result).toContain('# MAIN SECTION');
    expect(result).toContain('This is regular text');
  });

  test('handles mixed content with important words', () => {
    const input = `Revenue analysis shows:
function calculateRevenue() {
  return total * 0.1;
}
Key insights from the Growth data.`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('**Revenue**');
    expect(result).toContain('```javascript');
    expect(result).toContain('function calculateRevenue');
    // After code blocks, content is processed normally
    expect(result).toContain('Key insights');
    expect(result).toContain('Growth data');
  });

  test('handles single character lines', () => {
    const input = `{
}
;`;

    const result = formatContentWithAI(input);
    
    expect(result).toContain('```javascript');
    expect(result).toContain('{');
    expect(result).toContain('}');
    expect(result).toContain(';');
  });

  test('ignores dots in title case detection', () => {
    const input = `Title With Dot.
Regular sentence with a period.`;

    const result = formatContentWithAI(input);
    
    // Should not format as header due to dot
    expect(result).not.toContain('## Title With Dot.');
    expect(result).toContain('Title With Dot.');
  });

  test('handles case insensitive important word matching', () => {
    const input = `revenue increased and GROWTH was strong.
key findings show important trends.`;

    const result = formatContentWithAI(input);
    
    // The function preserves original case and replaces with that case
    expect(result).toContain('**Revenue**'); // Capitalizes first letter
    expect(result).toContain('**Growth**');  // Capitalizes first letter  
    expect(result).toContain('**Key**');     // Capitalizes first letter
    expect(result).toContain('**Important**'); // Capitalizes first letter
  });

  test('covers title case header detection (line 56)', async () => {
    const titleCaseText = `
Introduction To The Topic

This is regular content here.

Key Benefits Overview

More content follows here.

Summary And Conclusions

Final thoughts.
`;
    
    const result = await formatContentWithAI(titleCaseText);
    
    // Should convert title case lines to ## headers (line 56)
    expect(result).toContain('## Introduction To The Topic');
    expect(result).toContain('## Key Benefits Overview');  
    expect(result).toContain('## Summary And Conclusions');
  });

  // Zero-cost edge case tests for robustness
  test('handles empty input gracefully', () => {
    const result = formatContentWithAI('');
    expect(result).toBe('');
  });

  test('handles whitespace-only input', () => {
    const result = formatContentWithAI('   \n\t   \n   ');
    expect(result).toBeDefined();
  });

  test('handles very long single line without breaking', () => {
    const longLine = 'A'.repeat(500);
    const result = formatContentWithAI(longLine);
    expect(result).toContain('A');
    expect(result.length).toBeGreaterThan(400);
  });

  test('handles mixed line endings consistently', () => {
    const input = 'Line 1\r\nLine 2\nLine 3\r\n';
    const result = formatContentWithAI(input);
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
    expect(result).toContain('Line 3');
  });
});