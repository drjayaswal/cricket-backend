import express from "express";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_ID,
  process.env.CASHFREE_SECRET
);

router.post("/create-order", async (req, res) => {
  try {
    const orderId = `ORDER_${Date.now()}`;
    const orderRequest = {
      order_id: orderId,
      order_amount: 101,
      order_currency: "INR",
      order_meta: {
        return_url: "https://localhost:5002/",
      },
      customer_details: {
        customer_id: `USER_${Date.now()}`,
        customer_phone: "9999999999",
        customer_email: "customer@example.com"
      },
    };

    const response = await cashfree.PGCreateOrder(orderRequest);
    console.log(response.data);

    // Respond with hosted page link
    return res.json({
      order_id: orderId,
      payment_session_id: response.data.payment_session_id,
      payment_link: response.data.payment_link, // Hosted payment link
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});
router.post("/get-order", async (req, res) => {
  try {
    const { order_id } = req.body;
    const response = await cashfree.PGFetchOrder(order_id);
    console.log(response)
    return res.json(response.data);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Something went wrong" });
  }});
export default router;