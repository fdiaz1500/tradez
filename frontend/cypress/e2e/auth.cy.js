describe('Authentication', () => {
    beforeEach(() => {
      cy.cleanup();
    });
  
    it('should display login page', () => {
      cy.visit('/login');
      cy.contains('Sign in').should('be.visible');
      cy.contains('Don\'t have an account? Sign up').should('be.visible');
    });
  
    it('should show validation errors on login form', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains('Email Address').parent().find('input').should('have.attr', 'aria-invalid', 'true');
      cy.contains('Password').parent().find('input').should('have.attr', 'aria-invalid', 'true');
    });
  
    it('should show error message with invalid credentials', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.contains('Invalid email or password').should('be.visible');
    });
  
    it('should navigate to registration page', () => {
      cy.visit('/login');
      cy.contains('Don\'t have an account? Sign up').click();
      cy.url().should('include', '/register');
    });
  
    it('should register a new user', () => {
      const email = `user${Date.now()}@example.com`;
      
      cy.visit('/register');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type('Test123');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      
      // Should display user info in the header
      cy.contains('Test User').should('be.visible');
    });
  
    it('should login successfully with valid credentials', () => {
      // Assuming test@example.com exists from seed data
      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard after successful login
      cy.url().should('include', '/dashboard');
    });
  
    it('should logout successfully', () => {
      // Login first
      cy.login();
      
      // Visit dashboard
      cy.visit('/dashboard');
      
      // Click on profile menu
      cy.contains('Test User').click();
      
      // Click logout
      cy.contains('Logout').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
      
      // Try to access dashboard (should redirect to login)
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

