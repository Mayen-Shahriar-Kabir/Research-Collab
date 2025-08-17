import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  institution: { type: String, default: '' },
  academicInterests: [{ type: String }],
  publications: [{
    title: { type: String, required: true },
    url: { type: String, default: '' }
  }],
  profilePhoto: { type: String, default: null }
}, { collection: "RC" }); 

const User = mongoose.model("User", userSchema);

export default User;