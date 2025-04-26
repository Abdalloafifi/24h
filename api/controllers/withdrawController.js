const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// سحب الأموال
exports.withdrawFunds = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    // تحقق من الصلاحية (ممرض/دكتور فقط)
    if (user.role !== "nurse") {
        return res.status(403).json({ error: "غير مصرح بالسحب!" });
    }

    // تحقق من الرصيد الكافي
    if (user.balance < amount) {
        return res.status(400).json({ error: "الرصيد غير كافي!" });
    }

    // خصم المبلغ من الرصيد
    user.balance -= amount;
    await user.save();

    res.status(200).json({
        message: `تم سحب ${amount} جنيه بنجاح!`,
        newBalance: user.balance,
    });
});