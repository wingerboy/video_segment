const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const sharp = require('sharp'); // 引入sharp库
const { authenticate } = require('../middleware/auth');
const { Background } = require('../models');
const config = require('../config');

// 加载环境变量
dotenv.config();

const router = express.Router();

// 获取配置的上传路径
const UPLOAD_BACKGROUNDS_DIR = config.PHYSICAL_BACKGROUNDS_DIR;
const UPLOAD_URL_PATH = config.UPLOAD_BACKGROUNDS_URL_PATH;
const UPLOAD_FILE_SIZE_LIMIT = config.UPLOAD_FILE_SIZE_LIMIT;

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

/**
 * 获取图片详细信息
 * @param {string} filePath 图片文件路径
 * @returns {Promise<Object>} 图片元数据信息
 */
const getImageDetails = async (filePath) => {
  try {
    // 验证文件存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    
    // 获取文件基本信息
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const fileSizeKB = Math.ceil(fileSize / 1024);
    
    // 获取图片的详细元数据
    const metadata = await sharp(filePath).metadata();
    
    // 提取核心信息
    const dimensions = `${metadata.width}x${metadata.height}`;
    const aspectRatio = metadata.width / metadata.height;
    
    // 整理图片元数据
    const imageInfo = {
      dimensions: dimensions,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: parseFloat(aspectRatio.toFixed(2)),
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation || 1,
      size: fileSizeKB,
      isLandscape: metadata.width >= metadata.height,
      isPortrait: metadata.width < metadata.height,
      fileSize: fileSize,
      fileSizeFormatted: `${(fileSizeKB / 1024).toFixed(2)} MB`
    };
    
    // 记录元数据信息到日志
    console.log('图片详细信息:', JSON.stringify(imageInfo, null, 2));
    
    return imageInfo;
  } catch (error) {
    console.error('获取图片信息失败:', error);
    console.error('文件路径:', filePath);
    
    // 返回默认值
    return {
      dimensions: '0x0',
      width: 0,
      height: 0,
      aspectRatio: 0,
      format: null,
      hasAlpha: false,
      size: 0,
      error: error.message
    };
  }
};

// 简单获取尺寸（向后兼容）
const getImageDimensions = async (filePath) => {
  const imageInfo = await getImageDetails(filePath);
  return imageInfo.dimensions;
};

// 获取所有背景 - 需要验证用户
router.get('/user', authenticate, async (req, res) => {
  try {
    const backgrounds = await Background.findByEmail(req.user.email);
    
    res.json(backgrounds.map(background => ({
      id: background.id,
      backgroundPath: background.backgroundPath, // 返回绝对路径
      backgroundUrlPath: background.backgroundUrlPath, // 返回URL路径
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
    console.log('文件MD5:', md5Hash);
    
    // 获取图片详细信息
    const imageInfo = await getImageDetails(filePath);
    
    // 文件名称
    const backgroundName = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));
    
    // 创建新背景记录
    const newBackground = await Background.create({
      email: req.user.email,
      backgroundMd5: md5Hash,
      backgroundPath: filePath, // 存储绝对路径
      backgroundUrlPath: virtualPath, // 存储虚拟路径，用于URL访问
      backgroundSize: imageInfo.size || Math.ceil(req.file.size / 1024), // 使用图片元数据或文件大小
      backgroundDim: imageInfo.dimensions,
      backgroundStatus: 'exists',
      backgroundUsageCnt: 0,
      backgroundName: backgroundName,
      backgroundFormat: imageInfo.format || path.extname(req.file.originalname).substring(1),
      backgroundHasAlpha: imageInfo.hasAlpha || false,
      backgroundExtra: JSON.stringify({
        aspectRatio: imageInfo.aspectRatio,
        isLandscape: imageInfo.isLandscape,
        channels: imageInfo.channels,
        space: imageInfo.space,
        orientation: imageInfo.orientation
      })
    });
    
    res.status(201).json({ 
      message: '背景上传成功',
      background: {
        id: newBackground.id,
        backgroundName: newBackground.backgroundName,
        backgroundPath: newBackground.backgroundPath, // 返回绝对路径
        backgroundUrlPath: newBackground.backgroundUrlPath, // 返回URL路径
        backgroundDim: newBackground.backgroundDim,
        backgroundSize: newBackground.backgroundSize,
        backgroundFormat: newBackground.backgroundFormat,
        backgroundHasAlpha: newBackground.backgroundHasAlpha,
        createdAt: newBackground.createdAt
      }
    });
  } catch (error) {
    console.error('上传背景失败:', error);
    
    // 如果上传过程中出错，尝试删除已上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('已删除上传的文件:', req.file.path);
      } catch (unlinkError) {
        console.error('删除上传文件失败:', unlinkError);
      }
    }
    
    // 返回适当的错误信息
    let errorMessage = '上传背景失败';
    let statusCode = 500;
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = `文件大小超过限制 (最大 ${UPLOAD_FILE_SIZE_LIMIT}MB)`;
      statusCode = 413;
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = '意外的文件字段名称';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: error.message 
    });
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

// 获取单个背景详情 - 需要验证用户
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    const backgroundId = req.params.id;
    
    // 查找背景并确保属于当前用户
    const background = await Background.findOne({
      where: { 
        id: backgroundId,
        email: req.user.email,
        backgroundStatus: 'exists'
      }
    });
    
    if (!background) {
      return res.status(404).json({ message: '背景不存在或无访问权限' });
    }
    
    // 解析额外信息
    let extraInfo = {};
    try {
      if (background.backgroundExtra) {
        extraInfo = JSON.parse(background.backgroundExtra);
      }
    } catch (parseError) {
      console.error('解析背景额外信息失败:', parseError);
    }
    
    // 返回格式化的背景信息
    res.json({
      id: background.id,
      backgroundName: background.backgroundName,
      backgroundPath: background.backgroundPath, // 返回绝对路径
      backgroundUrlPath: background.backgroundUrlPath, // 返回URL路径
      backgroundSize: background.backgroundSize,
      backgroundSizeFormatted: background.backgroundSize < 1024 
        ? `${background.backgroundSize} KB` 
        : `${(background.backgroundSize / 1024).toFixed(2)} MB`,
      backgroundDim: background.backgroundDim,
      backgroundMd5: background.backgroundMd5,
      backgroundStatus: background.backgroundStatus,
      backgroundFormat: background.backgroundFormat,
      backgroundHasAlpha: background.backgroundHasAlpha,
      backgroundUsageCnt: background.backgroundUsageCnt,
      // 解析尺寸信息
      width: background.backgroundDim ? parseInt(background.backgroundDim.split('x')[0]) : 0,
      height: background.backgroundDim ? parseInt(background.backgroundDim.split('x')[1]) : 0,
      // 额外元数据信息
      ...extraInfo,
      createdAt: background.createdAt,
      updatedAt: background.updatedAt
    });
  } catch (error) {
    console.error('获取背景详情失败:', error);
    res.status(500).json({ message: '获取背景详情失败', error: error.message });
  }
});

module.exports = router; 