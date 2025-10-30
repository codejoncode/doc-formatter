describe('Document Formatter E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the application correctly', () => {
    cy.contains('AI Document Formatter').should('be.visible')
    cy.contains('Format your documents with AI and export to PDF').should('be.visible')
    cy.get('[data-testid="document-formatter"]').should('be.visible')
  })

  it('shows supported file formats in empty state', () => {
    cy.contains('Supported file formats:').should('be.visible')
    cy.contains('Plain Text (.txt)').should('be.visible')
    cy.contains('HTML (.html, .htm)').should('be.visible')
    cy.contains('Markdown (.md, .markdown)').should('be.visible')
    cy.contains('Microsoft Word (.docx, .doc)*').should('be.visible')
    cy.contains('PDF (.pdf)*').should('be.visible')
    cy.contains('OpenDocument Text (.odt)*').should('be.visible')
    cy.contains('Rich Text Format (.rtf)').should('be.visible')
  })

  it('displays character count and updates dynamically', () => {
    const testText = 'Hello, this is a test document for character counting.'
    
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type(testText)
    
    cy.contains(`${testText.length} characters`).should('be.visible')
  })

  it('shows warning for very large documents', () => {
    // Create a large text string (over 200,000 characters)
    const largeText = 'x'.repeat(200001)
    
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .invoke('val', largeText)
      .trigger('input')
    
    cy.contains('⚠️ Very large document').should('be.visible')
    cy.contains('200,001 characters').should('be.visible')
  })

  it('enables format button only when text is present', () => {
    cy.get('button').contains('Format with AI').should('be.disabled')
    
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type('Some text')
    
    cy.get('button').contains('Format with AI').should('not.be.disabled')
  })

  it('performs complete text formatting workflow', () => {
    const testDocument = `
      Business Quarterly Report
      
      Executive Summary
      This quarter has shown remarkable growth across all business segments.
      
      Key Achievements:
      - Revenue increased by 25%
      - Customer base expanded by 150 new clients
      - Market share grew significantly
      
      Financial Highlights
      Total revenue reached $2.5 million this quarter.
      
      Important Note: These results exceed our initial projections.
      
      Conclusion
      We are well-positioned for continued success in the coming quarters.
    `
    
    // Input text
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .clear()
      .type(testDocument)
    
    // Start formatting
    cy.get('button').contains('Format with AI').click()
    
    // Check loading state
    cy.get('button').contains('Formatting with AI...').should('be.visible')
    cy.get('button').contains('Formatting with AI...').should('be.disabled')
    
    // Wait for formatting to complete
    cy.get('button').contains('Format with AI', { timeout: 10000 }).should('be.visible')
    cy.get('button').contains('Format with AI').should('not.be.disabled')
    
    // Verify formatted content appears
    cy.get('.preview-content').should('be.visible')
    cy.get('.preview-content').should('contain.text', 'Document')
    
    // Verify PDF generator appears
    cy.get('button').contains('Download PDF').should('be.visible')
    cy.get('button').contains('Download PDF').should('not.be.disabled')
  })

  it('clears all content when clear button is clicked', () => {
    const testText = 'This text should be cleared'
    
    // Add some text
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type(testText)
    
    cy.contains(`${testText.length} characters`).should('be.visible')
    
    // Clear the content
    cy.get('button').contains('Clear All').click()
    
    // Verify everything is cleared
    cy.get('textarea[placeholder*="Paste your document text here"]').should('have.value', '')
    cy.contains('0 characters').should('be.visible')
    cy.get('button').contains('Format with AI').should('be.disabled')
  })

  it('handles drag and drop file upload', () => {
    // Create a test file
    const fileName = 'test-document.txt'
    const fileContent = 'This is test content from a uploaded file.'
    
    // Intercept the file creation
    cy.window().then((win) => {
      const file = new win.File([fileContent], fileName, { type: 'text/plain' })
      
      // Get upload area and trigger drag events
      cy.get('.file-upload-area').as('uploadArea')
      
      cy.get('@uploadArea').trigger('dragover')
      cy.get('@uploadArea').should('have.class', 'drag-over')
      
      cy.get('@uploadArea').trigger('drop', {
        dataTransfer: {
          files: [file],
        },
      })
    })
    
    // Verify file upload success
    cy.contains(`Uploaded: ${fileName}`).should('be.visible')
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .should('have.value', fileContent)
  })

  it('validates file size limits', () => {
    cy.window().then((win) => {
      // Create a file that's too large (over 20MB)
      const largeContent = 'x'.repeat(21 * 1024 * 1024) // 21MB
      const file = new win.File([largeContent], 'large-file.txt', { type: 'text/plain' })
      
      cy.get('input[type="file"]').then(input => {
        const dataTransfer = new win.DataTransfer()
        dataTransfer.items.add(file)
        input[0].files = dataTransfer.files
        
        cy.wrap(input).trigger('change', { force: true })
      })
    })
    
    cy.contains('Error:').should('be.visible')
    cy.contains('exceeds maximum allowed size').should('be.visible')
  })

  it('validates supported file types', () => {
    cy.window().then((win) => {
      // Create an unsupported file type
      const file = new win.File(['test content'], 'test.xyz', { type: 'application/xyz' })
      
      cy.get('input[type="file"]').then(input => {
        const dataTransfer = new win.DataTransfer()
        dataTransfer.items.add(file)
        input[0].files = dataTransfer.files
        
        cy.wrap(input).trigger('change', { force: true })
      })
    })
    
    cy.contains('Error:').should('be.visible')
    cy.contains('not supported').should('be.visible')
  })

  it('removes uploaded file when remove button is clicked', () => {
    const fileName = 'removable-test.txt'
    const fileContent = 'This file will be removed.'
    
    cy.window().then((win) => {
      const file = new win.File([fileContent], fileName, { type: 'text/plain' })
      
      cy.get('input[type="file"]').then(input => {
        const dataTransfer = new win.DataTransfer()
        dataTransfer.items.add(file)
        input[0].files = dataTransfer.files
        
        cy.wrap(input).trigger('change', { force: true })
      })
    })
    
    // Verify file is uploaded
    cy.contains(`Uploaded: ${fileName}`).should('be.visible')
    
    // Remove the file
    cy.get('button[title="Remove file"]').click()
    
    // Verify file is removed
    cy.contains(`Uploaded: ${fileName}`).should('not.exist')
    cy.get('textarea[placeholder*="Paste your document text here"]').should('have.value', '')
    cy.contains('Upload Document').should('be.visible')
  })

  it('handles file upload and formatting integration', () => {
    const fileName = 'integration-test.txt'
    const fileContent = `
      Integration Test Document
      
      This document tests the complete integration between file upload and AI formatting.
      
      Features to test:
      - File upload functionality
      - Content extraction
      - AI formatting process
      - PDF generation capability
      
      Expected Results:
      The system should successfully process this document and format it properly.
    `
    
    cy.window().then((win) => {
      const file = new win.File([fileContent], fileName, { type: 'text/plain' })
      
      cy.get('input[type="file"]').then(input => {
        const dataTransfer = new win.DataTransfer()
        dataTransfer.items.add(file)
        input[0].files = dataTransfer.files
        
        cy.wrap(input).trigger('change', { force: true })
      })
    })
    
    // Verify file upload
    cy.contains(`Uploaded: ${fileName}`).should('be.visible')
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .should('contain.value', 'Integration Test Document')
    
    // Format the uploaded content
    cy.get('button').contains('Format with AI').click()
    
    // Wait for formatting to complete
    cy.get('button').contains('Format with AI', { timeout: 10000 }).should('be.visible')
    
    // Verify formatted content
    cy.get('.preview-content').should('be.visible')
    cy.get('button').contains('Download PDF').should('be.visible')
  })

  it('is responsive on mobile viewport', () => {
    cy.viewport('iphone-x')
    
    cy.contains('AI Document Formatter').should('be.visible')
    cy.get('.file-upload-area').should('be.visible')
    cy.get('textarea[placeholder*="Paste your document text here"]').should('be.visible')
    
    // Test that buttons are stacked vertically on mobile
    cy.get('.button-group').should('be.visible')
    
    // Test text input on mobile
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type('Mobile test content')
    
    cy.contains('18 characters').should('be.visible')
    cy.get('button').contains('Format with AI').should('not.be.disabled')
  })

  it('maintains state during browser refresh', () => {
    const testText = 'This text should persist after refresh'
    
    // Add text
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type(testText)
    
    // Note: Without persistence implementation, this test documents current behavior
    cy.reload()
    
    // After reload, text is not persisted (expected current behavior)
    cy.get('textarea[placeholder*="Paste your document text here"]').should('have.value', '')
  })

  it('handles keyboard navigation', () => {
    cy.get('textarea[placeholder*="Paste your document text here"]').focus()
    
    // Test tab navigation
    cy.focused().tab()
    cy.focused().should('contain', 'Format with AI')
    
    cy.focused().tab()
    cy.focused().should('contain', 'Clear All')
    
    // Test enter key in textarea
    cy.get('textarea[placeholder*="Paste your document text here"]')
      .type('Line 1{enter}Line 2')
      .should('contain.value', 'Line 1\nLine 2')
  })
})