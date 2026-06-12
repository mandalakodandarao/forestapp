import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';

jest.mock('../src/config/db.js', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    end: jest.fn()
  },
  query: jest.fn(),
  withTransaction: jest.fn()
}));

describe('health endpoint', () => {
  it('returns service health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'forestroots-api' });
    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });
});

