import express from 'express';
import { MatchSchedule } from '../models/MatchSchedule.js';
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import Admin from '../models/admin';
import authMiddleware from '../middlewares/authMiddleware.js';
import { checkIsSuperAdmin, findUserByPhone } from "../services/actions"

const router = express.Router();

router.get('/total-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
});

router.get('/total-active-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
})

router.get('/company-statement', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
});

router.get('/users-statement', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
});

router.get('/fetch-users', async (req, res) => {
  const query = req.query.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    if (query) {
      // Search by name, phone number or email if query exists
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { mobile: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select("name email mobile amount portfolio");

      return res.status(200).json({ users });
    }

    // Regular pagination if no query
    const users = await User.find({})
      .skip(skip)
      .limit(limit)
      .select("name email mobile amount portfolio");

    const total = await User.countDocuments();

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get('/fetch-all-admins', authMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('name role');

    if (!admins) {
      return res.status(404).json({ message: "No Admin Found" })
    }

    res.status(200).json({ admins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get('/user-details', async (req, res) => {

  const user_id = req.query.id;
  if (!user_id) {
    return res.status(400).json({ message: "User ID not provided" });
  }

  try {
    const user = await User.findOne({ _id: user_id })

    if (!user) {
      return res.status(404).json({ message: "User Not Found" })
    }
    // console.log(users)

    res.status(200).json({
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post('/promote-user-to-admin', authMiddleware, async (req, res) => {
  const { id, role } = req.body;
  const admin_id = req.user.userId;

  const result = await checkIsSuperAdmin(admin_id);
  if (!result.success) {
    return res.status(result.code).json({ message: result.message });
  }

  if (!role) {
    return res.status(400).json({ message: "Role is not provided in the body" });
  }

  try {
    const result = await User.findOneAndUpdate(
      { _id: id },
      { $set: { isAdmin: true, role } },
      {
        new: true,
      }
    );

    if (!result) {
      res.status(400).send("User not found");
    }
    res.status(201).json({
      message: "New admin created successfully",
    });
  } catch (error) {
    console.error('Error creating new admin:', error);
    res.status(500).json({
      message: 'Failed to create new admin',
      error: error.message
    });
  }

})



export default router;
