import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, unique: true },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  password: { type: String },

  googleId: { type: String, unique: true, sparse: true }, 
  email: { type: String, unique: true, sparse: true },
});

const User = mongoose.model("User", UserSchema);
export default User
