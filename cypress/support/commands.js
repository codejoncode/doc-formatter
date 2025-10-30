// cypress/support/commands.js

// Custom command for file upload
Cypress.Commands.add('uploadFile', (fileName, fileType = 'text/plain', selector = 'input[type=file]') => {
  cy.get(selector).then(subject => {
    cy.fixture(fileName).then(content => {
      const el = subject[0]
      const blob = new Blob([content], { type: fileType })
      const file = new File([blob], fileName, { type: fileType })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      el.files = dataTransfer.files
      
      // Trigger change event
      cy.wrap(subject).trigger('change', { force: true })
    })
  })
})

// Custom command for drag and drop file upload
Cypress.Commands.add('dragAndDropFile', (fileName, fileType = 'text/plain', targetSelector) => {
  cy.fixture(fileName).then(content => {
    const blob = new Blob([content], { type: fileType })
    const file = new File([blob], fileName, { type: fileType })
    
    cy.get(targetSelector).trigger('dragover')
    
    cy.get(targetSelector).trigger('drop', {
      dataTransfer: {
        files: [file],
      },
    })
  })
})

// Custom command to wait for AI formatting to complete
Cypress.Commands.add('waitForFormatting', () => {
  cy.get('[data-testid="format-button"]', { timeout: 10000 })
    .should('not.contain', 'Formatting')
    .should('contain', 'Format with AI')
})

// Custom command to check PDF download
Cypress.Commands.add('checkPDFDownload', () => {
  cy.window().then((win) => {
    cy.stub(win, 'open').as('windowOpen')
  })
  
  cy.get('[data-testid="pdf-button"]').click()
  cy.get('@windowOpen').should('have.been.called')
})