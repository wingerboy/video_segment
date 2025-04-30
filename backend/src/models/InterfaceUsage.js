const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// 定义接口使用记录
const InterfaceUsage = sequelize.define('InterfaceUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  interfaceAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '接口地址 (例如：ip:8443)'
  },
  requestCnt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '请求次数'
  },
  resposeCnt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '响应次数'
  },
  succCnt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功次数'
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
  tableName: 'interface_usages',
  timestamps: true,
  hooks: {
    beforeUpdate: (record) => {
      record.updatedAt = new Date();
    }
  }
});

// 增加请求次数
InterfaceUsage.incrementRequest = async function(interfaceAddress) {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.requestCnt += 1;
    await record.save();
    return record;
  } else {
    return await this.create({
      interfaceAddress,
      requestCnt: 1,
      resposeCnt: 0,
      succCnt: 0
    });
  }
};

// 增加响应次数
InterfaceUsage.incrementResponse = async function(interfaceAddress, isSuccess = false) {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.resposeCnt += 1;
    if (isSuccess) {
      record.succCnt += 1;
    }
    await record.save();
    return record;
  } else {
    return await this.create({
      interfaceAddress,
      requestCnt: 0,
      resposeCnt: 1,
      succCnt: isSuccess ? 1 : 0
    });
  }
};

// 通过接口地址查找使用记录
InterfaceUsage.findByAddress = async function(interfaceAddress) {
  return this.findOne({ where: { interfaceAddress } });
};

module.exports = InterfaceUsage; 