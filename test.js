require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 创建测试图片
const testImagePath = path.join(__dirname, 'test-image.png');
const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(base64Data, 'base64');
fs.writeFileSync(testImagePath, imageBuffer);
console.log('测试图片已创建');

const API_BASE_URL = 'http://localhost:3002/api';
const orderId = `O${Date.now()}`;

// 创建测试订单
async function createTestOrder() {
  const Order = require('./src/models/Order');
  const mongoose = require('mongoose');
  
  try {
    console.log('数据库URL:', process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('连接数据库成功');

    const testOrder = new Order({
      id: orderId,
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
    throw error;
  }
}

async function testAPIs() {
  try {
    // 创建测试订单
    await createTestOrder();

    // 1. 测试获取厨师信息
    console.log('\n1. 测试获取厨师信息');
    const chefInfo = await axios.get(`${API_BASE_URL}/chef/info`, {
      params: { orderId }
    });
    console.log('厨师信息:', chefInfo.data);

    // 2. 测试图片上传
    console.log('\n2. 测试图片上传');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    try {
      const uploadResponse = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: formData.getHeaders()
      });
      console.log('上传响应:', uploadResponse.data);

      // 3. 测试提交评价
      console.log('\n3. 测试提交评价');
      try {
        const ratingResponse = await axios.post(`${API_BASE_URL}/ratings`, {
          orderId,
          rating: 5,
          content: '服务很好，菜品美味！',
          images: [uploadResponse.data.url]
        });
        console.log('评价响应:', ratingResponse.data);
      } catch (ratingError) {
        console.error('评价提交失败:', ratingError.response ? {
          status: ratingError.response.status,
          data: ratingError.response.data,
          headers: ratingError.response.headers
        } : ratingError.message);
      }
    } catch (uploadError) {
      console.error('图片上传失败:', uploadError.response ? {
        status: uploadError.response.status,
        data: uploadError.response.data,
        headers: uploadError.response.headers
      } : uploadError.message);
    }

    // 清理测试图片
    fs.unlinkSync(testImagePath);
    console.log('\n测试完成，已清理测试图片');

  } catch (error) {
    console.error('测试失败:', error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : error.message);
    // 确保清理测试图片
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// 运行测试
testAPIs(); 