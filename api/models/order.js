const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true,
    },
    location: {
        type: {
            type: String,
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "completed"],
        default: "pending",
    },

    done: {
        type: Boolean,
        default: false,
    },
    confirmation: {
        patient: { type: Boolean, default: false },
        nurse: { type: Boolean, default: false },
      },
}, { timestamps: true });

// إنشاء index للموقع الجغرافي
OrderSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Order", OrderSchema);