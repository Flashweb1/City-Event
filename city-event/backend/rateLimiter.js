export default class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      if (!this.requests.has(ip)) {
        this.requests.set(ip, []);
      }

      const timestamps = this.requests.get(ip);
      const windowStart = now - this.windowMs;
      const recentRequests = timestamps.filter(time => time > windowStart);
      
      if (recentRequests.length >= this.limit) {
        res.set('Retry-After', Math.ceil(this.windowMs / 1000));
        return res.status(429).json({ 
          success: false,
          error: 'Too Many Requests', 
          message: `Rate limit exceeded. Try again in ${Math.ceil(this.windowMs / 60000)} minutes.` 
        });
      }

      recentRequests.push(now);
      this.requests.set(ip, recentRequests);
      next();
    };
  }

  cleanup() {
    setInterval(() => {
      const windowStart = Date.now() - this.windowMs;
      for (const [ip, timestamps] of this.requests.entries()) {
        const recentRequests = timestamps.filter(time => time > windowStart);
        if (recentRequests.length === 0) this.requests.delete(ip);
        else this.requests.set(ip, recentRequests);
      }
    }, this.windowMs);
  }
}