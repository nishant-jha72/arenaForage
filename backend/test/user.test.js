// tests/user.test.js
const request = require('supertest');
const app = require('../server');

describe('User Auth', () => {

    it('should login', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({ gmail: 'nishant.jha.aiml.2022@mitmeerut.ac.in', password: '12345678' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty('user');
    });
});