const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { authenticate } = require('../middleware/auth');
const { Background } = require('../models');

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || 'uploads';
const UPLOAD_BACKGROUNDS_DIR = process.env.UPLOAD_BACKGROUNDS_DIR || 'uploads/backgrounds';
const UPLOAD_FILE_SIZE_LIMIT = parseInt(process.env.UPLOAD_FILE_SIZE_LIMIT || '5'); // 默认5MB

// 确保上传目录存在
const ensureDir = (dirPath) => {
  const absolutePath = path.join(__dirname, '../../', dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
};

// 创建背景图片上传目录
const backgroundUploadDir = ensureDir(UPLOAD_BACKGROUNDS_DIR);

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, backgroundUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'background-' + uniqueSuffix + extension);
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件！'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_FILE_SIZE_LIMIT * 1024 * 1024 // 使用配置的文件大小限制
  }
});

// 计算文件的MD5哈希值
const calculateMD5 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// 获取图片尺寸（此处简化处理，实际应使用图像处理库如sharp或jimp）
const getImageDimensions = async (filePath) => {
  // 模拟获取图片尺寸，实际项目中应使用图像处理库
  return '1920x1080';  // 返回默认尺寸
};

// 获取所有背景 - 需要验证用户
router.get('/', authenticate, async (req, res) => {
  try {
    const backgrounds = await Background.findAll({ 
      where: { 
        userId: req.user.id,
        status: 'active'
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(backgrounds);
  } catch (error) {
    console.error('获取背景失败:', error);
    res.status(500).json({ message: '获取背景失败', error: error.message });
  }
});

// 上传新背景 - 需要验证用户
router.post('/', authenticate, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有文件上传或文件类型不正确' });
    }
    
    const filePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath).replace(/\\/g, '/');
    
    // 计算MD5哈希值
    const md5Hash = await calculateMD5(filePath);
    
    // 获取图片尺寸
    const dimensions = await getImageDimensions(filePath);
    
    // 创建新背景记录
    const newBackground = await Background.create({
      userId: req.user.id,
      md5Hash: md5Hash,
      path: relativePath,
      size: req.file.size,
      dimensions: dimensions,
      status: 'active',
      usageCount: 0
    });
    
    res.status(201).json({
      id: newBackground.id,
      name: req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      path: relativePath,
      size: req.file.size,
      dimensions: dimensions,
      md5Hash: md5Hash,
      createdAt: newBackground.createdAt
    });
  } catch (error) {
    console.error('上传背景失败:', error);
    res.status(500).json({ message: '上传背景失败', error: error.message });
  }
});

// 删除背景 - 需要验证用户
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const backgroundId = req.params.id;
    
    // 查找背景并确保属于当前用户
    const background = await Background.findOne({
      where: { 
        id: backgroundId,
        userId: req.user.id
      }
    });
    
    if (!background) {
      return res.status(404).json({ message: '背景不存在或无权限删除' });
    }
    
    // 标记为已删除（软删除）而不是物理删除文件
    background.status = 'deleted';
    await background.save();
    
    // 如果需要也可以物理删除文件
    // const filePath = path.join(__dirname, '../..', background.path);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
    
    res.json({ message: '背景已删除', background: { id: background.id } });
  } catch (error) {
    console.error('删除背景失败:', error);
    res.status(500).json({ message: '删除背景失败', error: error.message });
  }
});

// 增加背景使用次数
router.put('/:id/increment-usage', authenticate, async (req, res) => {
  try {
    const backgroundId = req.params.id;
    
    const background = await Background.findOne({
      where: { 
        id: backgroundId,
        userId: req.user.id,
        status: 'active'
      }
    });
    
    if (!background) {
      return res.status(404).json({ message: '背景不存在或已删除' });
    }
    
    background.usageCount += 1;
    await background.save();
    
    res.json({ 
      message: '背景使用次数已更新',
      background: {
        id: background.id,
        usageCount: background.usageCount
      }
    });
  } catch (error) {
    console.error('更新背景使用次数失败:', error);
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

// 检查背景图是否已存在（通过MD5哈希）
router.get('/check/:md5Hash', authenticate, async (req, res) => {
  try {
    const md5Hash = req.params.md5Hash;
    
    // 在数据库中查找相同MD5的背景图
    const existingBackground = await Background.findOne({
      where: {
        md5Hash: md5Hash,
        userId: req.user.id,
        status: 'active'
      },
      attributes: ['id', 'path', 'size', 'dimensions']
    });
    
    if (existingBackground) {
      return res.status(200).json({
        exists: true,
        background: {
          id: existingBackground.id,
          path: existingBackground.path,
          size: existingBackground.size,
          dimensions: existingBackground.dimensions
        }
      });
    }
    
    // 未找到相同MD5的背景图
    res.status(404).json({ exists: false });
  } catch (error) {
    console.error('检查背景图失败:', error);
    res.status(500).json({ message: '检查背景图失败', error: error.message });
  }
});

module.exports = router; 