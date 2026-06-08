import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock firebase auth
vi.mock('../utils/firebase', () => ({
  auth: { currentUser: null }
}));

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('eventsAPI.getAll fetches events', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: '1', title: 'Test' }], pagination: { total: 1 } })
    });
    const { eventsAPI } = await import('../utils/api');
    const result = await eventsAPI.getAll();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test');
  });

  it('eventsAPI.getById fetches single event', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', title: 'Test Event' })
    });
    const { eventsAPI } = await import('../utils/api');
    const result = await eventsAPI.getById('1');
    expect(result.id).toBe('1');
  });
});