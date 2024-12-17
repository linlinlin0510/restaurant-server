const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 获取所有订单
router.get('/', async (req, res) => {
  try {
    console.log('收到获取订单请求');
    const orders = await Order.find().sort({ createTime: -1 });
    console.log('从数据库获取的订单：', orders);

    const formattedOrders = {
      pending: orders.filter(order => order.status === 'pending'),
      processing: orders.filter(order => order.status === 'processing'),
      completed: orders.filter(order => order.status === 'completed')
    };

    console.log('格式化后的订单数据：', formattedOrders);
    res.json(formattedOrders);
  } catch (error) {
    console.error('获取订单失败：', error);
    res.status(500).json({ message: error.message });
  }
});

// 创建新订单
router.post('/', async (req, res) => {
  const startTime = Date.now();
  console.log('开始处理订单请求：', startTime);
  console.log('接收到的订单数据：', req.body);
  
  try {
    // 构建订单数据
    const orderData = {
      id: req.body.id || ('OD' + startTime), // 使用提供的ID或生成新ID
      items: req.body.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: req.body.totalAmount,
      tableNumber: req.body.tableNumber,
      status: 'pending',
      customerName: req.body.customerName,
      createTime: req.body.createTime || new Date()
    };

    console.log('数据准备耗时：', Date.now() - startTime, 'ms');
    console.log('准备保存订单：', orderData);
    
    const order = new Order(orderData);
    const saveStartTime = Date.now();
    const newOrder = await order.save();
    
    console.log('数据库保存耗时：', Date.now() - saveStartTime, 'ms');
    console.log('订单保存成功：', newOrder);
    
    res.status(201).json(newOrder);
    console.log('总处理时间：', Date.now() - startTime, 'ms');
  } catch (error) {
    console.error('保存订单失败：', error);
    console.log('错误发生时总耗时：', Date.now() - startTime, 'ms');
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : []
    });
  }
});

// 更新订单状态
router.patch('/:id/status', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    order.status = req.body.status;
    if (req.body.status === 'completed') {
      order.completeTime = new Date();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除订单
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: '订单未找到' });
    }

    // 只能删除待接单状态的订单
    if (order.status !== 'pending') {
      return res.status(400).json({ message: '只能取消待接单状态的订单' });
    }

    await Order.deleteOne({ id: req.params.id });
    res.json({ message: '订单已取消' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 