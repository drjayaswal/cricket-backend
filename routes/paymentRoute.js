import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { randomUUID } from "crypto";
import User from "../models/User.js";
import { OrderStatusResponse,StandardCheckoutClient,StandardCheckoutPayRequest, MetaInfo, Env } from "pg-sdk-node";

const router = express.Router();

const clientId = process.env.PHONEPE_MERCHANT_ID;
const clientSecret = process.env.PHONEPE_SALT_KEY;
const clientVersion = 1 || process.env.INDEX;
const env = Env.PRODUCTION;
const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);
const BACK = process.env.BACKEND_URL;
const FRONT = process.env.FRONTEND_URL;

const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All Recent Transactions are deleted")
  return
};
// Start Payment Route
router.post("/start", async (req, res) => {
  try {
    const { name, mobile, amount } = req.body;
    // deleteAllTransactions(mobile)
    // return


    const metaInfo = MetaInfo.builder().udf1("udf1").udf2("udf2").build();
    
    const transactionId = randomUUID();
    
    const redirectUrl = `${BACK}/payment/statusRedirect/${transactionId}`;
    
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(amount*100)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const user = await User.findOne({mobile})
    if(!user){
      throw new Error("User not found")
    }
    user.transactions.push({
      TID:transactionId,
      amount:amount
    })
    await user.save();

    client.pay(request).then((response) => {
      console.log("\n\n",transactionId)
      console.log("\n\n",response.redirectUrl,"\n\n")
        res.status(200).json({
        userData:{
            name,
            mobile,
            amount,
            transactionId
        },
        response
        });
    });

} catch (error) {
    console.error(error)
  }
});


router.get("/status/:txnId",async(req,res) => {
    try {
        const {txnId} = req.params;
        const transactionId = txnId;
        const user = await User.findOne({
          "transactions.TID":transactionId
        })
        client.getOrderStatus(transactionId).then((response) => {
          if (response) {
            response.amount /= 100;
            response.payableAmount /= 100;
            const payment = response.paymentDetails?.[0];
            if (payment) {
              payment.amount /= 100;
              payment.payableAmount /= 100;
          
              const split = payment.splitInstruments?.[0];
              if (split) {
                split.amount /= 100;
              }
            }
            // const user = await User.findOne()
            // const transaction = user.transactions.find((t) => t.TID === transactionId);
            // if(!transaction){
            //   throw new Error("No Such Transaction");
            // }
            // if(response.state !== 'PENDING'){
            //   if(response.state === 'COMPLETED'){
            //     transaction.state = "SUCCESS";
            //   }else{
            //     transaction.state = "FAILED";
            //   }
            // }



          }
          // console.log(response)
          // return
          return res.status(200).json({
            response
          })
        });
    } catch (error) {
        throw new Error("Cannot Fetch Transaction Status")
    }
})

// Redirect Route
router.get("/statusRedirect/:txnId", async (req, res) => {
  try {
    const { txnId } = req.params;
    return res.redirect(
      303,
      `${process.env.FRONTEND_URL}/payment/status/${txnId}`
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to redirect",
      error: error.response?.data || error.message,
    });
  }
});


export default router;
