import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Project Completion Certificate' },
  note: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'Certificates' });

export default mongoose.model('Certificate', certificateSchema);
