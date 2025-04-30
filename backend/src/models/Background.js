const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义Background模型 - 背景图库
const Background = sequelize.define('Background', {
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
  backgroundPath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '背景路径'
  },
  backgroundMd5: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '背景md5'
  },
  backgroundStatus: {
    type: DataTypes.ENUM('exists', 'deleted', 'expired'),
    defaultValue: 'exists',
    comment: '背景状态：存在、删除、过期等'
  },
  backgroundSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '背景大小（字节）'
  },
  backgroundDim: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '图片尺寸，例如 "1920x1080"'
  },
  backgroundUsageCnt: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '背景使用次数'
  },
  backgroundName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '背景名称'
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
  tableName: 'backgrounds',
  timestamps: true,
  hooks: {
    beforeUpdate: (background) => {
      background.updatedAt = new Date();
    }
  },
  indexes: [
    // 定义复合唯一索引：email + md5 + status 组合保持唯一
    {
      unique: true,
      fields: ['email', 'backgroundMd5', 'backgroundStatus']
    }
  ]
});

// 通过Email查询背景
Background.findByEmail = async function(email) {
  return this.findAll({ 
    where: { email },
    order: [['createdAt', 'DESC']]
  });
};

// 通过Email和MD5查询背景
Background.findByEmailAndMd5 = async function(email, md5) {
  return this.findOne({ 
    where: { 
      email: email,
      backgroundMd5: md5
    }
  });
};

module.exports = Background; 