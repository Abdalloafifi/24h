const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminSchema = new Schema(
    {

        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // تحقق من تنسيق البريد الإلكتروني
        },
        RealEmail: {
            type: String,
            required: true,
            
        },
        documentation: {
            type: Boolean,
            default: false,
        },

        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        }



    },
    { timestamps: true }
);
const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;