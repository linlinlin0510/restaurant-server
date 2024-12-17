const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    _id: false,
    id: Number,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending'
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  completeTime: {
    type: Date
  },
  tableNumber: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Order', orderSchema); 