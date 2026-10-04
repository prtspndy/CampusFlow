import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventsService } from '../services/events.service';
import { apiClient } from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('eventsService.listEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the count from pagination.total when the API nests it', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        message: 'Events retrieved successfully',
        data: {
          events: [{ id: 'evt-1', title: 'Skyline Annual Spring Gala 2026' }],
          pagination: { total: 3, page: 1, limit: 12, totalPages: 1 },
        },
      },
    });

    const result = await eventsService.listEvents({ page: 1, limit: 12, status: 'PUBLISHED' });

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
    expect(result.totalPages).toBe(1);
    expect(result.events).toHaveLength(1);
  });

  it('keeps a top-level total when the API already returns one', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        message: 'Events retrieved successfully',
        data: {
          events: [],
          total: 0,
          page: 2,
          limit: 12,
          totalPages: 1,
        },
      },
    });

    const result = await eventsService.listEvents({ page: 2, limit: 12 });

    expect(result.total).toBe(0);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(12);
  });
});
