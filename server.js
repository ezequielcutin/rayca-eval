const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json')
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Set WebSocket instance to app
app.set('io', io);

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Rayca Eval API');
});

// Swagger setup
// const swaggerJsDoc = require('swagger-jsdoc');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Rayca Eval API',
      version: '1.0.0',
      description: 'API Documentation for Rayca Eval Project'
    },
    servers: [
      {
        url: `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
      }
    ],
  },
  apis: ['./routes/*.js'],
};

// const swaggerDocs = swaggerJsDoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New WebSocket connection');
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));