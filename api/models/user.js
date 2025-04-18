const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["sick", "nurse"],
            default: "sick",
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
            match: /^[0-9]{14}$/, // تحقق من تنسيق الرقم الوطني (14 أرقام)
        },
        password: {
            type: String,
            required: true,
        },
        resetPasswordCode: {
            type: String,
            default: null,
        },

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
        
        PersonalPhoto: [{
            type: String,
        }],
        isAdmin: {
            type: Boolean,
            default: false,
        }



    },
    { timestamps: true }
);
const User = mongoose.model("User", UserSchema);
module.exports = User;