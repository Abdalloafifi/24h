const User = require("../models/User");
const Message = require("../models/MessagesClines");
const asyncHandler = require("express-async-handler");
const xss = require("xss");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");
const { getReceiverSocketId, getIO } = require("../socket"); // استيراد io والدالة الخاصة بالـ socket

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET غير موجود في المتغيرات البيئية");
}
  




/**
 * @desc   get all users
 * @route  GET /api/messager/allusers
 * @access  عام
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ UserType:"nurse" }).select(
      "-password -email"
    );
    // التحقق من عدم وجود مستخدمين في المصفوفة
    if (users.length === 0) {
      return res.status(400).json({ message: " لا يوجد مستخدمين" });
    }
    res.status(200).json(users);
  });


/**
 * @desc   get messages-chat
 * @route  GET /api/messager/messages/:id
 * @access  خاص
 */
exports.getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const messages = await Message.find({
        $or: [
          { senderId: req.user._id, receiverId: id },
          { senderId: id, receiverId: req.user._id },
        ],
      })
      .sort({ createdAt: 1 })
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar");
  
    // if (messages.length === 0) {
    //   return res.status(400).json({ message: "لا يوجد رسائل" });
    // }
  console.log(messages.length);
    res.status(200).json(messages);
  });
  


/**
 * @desc   send message text or image or video or audio
 * @route  POST /api/messager/sendmessage/:id
 * @access  خاص
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "معرّف مستلم غير صالح" });
  }

  const receiver = await User.findById(id);
  if (!receiver) {
    return res.status(404).json({ message: "المستلم غير موجود" });
  }

  const sanitizedText = text ? xss(text) : undefined;

  const newMessage = {
    senderId: req.user._id,
    receiverId: id,
    text: sanitizedText,
  };

  // ✅ رفع الملفات لو موجودة
  if (req.files && req.files.length > 0) {
    const uploaded = await Promise.all(req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "24h/messages", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, type: file.mimetype.split('/')[0] });
          }
        );
        uploadStream.end(file.buffer);
      });
    }));

    uploaded.forEach(({ url, type }) => {
      switch (type) {
        case 'image':
          if (!newMessage.image) newMessage.image = [];
          newMessage.image.push(url);
          break;
        case 'video':
          if (!newMessage.video) newMessage.video = [];
          newMessage.video.push(url);
          break;
        case 'audio':
          if (!newMessage.audio) newMessage.audio = [];
          newMessage.audio.push(url);
          break;
      }
    });
  }

  if (!newMessage.text && !newMessage.image && !newMessage.video && !newMessage.audio) {
    return res.status(400).json({ message: "الرسالة لا تحتوي على محتوى" });
  }

  const createdMessage = await Message.create(newMessage);
  const populatedMessage = await Message.findById(createdMessage._id)
    .populate("senderId", "username avatar")
    .populate("receiverId", "username avatar");

  // 🔁 إرسال الرسالة للطرفين بالسوكيت
  const io = getIO();
  const receiverSocketId = getReceiverSocketId(receiver._id.toString());
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", populatedMessage);
  }

  const senderSocketId = getReceiverSocketId(req.user._id.toString());
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", populatedMessage);
  }

  res.status(201).json(populatedMessage);
});