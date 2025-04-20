var express = require('express');
var router = express.Router();
const { verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifytoken');
const { register, verifyEmail,verifyPhone, uploadPersonalPhoto, login, viledLogin, logout } = require('../controllers/authcontroller');
const upload = require('../middlewares/uplod'); // هذا هو ملف multer

 
router.post('/register', register);
router.post('/verifyEmail', verifyToken, verifyEmail);
router.post('/verifyPhone', verifyToken, verifyPhone);
router.post('/login', login);
router.post('/viledLogin',verifyToken,viledLogin);
//logout router
router.post('/logout', logout);

router.post(
    '/uploadPersonalPhoto', verifyToken,upload.array('files'), uploadPersonalPhoto);



module.exports = router;
