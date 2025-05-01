const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Video模型
const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  oriVideoPath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '原始视频绝对路径'
  },
  oriVideoUrlPath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '原始视频URL路径，用于前端访问'
  },
  oriVideoMd5: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '原始视频md5'
  },
  foreVideoPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '提取的前景视频路径'
  },
  foreVideoMd5: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '提取的前景视频md5'
  },
  oriVideoStatus: {
    type: DataTypes.ENUM('exists', 'deleted', 'expired'),
    defaultValue: 'exists',
    comment: '原始视频状态：存在、删除、过期等'
  },
  foreVideoStatus: {
    type: DataTypes.ENUM('exists', 'deleted', 'expired'),
    defaultValue: 'exists',
    comment: '前景视频状态：存在、删除、过期等'
  },
  oriVideoSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '原始视频大小（Mb）'
  },
  oriVideoDim: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '原始视频尺寸，例如 "1920x1080"'
  },
  oriVideoFrameCnt: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '原始视频总帧数'
  },
  oriVideoDuration: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '原始视频时长(秒)'
  },
  oriVideoFrameRate: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '原始视频帧率(fps)'
  },
  oriVideoCodec: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '原始视频编码格式'
  },
  oriVideoUsageCnt: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '原始视频使用次数'
  },
  oriVideoName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '原始视频名称'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'videos',
  timestamps: true,
  hooks: {
    beforeUpdate: (video) => {
      video.updatedAt = new Date();
    }
  },
  indexes: [
    // 定义复合唯一索引：email + md5 + status 组合保持唯一
    {
      unique: true,
      fields: ['email', 'oriVideoMd5', 'oriVideoStatus']
    }
  ]
});

// 通过Email查询视频
Video.findByEmail = async function(email) {
  return this.findAll({ 
    where: { email },
    order: [['createdAt', 'DESC']]
  });
};

// 通过Email和MD5查询视频
Video.findByEmailAndMd5 = async function(email, md5) {
  return this.findOne({ 
    where: { 
      email: email,
      oriVideoMd5: md5
    }
  });
};

module.exports = Video; 