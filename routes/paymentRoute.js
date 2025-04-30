import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';

const ID = process.env.PHONEPE_MERCHANT_ID
const KEY = process.env.PHONEPE_SALT_KEY
const INDEX = process.env.PHONEPE_SALT_INDEX
const generateTransactionId = () => {
    return `TXID${Date.now()}`;
};
const deleteAllTransactions = async (mobile) => {
    const user = await User.findOne({mobile})
    while(user.transactions.length > 0){
        user.transactions.pop()
        await user.save()
    }
}
router.post('/start' ,async (req, res) => {
    try {
        const { name, mobile, amount } = req.body;
        // deleteAllTransactions(mobile);
        // return
        // Validate required fields
        if (!name || !mobile || !amount) {
            return res.status(400).json({
                success: false,
                message: "Name, mobile and amount are required"
            });
        }

        const transactionId = generateTransactionId();
        
        // Find user before creating payment
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Create PhonePe payload
        const payload = {
            merchantId: ID,
            merchantTransactionId: transactionId,
            amount: amount * 100,
            redirectUrl: `${process.env.BACKEND_URL}/payment/status/${transactionId}`,
            redirectMode: "POST",
            mobileNumber: mobile,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        // Generate checksum
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const string = base64Payload + "/pg/v1/pay" + KEY;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + "###" + INDEX;

        // Add transaction to user's transactions array
        user.transactions.push({
            TID: transactionId,
            amount: amount,
            status: "Pending",
            time: new Date(),
        });
        
        // Save user with new transaction
        await user.save();

        // Make PhonePe API call
        const response = await axios.post(
            `${process.env.PHONEPE_API_BASE}/pg/v1/pay`,
            {
                request: base64Payload
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                }
            }
        );
        if (response.data.success) {
            return res.status(200).json({
                success: true,
                code:200,
                message: "Payment initiated successfully",
                data: {
                    transactionId,
                    name,
                    mobile,
                    amount,
                    redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
                }
            });
        } else {
            user.transactions = user.transactions.filter(t => t.transactionId !== transactionId);
            await user.save();            
            throw new Error(response.data.message || "Payment initialization failed");
        }
    } catch (error) {
        console.error("Payment Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Payment initialization failed",
            error: error.response?.data || error.message
        });
    }
});

router.post('/status/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const string = `/pg/v1/status/${ID}/${transactionId}` + KEY;
        const sha256 = crypto
            .createHash('sha256')
            .update(string)
            .digest('hex');
        const checksum = sha256 + "###" + INDEX;
        
        // Find user with this transaction ID
        const user = await User.findOne({
            "transactions.TID": transactionId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        const response = await axios.get(
            `${process.env.PHONEPE_API_BASE}/pg/v1/status/${ID}/${transactionId}`,
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': ID
                }
            }
        );
        const responseInfo = response.data
        const responseData = response.data.data
        const transaction = user.transactions.find(t => t.TID === transactionId);
        if (transaction) {
            transaction.paymentInstrument = responseData.paymentInstrument;
            await user.save();
        }else{
            throw new Error("No Such Transaction Initiated Yet or Invalid Transaction ID");
        }
        if (responseInfo.success === true) {
            return res.redirect(
                303,
                `${process.env.FRONTEND_URL}/payment/status/${transactionId}`
            );
        }
    } catch (error) {
        console.error("Payment Status Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve payment status",
            error: error.response?.data || error.message
        });
    }
});

router.post("/transactionData/:trxnId", async(req, res) => {
    try {
        const {trxnId} = req.params;
        console.log(trxnId)
        const user = await User.findOne({
            "transactions.TID": trxnId
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "No User Found"
            });
        }
        const transaction = user.transactions.find(t => t.TID === trxnId);
        if (transaction) {
            return res.status(200).json(transaction);
        } else {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

export default router;