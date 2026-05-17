const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, err: 'Access Denied: No Token Provided!' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, err: 'Access Denied: Malformed Token!' });

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const verified = jwt.verify(token, secret);
    req.user = verified; // Attach decoded { userId: '...' } to req.user
    next();
  } catch (err) {
    res.status(401).json({ success: false, err: 'Invalid Token!' });
  }
};
