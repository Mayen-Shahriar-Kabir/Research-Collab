import jwt from 'jsonwebtoken';

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
