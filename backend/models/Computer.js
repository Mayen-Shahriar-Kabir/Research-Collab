import mongoose from "mongoose";

const computerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, default: "" },
  specs: { type: String, default: "" },
  status: { type: String, enum: ["active", "maintenance", "retired"], default: "active" },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'Computers' });

export default mongoose.model('Computer', computerSchema);
