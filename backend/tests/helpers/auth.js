const jwt = require('jsonwebtoken');

/**
 * Generate a valid JWT token for a test user
 * @param {string} userId - User ID to include in the token
 * @param {string} role - User role (default: 'user')
 * @returns {string} JWT Token
 */
function generateTestToken(userId = '11111111-1111-1111-1111-111111111111', role = 'user') {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate authorization headers with a valid JWT token
 * @param {string} userId - User ID to include in the token
 * @param {string} role - User role (default: 'user')
 * @returns {Object} Headers object
 */
function getAuthHeader(userId, role) {
  const token = generateTestToken(userId, role);
  return {
    Authorization: `Bearer ${token}`
  };
}

module.exports = {
  generateTestToken,
  getAuthHeader
};

