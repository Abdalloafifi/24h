const mongoose = require('mongoose');

//category schema
const categorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    price: {
        type: Number,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, { timestamps: true });

const category = mongoose.model('category', categorySchema);
module.exports = category;