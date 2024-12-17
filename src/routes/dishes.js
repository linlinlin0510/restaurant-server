const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // 使用绝对路径
      const uploadDir = path.join(__dirname, '../../uploads/dishes');
      console.log('上传目录路径:', uploadDir);

      // 确保上传目录存在
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
          console.log('成功创建上传目录');
        } catch (mkdirError) {
          console.error('创建上传目录失败:', mkdirError);
          return cb(mkdirError);
        }
      }

      // 检查目录权限
      try {
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log('上传目录权限检查通过');
      } catch (accessError) {
        console.error('上传目录权限不足:', accessError);
        return cb(new Error('服务器上传目录权限不足'));
      }

      cb(null, uploadDir);
    } catch (error) {
      console.error('处理上传目录时发生错误:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // 获取文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      console.log('文件扩展名:', ext);

      // 生成安全的文件名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + ext;
      console.log('生成的文件名:', filename);

      cb(null, filename);
    } catch (error) {
      console.error('生成文件名时发生错误:', error);
      cb(error);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 限制2MB
    files: 1
  },
  fileFilter: function (req, file, cb) {
    try {
      // 检查MIME类型
      const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype)) {
        console.log('不支持的文件类型:', file.mimetype);
        return cb(new Error('只支持 JPG 和 PNG 格式的图片'));
      }

      // 检查文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        console.log('不支持的文件扩展名:', ext);
        return cb(new Error('只支持 .jpg 和 .png 格式的图片'));
      }

      console.log('文件类型检查通过:', file.mimetype);
      cb(null, true);
    } catch (error) {
      console.error('文件类型检查失败:', error);
      cb(error);
    }
  }
});

// 上传菜品图片
router.post('/upload', (req, res) => {
  console.log('收到图片上传请求');
  
  upload.single('image')(req, res, function(err) {
    if (err) {
      console.error('文件上传错误:', err);
      
      // 处理特定的错误类型
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '图片大小不能超过2MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: '文件上传失败: ' + err.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: err.message || '文件上传失败'
      });
    }

    try {
      if (!req.file) {
        console.log('未接收到上传文件');
        return res.status(400).json({ 
          success: false,
          message: '请选择要上传的图片' 
        });
      }

      console.log('上传的文件信息：', {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      const imageUrl = `/uploads/dishes/${req.file.filename}`;
      console.log('生成的图片URL：', imageUrl);

      res.json({ 
        success: true,
        url: imageUrl 
      });
    } catch (error) {
      console.error('处理上传图片请求失败：', error);
      // 如果发生错误，尝试删除已上传的文件
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('已删除错误上传的文件');
        } catch (unlinkError) {
          console.error('删除错误上传文件失败:', unlinkError);
        }
      }
      res.status(500).json({ 
        success: false,
        message: '服务器处理上传失败',
        error: error.message 
      });
    }
  });
});

// 获取所有菜品
router.get('/', async (req, res) => {
  console.log('收到获取所有菜品请求');
  try {
    const dishes = await Dish.find({ status: 'on' });
    console.log('查询到的菜品：', dishes);
    res.json(dishes);
  } catch (error) {
    console.error('获取菜品错误：', error);
    res.status(500).json({ message: error.message });
  }
});

// 按分类获取菜品
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  console.log('收到获取分类菜品请求，分类：', category);
  try {
    const query = category === '全部' ? { status: 'on' } : { category, status: 'on' };
    console.log('查询条件：', query);
    const dishes = await Dish.find(query);
    console.log('查询到的菜品：', dishes);
    res.json(dishes);
  } catch (error) {
    console.error('获取分类菜品错误：', error);
    res.status(500).json({ message: error.message });
  }
});

