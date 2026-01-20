import { randomUUID } from 'crypto';

export const requestId = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};