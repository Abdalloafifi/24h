const { User, complexityOptions } = require('../models/User');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const passwordComplexity = require("joi-password-complexity");
const xss = require('xss');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const { Vonage } = require('@vonage/server-sdk')
const cloudinary = require("../config/cloudinary");
const { generateTokenAndSend } = require('../middlewares/genarattokenandcookies');


/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/auth/register
 * @access  عام
 */

exports.register = asyncHandler(async (req, res) => {
    const data = {
        username: xss(req.body.username?.trim()),
        email: xss(req.body.email?.trim()),
        password: xss(req.body.password),
        phone: xss(req.body.phone),
        NationalNumber: xss(req.body.NationalNumber),
    };
    const { error } = validateRegister(data);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
        return res.status(401).json({ error: 'المستخدم موجود بالفعل!' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const randamnumber = Math.floor(100000 + Math.random() * 900000);
    const randamnumberPhone = Math.floor(100000 + Math.random() * 900000);

    const newUser = new User({
        username: data.username,
        email: data.email,
        RealEmail: randamnumber,
        password: hashedPassword,
        phone: data.phone,
        RealPhone: randamnumberPhone,
        NationalNumber: data.NationalNumber,
    });

    try {
        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: data.email,
            subject: 'Verify the email address',
            text: `Since you received this message, this means that this email is correct and you can put the code in the correct place.: ${randamnumber}`,
        };
        try {

            await transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('Email sent: ');
                }
            });
            try {
                // Send the verification code to the user's phone using Vonage API
                const vonage = new Vonage({
                    apiKey: process.env.VONAGE_API_KEY,
                    apiSecret: process.env.VONAGE_API_SECRET,
                });

                const from = "24h"  // nema ( if contry suuport nema) or number 
                const to = data.phone.startsWith('+')
                    ? data.phone
                    : '20' + data.phone.replace(/^0+/, '');
                const text = `  this phone number is correct and you can put the code in the correct place.: ${randamnumberPhone}`

                async function sendSMS() {
                    await vonage.sms.send({ to, from, text })
                        .then(resp => { console.log('Message sent successfully'); })
                        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
                }
                await sendSMS();
            } catch (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ error: "Failed to send email" });
            }
            res.status(200).json({ message: "Email sent successfully" });

        } catch (err) {
            console.error('Error sending email:', err);
            res.status(500).json({ error: "Failed to send email" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function validateRegister(data) {
    const schema = Joi.object({

        username: Joi.string().min(3).max(30).required().messages({
            'string.min': 'اسم المستخدم يجب أن يكون على الأقل 3 أحرف',
            'string.max': 'اسم المستخدم يجب ألا يتجاوز 30 حرفًا',
            'any.required': 'اسم المستخدم مطلوب'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'البريد الإلكتروني غير صحيح',
            'any.required': 'البريد الإلكتروني مطلوب'
        }),
        password: passwordComplexity(complexityOptions).required().messages({
            'any.required': 'كلمة المرور مطلوبة'
        }),
        phone: Joi.string().optional().messages({
            'string.empty': 'رقم الهاتف مطلوب'
        }),
        NationalNumber: Joi.string().required().messages({
            'string.empty': 'الرقم الوطني مطلوب',
            'any.required': 'الرقم الوطني مطلوب'
        }),

    });
    return schema.validate(data);
}

/**
 * @desc    التاكد من صحه البريد الالكتروني
 * @route   POST /api/auth/verifyEmail
 * @access  عام
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
    const data = {
        code: xss(req.body.code)
    }
    const { error } = validateVerifyEmailorphone(data);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const user = req.user
    if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود!' });
    }

    if (user.RealEmail !== data.code) {
        return res.status(400).json({ error: 'الرمز غير صحيح!' });
    }

    user.okemail = true;
    await user.save();


    res.status(200).json({ message: 'تم توثيق البريد الإلكتروني بنجاح!' });

});

function validateVerifyEmailorphone(data) {
    const schema = Joi.object({
        code: Joi.string().required().messages({
            'any.required': 'الرمز مطلوب'
        })
    });
    return schema.validate(data);
}
/**
 * @desc    التحقق من  صحه رقم الهاتف
 * @route   POST /api/auth/verifyPhone
 * @access  عام
 */
exports.verifyPhone = asyncHandler(async (req, res) => {
    const data = {
        email: xss(req.body.email?.trim()),
        code: xss(req.body.code)
    }
    const { error } = validateVerifyEmailorphone(data);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const user = await User.findOne({ email: data.email });
    if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود!' });
    }

    if (user.RealPhone !== data.code) {
        return res.status(400).json({ error: 'الرمز غير صحيح!' });
    }

    user.okphone = true;

    await user.save();
    if (user.okemail && user.okphone) {
        user.documentation = true;
        await user.save();
    }



    generateTokenAndSend(user, res);
    res.status(200).json({ message: 'تم توثيق رقم الهاتف بنجاح!' });
});


/**
 * @desc    تسجيل دخول المستخدم
 * @route   POST /api/auth/login
 * @access  عام
 */
exports.login = asyncHandler(async (req, res) => {
    try {

        const data = {
            email: xss(req.body.email),
            password: xss(req.body.password),
            phone: xss(req.body.phone),
        };
        console.log(req.body)
        // التحقق من صحة البيانات
        const { error } = validateLogin(data);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });

        }
        // البحث عن المستخدم
        const user = await User.findOne({ $or: [{ email: data.email }, { phone: data.phone }] });
        if (!user) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة!' });
        }

        // التحقق من كلمة المرور
        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة!' });
        }
        // التحقق من حالة المستخدم
        if (user.okemail &&user.okphone &&user.documentation === false) {
            return res.status(401).json({ error:  'يجب توثيق الحساب أولاً' });
        }
        // id ,email, role 
        generateTokenAndSend(user, res);

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
});
function validateLogin(data) {
    const schema = Joi.object({
        role: Joi.string().required().messages({
            'string.empty': 'نوع المستخدم مطلوب',
            'any.required': 'نوع المستخدم مطلوب'
        }),
        phone: Joi.string().required().messages({
            'string.empty': 'رقم الهاتف مطلوب',
            'any.required': 'رقم الهاتف مطلوب'
        }),
        email: Joi.string().email().required().trim().messages({
            'string.email': 'البريد الإلكتروني غير صحيح',
            'any.required': 'البريد الإلكتروني مطلوب'
        }),
        password: passwordComplexity().required().messages({
            'any.required': 'كلمة المرور مطلوبة'
        })
    });
    return schema.validate(data);
}

