const User = require("../models/User");
const MessagesToSupport = require("../models/MessagesToSupport");
const asyncHandler = require("express-async-handler");
const xss = require("xss");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");
const { getReceiverSocketId, getIO } = require("../socket"); // استيراد io والدالة الخاصة بالـ socket

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET غير موجود في المتغيرات البيئية");
}
  



exports.getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const messages = await MessagesToSupport.find({
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
    console.log("test1");
  
    const receiver = await User.findById(id);
    if (!receiver) {
      return res.status(404).json({ message: "المستلم غير موجود" });
    }
    console.log("test2");
  
    const sanitizedText = text ? xss(text) : undefined;
  
    const newMessage = {
      senderId: req.user._id,
      receiverId: id,
      text: sanitizedText,
    };
  
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "chat/messages", resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        
        const fileType = req.file.mimetype.split('/')[0];
        switch(fileType) {
          case 'image': newMessage.image = result.secure_url; break;
          case 'video': newMessage.video = result.secure_url; break;
          case 'audio': newMessage.audio = result.secure_url; break;
        }
      } catch (uploadError) {
        console.log(uploadError);
        return res.status(500).json({ message: "فشل رفع الملف" });
      }
    }
    console.log("test3");
  
    if (!newMessage.text && !newMessage.image && !newMessage.video && !newMessage.audio) {
      return res.status(400).json({ message: "الرسالة لا تحتوي على محتوى" });
    }
    console.log("test4");
  
    const createdMessage = await Message.create(newMessage);
    const populatedMessage = await Message.findById(createdMessage._id)
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar");
  
    // إرسال رسالة عبر socket للمستلم إذا كان متصلاً
    console.log("test5");
    // إرسال رسالة عبر socket للمستلم إذا كان متصلاً
  const receiverSocketId = getReceiverSocketId(receiver._id.toString());
  if (receiverSocketId) {
    const io = getIO(); // التأكد من إن io مُهيأ
    io.to(receiverSocketId).emit("newMessage", populatedMessage);
  }
  
  // إرسال الحدث للمرسل (للتحديث اللحظي)
  const senderSocketId = getReceiverSocketId(req.user._id.toString());
  if (senderSocketId) {
    const io = getIO();
    io.to(senderSocketId).emit("newMessage", populatedMessage);
  }
    console.log("test6");
  
    res.status(201).json(populatedMessage);
  });
  