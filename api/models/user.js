const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        UserType: {
            type: String,
            enum: ["sick", "nurse"],
            required: true,
        },
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

        phone: {
            type: String,
            
        },
        NationalNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^[0-9]{14}$/, // تحقق من تنسيق الرقم الوطني (10 أرقام)
        },
        password: {
            type: String,
            required: true,
        },

        PersonalPhoto: [{
            type: String,
        }],
        avatar: {
            type: String,
            default: "https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg", // رابط الصورة الافتراضية
        },
        Address: {
            type: String,

        },
        description: {
            type: String,
        },



    },
    { timestamps: true }
);
const User = mongoose.model("User", UserSchema);
module.exports = User;