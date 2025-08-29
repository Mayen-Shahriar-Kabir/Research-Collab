import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  roleRequest: { type: String, enum: ['student', 'faculty', null], default: null },
  cgpa: { type: Number, min: 0, max: 4, default: null },
  studentId: { type: String, default: '' },
  program: { type: String, enum: ['Undergraduate', 'Postgraduate', ''], default: '' },
  department: { type: String, default: '' },
  institution: { type: String, default: '' },
  academicInterests: [{ type: String }],
  publications: [{
    title: { type: String, required: true },
    url: { type: String, default: '' },
    file: { type: String, default: '' }
  }],
  profilePhoto: { type: String, default: null },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  frozen: { type: Boolean, default: false }
}, { collection: "RC" }); 

const User = mongoose.model("User", userSchema);

export default User;