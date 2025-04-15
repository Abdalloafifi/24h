const { Server } = require("socket.io");
let io;
const userSocketMap = {};

// تهيئة الـ Socket.IO وربطه بالسيرفر
const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [ "http://localhost:5173"], // الأصول المسموحة
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // تخزين معرف المستخدم عند الاتصال
    const userId = socket.handshake.auth.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // إرسال قائمة المتصلين للجميع
    io.emit("onlineUsers", Object.keys(userSocketMap));

    // إدارة انفصال المستخدم
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      if (userId) delete userSocketMap[userId];
      io.emit("onlineUsers", Object.keys(userSocketMap));
    });
  });
};

// دالة لإرجاع socketId الخاص بالمستخدم
const getReceiverSocketId = (userId) => userSocketMap[userId];

// دالة getter للـ io للتأكد من أنه تم تهيئته
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call setupSocket() first.");
  }
  return io;
};

module.exports = { setupSocket, getReceiverSocketId, getIO };
