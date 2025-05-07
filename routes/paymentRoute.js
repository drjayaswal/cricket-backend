import express from "express";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import { User } from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";

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

// Route: Create Order
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const orderId = `order_${Date.now()}`;
    const transactionId = `txn_${uuidv4()}`;

    user.transactions.push({
      TID: transactionId,
      OID: orderId,
      amount: amount,
      status: "PENDING",
    });

    await user.save();

    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: user._id,
        customer_name: user.name,
        customer_phone: user.mobile,
      },
      order_meta: {
        return_url: `${FRONT}/payment/orders/${orderId}`,
      },
    };

    const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-api-version": "2025-01-01",
        "x-client-id": ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderRequest),
    });

    const result = await response.json();

    if (result.order_status === "ACTIVE") {
      res.status(200).json({
        message: "Order created successfully",
        orderDetails: {
          orderId: result.order_id,
          orderAmount: result.order_amount,
          createdAt: result.created_at,
          paymentSessionId: result.payment_session_id,
        },
      });
    } else {
      res.status(400).json({
        error: "Failed to create order",
        details: result.message || "Unknown error occurred.",
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Route: Create Payment Link
router.post("/create-link/:orderId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const { amount, purpose } = req.body;
    const { orderId } = req.params;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const pendingTransaction = user.transactions.find((trxn) => trxn.OID === orderId);

    if (!pendingTransaction || pendingTransaction.status !== "PENDING") {
      return res.status(201).json({ message: "No Pending Request" });
    }

    const expiryTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const paymentLinkRequest = {
      customer_details: {
        customer_id: `cust_${uuidv4()}`,
        customer_name: user.name,
        customer_phone: user.mobile,
      },
      link_amount: pendingTransaction.amount,
      link_currency: "INR",
      link_expiry_time: expiryTime,
      link_id: `link_${uuidv4()}`,
      link_purpose: purpose || "Payment for services",
      link_meta: {
        order_id: pendingTransaction.OID,
        return_url: `${FRONT}/payment/status/${pendingTransaction.OID}`,
      },
      link_notify: {
        send_sms: true,
        send_email: false,
      },
    };

    const response = await fetch("https://sandbox.cashfree.com/pg/links", {
      method: "POST",
      headers: {
        "x-api-version": "2025-01-01",
        "x-client-id": ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentLinkRequest),
    });

    const result = await response.json();

    if (result.link_status === "ACTIVE") {
      res.status(200).json({
        message: "Payment link created successfully",
        linkDetails: {
          paymentLink: result.link_url,
          linkExpiry: result.link_expiry_time,
          linkId: result.link_id,
          orderId: pendingTransaction.OID,
        },
      });
    } else {
      res.status(400).json({
        error: "Failed to create payment link",
        details: result.message || "Unknown error occurred.",
      });
    }
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// Route: Check Order Status
router.get("/check-order/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log("Checking Order ID:", order_id);

    const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      method: "GET",
      headers: {
        "x-api-version": "2025-01-01",
        "x-client-id": ID,
        "x-client-secret": SECRET,
      },
    });

    const result = await response.json();

    console.log("Cashfree API Response:", result);

    if (result.order_status) {
      res.status(200).json({
        message: "Order status fetched successfully",
        orderStatus: result.order_status,
        receiptDetails: {
          orderId: result.order_id,
          amount: result.order_amount,
          currency: result.order_currency,
          createdAt: result.created_at,
          customerName: result.customer_details.customer_name,
          paymentSessionId: result.payment_session_id,
        },
      });
    } else {
      res.status(400).json({
        error: "Failed to fetch order status",
        details: result.message || "Unknown error occurred.",
      });
    }
  } catch (error) {
    console.error("Error checking order status:", error);
    res.status(500).json({ error: "Server error" });
  }
});
export default router;
