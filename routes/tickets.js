const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route    POST api/tickets
// @desc     Create a ticket
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('assignedToEmail', 'AssignedToEmail is required').isEmail(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, assignedToEmail } = req.body;

    try {
      const assignedToUser = await User.findOne({ email: assignedToEmail });
      if (!assignedToUser) {
        return res.status(404).json({ msg: 'Assigned user not found' });
      }

      const newTicket = new Ticket({
        user: req.user.id,
        title,
        description,
        assignedTo: {
          id: assignedToUser.id,
          name: assignedToUser.name,
          email: assignedToUser.email,
        },
      });

      const ticket = await newTicket.save();

      // Send email notification (this can be commented out if causing issues)
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: assignedToEmail,
        subject: 'New Ticket Assigned',
        text: `A new ticket with title "${title}" has been assigned to you.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


// @route    GET api/tickets
// @desc     Get all tickets
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id });
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/tickets/:id
// @desc     Update a ticket
// @access   Private
router.put('/:id', auth, async (req, res) => {
  const { title, description, status, assignedToEmail } = req.body;

  const ticketFields = {};
  if (title) ticketFields.title = title;
  if (description) ticketFields.description = description;
  if (status) ticketFields.status = status;

  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    // Ensure user owns ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (assignedToEmail) {
      const assignedUser = await User.findOne({ email: assignedToEmail });
      if (!assignedUser) {
        return res.status(404).json({ msg: 'Assigned user not found' });
      }
      ticketFields.assignedTo = {
        id: assignedUser._id,
        email: assignedUser.email,
        name: assignedUser.name,
      };

      // Send email notification (this can be commented out if causing issues)
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: assignedToEmail,
        subject: 'Ticket Updated and Assigned',
        text: `A ticket with title "${title}" has been assigned to you.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }

    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: ticketFields },
      { new: true }
    );

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    DELETE api/tickets/:id
// @desc     Delete a ticket
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    // Ensure user owns ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await ticket.remove();

    res.json({ msg: 'Ticket removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;