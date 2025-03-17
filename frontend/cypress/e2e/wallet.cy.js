describe('Wallet Functionality', () => {
    beforeEach(() => {
      // Login before each test
      cy.loginByApi();
      cy.visit('/wallets');
    });
  
    afterEach(() => {
      cy.cleanup();
    });
  
    it('should display wallet page with existing wallets', () => {
      cy.contains('Your Wallets').should('be.visible');
      
      // Should display wallet cards
      cy.get('[data-testid="wallet-card"]').should('have.length.at.least', 1);
    });
  
    it('should show wallet details', () => {
      // Look for BTC wallet
      cy.contains('BTC').closest('[data-testid="wallet-card"]').as('btcWallet');
      
      // Should display currency name
      cy.get('@btcWallet').contains('Bitcoin').should('be.visible');
      
      // Should display balance
      cy.get('@btcWallet').contains('Balance:').should('be.visible');
      
      // Should have view transactions button
      cy.get('@btcWallet').contains('View Transactions').should('be.visible');
    });
  
    it('should open add new wallet modal', () => {
      // Click add wallet button
      cy.contains('Add Wallet').click();
      
      // Modal should appear
      cy.contains('Create New Wallet').should('be.visible');
      
      // Should have currency dropdown
      cy.contains('Currency').should('be.visible');
      
      // Should have create button
      cy.contains('button', 'Create').should('be.visible');
    });
  
    it('should create a new wallet', () => {
      // Keep track of initial wallet count
      cy.get('[data-testid="wallet-card"]').its('length').as('initialWalletCount');
      
      // Click add wallet button
      cy.contains('Add Wallet').click();
      
      // Select currency (find one that doesn't exist yet)
      cy.get('label').contains('Currency').parent().click();
      cy.get('li[role="option"]').first().click();
      
      // Create wallet
      cy.contains('button', 'Create').click();
      
      // Should show success message
      cy.contains('Wallet created successfully').should('be.visible');
      
      // Should have one more wallet than before
      cy.get('@initialWalletCount').then((initialCount) => {
        cy.get('[data-testid="wallet-card"]').should('have.length', initialCount + 1);
      });
    });
  
    it('should navigate to transaction history when clicking view transactions', () => {
      // Look for BTC wallet
      cy.contains('BTC').closest('[data-testid="wallet-card"]').as('btcWallet');
      
      // Click view transactions
      cy.get('@btcWallet').contains('View Transactions').click();
      
      // Should navigate to transactions page with filter for BTC
      cy.url().should('include', '/transactions');
      cy.url().should('include', 'currency=BTC');
      
      // Should show transaction list filtered to BTC
      cy.contains('Transaction History').should('be.visible');
      cy.contains('Filtered by: BTC').should('be.visible');
    });
  });


