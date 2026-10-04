import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError, parseApiError } from '../lib/api-errors';

describe('parseApiError', () => {
  it('returns ApiError instance untouched', () => {
    const err = new ApiError('Direct error', 'ERR_CODE', 400);
    const parsed = parseApiError(err);
    expect(parsed).toBe(err);
    expect(parsed.message).toBe('Direct error');
    expect(parsed.code).toBe('ERR_CODE');
    expect(parsed.statusCode).toBe(400);
  });

  it('parses structured backend ApiResponse error envelope', () => {
    const mockAxiosError = new AxiosError(
      'Request failed with status code 403',
      'ERR_BAD_REQUEST',
      {} as InternalAxiosRequestConfig,
      {},
      {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        data: {
          success: false,
          error: {
            code: 'FORBIDDEN_INSUFFICIENT_ROLE',
            message: 'You lack permissions to settle reimbursements',
            details: [{ field: 'role', message: 'Required TREASURER or ADMIN' }],
          },
        },
      } as AxiosResponse,
    );

    const parsed = parseApiError(mockAxiosError);
    expect(parsed.statusCode).toBe(403);
    expect(parsed.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    expect(parsed.message).toBe('You lack permissions to settle reimbursements');
    expect(parsed.details?.[0].field).toBe('role');
  });

  it('handles network disconnection without response', () => {
    const mockAxiosError = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      {} as InternalAxiosRequestConfig,
      {},
    );

    const parsed = parseApiError(mockAxiosError);
    expect(parsed.code).toBe('NETWORK_ERROR');
    expect(parsed.message).toContain('Network error');
  });

  it('handles timeout errors', () => {
    const mockAxiosError = new AxiosError(
      'timeout of 10000ms exceeded',
      'ECONNABORTED',
    );

    const parsed = parseApiError(mockAxiosError);
    expect(parsed.code).toBe('TIMEOUT');
    expect(parsed.message).toContain('timed out');
  });

  it('parses standard JS errors', () => {
    const jsError = new Error('Local client crash');
    const parsed = parseApiError(jsError);
    expect(parsed.code).toBe('CLIENT_ERROR');
    expect(parsed.message).toBe('Local client crash');
  });

  it('parses unknown non-error types gracefully', () => {
    const parsed = parseApiError('something mysterious');
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(parsed.message).toBe('An unexpected error occurred');
  });
});
