const fs = require('fs');

const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(base64Data, 'base64');

fs.writeFileSync('test-image.png', imageBuffer);
console.log('测试图片已创建'); 