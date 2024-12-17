require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const ordersRouter = require('./routes/orders');
const dishesRouter = require('./routes/dishes');
const ratingsRouter = require('./routes/ratings');
const chefRouter = require('./routes/chef');
const path = require('path');

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(xss());

// 速率限制
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: '请求频率超限，请稍后再试',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000) - Date.now() / 1000
    });
  }
});

// 分别为不同的路由设置不同的限制
const ordersLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: '订单请求频率超限，请稍后再试'
});

const dishesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: '菜品请求频率超限，请稍后再试'
});

app.use('/api/orders', ordersLimiter);
app.use('/api/dishes', dishesLimiter);
app.use('/api', limiter);

// 基础中间件
app.use(cors());
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '50mb' }));
app.use(compression());

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      writeConcern: {
        w: 1,
        j: true
      },
      readPreference: 'primaryPreferred',
      retryWrites: true,
      heartbeatFrequencyMS: 10000
    });
    console.log('成功连接到数据库');
  } catch (error) {
    console.error('数据库连接错误:', error);
    process.exit(1);
  }
};

connectDB();

// 路由
app.use('/api/orders', ordersRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/chef', chefRouter);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/dishes', express.static(path.join(__dirname, '../uploads/dishes')));

// 处理 404
app.use((req, res) => {
  res.status(404).json({ message: '未找到请求的资源' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message;
  res.status(err.status || 500).json({ message });
});

// Vercel 需要导出 app
module.exports = app;

// 仅在非 Vercel 环境下启动服务器
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
  });
} 