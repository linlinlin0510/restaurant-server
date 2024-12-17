require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function createTestOrder() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('连接数据库成功');

    const testOrder = new Order({
      id: 'O1702819530123',
      customerName: '测试顾客',
      tableNumber: 'A1',
      items: [
        {
          name: '宫保鸡丁',
          price: 38,
          quantity: 1
        }
      ],
      totalAmount: 38,
      status: 'completed',
      createdAt: new Date()
    });

    await testOrder.save();
    console.log('测试订单创建成功');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('创建测试订单失败:', error);
  }
}

createTestOrder(); 