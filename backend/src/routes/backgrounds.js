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
const UPLOAD_BACKGROUNDS_DIR = process.env.UPLOAD_BACKGROUNDS_DIR || 'uploads/backgrounds';
const UPLOAD_URL_PATH = process.env.UPLOAD_BACKGROUNDS_URL_PATH || 'backgrounds'; // 虚拟路径，用于URL访问
const UPLOAD_FILE_SIZE_LIMIT = parseInt(process.env.UPLOAD_FILE_SIZE_LIMIT || '5'); // 默认5MB

console.log('背景图片上传配置:');
console.log(`- 物理路径配置: ${UPLOAD_BACKGROUNDS_DIR}`);
console.log(`- 虚拟URL路径: ${UPLOAD_URL_PATH}`);
console.log(`- 文件大小限制: ${UPLOAD_FILE_SIZE_LIMIT}MB`);

// 确保上传目录存在
const ensureDir = (dirPath) => {
  // 判断是否为绝对路径
  const absolutePath = path.isAbsolute(dirPath) 
    ? dirPath // 如果是绝对路径，直接使用
    : path.join(__dirname, '../../', dirPath); // 如果是相对路径，转为绝对路径
  
  console.log('上传目录绝对路径:', absolutePath);
  
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    console.log('创建上传目录:', absolutePath);
  } else {
    console.log('上传目录已存在:', absolutePath);
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
router.get('/user', authenticate, async (req, res) => {
  try {
    const backgrounds = await Background.findByEmail(req.user.email);
    
    res.json(backgrounds.map(background => ({
      id: background.id,
      backgroundPath: background.backgroundPath,
      backgroundMd5: background.backgroundMd5,
      backgroundSize: background.backgroundSize,
      backgroundDim: background.backgroundDim,
      backgroundStatus: background.backgroundStatus,
      backgroundUsageCnt: background.backgroundUsageCnt,
      backgroundName: background.backgroundName,
      createdAt: background.createdAt,
      updatedAt: background.updatedAt
    })));
  } catch (error) {
    console.error('获取背景失败:', error);
    res.status(500).json({ message: '获取背景失败', error: error.message });
  }
});

// 上传新背景 - 需要验证用户
router.post('/upload', authenticate, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有文件上传或文件类型不正确' });
    }
    
    const filePath = req.file.path;
    
    // 使用虚拟路径映射，不存储物理路径
    const fileName = req.file.filename;
    const virtualPath = `${UPLOAD_URL_PATH}/${fileName}`; // 使用虚拟路径格式
    
    console.log('文件物理路径:', filePath);
    console.log('存储的虚拟路径:', virtualPath);
    
    // 计算MD5哈希值
    const md5Hash = await calculateMD5(filePath);
    
    // 获取图片尺寸
    const dimensions = await getImageDimensions(filePath);
    
    // 文件名称
    const backgroundName = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));
    
    // 创建新背景记录
    const newBackground = await Background.create({
      email: req.user.email,
      backgroundMd5: md5Hash,
      backgroundPath: virtualPath, // 存储虚拟路径，用于URL访问
      backgroundSize: Math.ceil(req.file.size / 1024), // 转换为KB并向上取整
      backgroundDim: dimensions,
      backgroundStatus: 'exists',
      backgroundUsageCnt: 0,
      backgroundName: backgroundName
    });
    
    res.status(201).json({
      id: newBackground.id,
      backgroundName: newBackground.backgroundName,
      backgroundPath: newBackground.backgroundPath, // 返回虚拟路径，前端据此构建完整URL
      backgroundSize: newBackground.backgroundSize,
      backgroundDim: newBackground.backgroundDim,
      backgroundMd5: newBackground.backgroundMd5,
      backgroundStatus: newBackground.backgroundStatus,
      createdAt: newBackground.createdAt
    });
  } catch (error) {
    console.error('上传背景失败:', error);
    // 如果上传过程中出错，尝试删除已上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('删除上传文件失败:', unlinkError);
      }
    }
    res.status(500).json({ message: '上传背景失败', error: error.message });
  }
});

// 删除背景 - 需要验证用户
router.delete('/del/:id', authenticate, async (req, res) => {
  try {
    const backgroundId = req.params.id;
    
    // 查找背景并确保属于当前用户
    const background = await Background.findOne({
      where: { 
        id: backgroundId,
        email: req.user.email
      }
    });
    
    if (!background) {
      return res.status(404).json({ message: '背景不存在或无权限删除' });
    }
    
    // 标记为已删除（软删除）而不是物理删除文件
    background.backgroundStatus = 'deleted';
    await background.save();
    
    // 如果需要也可以物理删除文件
    // const filePath = path.join(__dirname, '../..', background.backgroundPath);
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
router.put('/usage/:id', authenticate, async (req, res) => {
  try {
    const backgroundId = req.params.id;
    
    const background = await Background.findOne({
      where: { 
        id: backgroundId,
        email: req.user.email,
        backgroundStatus: 'exists'
      }
    });
    
    if (!background) {
      return res.status(404).json({ message: '背景不存在或已删除' });
    }
    
    background.backgroundUsageCnt += 1;
    await background.save();
    
    res.json({ 
      message: '背景使用次数已更新',
      background: {
        id: background.id,
        backgroundUsageCnt: background.backgroundUsageCnt
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
    const existingBackground = await Background.findByEmailAndMd5(
      req.user.email,
      md5Hash
    );
    
    if (existingBackground) {
      return res.status(200).json({
        exists: true,
        background: {
          id: existingBackground.id,
          backgroundPath: existingBackground.backgroundPath,
          backgroundSize: existingBackground.backgroundSize,
          backgroundDim: existingBackground.backgroundDim,
          backgroundStatus: existingBackground.backgroundStatus
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