const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义模型使用记录
const ModelUsage = sequelize.define('ModelUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  modelName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '模型名称'
  },
  modelAlias: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '模型别名'
  },
  modelUsageCnt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '模型使用次数'
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
  tableName: 'model_usages',
  timestamps: true,
  hooks: {
    beforeUpdate: (record) => {
      record.updatedAt = new Date();
    }
  }
});

// 增加使用次数
ModelUsage.incrementUsage = async function(modelName) {
  const record = await this.findOne({ where: { modelName } });
  if (record) {
    record.modelUsageCnt += 1;
    await record.save();
    return record;
  } else {
    return await this.create({
      modelName,
      modelUsageCnt: 1
    });
  }
};

// 通过模型名查找使用记录
ModelUsage.findByModelName = async function(modelName) {
  return this.findOne({ where: { modelName } });
};

module.exports = ModelUsage; 