import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['application', 'task', 'milestone', 'feedback', 'system'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  dueDate: { type: Date, default: null },
  read: { type: Boolean, default: false }
}, { timestamps: true, collection: 'Notifications' });

export default mongoose.model('Notification', notificationSchema);
