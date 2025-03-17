const dbHelper = require('../../helpers/db');
const { publicRequest, authenticatedRequest } = require('../../helpers/request');

describe('Auth Routes', () => {
  beforeAll(async () => {
    await dbHelper.initTestDB();
  });

  afterAll(async () => {
    await dbHelper.cleanTestDB();
    await dbHelper.closePool();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await publicRequest('post', '/api/auth/login', {
        email: 'test@example.com',
        password: 'Test123'
      });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });
    
    test('should return 401 with invalid credentials', async () => {
      const response = await publicRequest('post', '/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
    
    test('should return validation error with missing credentials', async () => {
      const response = await publicRequest('post', '/api/auth/login', {
        email: 'test@example.com'
        // Missing password
      });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await publicRequest('post', '/api/auth/register', {
        email: 'newuser@example.com',
        password: 'NewUser123',
        firstName: 'New',
        lastName: 'User'
      });
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.firstName).toBe('New');
      expect(response.body.user.lastName).toBe('User');
    });
    
    test('should return 409 if email already exists', async () => {
      const response = await publicRequest('post', '/api/auth/register', {
        email: 'test@example.com', // Existing email
        password: 'Test123',
        firstName: 'Duplicate',
        lastName: 'User'
      });
      
      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
    });
    
    test('should return validation error with invalid data', async () => {
      const response = await publicRequest('post', '/api/auth/register', {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: ''
      });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await authenticatedRequest('post', '/api/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
    
    test('should return 200 even without authentication', async () => {
      const response = await publicRequest('post', '/api/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});

