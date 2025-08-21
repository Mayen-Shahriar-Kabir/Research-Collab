import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requirements: [{ type: String }],
  status: { type: String, enum: ['available', 'in_progress', 'completed'], default: 'available' },
  maxStudents: { type: Number, default: 1 },
  currentStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deadline: { type: Date }
}, { timestamps: true, collection: 'Projects' });

export default mongoose.model('Project', projectSchema);
