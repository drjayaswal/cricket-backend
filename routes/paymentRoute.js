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
// Utility function to generate transaction ID
const generateTransactionId = () => {
    return `TXID${Date.now()}`;
};

router.post('/start', async (req, res) => {
    try {
        const { name, mobile, amount } = req.body;
        if (!name || !mobile || !amount) {
            return res.status(400).json({
                success: false,
                message: "Name, mobile and amount are required"
            });
        }
        const transactionId = generateTransactionId();
        const payload = {
            merchantId: ID,
            merchantTransactionId: transactionId,
            merchantUserId: `MUID${Date.now()}`,
            amount: amount * 100,
            redirectUrl: `${process.env.BACKEND_URL}/payment/status/${transactionId}`,
            redirectMode: "POST",
            mobileNumber: mobile,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const string = base64Payload + "/pg/v1/pay" + KEY;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + "###" + INDEX;

        // DB Queries

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
                message: "Payment initiated successfully",
                user:{
                    TID: transactionId,
                    name: name,
                    mobile: mobile
                },
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
            });
        } else {
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
        
        // Generate checksum for status API
        const string = `/pg/v1/status/${ID}/${transactionId}` + KEY;
        const sha256 = crypto
            .createHash('sha256')
            .update(string)
            .digest('hex');
        const checksum = sha256 + "###" + INDEX;

        // Use correct status API endpoint
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

        console.log("PhonePe Status Response:", response.data);

        if (response.data.success === true) {
            const paymentStatus = response.data.code;
            const transactionAmount = response.data.data?.amount / 100; // Convert from paisa to rupees

            return res.status(200).json({
                success: true,
                message: "Payment status retrieved successfully",
                data: {
                    transactionId,
                    amount: transactionAmount,
                    status: paymentStatus,
                    ...response.data.data
                }
            });
        } else {
            throw new Error(response.data.message || "Failed to retrieve payment status");
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

export default router;