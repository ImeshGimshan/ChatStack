const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set in environment variables!');
  process.exit(1);
}

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authorization header is required' 
      });
    }

 
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Extract user ID from token
    // Auth service stores user ID in 'sub' field
    const userId = decoded.sub || decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token: missing user ID' 
      });
    }

    // Attach user info to request object
    req.userId = String(userId);
    req.user = decoded;

    next();

  } catch (error) {
    console.error('JWT verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token has expired' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Error verifying token' 
    });
  }
};

module.exports = authenticateToken;