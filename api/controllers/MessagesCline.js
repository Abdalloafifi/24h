const Message = require("../models/MessagesClines");
const asyncHandler = require("express-async-handler");
const xss = require("xss");
const cloudinary = require("../config/cloudinary");
const { getReceiverSocketId, getIO } = require("../socket");

const isDoctor = (req, res, next) => {
  if (req.user.role !== "nurse") {
    return res.status(403).json({ message: "صلاحيات غير كافية" });
  }
  next();
};

const isPatient = (req, res, next) => {
  if (req.user.role !== "sick") {
    return res.status(403).json({ message: "صلاحيات غير كافية" });
  }
  next();
};

/**
 * @route   GET /api/messages/patient
 * @desc    جلب كل محادثات المريض مع الردود
 * @access  Private (sick)
 */
exports.getPatientMessages = [
  isPatient,
  asyncHandler(async (req, res) => {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "username avatar")
      .populate("receiverId", "username avatar");

    res.status(200).json(messages);
  }),
];
/**
 * @route   POST /api/messages/questions
 * @desc    المريض يرسل سؤال جديد مع إمكانية إرفاق ملفات
 * @access  Private (sick)
 */
exports.sendQuestion = [
  isPatient,
  asyncHandler(async (req, res) => {
    const { text } = req.body;
    const sanitizedText = text ? xss(text) : undefined;

    const newMessage = {
      senderId: req.user._id,
      text: sanitizedText,
    };

    if (req.files?.length > 0) {
      const uploaded = await Promise.all(
        req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "clinic/messages", resource_type: "auto" },
              (error, result) => {
                if (error) reject(error);
                else resolve({
                  url: result.secure_url,
                  type: file.mimetype.split("/")[0]
                });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );

      uploaded.forEach(({ url, type }) => {
        switch (type) {
          case "image":
            newMessage.image = newMessage.image || [];
            newMessage.image.push(url);
            break;
          case "video":
            newMessage.video = newMessage.video || [];
            newMessage.video.push(url);
            break;
          case "audio":
            newMessage.audio = newMessage.audio || [];
            newMessage.audio.push(url);
            break;
        }
      });
    }

    const createdMessage = await Message.create(newMessage);
    
    const io = getIO();
    const populatedMessage = await Message.populate(createdMessage, {
      path: "senderId",
      select: "username avatar",
    });
    
    io.emit("new_question", populatedMessage);

    res.status(201).json(populatedMessage);
  }),
];

/**
 * @route   GET /api/messages/questions/unanswered
 * @desc    جلب جميع الأسئلة غير المجابة للأطباء
 * @access  Private (nurse)
 */
exports.getUnansweredQuestions = [
  isDoctor,
  asyncHandler(async (req, res) => {
    const questions = await Message.find({ isAnswered: false })
      .sort({ createdAt: 1 })
      .populate("senderId", "username avatar");

    res.status(200).json(questions);
  }),
];

/**
 * @route   PATCH /api/messages/questions/:messageId/lock
 * @desc    قفل السؤال عند بدء الطبيب بالرد
 * @access  Private (nurse)
 */
exports.startReply = [
  isDoctor,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $set: { isAnswered: true } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "الرسالة غير موجودة" });
    }

    // إخفاء السؤال من قوائم الأطباء الآخرين
    const io = getIO();
    io.emit("question_locked", messageId);

    res.status(200).json({ message: "بدأت عملية الرد" });
  }),
];

/**
 * @route   POST /api/messages/questions/:messageId/reply
 * @desc    الطبيب يرسل الرد النهائي على سؤال مع إمكانية إرفاق ملفات
 * @access  Private (nurse)
 */
exports.submitReply = [
  isDoctor,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "الرسالة الأصلية غير موجودة" });
    }

const reply = new Message({
  senderId: req.user._id,
  receiverId: originalMessage.senderId,
  text: text ? xss(text) : undefined,
  parentMessage: messageId,
});

if (req.files?.length > 0) {
  const uploaded = await Promise.all(
    req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "clinic/messages", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              type: file.mimetype.split("/")[0]
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    })
  );

  uploaded.forEach(({ url, type }) => {
    switch (type) {
      case "image":
        reply.image = reply.image || [];
        reply.image.push(url);
        break;
      case "video":
        reply.video = reply.video || [];
        reply.video.push(url);
        break;
      case "audio":
        reply.audio = reply.audio || [];
        reply.audio.push(url);
        break;
    }
  });
}

const savedReply = await reply.save();

    
    const io = getIO();
    
    const patientSocketId = getReceiverSocketId(originalMessage.senderId);
    if (patientSocketId) {
      io.to(patientSocketId).emit("new_reply", savedReply);
    }

    await Message.findByIdAndUpdate(messageId, {
      $push: { replies: savedReply._id },
    });

    res.status(201).json(savedReply);
  }),
];

