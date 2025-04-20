const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const xss = require("xss");
const Joi = require("joi");
const {generateTokenAndSend,} = require("../middlewares/genarattokenandcookies");
const cloudinary = require("../config/cloudinary"); 

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET غير موجود في المتغيرات البيئية");
}

/**
 * @desc   get user profile
 * @route   get /api/user/profile/:id
 * @access  خاص
 */

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -email');;
  if (!user) {
    return res.status(404).json({ message: "المستخدم غير موجود" });
  }
  res.status(200).json(user);
});

/**
 * @desc    update user profile
 * @route   PUT /api/user/profile/:id
 * @access  خاص
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
  let data = {
    phone : xss(req.body.phone),
    description : xss(req.body.description),
  };
  const { error } = viledUpdataProfile(data);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true }
  ).select("-password -email");

  if (!user) {
    return res.status(404).json({ message: "المستخدم غير موجود" });
  }

  generateTokenAndSend(user._id, res);
  res.status(200).json(user);
});

function viledUpdataProfile(data) {
  const schema = Joi.object({
    phone: Joi.string().optional(),
    description: Joi.string().optional(),
  }).min(1); 

  return schema.validate(data);
}

/**
 * * @desc    update user profile avatar
 * * @route   PUT /api/user/profile/avatar/:id
 * * @access  خاص
 */
exports.updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const file = req.file;

    if (!file || !file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "يرجى تحميل صورة صالحة" });
    }
    const user = await User.findById(userId);
    if (!user || user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "غير مصرح بالتعديل" });
    }

    if (user.avatar) {
      try {
        const publicId = user.avatar
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("خطأ في حذف الصورة القديمة:", error);
      }
    }

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      {
        folder: "chat/avatars",
        width: 150,
        height: 150,
        crop: "fill",
        quality: "auto:best",
      }
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true }
    ).select("-password -email");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("خطأ في تحديث الصورة:", error);
    res.status(500).json({ message: "فشل في تحديث الصورة" });
  }
});
