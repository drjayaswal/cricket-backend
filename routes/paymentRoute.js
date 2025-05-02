import express, { response } from "express";
import { v4 as uuidv4 } from "uuid";
import fetch, { isRedirect } from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { randomUUID } from "crypto";
import User from "../models/User.js";
import { Cashfree } from "cashfree-pg";
import authMiddleware from "../middlewares/authMiddleware.js";
import { load } from "@cashfreepayments/cashfree-js";
import { error } from "console";

const router = express.Router();

const ID = process.env.CASHFREE_ID;
const SECRET = process.env.CASHFREE_SECRET;
const BACK = process.env.BACKEND_URL;
const FRONT = process.env.FRONTEND_URL;

// Helper to delete all transactions for a user
const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All recent transactions are deleted");
};

// Start Payment Route
// Start Payment Route with dynamic user data

router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }
    const userId = req.user.userId;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "No user" });
    }
    const transactionId = `T${randomUUID()}`
    user.transactions.push({
      TID:transactionId,
      amount:amount,
      status:'PENDING'
    })
    await user.save()
    const orderBody = {
      order_currency: "INR",
      order_amount: Number(amount),
      customer_details: {
        customer_id: user._id.toString(),
        customer_name: user.name,
        customer_email: user.googleId,
        customer_phone: user.mobile,
      },
    };
    const options = {
      method: "POST",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderBody),
    };
    fetch("https://sandbox.cashfree.com/pg/orders", options)
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        res.status(200).json({
          orderId: response.order_id,
          trxnId:transactionId,
          orderAmount: response.order_amount,
          createdAt: response.createdAt,
          sessionId: response.payment_session_id,
          customer: response.customer_details,
        });
      })
      .catch((error) => {
        res.status(999).json({ PayError: error });
      });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/create-link/:orderId/:trxnId", authMiddleware, async (req, res) => {
  try {
    const { orderId,trxnId } = req.params;
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "No user" });
    }
    const expiryTime = new Date(Date.now() + 0.25 * 60 * 60 * 1000).toISOString();
    const transaction = user.transactions.find((t) => t.TID == trxnId)
    if(!transaction){
      throw new Error("No Such Transactions");
    }
    const linkId = "link_" + uuidv4().replace(/-/g, "").slice(0, 20);
    const orderBody = {
      customer_details: {
        customer_name: user.name,
        customer_phone: user.mobile,
      },
      link_id: linkId,
      link_amount: Number(transaction.amount),
      link_auto_reminders: true,
      link_currency: "INR",
      link_purpose: "Payment for CricStock11",
      link_expiry_time: expiryTime,
      link_notify: {
        sms: true,
        email: true,
        whatsapp: false,
      },
      link_meta: {
        return_url: `${FRONT}/payment/status/${orderId}`,
        upi_intent: false,
      },
    };
    const options = {
      method: "POST",
      headers: {
        "x-api-version": "2022-09-01",
        "x-client-id": ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderBody),
    };

    
    fetch("https://sandbox.cashfree.com/pg/links", options)
    .then(async(response) => response.json())
    .then(async (response) => {
        transaction.time = Date()
        if(response.link_status != 'ACTIVE'){
          if(response.link_status == 'FAILED'){
            transaction.status = "FAILED"
          }
          else{
            transaction.status = "SUCCESS";
          }
        }
        await user.save()
        console.log(response);
        res.redirect(303,`${response.link_url}`)
      })
      .catch((error) => {
        res.status(999).json({ payError: error });
      });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect Route
router.get("/statusRedirect/:txnId", async (req, res) => {
  res.status(999).json({ message: "Redirect" });
  // try {
  //   const { txnId } = req.params;
  //   console.log(txnId)
  //   return res.redirect(
  //     303,
  //     `${process.env.FRONTEND_URL}/payment/status/${txnId}`
  //   );
  // } catch (error) {
  //   return res.status(500).json({
  //     success: false,
  //     message: "Failed to redirect",
  //     error: error.response?.data || error.message,
  //   });
  // }
});

export default router;
