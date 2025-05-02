import express, { response } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import axios from "axios";
import { randomUUID } from "crypto";
import User from "../models/User.js";
import { Cashfree } from 'cashfree-pg';
import authMiddleware from "../middlewares/authMiddleware.js";
dotenv.config();

Cashfree.XClientId = process.env.CASHFREE_GET_ID
Cashfree.XClientSecret = process.env.CASHFREE_GET_SECRET;
Cashfree.XEnviroment = "SANDBOX";

const router = express.Router();

const BACK = process.env.BACKEND_URL;
const FRONT = process.env.FRONTEND_URL;

// Helper to delete all transactions for a user
const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All recent transactions are deleted");
};

// Start Payment Route
// Start Payment Route with dynamic user data

router.post("/start",authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    // const userId = req.user.userId;
    // const { amount } = req.body;

    // const user = await User.findOne({ _id:userId });
    // if (!user) {
    //   return res.status(404).json({ error: "No user" });
    // }
    const options = {
      method: 'POST',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_GET_ID,
        'x-client-secret': process.env.CASHFREE_GET_SECRET,
        'Content-Type': 'application/json'
      },
      body: '{"order_currency":"INR","order_amount":10.34,"customer_details":{"customer_id":"7112AAA812234","customer_phone":"9898989898"}}'
    };
    
    fetch('https://sandbox.cashfree.com/pg/orders', options)
    .then(response => response.json())
    .then(response => {
      console.log(response)
        res.status(200).json(response);
      })
    .catch(err => console.error(err));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/status/:txnId", async (req, res) => {
  res.status(999).json({ message: "Status" });
  // try {
  //     const {txnId} = req.params;
  //     const transactionId = txnId;
  //     const user = await User.findOne({
  //       "transactions.TID":transactionId
  //     })
  //     client.getOrderStatus(transactionId).then(async(response) => {
  //       if (response) {
  //         response.amount /= 100;
  //         response.payableAmount /= 100;
  //         const payment = response.paymentDetails?.[0];
  //         if (payment) {
  //           payment.amount /= 100;
  //           payment.payableAmount /= 100;

  //           const split = payment.splitInstruments?.[0];
  //           if (split) {
  //             split.amount /= 100;
  //           }
  //         }
  //         const user = await User.findOne({"transactions.TID":transactionId})
  //         if(!user){
  //           throw new Error("User not found")
  //         }
  //         const transaction = user.transactions.find((t) => t.TID === transactionId);
  //         if(!transaction){
  //           throw new Error("Transaction not found");
  //         }
  //         if(response.state !== 'PENDING'){
  //           if(response.state === 'COMPLETED'){
  //             transaction.state = "SUCCESS";
  //           }else{
  //             transaction.state = "FAILED";
  //           }
  //         }
  //         await user.save();
  //       }
  //       console.log(response)
  //       // return
  //       return res.status(200).json({
  //         response
  //       })
  //     });
  // } catch (error) {
  //     throw new Error("Cannot Fetch Transaction Status")
  // }
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
