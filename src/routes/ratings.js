const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('评价路由模块已加载');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('处理文件上传目录');
    const uploadDir = path.join(__dirname, '../../uploads');
    console.log('上传目录:', uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log('创建上传目录');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log('生成文件名，原始文件名:', file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('生成的文件名:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: function (req, file, cb) {
    console.log('检查文件类型:', file.mimetype);
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只允许上传图片文件！'));
    }
    cb(null, true);
  }
});

// 上传图片
router.post('/upload', upload.single('image'), (req, res) => {
  console.log('收到图片上传请求');
  try {
    if (!req.file) {
      console.log('没有上传文件');
      return res.status(400).json({ message: '没有上传文件' });
    }

    console.log('上传的文件信息:', req.file);
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('生成的图片URL:', imageUrl);
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('上传图片失败：', error);
    res.status(500).json({ message: '上传失败' });
  }
});

// 提交评价
router.post('/', async (req, res) => {
  console.log('收到评价提交请求:', req.body);
  try {
    const { orderId, rating, content, images } = req.body;

    // 验证订单是否存在
    const order = await Order.findOne({ id: orderId });
    console.log('查询到的订单:', order);
    if (!order) {
      console.log('订单不存在');
      return res.status(404).json({ message: '订单不存在' });
    }

    // 检查是否已经评价过
    const existingRating = await Rating.findOne({ orderId });
    console.log('已存在的评价:', existingRating);
    if (existingRating) {
      console.log('订单已评价过');
      return res.status(400).json({ message: '该订单已经评价过了' });
    }

    // 创建新评价
    const newRating = new Rating({
      orderId,
      rating,
      content,
      images
    });

    console.log('准备保存的评价:', newRating);
    try {
      await newRating.save();
      console.log('评价保存成功');
      res.status(201).json(newRating);
    } catch (saveError) {
      console.error('保存评价时出错:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          message: '评价数据验证失败',
          details: Object.values(saveError.errors).map(err => err.message)
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('提交评价失败：', error);
    res.status(500).json({ 
      message: '评价失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 