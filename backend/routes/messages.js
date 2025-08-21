import express from 'express';
import Message from '../models/Message.js';
import User from '../models/model.js';
import Application from '../models/Application.js';
import Project from '../models/Project.js';

const router = express.Router();

// Get all messages for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'email role profile name')
      .populate('recipient', 'email role profile name')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users for starting a chat
router.get('/search', async (req, res) => {
  try {
    const { query = '', requesterId } = req.query;
    if (!requesterId) return res.status(400).json({ message: 'requesterId required' });

    const requester = await User.findById(requesterId).select('role');
    if (!requester) return res.status(404).json({ message: 'Requester not found' });

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const roleFilter = (requester.role === 'student')
      ? { role: 'faculty' } // students can only search faculties to initiate
      : {}; // faculty/admin can search anyone

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
    const { sender, recipient, content } = req.body;
    if (!sender || !recipient || !content) {
      return res.status(400).json({ message: 'sender, recipient, and content are required' });
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
      // Students can only message after applying to a project of the recipient faculty,
      // OR reply if the recipient has previously messaged them.

      // Allow reply if recipient has messaged the student before
      const hasIncoming = await Message.exists({ sender: recipient, recipient: sender });

      if (!hasIncoming) {
        // Must be messaging a faculty and have an application to that faculty's project
        if (recipientUser.role !== 'faculty') {
          return res.status(403).json({ message: 'Students can only message faculties after applying to their projects' });
        }
        // Get projects owned by the faculty recipient
        const facultyProjects = await Project.find({ faculty: recipient }).select('_id');
        const projectIds = facultyProjects.map(p => p._id);
        if (projectIds.length === 0) {
          return res.status(403).json({ message: 'You must apply to one of this faculty’s projects before messaging' });
        }
        const hasApplied = await Application.exists({ student: sender, project: { $in: projectIds } });
        if (!hasApplied) {
          return res.status(403).json({ message: 'You can message this faculty only after applying to their project' });
        }
      }
    }

    // Faculty/Admin can message anyone
    const msg = await Message.create({ sender, recipient, content });
    const populated = await msg.populate([
      { path: 'sender', select: 'email role profile name' },
      { path: 'recipient', select: 'email role profile name' },
    ]);
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
