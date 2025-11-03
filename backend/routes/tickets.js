const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Ticket = require('../models/Ticket');

// GET /api/tickets - Get user tickets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tickets: tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tickets - Create new ticket
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;
    
    const ticket = new Ticket({
      userId: req.user._id,
      username: req.user.username,
      subject: subject,
      category: category,
      priority: priority || 'medium',
      description: description,
      status: 'open'
    });
    
    await ticket.save();
    
    res.json({
      success: true,
      ticket: ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tickets/:id - Get specific ticket
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      ticket: ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, priority } = req.body;
    
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status, priority, updatedAt: new Date() },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      ticket: ticket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tickets/:id/messages - Add message to ticket
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    const ticket = await Ticket.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    ticket.messages.push({
      author: req.user.username,
      message: message,
      timestamp: new Date(),
      isAdmin: false
    });
    
    ticket.status = 'updated';
    ticket.updatedAt = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      ticket: ticket
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;