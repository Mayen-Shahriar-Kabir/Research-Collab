import mongoose from "mongoose";

const pcRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, default: '' },
  desiredStart: { type: Date, required: true },
  desiredEnd: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
  // Student preference (optional). Admin allocation uses `computer`.
  preferredComputer: { type: mongoose.Schema.Types.ObjectId, ref: 'Computer' },
  // Allocation details when approved
  computer: { type: mongoose.Schema.Types.ObjectId, ref: 'Computer' },
  slotStart: { type: Date },
  slotEnd: { type: Date }
}, { timestamps: true, collection: 'PcRequests' });

export default mongoose.model('PcRequest', pcRequestSchema);
