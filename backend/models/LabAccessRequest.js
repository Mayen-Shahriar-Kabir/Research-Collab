import mongoose from "mongoose";

const labAccessRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String, default: '' }
}, { timestamps: true, collection: 'LabAccessRequests' });

export default mongoose.model('LabAccessRequest', labAccessRequestSchema);
