describe('Trading Functionality', () => {
    beforeEach(() => {
      // Login before each test
      cy.loginByApi();
      cy.visit('/trading');
    });
  
    afterEach(() => {
      cy.cleanup();
    });
  
    it('should display trading form', () => {
      cy.contains('Exchange Cryptocurrencies').should('be.visible');
      cy.contains('From Currency').should('be.visible');
      cy.contains('To Currency').should('be.visible');
      cy.get('button').contains('Exchange').should('be.visible');
    });
  
    it('should display available currencies and wallets', () => {
      // From Currency should have options
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').should('have.length.at.least', 1);
      
      // To Currency should have options
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').should('have.length.at.least', 1);
    });
  
    it('should show exchange rate when currencies are selected', () => {
      // Select From Currency
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').contains('BTC').click();
      
      // Select To Currency
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').contains('ETH').click();
      
      // Exchange rate should be displayed
      cy.contains('Exchange Rate:').parent().contains('BTC').should('be.visible');
      cy.contains('Exchange Rate:').parent().contains('ETH').should('be.visible');
    });
  
    it('should calculate estimated amount when entering trade amount', () => {
      // Select From Currency
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').contains('BTC').click();
      
      // Select To Currency
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').contains('ETH').click();
      
      // Enter amount
      cy.get('input[name="amount"]').type('0.1');
      
      // Should show fee and estimated received amount
      cy.contains('Fee (0.1%):').should('be.visible');
      cy.contains('You will receive approximately:').should('be.visible');
    });
  
    it('should disable exchange button when amount exceeds balance', () => {
      // Select From Currency
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').contains('BTC').click();
      
      // Select To Currency
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').contains('ETH').click();
      
      // Enter amount exceeding balance (assuming balance is less than 1000 BTC)
      cy.get('input[name="amount"]').type('1000');
      
      // Exchange button should be disabled
      cy.get('button').contains('Exchange').should('be.disabled');
    });
  
    it('should swap currencies when clicking swap button', () => {
      // Select From Currency
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').contains('BTC').click();
      
      // Select To Currency
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').contains('ETH').click();
      
      // Get the initial currencies
      cy.get('label').contains('From Currency').parent().invoke('text').as('fromCurrency');
      cy.get('label').contains('To Currency').parent().invoke('text').as('toCurrency');
      
      // Click swap button
      cy.get('button').contains('Swap').click();
      
      // Currencies should be swapped
      cy.get('@fromCurrency').then((initialFromCurrency) => {
        cy.get('@toCurrency').then((initialToCurrency) => {
          cy.get('label').contains('To Currency').parent().should('include.text', initialFromCurrency.trim());
          cy.get('label').contains('From Currency').parent().should('include.text', initialToCurrency.trim());
        });
      });
    });
  
    it('should complete an exchange transaction', () => {
      // Select From Currency
      cy.get('label').contains('From Currency').parent().click();
      cy.get('li[role="option"]').contains('BTC').click();
      
      // Select To Currency
      cy.get('label').contains('To Currency').parent().click();
      cy.get('li[role="option"]').contains('ETH').click();
      
      // Enter amount
      cy.get('input[name="amount"]').type('0.01');
      
      // Submit exchange
      cy.get('button').contains('Exchange').click();
      
      // Should display success message
      cy.contains('Exchange completed successfully').should('be.visible');
    });
  });

