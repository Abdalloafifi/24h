const Order = require('../models/order');
const User = require('../models/User');
const Category = require('../models/category');
const asyncHandler = require('express-async-handler');
const xss = require('xss');
const { getReceiverSocketId, getIO } = require("../socket");

/**
 * @desc    إنشاء طلب جديد
 * @route   POST /api/orders
 * @access  خاص (المريض)
 */
exports.createOrder = asyncHandler(async (req, res) => {
    const existingOrder = await Order.findOne({ 
        user: req.user.id, 
        status: { $in: ["pending", "accepted"] } 
    });
    if (existingOrder) {
        return res.status(400).json({ error: "لديك طلب قيد التنفيذ بالفعل!" });
    }
    const data = {
        category: xss(req.body.category),
        coordinates: JSON.parse(xss(req.body.coordinates)),
    };
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
        return res.status(404).json({ error: "نوع الخدمة غير موجود" });
    }
    const newOrder = new Order({
        user: req.user.id,
        category: data.category,

        location: {
            type: "Point",
            coordinates: data.coordinates,
        },
    });
    await newOrder.save();
    const io = getIO();
    io.emit("newOrder", newOrder);

    res.status(201).json(newOrder);
});

/**
 * @desc    الحصول على الطلبات للممرضين (مرتبة حسب القرب)
 * @route   GET /api/orders/nearby
 * @access  خاص (الممرض)
 */
exports.getNearbyOrders = asyncHandler(async (req, res) => {
    const nurse = await User.findById(req.user.id);
    if (!nurse?.location) {
        return res.status(400).json({ error: "الموقع غير متوفر" });
    }
    const orders = await Order.aggregate([
        {
            $geoNear: {
                near: nurse.location,
                distanceField: "distance",
                maxDistance: 50000, // 50 كم
                spherical: true,
                query: { status: "pending" },
            },
        },
        { $sort: { distance: 1 } },
    ]);

  const populatedOrders = await Order.populate(orders, [
    { 
        path: "user", 
        select: "username avatar  _id", 
    },
    { 
        path: "category", 
        select: "status price", 
    },
]);

res.status(200).json(populatedOrders);
});

/**
 * @desc    قبول الطلب من قبل الممرض
 * @route   PUT /api/orders/:id/accept
 * @access  خاص (الممرض)
 */
exports.acceptOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order || order.status !== "pending") {
        return res.status(404).json({ error: "الطلب غير متاح" });
    }
    const existingOrder = await Order.findOne({ 
        doctor: req.user.id, 
        status: "accepted" 
    });
    if (existingOrder) {
        return res.status(400).json({ error: "لديك طلب قيد التنفيذ بالفعل!" });
    }
    order.doctor = req.user.id;
    order.status = "accepted";
    await order.save();

    const io = getIO();
    io.emit("orderAccepted", order); 
    io.to(getReceiverSocketId(order.user.toString())).emit("orderUpdate", order);

    res.status(200).json(order);
});

/**
 * @desc    إكمال الطلب
 * @route   PUT /api/orders/:id/complete
 * @access  خاص (المريض والممرض)
 */
exports.completeOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
  
    if (req.user.role === "sick") {
      order.confirmation.patient = true;
    } else if (req.user.role === "nurse") {
      order.confirmation.nurse = true;
    }
      if (order.confirmation.patient && order.confirmation.nurse) {
      order.status = "completed";
      order.done = true;
    }

    await order.save();
  
    const io = getIO();
    io.emit("orderUpdate", order);
  
    res.status(200).json(order);
  });