var express = require('express');
var router = express.Router();
const { verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifytoken');
const { acceptOrder, completeOrder, createOrder, getNearbyOrders } = require("../controllers/orderController");

router.post("/orders",verifyToken, createOrder);
router.get("/orders/nearby",verifyToken, getNearbyOrders);
router.put("/orders/:id/accept", verifyToken, acceptOrder);
router.put("/orders/:id/complete", verifyToken, completeOrder);



module.exports = router;
