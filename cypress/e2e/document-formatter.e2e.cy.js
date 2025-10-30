describe('Document Formatter E2E Tests', () => {
  beforeEach(() => {
    // Navigate to the app
    cy.visit('http://localhost:3000');
  });

  describe('Basic App Functionality', () => {
    it('should display the main app interface', () => {
      cy.contains('AI Document Formatter').should('be.visible');
      cy.contains('Format your documents with AI and export to PDF').should('be.visible');
    });

    it('should have text input area', () => {
      cy.get('textarea').should('be.visible');
      cy.get('textarea').should('have.attr', 'placeholder').and('contain', 'Paste your document text here');
    });

    it('should have format and clear buttons', () => {
      cy.contains('Format with AI').should('be.visible');
      cy.contains('Clear All').should('be.visible');
    });
  });

  describe('File Upload Functionality', () => {
    it('should display file upload area', () => {
      cy.get('.file-upload-area').should('be.visible');
      cy.contains('Upload Document').should('be.visible');
      cy.contains('Drag and drop your file here').should('be.visible');
    });

    it('should show supported file formats', () => {
      cy.contains('TXT, HTML, MD, DOCX, DOC, PDF, ODT, RTF').should('be.visible');
      cy.contains('Maximum size').should('be.visible');
    });

    it('should handle file input click', () => {
      cy.get('.file-upload-area').click();
      // File input should be triggered (we can't actually test file selection in headless mode)
    });
  });

  describe('Text Formatting', () => {
    it('should format text input', () => {
      const testText = 'This is a test document.\n\nIt has multiple paragraphs.\n\nAnd should be formatted properly.';
      
      cy.get('textarea').type(testText);
      cy.contains('Format with AI').click();
      
      // Should show loading state
      cy.contains('Formatting...').should('be.visible');
      
      // Wait for formatting to complete (with timeout)
      cy.get('.preview-content', { timeout: 10000 }).should('be.visible');
    });

    it('should clear all content', () => {
      const testText = 'Test content to be cleared';
      
      cy.get('textarea').type(testText);
      cy.contains('Clear All').click();
      
      cy.get('textarea').should('have.value', '');
      cy.get('.preview-content').should('not.exist');
    });
  });

  describe('PDF Export', () => {
    it('should show PDF download button when content is formatted', () => {
      const testText = 'Content for PDF export test';
      
      cy.get('textarea').type(testText);
      cy.contains('Format with AI').click();
      
      // Wait for formatting to complete
      cy.get('.preview-content', { timeout: 10000 }).should('be.visible');
      
      // PDF button should be visible
      cy.contains('Download PDF').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.contains('AI Document Formatter').should('be.visible');
      cy.get('textarea').should('be.visible');
      cy.get('.file-upload-area').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport(768, 1024); // iPad
      
      cy.contains('AI Document Formatter').should('be.visible');
      cy.get('textarea').should('be.visible');
      cy.get('.file-upload-area').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080); // Desktop
      
      cy.contains('AI Document Formatter').should('be.visible');
      cy.get('textarea').should('be.visible');
      cy.get('.file-upload-area').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty content formatting', () => {
      cy.contains('Format with AI').click();
      
      // Should show error message
      cy.contains('Please enter some text to format').should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Intercept API calls and simulate network error
      cy.intercept('POST', '**/api/format', { forceNetworkError: true }).as('formatError');
      
      const testText = 'Test content for error handling';
      cy.get('textarea').type(testText);
      cy.contains('Format with AI').click();
      
      cy.wait('@formatError');
      
      // Should show error message
      cy.contains('Failed to format document').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab through the interface
      cy.get('body').tab();
      cy.focused().should('have.attr', 'type', 'file'); // File input
      
      cy.focused().tab();
      cy.focused().should('contain', 'textarea'); // Text area
      
      cy.focused().tab();
      cy.focused().should('contain', 'Format with AI'); // Format button
    });

    it('should have proper ARIA labels', () => {
      cy.get('.file-upload-area').should('have.attr', 'aria-label');
      cy.get('textarea').should('have.attr', 'aria-label');
      cy.get('button').should('have.attr', 'aria-label');
    });
  });

  describe('Performance', () => {
    it('should handle large text input efficiently', () => {
      // Create large text content
      const largeText = 'Lorem ipsum '.repeat(10000);
      
      cy.get('textarea').type(largeText, { delay: 0 });
      
      // Should show character count warning
      cy.contains('Large content detected').should('be.visible');
    });

    it('should load within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('http://localhost:3000').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work consistently across browsers', () => {
      // This test would be run across different browsers in CI
      cy.contains('AI Document Formatter').should('be.visible');
      cy.get('textarea').should('be.visible');
      cy.get('.file-upload-area').should('be.visible');
      
      // Test basic functionality
      cy.get('textarea').type('Cross-browser test content');
      cy.contains('Format with AI').click();
    });
  });
});