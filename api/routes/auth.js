var express = require('express');
var router = express.Router();
const { verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifytoken');
const { register, verifyEmail,verifyPhone, uploadPersonalPhoto, login, viledLogin, logout } = require('../controllers/authcontroller');
const upload = require('../middlewares/uplod'); // هذا هو ملف multer

 
router.post('/register', register);
router.post('/verifyEmail', verifyEmail);
router.post('/verifyPhone', verifyPhone);
router.post('/login', login);
router.post('/viledLogin',verifyToken,viledLogin);
//logout router
router.post('/logout',verifyToken, logout);

router.post(
    '/uploadPersonalPhoto', verifyToken,upload.array('files'), uploadPersonalPhoto);



module.exports = router;
