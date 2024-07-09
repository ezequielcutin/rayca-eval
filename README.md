# Customer Support Ticket Management Microservice

This project is a microservice for managing customer support tickets. It allows users to create, update, and track support tickets. The system is built using Node.js and integrates with MongoDB for data storage. JWT-based authentication is implemented to ensure secure access to the endpoints, with role-based access control for different user roles like customers, support agents, and admins. The system also includes a notification feature to alert users of ticket assignments or status changes via email or real-time notifications using WebSockets.

## Installation

To get started with the project, clone the repository and install the necessary dependencies:

```sh
git clone https://github.com/ezequielcutin/rayca-eval.git
cd rayca-eval
npm install
```

Next, you'll need to set up your environment variables. Create a `.env` file in the root of your project directory and add the following:

```sh
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_email_user>
EMAIL_PASS=<your_email_password>
```
Ensure MongoDB is running and accessible from your connection string.

## Usage

To start the server, run the following command:

```sh
npm start
```

This will start the server on the port specified in your environment variables or default to port 5001. You can then access the API endpoints at `http://localhost:5001/api`.

To start the server in development mode with nodemon, run:

```sh
npm run dev
```

## API Documentation

The API documentation is available through Swagger. You can access it by navigating to `http://localhost:5001/api-docs` in your browser. It provides detailed information about the available endpoints, request/response formats, and authentication requirements.

## Testing

To run the tests for this project, use the following command:

```sh
npm test
```

This runs the test suite, written using Jest, and covers various aspects of the application, including user authentication and ticket management.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- Nodemailer
- WebSockets
- Jest
- Swagger for API documentation

## Contributing

If you'd like to contribute to this project, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



