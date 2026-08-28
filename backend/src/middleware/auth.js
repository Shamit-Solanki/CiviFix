import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ')
    ? h.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

export function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ')
    ? h.slice(7)
    : null;

  // No token = public/unauthenticated request
  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch {
    // Invalid token is treated as unauthenticated
  }

  next();
}

export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res.status(403).json({
          error: 'Insufficient permissions'
        });
}