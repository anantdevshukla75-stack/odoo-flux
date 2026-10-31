import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import * as dbModule from '../../src/config/database.js';
import * as redisModule from '../../src/config/redis.js';

describe('Health and Middleware Integration Tests', () => {
  it('should return 200 and healthy status when DB and Redis are connected', async () => {
    vi.spyOn(dbModule, 'checkDatabaseConnection').mockResolvedValue({ ok: true, latencyMs: 5 });
    vi.spyOn(redisModule, 'checkRedisConnection').mockResolvedValue({ ok: true, latencyMs: 2 });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.services.database.status).toBe('connected');
    expect(response.body.data.services.redis.status).toBe('connected');
    expect(response.body.data.timestamp).toBeDefined();

    vi.restoreAllMocks();
  });

  it('should return 503 and degraded status when database is disconnected', async () => {
    vi.spyOn(dbModule, 'checkDatabaseConnection').mockResolvedValue({ ok: false, error: 'DB Connection Timeout' });
    vi.spyOn(redisModule, 'checkRedisConnection').mockResolvedValue({ ok: true, latencyMs: 2 });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('degraded');
    expect(response.body.data.services.database.status).toBe('disconnected');

    vi.restoreAllMocks();
  });

  it('should return 404 for unknown endpoints with consistent error payload', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('NOT_FOUND');
    expect(response.body.message).toContain('Route not found');
  });

  it('should return root welcome response on GET /', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('online');
    expect(response.body.name).toBe('Brightloop Software Subscription Management API');
  });
});
