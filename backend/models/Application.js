import mongoose from "mongoose";

//application schema
const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  message: { type: String, default: '' },
  cvUrl: { type: String, default: '' },
  sampleWorkUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'shortlisted', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

applicationSchema.index({ student: 1, project: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema, 'Application');
