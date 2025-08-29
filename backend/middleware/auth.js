import jwt from 'jsonwebtoken';
import User from '../models/model.js';

// Optional auth: if Authorization header present, set req.user; otherwise continue
export default function optionalAuth(req, res, next) {
  try {
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return next();
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    // decoded expected shape: { id, role, iat, exp }
    req.user = { id: decoded.id, role: decoded.role };
  } catch (e) {
    // Ignore invalid token to keep optional behavior
  }
  next();
}

// Middleware to check if user is frozen
export const checkFrozenStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.frozen) {
      return res.status(403).json({ 
        message: 'Your account has been frozen. Please contact an administrator.',
        frozen: true 
      });
    }

    next();
  } catch (error) {
    console.error('Error checking frozen status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
