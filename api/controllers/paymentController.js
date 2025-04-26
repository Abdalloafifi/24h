const axios = require("axios");
const Order = require("../models/order");
const User = require('../models/User');
const Payment = require("../models/payment");
const asyncHandler = require("express-async-handler");

// إعدادات Paymob
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

/**
 * @desc    إنشاء عملية دفع
 * @route   POST /api/payment/create
 * @access  خاص (المريض)
 */
exports.createPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    
    // التحقق من وجود الطلب
    const order = await Order.findById(orderId).populate("category");
    if (!order) {
        return res.status(404).json({ error: "الطلب غير موجود" });
    }

    // إنشاء سجل دفع
    const payment = new Payment({
        user: req.user.id,
        receiver: order.doctor,
        order: orderId,
        amount: order.category.price,
    });
    await payment.save();

    // إنشاء طلب دفع عبر Paymob API
    try {
        // الخطوة 1: الحصول على token
        const authResponse = await axios.post(
            "https://accept.paymob.com/api/auth/tokens",
            { api_key: PAYMOB_API_KEY }
        );
        const token = authResponse.data.token;

        // الخطوة 2: إنشاء طلب دفع
        const orderResponse = await axios.post(
            "https://accept.paymob.com/api/ecommerce/orders",
            {
                auth_token: token,
                delivery_needed: "false",
                amount_cents: payment.amount * 100,
                currency: "EGP",
                items: [],
            }
        );
        const paymobOrderId = orderResponse.data.id;

        // الخطوة 3: إنشاء مفتاح دفع
        const paymentKeyResponse = await axios.post(
            "https://accept.paymob.com/api/acceptance/payment_keys",
            {
                auth_token: token,
                amount_cents: payment.amount * 100,
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: {
                    email: req.user.email,
                    phone_number: req.user.phone,
                },
                currency: "EGP",
                integration_id: PAYMOB_INTEGRATION_ID,
            }
        );

        res.status(200).json({
            paymentKey: paymentKeyResponse.data.token,
            paymentId: payment._id,
        });
    } catch (error) {
        res.status(500).json({ error: "فشل في إنشاء عملية الدفع" });
    
    }
});

/**
 * @desc    معالجة استجابة Paymob (Webhook)
 * @route   POST /api/payment/webhook
 * @access  Public (يجب تأمينه في الإنتاج)
 */
exports.handlePaymentWebhook = asyncHandler(async (req, res) => {
    const { obj: { order: { id }, success, amount_cents, id: transactionId } } = req.body;

    
    if (success) {
        const payment = await Payment.findOne({ _id: id });
        if (payment) {
            payment.status = "completed";
            payment.transactionId = transactionId;
            await payment.save();

            // تحديث رصيد المستلم
            await User.findByIdAndUpdate(
                payment.receiver,
                { $inc: { balance: payment.amount } }
            );
        }
    }

    res.status(200).send("OK");
});