/**
 * @desc    تسجيل دخول المستخدم
 * @route   POST /api/auth/viledLogin
 * @access  عام
 */
exports.viledLogin = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        generateTokenAndSend(user, res);
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

/**
 * @desc    تسجيل خروج المستخدم
 * @route   POST /api/auth/logout
 * @access  خاص
 */
exports.logout = asyncHandler(async (req, res) => {
    try {
        //clean header
        res.setHeader('x-auth-token', '');
        res.status(200).json({ message: 'تم تسجيل الخروج بنجاح!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @desc    رفع مستندات |الصوره الشخصسه |صور الهويه
 * @route   POST /api/auth/uploadPersonalPhoto
 * @access  عام
 */
exports.uploadPersonalPhoto = asyncHandler(async (req, res) => {
    try {
        // 1. التأكد من وجود ملفات
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'يجب رفع ملف واحد على الأقل' });
        }

        // 2. التحقق من المستخدم الموثق
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        if (!user.documentation) {
            return res.status(403).json({ error: 'يجب توثيق البريد الإلكتروني أولاً' });
        }
        const cloudinaryFolder = `users/${user._id}/documents`;
        // 4. رفع الملفات من الذاكرة إلى Cloudinary
        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: cloudinaryFolder,
                        resource_type: 'auto',
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ فشل رفع الملف:', error);
                            return reject(new Error(`فشل رفع الملف: ${file.originalname}`));
                        }
                        resolve(result.secure_url);
                    }
                ).end(file.buffer);
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        // 5. تحديث بيانات المستخدم
        user.PersonalPhoto = [...user.PersonalPhoto, ...uploadedUrls];
        user.ChangePersonalPhoto = true; // تعيين الحقل إلى true
        await user.save();

        // 6. إرسال الاستجابة
        res.status(200).json({
            message: `تم رفع ${uploadedUrls.length} صورة بنجاح`,
            urls: uploadedUrls,
        });

    } catch (error) {
        console.error('❌ خطأ أثناء الرفع:', error);
        res.status(500).json({
            error: error.message || 'فشل في رفع الملفات',
            details: error.stack,
        });
    }
});
