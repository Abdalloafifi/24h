const User = require("../models/User");
const MessagesToSupport = require("../models/MessagesClines");
const asyncHandler = require("express-async-handler");
const xss = require("xss");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");
const { getReceiverSocketId, getIO } = require("../socket"); // استيراد io والدالة الخاصة بالـ socket

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET غير موجود في المتغيرات البيئية");
  }