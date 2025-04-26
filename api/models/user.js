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
        okemail: {
            type: Boolean,
            default: false,
        },
        
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^[0-9]{11}$/, // تحقق من تنسيق رقم الهاتف (12 أرقام)
        },
        RealPhone: {
            type: String,
            required: true,  
        },
        okphone: {
            type: Boolean,
            default: false,
        },
        documentation: {
            type: Boolean,
            default: false,

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
        
        PersonalPhoto: [{
            type: String,
        }],
        ChangePersonalPhoto: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
            }
        },
balance: {
    type: Number,
    default: 0,
    min: 0,
},



    },
    { timestamps: true }
);
UserSchema.index({ location: '2dsphere' });
const complexityOptions = {
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
  };

const User = mongoose.model("User", UserSchema);
module.exports = { User, complexityOptions };