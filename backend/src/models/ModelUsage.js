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
    unique: true,
    comment: '模型名称'
  },
  modelAlias: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '模型别名'
  },
  modelDescription: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '模型描述'
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
    },
    afterSync: async () => {
      try {
        // 检查是否已存在默认模型
        const count = await ModelUsage.count({
          where: { modelName: 'BEN2_Base' }
        });

        // 如果不存在，添加默认模型
        if (count === 0) {
          await ModelUsage.create({
            modelName: 'BEN2_Base',
            modelAlias: '李白',
            modelDescription: '准确率高、模型推理时间长',
            modelUsageCnt: 0
          });
          console.log('成功添加默认模型: BEN2_Base (李白)');
        }
      } catch (error) {
        console.error('添加默认模型失败:', error);
      }
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

// 获取所有可用模型的别名和描述
ModelUsage.getAvailableModels = async function() {
  return this.findAll({
    attributes: ['modelName', 'modelAlias', 'modelDescription'],
    order: [['modelUsageCnt', 'DESC']]
  });
};

// 初始化默认模型
sequelize.afterSync(async () => {
  try {
    // 检查默认模型是否存在
    const defaultModel = await ModelUsage.findOne({
      where: { modelName: 'BEN2_Base' }
    });
    
    // 如果不存在则创建
    if (!defaultModel) {
      await ModelUsage.create({
        modelName: 'BEN2_Base',
        modelAlias: '李白',
        modelDescription: '准确率高、模型推理时间长',
        modelUsageCnt: 0
      });
      console.log('已创建默认模型: BEN2_Base (李白)');
    }
  } catch (error) {
    console.error('初始化默认模型失败:', error);
  }
});

module.exports = ModelUsage; 