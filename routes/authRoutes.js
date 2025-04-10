import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import twilio from "twilio";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import authMiddleware from "../middlewares/authMiddleware.js";

dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { name, mobile } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await User.findOne({ mobile });
    if (user) {
      return res.json({ message: "User already exist" });
    }

    if (!user) {
      user = new User({ name, mobile });
    }
    user.name = name;
    user.otp = otp;
    await user.save();

    // Send OTP via Twilio
    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioNumber,
      to: mobile,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;

  try {
    const user = await User.findOne({ mobile });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    } else {
      user.isVerified = true;
      user.otp = null;
      await user.save();
    }
    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// Set Password
router.post("/set-password", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({ mobile });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "User not verified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error setting password" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
});

router.post("/google-login", async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: "Token ID is required" });
  }

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      console.error("Invalid Google token");
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name, sub } = ticket.getPayload(); // Extract user details

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        googleId: sub,
        isVerified: false,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, message: "Google Sign-In successful" });
  } catch (error) {
    console.error("Google Authentication Error:", error);
    res
      .status(500)
      .json({ message: "Google authentication failed", error: error.message });
  }
});

router.post("/forgot-password/sendOtp", async (req, res) => {
  const { mobile } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    // Send OTP via Twilio
    const messsage = await twilioClient.messages.create({
      body: `Your password reset OTP is: ${otp}`,
      from: twilioNumber,
      to: mobile,
    });

    res.json({ message: "OTP sent successfully for password reset" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

router.post("/change-password", async (req, res) => {
  const { mobile, oldPassword, newPassword } = req.body;

  try {
    // Find the user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    // Check if old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({ message: "Incorrect old password" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.json({ message: "Server error" });
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;

    // Find user by ID in MongoDB
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

// For the user who logged in using Google SignIn

router.post("/verify-mobile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    await user.save();

    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioNumber,
      to: mobile,
    });

    res.json({ message: "OTP sent succesfully" });
  } catch (err) {
   
    res.status(500).json({ message: "Error Sending otp" });
  }
});

router.post("/verify-mobile-otp", authMiddleware, async (req, res) => {
  try {
    console.log("Received Data:", req.body); // ✅ Check what is actually coming in

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { otp, mobile } = req.body;
    
    if (!otp || !mobile) {  // ✅ Ensure both values exist
      return res.status(400).json({ message: "OTP and mobile are required" });
    }

    console.log(`Stored OTP: ${user.otp}, Received OTP: ${otp}`); // ✅ Log comparison values

    if (user.otp.toString() !== otp.toString()) { // ✅ Ensure correct comparison
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.mobile = mobile;
    user.isVerified = true;
    user.otp = null;
    await user.save();

    res.json({ message: "Phone verified successfully" });
  } catch (err) {
    console.error("❌ Error verifying OTP:", err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});


export default router;