// 添加示例数据的路由（仅用于测试）
router.post('/init', async (req, res) => {
  console.log('收到初始化菜品数据请求');
  try {
    // 清空现有数据
    console.log('清空现有数据...');
    await Dish.deleteMany({});
    
    // 插入示例数据
    const sampleDishes = [
      {
        id: 1,
        name: '宫保鸡丁',
        price: 28,
        category: '热菜',
        description: '传统川菜，口感麻辣鲜香',
        image: 'https://gw.alicdn.com/tfs/TB1UdW.dHj1gK0jSZFuXXcrHpXa-1000-1000.jpg',
        status: 'on'
      },
      {
        id: 2,
        name: '酸辣土豆丝',
        price: 16,
        category: '凉菜',
        description: '开胃爽口',
        image: 'https://gw.alicdn.com/tfs/TB1l_qbdO_1gK0jSZFqXXcpaXXa-1000-1000.jpg',
        status: 'on'
      },
      {
        id: 3,
        name: '麻婆豆腐',
        price: 22,
        category: '热菜',
        description: '香辣可口，入口即化',
        image: 'https://gw.alicdn.com/tfs/TB1UdW.dHj1gK0jSZFuXXcrHpXa-1000-1000.jpg',
        status: 'on'
      },
      {
        id: 4,
        name: '米饭',
        price: 2,
        category: '主食',
        description: '香软可口',
        image: 'https://gw.alicdn.com/tfs/TB1l_qbdO_1gK0jSZFqXXcpaXXa-1000-1000.jpg',
        status: 'on'
      },
      {
        id: 5,
        name: '可乐',
        price: 6,
        category: '饮品',
        description: '冰镇可乐',
        image: 'https://gw.alicdn.com/tfs/TB1l_qbdO_1gK0jSZFqXXcpaXXa-1000-1000.jpg',
        status: 'on'
      }
    ];
    
    console.log('插入示例数据...');
    const result = await Dish.insertMany(sampleDishes);
    console.log('插入结果：', result);
    res.status(201).json({ message: '示例数据初始化成功', count: result.length });
  } catch (error) {
    console.error('初始化菜品数据错误：', error);
    res.status(500).json({ message: error.message });
  }
});

// 删除菜品
router.delete('/:id', async (req, res) => {
  const dishId = parseInt(req.params.id);
  console.log('收到删除菜品请求，ID:', dishId);
  
  try {
    const dish = await Dish.findOne({ id: dishId });
    console.log('查找到的菜品:', dish);
    
    if (!dish) {
      console.log('菜品不存在，ID:', dishId);
      return res.status(404).json({ message: '菜品不存在' });
    }

    // 检查该菜品是否在未完成的订单中
    const Order = require('../models/Order');
    const pendingOrders = await Order.find({
      status: { $in: ['pending', 'processing'] },
      'items.id': dishId
    });

    console.log('相关未完成订单数量:', pendingOrders.length);
    if (pendingOrders.length > 0) {
      console.log('菜品在未完成订单中，不能删除，订单IDs:', pendingOrders.map(o => o.id));
      return res.status(400).json({ 
        message: '该菜品在未完成的订单中，无法删除',
        orderIds: pendingOrders.map(o => o.id)
      });
    }

    // 执行删除
    const result = await Dish.deleteOne({ id: dishId });
    console.log('删除结果:', result);
    
    if (result.deletedCount === 0) {
      console.log('菜品删除失败，可能已被删除');
      return res.status(404).json({ message: '菜品不存在或已被删除' });
    }
    
    console.log('菜品删除成功，ID:', dishId);
    res.json({ message: '菜品已删除', id: dishId });
  } catch (error) {
    console.error('删除菜品失败：', error);
    res.status(500).json({ 
      message: error.message,
      details: error.stack
    });
  }
});

// 创建新菜品
router.post('/', async (req, res) => {
  console.log('收到创建菜品请求：', req.body);
  try {
    // 生成新的菜品ID
    const maxDish = await Dish.findOne().sort('-id');
    const newId = maxDish ? maxDish.id + 1 : 1;

    const dish = new Dish({
      id: newId,
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      image: req.body.image,
      status: req.body.status || 'on'
    });

    const newDish = await dish.save();
    console.log('菜品创建成功：', newDish);
    res.status(201).json(newDish);
  } catch (error) {
    console.error('创建菜品失败：', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : []
    });
  }
});

module.exports = router; 