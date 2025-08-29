const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty'], required: true },
  profile: {
    name: String,
    academicInterests: [String],
    institution: String,
    publications: [{ title: String, url: String }],
    cgpa: { type: Number, min: 0, max: 4.0 },
    studentId: String,
    program: { type: String, enum: ['Undergraduate', 'Postgraduate'] },
    department: String,
  },
});

module.exports = mongoose.model('User', userSchema);