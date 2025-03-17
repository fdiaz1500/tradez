const ApiError = require('../../../src/utils/ApiError');

describe('ApiError', () => {
  test('should create an error with default values', () => {
    const message = 'Test error';
    const error = new ApiError(message);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });
  
  test('should create an error with custom statusCode', () => {
    const message = 'Not found';
    const statusCode = 404;
    const error = new ApiError(message, statusCode);
    
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(true);
  });
  
  test('should create an error with custom isOperational flag', () => {
    const message = 'Unexpected error';
    const statusCode = 500;
    const isOperational = false;
    const error = new ApiError(message, statusCode, isOperational);
    
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(isOperational);
  });
  
  test('should create an error with custom stack', () => {
    const message = 'Custom stack error';
    const statusCode = 400;
    const isOperational = true;
    const stack = 'Custom stack trace';
    const error = new ApiError(message, statusCode, isOperational, stack);
    
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(isOperational);
    expect(error.stack).toBe(stack);
  });
});


