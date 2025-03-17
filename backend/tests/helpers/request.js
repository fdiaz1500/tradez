const supertest = require('supertest');
const app = require('../../src/index'); // Your main Express app
const authHelper = require('./auth');

/**
 * Makes an authenticated request to the API
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {string} userId - User ID for authentication
 * @param {string} role - User role
 * @returns {Promise} - Supertest response
 */
async function authenticatedRequest(method, endpoint, data = null, userId = '11111111-1111-1111-1111-111111111111', role = 'user') {
  const headers = authHelper.getAuthHeader(userId, role);
  
  let request = supertest(app)[method](endpoint)
    .set(headers);
  
  if (data && (method === 'post' || method === 'put')) {
    request = request.send(data);
  }
  
  return request;
}

/**
 * Makes a public request to the API (no authentication)
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} - Supertest response
 */
async function publicRequest(method, endpoint, data = null) {
  let request = supertest(app)[method](endpoint);
  
  if (data && (method === 'post' || method === 'put')) {
    request = request.send(data);
  }
  
  return request;
}

module.exports = {
  authenticatedRequest,
  publicRequest
};

