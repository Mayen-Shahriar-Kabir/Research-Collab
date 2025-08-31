import express from 'express';
import Message from '../models/Message.js';
import User from '../models/model.js';
import Application from '../models/Application.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all messages for a user
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'email role profile name')
      .populate('recipient', 'email role profile name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users for starting a chat
router.get('/search', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { query = '' } = req.query;
    const requesterId = req.user.id;
    const requester = await User.findById(requesterId).select('role');
    if (!requester) return res.status(404).json({ message: 'Requester not found' });

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    let roleFilter = {};
    if (requester.role === 'student') {
      // Students can search faculties they have accepted applications with
      const acceptedApplications = await Application.find({ 
        student: requesterId, 
        status: 'accepted' 
      }).populate('project', 'faculty');
      
      const facultyIds = acceptedApplications.map(app => app.project.faculty);
      roleFilter = { _id: { $in: facultyIds }, role: 'faculty' };
    }
    // Admin and faculty can search anyone

    const users = await User.find({
      _id: { $ne: requesterId },
      ...roleFilter,
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    })
      .select('name email role profile')
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { recipient, content } = req.body;
    const sender = req.user.id;
    
    if (!recipient || !content) {
      return res.status(400).json({ message: 'recipient and content are required' });
    }

    // Role-based permissions
    const [senderUser, recipientUser] = await Promise.all([
      User.findById(sender),
      User.findById(recipient),
    ]);
    if (!senderUser || !recipientUser) {
      return res.status(404).json({ message: 'Sender or recipient not found' });
    }

    if (senderUser.role === 'student') {
      // Students can only message faculty after being accepted to their project,
      // OR reply if the recipient has previously messaged them.

      // Allow reply if recipient has messaged the student before
      const hasIncoming = await Message.exists({ sender: recipient, recipient: sender });

      if (!hasIncoming) {
        // Must be messaging a faculty and have an ACCEPTED application to that faculty's project
        if (recipientUser.role !== 'faculty') {
          return res.status(403).json({ message: 'Students can only message faculties after being accepted to their projects' });
        }
        
        // Check for accepted applications to faculty's projects
        const facultyProjects = await Project.find({ faculty: recipient }).select('_id');
        const projectIds = facultyProjects.map(p => p._id);
        
        if (projectIds.length === 0) {
          return res.status(403).json({ message: 'This faculty has no projects available' });
        }
        
        const hasAcceptedApplication = await Application.exists({ 
          student: sender, 
          project: { $in: projectIds },
          status: 'accepted'
        });
        
        if (!hasAcceptedApplication) {
          return res.status(403).json({ message: 'You can only message this faculty after being accepted to their project' });
        }
      }
    }

    // Faculty/Admin can message anyone
    const msg = await Message.create({ sender, recipient, content });
    const populated = await msg.populate([
      { path: 'sender', select: 'email role profile name' },
      { path: 'recipient', select: 'email role profile name' },
    ]);
    // Notify recipient
    await Notification.create({
      user: recipient,
      type: 'message',
      title: `New message from ${populated.sender?.name || 'a user'}`,
      body: content.slice(0, 120),
      link: `/messages`
    });
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Mark as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const updated = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Message not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
