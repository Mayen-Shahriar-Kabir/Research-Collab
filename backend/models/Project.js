import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requirements: [{ type: String }],
  status: { type: String, enum: ['available', 'in_progress', 'completed', 'closed'], default: 'available' },
  maxStudents: { type: Number, default: 1 },
  currentStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deadline: { type: Date },
  applicationsOpen: { type: Boolean, default: true },
  closedForApplications: { type: Boolean, default: false },
  closedAt: { type: Date, default: null },
  documents: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  milestones: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }],
  stages: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    weight: { type: Number, default: 1 }, // Weight for progress calculation
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  }],
  requiredTasksCount: { type: Number, default: 0 }, // Number of tasks required for project completion
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true, collection: 'Projects' });

export default mongoose.model('Project', projectSchema);
