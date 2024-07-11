// controllers/ticket.js
const Ticket = require('../models/Ticket');
const User = require('../models/User');

exports.createTicket = async (req, res) => {
  const { title, description, status, assignedToEmail } = req.body;

  try {
    // Find user by email
    const assignedToUser = await User.findOne({ email: assignedToEmail });
    if (!assignedToUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const newTicket = new Ticket({
      title,
      description,
      status,
      assignedTo: assignedToUser._id,
      user: req.user.id, // assuming req.user is set after authentication
    });

    const ticket = await newTicket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};