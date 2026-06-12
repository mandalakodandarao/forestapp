import request from 'supertest';
import { app } from '../src/app.js';

jest.mock('../src/config/db.js', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    end: jest.fn()
  },
  query: jest.fn(),
  withTransaction: jest.fn()
}));

describe('request validation', () => {
  it('rejects invalid registration payloads', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'not-email',
      password: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
});

