import { describe, it, expect } from 'vitest';
import AppError from '../../src/utils/appError.js';

describe('AppError Unit Tests', () => {
  it('should instantiate an AppError with default operational status', () => {
    const error = new AppError('Something went wrong', 400, 'TEST_ERROR', { field: 'name' });
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('TEST_ERROR');
    expect(error.details).toEqual({ field: 'name' });
    expect(error.isOperational).toBe(true);
  });

  it('should create notFound AppError via static factory', () => {
    const error = AppError.notFound('User not found');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });

  it('should create unauthorized AppError via static factory', () => {
    const error = AppError.unauthorized('Token expired');
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe('UNAUTHORIZED');
  });

  it('should create conflict AppError via static factory', () => {
    const error = AppError.conflict('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe('CONFLICT');
  });
});
