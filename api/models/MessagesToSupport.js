const mongoose = require("mongoose");

const MessagesToSupportSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    audio: {
      type: String,
    },

  },
  { timestamps: true }
);

const MessagesToSupport = mongoose.model("MessagesToSupport", MessagesToSupportSchema);
module.exports = MessagesToSupport;
