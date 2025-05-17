import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  email: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ["marketing", "financial", "super_admin", ""], default: "" },
})

const Admin = mongoose.model("admins", adminSchema);

export default Admin;

