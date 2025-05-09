const { DataTypes } = require('sequelize');
const { Op } = require('sequelize');
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
  status: {
    type: DataTypes.ENUM('idle', 'busy', 'offline'),
    defaultValue: 'idle',
    allowNull: false,
    comment: '接口状态：空闲、繁忙、离线'
  },
  currentTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: '当前正在处理的任务ID'
  },
  currentTaskMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '当前任务处理信息'
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后一次心跳时间'
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

// 查找空闲接口
InterfaceUsage.findIdle = async function() {
  return this.findOne({ 
    where: { status: 'idle' },
    order: [['succCnt', 'DESC']] // 优先选择成功率高的接口
  });
};

// 更新接口状态为忙碌
InterfaceUsage.setInterfaceBusy = async function(interfaceAddress, taskId, message = '任务开始处理') {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.status = 'busy';
    record.currentTaskId = taskId;
    record.currentTaskMessage = message;
    await record.save();
    return record;
  }
  return null;
};

// 释放接口，将状态设为空闲
InterfaceUsage.releaseInterface = async function(interfaceAddress) {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.status = 'idle';
    record.currentTaskId = null;
    record.currentTaskMessage = null;
    await record.save();
    return record;
  }
  return null;
};

// 更新接口状态为离线
InterfaceUsage.setInterfaceOffline = async function(interfaceAddress) {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.status = 'offline';
    await record.save();
    return record;
  }
  return null;
};

// 更新接口心跳时间
InterfaceUsage.updateHeartbeat = async function(interfaceAddress) {
  const record = await this.findOne({ where: { interfaceAddress } });
  if (record) {
    record.lastHeartbeat = new Date();
    // 如果接口之前是离线状态，现在有了心跳，将其状态改为空闲
    if (record.status === 'offline') {
      record.status = 'idle';
    }
    await record.save();
    return record;
  } else {
    // 如果接口不存在，创建一个新记录
    return await this.create({
      interfaceAddress,
      status: 'idle',
      lastHeartbeat: new Date()
    });
  }
};

// 检查离线的接口
InterfaceUsage.checkOfflineInterfaces = async function(heartbeatTimeout = 15) {
  const timeoutDate = new Date(Date.now() - (heartbeatTimeout * 60 * 1000)); // 默认15分钟超时
  
  // 查找所有最后心跳时间早于超时时间或没有心跳记录的非离线接口
  const interfaces = await this.findAll({
    where: {
      [Op.or]: [
        { lastHeartbeat: { [Op.lt]: timeoutDate } },
        { lastHeartbeat: null }
      ],
      status: { [Op.ne]: 'offline' }
    }
  });
  
  // 将这些接口标记为离线
  for (const interfaceRecord of interfaces) {
    interfaceRecord.status = 'offline';
    await interfaceRecord.save();
    console.log(`接口 ${interfaceRecord.interfaceAddress} 已标记为离线：心跳超时`);
  }
  
  return interfaces.length;
};

module.exports = InterfaceUsage; 