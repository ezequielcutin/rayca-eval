const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Import User model
const auth = require('../middlewares/auth'); // Import auth middleware
const nodemailer = require('nodemailer');
require('dotenv').config();

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log('Email sent: ' + info.response);
  });
};

// @route   POST api/tickets
// @desc    Create a ticket
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, assignedTo } = req.body;

    try {
      const newTicket = new Ticket({
        title,
        description,
        status,
        assignedTo,
        user: req.user.id,
      });

      const ticket = await newTicket.save();

      // Emit event to notify users about the ticket creation
      req.app.get('io').emit('ticketCreated', ticket);

      // Fetch the email of the user who created the ticket
      const user = await User.findById(req.user.id);
      const userEmail = user.email;

      // Send email notification
      sendEmail(userEmail, 'New Ticket Created', `A new ticket has been created:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}`);

      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/tickets
// @desc    Get all tickets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ date: -1 });
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/tickets/:id
// @desc    Update a ticket
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, assignedTo } = req.body;

  const ticketFields = {};
  if (title) ticketFields.title = title;
  if (description) ticketFields.description = description;
  if (status) ticketFields.status = status;
  if (assignedTo) ticketFields.assignedTo = assignedTo;

  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    // Update
    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: ticketFields },
      { new: true }
    );

    // Emit event to notify users about the ticket update
    req.app.get('io').emit('ticketUpdated', ticket);

    // Fetch the email of the user assigned to the ticket (if any)
    if (ticket.assignedTo) {
      const assignedUser = await User.findById(ticket.assignedTo);
      const assignedUserEmail = assignedUser.email;

      // Send email notification
      sendEmail(assignedUserEmail, 'Ticket Updated', `A ticket has been updated:\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}`);
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/tickets/:id
// @desc    Delete a ticket
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    await Ticket.findByIdAndDelete(req.params.id);

    // Emit event to notify users about the ticket deletion
    req.app.get('io').emit('ticketDeleted', { id: req.params.id });

    // Fetch the email of the user who created the ticket
    const user = await User.findById(ticket.user);
    const userEmail = user.email;

    // Send email notification
    sendEmail(userEmail, 'Ticket Deleted', `A ticket has been deleted:\n\nTitle: ${ticket.title}`);

    res.json({ msg: 'Ticket removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;