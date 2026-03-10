// tests/user.test.js
const request = require('supertest');
const app = require('../server');

describe('User Auth', () => {
    it('should register a user', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({ name: 'Test', gmail: 'test@gmail.com', password: '12345678' });
        expect(res.statusCode).toBe(201);
    });

    it('should login', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({ gmail: 'test@gmail.com', password: '12345678' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('user');
    });
});