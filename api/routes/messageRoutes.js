// routes/messagesRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifytoken');
const upload = require('../middlewares/uplod');

const {sendQuestion,getUnansweredQuestions,startReply,submitReply,getPatientMessages} = require('../controllers/MessagesCline');


/**
 * @route   GET /api/messages/patient
 * @desc    جلب كل محادثات المريض مع الردود
 * @access  Private (sick)
 */
router.get('/patient',verifyToken,getPatientMessages);

/**
 * @route   POST /api/messages/questions
 * @desc    المريض يرسل سؤال جديد مع إمكانية إرفاق ملفات
 * @access  Private (sick)
 */
router.post('/questions',verifyToken,upload.array('files'),sendQuestion);

/**
 * @route   GET /api/messages/questions/unanswered
 * @desc    جلب جميع الأسئلة غير المجابة للأطباء
 * @access  Private (nurse)
 */
router.get('/questions/unanswered',verifyToken,getUnansweredQuestions);

/**
 * @route   PATCH /api/messages/questions/:messageId/lock
 * @desc    قفل السؤال عند بدء الطبيب بالرد
 * @access  Private (nurse)
 */
router.patch('/questions/:messageId/lock',verifyToken,startReply);

/**
 * @route   POST /api/messages/questions/:messageId/reply
 * @desc    الطبيب يرسل الرد النهائي على سؤال مع إمكانية إرفاق ملفات
 * @access  Private (nurse)
 */
router.post('/questions/:messageId/reply',verifyToken,upload.array('files'),submitReply);


module.exports = router;
