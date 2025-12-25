/**
 * End-to-end tests for HR Document Management
 */

describe('HR Document Management', () => {
  beforeEach(() => {
    // Login as employee
    cy.visit('/login');
    cy.get('[name="username"]').type('employee1');
    cy.get('[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should display onboarding dashboard', () => {
    cy.visit('/hr/documents');
    cy.contains('Onboarding Documents').should('be.visible');
  });

  it('should show assigned documents', () => {
    cy.visit('/hr/documents');
    cy.get('table').should('be.visible');
  });

  it('should allow downloading documents', () => {
    cy.visit('/hr/documents');
    cy.contains('Download').first().click();
  });

  it('should initiate document signing', () => {
    cy.visit('/hr/documents');
    cy.contains('Sign').first().click();
    // Should redirect to DocuSign
  });
});

describe('HR Document Admin Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('[name="username"]').type('admin');
    cy.get('[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
  });

  it('should allow uploading documents', () => {
    cy.visit('/hr/manage');
    cy.contains('Upload Document').click();
    cy.get('[name="title"]').type('Test Document');
    // Upload file and submit
  });

  it('should allow assigning documents to employees', () => {
    cy.visit('/hr/manage');
    // Select document and assign
  });
});











