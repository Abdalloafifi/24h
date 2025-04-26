const express = require("express");
const router = express.Router();
const {
    createPayment,
    handlePaymentWebhook
} = require("../controllers/paymentController");
const { withdrawFunds } = require("../controllers/withdrawController");

// الدفع
router.post("/payment/create", createPayment);
router.post("/payment/webhook", handlePaymentWebhook);

// السحب
router.post("/withdraw", withdrawFunds);

module.exports = router;