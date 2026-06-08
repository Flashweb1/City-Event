import { describe, it, expect } from 'vitest';
import RateLimiter from '../rateLimiter.js';

describe('RateLimiter', () => {
  it('allows requests within limit', () => {
    const limiter = new RateLimiter(5, 60000);
    const req = { ip: '127.0.0.1' };
    const res = {};
    const next = () => {};
    for (let i = 0; i < 5; i++) {
      expect(() => limiter.middleware()(req, res, next)).not.toThrow();
    }
  });

  it('tracks requests by IP', () => {
    const limiter = new RateLimiter(2, 60000);
    const req1 = { ip: '1.2.3.4' };
    const req2 = { ip: '5.6.7.8' };
    const res = {};
    const next = () => {};
    limiter.middleware()(req1, res, next);
    limiter.middleware()(req2, res, next);
    expect(limiter.requests.has('1.2.3.4')).toBe(true);
    expect(limiter.requests.has('5.6.7.8')).toBe(true);
  });
});