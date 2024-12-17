const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Chef = require('../models/Chef');

// 获取厨师信息
router.get('/info', async (req, res) => {
  console.log('收到获取厨师信息请求');
  const { orderId } = req.query;
  
  try {
    // 如果提供了订单ID，则返回与该订单相关的厨师信息
    if (orderId) {
      console.log('查询订单相关厨师信息，订单ID:', orderId);
      const order = await Order.findOne({ id: orderId });
      
      if (!order) {
        console.log('未找到订单:', orderId);
        return res.status(404).json({ 
          success: false,
          message: '未找到相关订单' 
        });
      }

      // 如果订单有指定的厨师，返回厨师信息
      if (order.chefId) {
        const chef = await Chef.findOne({ id: order.chefId });
        if (chef) {
          console.log('找到厨师信息:', chef);
          return res.json({
            success: true,
            chef: {
              id: chef.id,
              name: chef.name,
              avatar: chef.avatar,
              rating: chef.rating
            }
          });
        }
      }
      
      // 如果订单没有指定厨师或找不到厨师信息，返回默认值
      console.log('返回默认厨师信息');
      return res.json({
        success: true,
        chef: {
          id: 1,
          name: '主厨',
          avatar: '/images/chef-avatar.png',
          rating: 4.8
        }
      });
    }
    
    // 如果没有提供订单ID，返回默认厨师信息
    console.log('返回默认厨师信息');
    res.json({
      success: true,
      chef: {
        id: 1,
        name: '主厨',
        avatar: '/images/chef-avatar.png',
        rating: 4.8
      }
    });
  } catch (error) {
    console.error('获取厨师信息失败：', error);
    res.status(500).json({ 
      success: false,
      message: error.message || '获取厨师信息失败'
    });
  }
});

module.exports = router; 