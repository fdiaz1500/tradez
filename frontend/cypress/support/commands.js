
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email = 'test@example.com', password = 'Test123') => {
    cy.session([email, password], () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      
      // Wait for redirect to dashboard after successful login
      cy.url().should('include', '/dashboard');
    });
  });
  
  // Login via API for faster tests
  Cypress.Commands.add('loginByApi', (email = 'test@example.com', password = 'Test123') => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: {
        email,
        password
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      
      // Store token in localStorage
      window.localStorage.setItem('token', response.body.token);
    });
  });
  
  // Register a new user
  Cypress.Commands.add('register', (userData) => {
    const defaultData = {
      email: `user${Date.now()}@example.com`,
      password: 'Test123',
      firstName: 'Cypress',
      lastName: 'Test'
    };
    
    const data = { ...defaultData, ...userData };
    
    cy.visit('/register');
    cy.get('input[name="email"]').type(data.email);
    cy.get('input[name="password"]').type(data.password);
    cy.get('input[name="firstName"]').type(data.firstName);
    cy.get('input[name="lastName"]').type(data.lastName);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard');
  });
  
  // Clean up any created data
  Cypress.Commands.add('cleanup', () => {
    // This would typically call an API endpoint to clean up test data
    // Since we're using a containerized application, we can rely on container restarts
    // to clean up data, but in a real application, you might want to:
    // - Delete users created during tests
    // - Reset wallets and transactions
    
    // For now, just log out if logged in
    cy.window().then((window) => {
      if (window.localStorage.getItem('token')) {
        window.localStorage.removeItem('token');
      }
    });
  });

