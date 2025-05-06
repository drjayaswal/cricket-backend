// find user by transactionId
import { OtpRequest, User } from "../models/User.js";
import bcrypt from "bcryptjs";

const findUserByPhone = async (phone) => {
  try {
    const user = await User.findOne({ mobile: phone });
    if (!user) {
      return { success: false, code: 404, message: "User not found" };
    }

    return { success: true, code: 200, data: user };
  }
  catch (error) {
    console.error("Error finding user by phone:", error);
    return { success: false, code: 500, message: "Error finding user by phone" };
  }
}

const findOtpByPhone = async (phone) => {
  try {
    const otp = await OtpRequest.findOne({ phone });
    if (!otp) {
      return { success: false, code: 404, message: "OTP not found" };
    }
    return { success: true, code: 200, data: otp };
  }
  catch (error) {
    console.error("Error finding OTP:", error);
    return { success: false, code: 500, message: "Error finding OTP" };
  }
}

const createNewUser = async (name, mobile, password) => {
  try {
    // Check if user already exists
    let user = await findUserByPhone(mobile);
    if (user.code == 200) {
      return { success: false, code: 409, message: "User already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      mobile,
      password: hashedPassword,
      // referredBy,
      // referralCode: generateReferralCode(name),
    });
    await newUser.save();

    return { success: true, code: 201, data: newUser };

  } catch (err) {
    console.error("Error creating user:", err);
    return { success: false, code: 400 };
  }
}

const deleteOldOtpRequests = async () => {
  try {
    await OtpRequest.deleteMany({});

    console.log(`Deleted all OTP Requests in the DB`);
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
  }
}


export { findUserByPhone, findOtpByPhone, createNewUser, deleteOldOtpRequests }
