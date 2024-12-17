const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  status: { type: String, enum: ['on', 'off'], default: 'on' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', dishSchema); 