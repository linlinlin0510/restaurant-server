const mongoose = require('mongoose');

const chefSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '/images/chef-avatar.png'
  },
  rating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
chefSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Chef = mongoose.model('Chef', chefSchema);

module.exports = Chef; 