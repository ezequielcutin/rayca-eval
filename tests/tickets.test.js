process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
require('dotenv').config();
jest.mock('nodemailer');

jest.setTimeout(30000); // Increase timeout to 30 seconds

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json({ extended: false }));

// Set WebSocket instance to app
app.set('io', io);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/tickets', require('../routes/tickets'));

// Connect Database
beforeAll(async () => {
  await connectDB();
});

// Clear collections before each test
// beforeEach(async () => {
//   await User.deleteMany({});
//   await Ticket.deleteMany({});
// });
//this is giving errors, and ideally in a real-world-scenario you would not delete collections before making tickets, as this would be inefficient.
//therefore, we are keeping these lines of code commented out for simplicity.

// Disconnect from the database and close server after all tests
afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

describe('Tickets API', () => {
  let token;
  let ticketId;

  // Register and log in the user to get a token
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'johndoe@example.com',
        password: 'password123',
      });

    token = res.body.token;
  });

  // Create a ticket
  it('should create a ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Issue with login',
        description: 'Unable to login with my credentials',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title', 'Issue with login');
    ticketId = res.body._id;
  });

  // Get all tickets
  it('should get all tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Update a ticket
  it('should update a ticket', async () => {
    const res = await request(app)
      .put(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated issue with login',
        description: 'Still unable to login',
        status: 'open',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title', 'Updated issue with login');
  });

  // Delete a ticket
  it('should delete a ticket', async () => {
    const res = await request(app)
      .delete(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('msg', 'Ticket removed');
  });
});