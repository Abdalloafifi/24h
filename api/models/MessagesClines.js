const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: String,
    image: [String],
    video: [String],
    audio: [String],
    isAnswered: {
      type: Boolean,
      default: false,
    },
    parentMessage: { // إضافة حقل للربط بالرسالة الأصلية
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);