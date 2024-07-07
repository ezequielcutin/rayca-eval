process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const connectDB = require('../config/db');
const User = require('../models/User');
const app = express();
require('dotenv').config();

jest.setTimeout(30000); // Increase timeout to 30 seconds


// Connect Database
beforeAll(async () => {
  await connectDB();
});

// Middleware
app.use(express.json({ extended: false }));

// Routes
app.use('/api/auth', require('../routes/auth'));

describe('Auth API', () => {
  let token;

  // Register a user
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
        role: 'user',
      });

    console.log('Register response:', res.body); // Debug line

    if (res.body.msg === 'User already exists, log in instead!') {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('msg', 'User already exists, log in instead!');
    } else {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token; // Store token for further use
    }
  });

  // Log in the user
  it('should log in a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'johndoe@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  // Get user data
  it('should get user data', async () => {
    const res = await request(app)
      .get('/api/auth/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'John Doe');
  });
});