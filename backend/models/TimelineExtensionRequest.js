import mongoose from "mongoose";

const timelineExtensionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentDeadline: { type: Date, default: null },
  requestedNewDeadline: { type: Date, required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true, collection: 'TimelineExtensionRequests' });

export default mongoose.model('TimelineExtensionRequest', timelineExtensionSchema);
