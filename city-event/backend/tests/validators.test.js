import { describe, it, expect, vi } from 'vitest';
import { validateEventCreation } from '../validators.js';

describe('validateEventCreation', () => {
  const validBody = {
    title: 'Test Event',
    description: 'A great event',
    location: 'Central Park',
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    capacity: '100',
    category: 'Music',
  };

  it('passes for valid event data', () => {
    const req = { body: validBody };
    const res = { status: () => res, json: () => {} };
    const next = () => {};
    validateEventCreation(req, res, next);
    expect(req.body).toBeDefined();
  });

  it('rejects missing title', () => {
    const req = { body: { ...validBody, title: '' } };
    const status = vi.fn(() => res);
    const json = vi.fn();
    const res = { status, json };
    const next = () => {};
    validateEventCreation(req, res, next);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('rejects past dateTime', () => {
    const req = { body: { ...validBody, dateTime: new Date('2020-01-01').toISOString() } };
    const status = vi.fn(() => res);
    const json = vi.fn();
    const res = { status, json };
    const next = () => {};
    validateEventCreation(req, res, next);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('rejects capacity less than 1', () => {
    const req = { body: { ...validBody, capacity: '0' } };
    const status = vi.fn(() => res);
    const json = vi.fn();
    const res = { status, json };
    const next = () => {};
    validateEventCreation(req, res, next);
    expect(status).toHaveBeenCalledWith(400);
  });
});