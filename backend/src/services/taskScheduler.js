const { Task, InterfaceUsage, ModelUsage } = require('../models');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 任务调度器
 * 负责将等待中的任务分配给可用的接口
 */
class TaskScheduler {
  constructor() {
    // 使用配置中心的设置
    this.POLL_INTERVAL = config.SCHEDULER_INTERVAL;
    this.running = false;
    this.timeout = null;
  }

  /**
   * 启动任务调度器
   */
  async start() {
    if (this.running) return;
    
    this.running = true;
    logger.info('任务调度器已启动');
    
    // 立即开始第一次调度
    this.scheduleTasks();
  }

  /**
   * 停止任务调度器
   */
  async stop() {
    this.running = false;
    logger.info('任务调度器已停止');
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * 调度任务
   * - 查找等待中的任务
   * - 找到空闲接口
   * - 将任务分配给接口
   */
  async scheduleTasks() {
    try {
      if (!this.running) return;
      
      logger.info('开始任务调度轮询...');
      
      // 1. 检查接口心跳状态，将心跳超时的接口标记为离线
      const offlineCount = await InterfaceUsage.checkOfflineInterfaces();
      if (offlineCount > 0) {
        logger.info(`检测到 ${offlineCount} 个接口心跳超时，已标记为离线`);
      }
      
      // 2. 查找等待中的任务
      const waitingTasks = await Task.findAll({
        where: { taskStatus: 'waiting' },
        order: [['taskStartTime', 'ASC']], // 先进先出
        limit: 5 // 一次处理5个任务
      });
      
      if (waitingTasks.length > 0) {
        logger.info(`找到 ${waitingTasks.length} 个等待处理的任务`);
        
        // 3. 给每个任务分配接口
        for (const task of waitingTasks) {
          await this.assignTaskToInterface(task);
        }
      } else {
        logger.debug('没有等待中的任务');
      }
    } catch (error) {
      logger.error('任务调度出错:', { error: error.message, stack: error.stack });
    } finally {
      // 设置下一次轮询
      this.timeout = setTimeout(() => this.scheduleTasks(), this.POLL_INTERVAL);
    }
  }

  /**
   * 为任务分配接口
   * @param {Task} task 等待处理的任务
   */
  async assignTaskToInterface(task) {
    try {
      // 1. 查找空闲接口
      const idleInterface = await InterfaceUsage.findIdle();
      
      if (!idleInterface) {
        logger.warn(`任务 #${task.id} 没有可用的接口，稍后再试`, { taskId: task.id });
        return;
      }
      
      logger.info(`为任务 #${task.id} 分配接口: ${idleInterface.interfaceAddress}`, { 
        taskId: task.id, 
        interfaceAddress: idleInterface.interfaceAddress 
      });
      
      // 1.1 记录接口请求次数 +1
      await InterfaceUsage.incrementRequest(idleInterface.interfaceAddress);
      logger.debug(`接口 ${idleInterface.interfaceAddress} 请求次数 +1`, { 
        taskId: task.id, 
        interfaceAddress: idleInterface.interfaceAddress 
      });
      
      // 2. 准备任务数据
      const taskData = {
        taskId: String(task.id),  // 转换为字符串类型，适配Python的str类型
        videoPath: task.oriVideoPath,
        foregroundPath: task.foreVideoPath || null,  // Optional[str] = None，使用null
        backgroundPath: task.backgroundPath || null,  // Optional[str] = None，使用null
        modelName: task.modelName,
        modelAlias: task.modelAlias || null,  // Optional[str] = None，使用null
        callbackUrl: `${config.API_BASE_URL}/api/tasks/callback`,  // 保持与后端路由一致
        workerUrl: idleInterface.interfaceAddress
      };
      
      logger.debug(`发送任务数据到接口:`, { 
        taskId: task.id, 
        interfaceAddress: idleInterface.interfaceAddress,
        taskData 
      });
      
      // 3. 调用接口服务
      const response = await axios.post(`${idleInterface.interfaceAddress}/api/video/segment`, taskData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 100000000 // 100000秒超时
      });
      
      // 打印接口返回的响应信息
      logger.debug(`接口返回响应:`, { 
        taskId: task.id, 
        interfaceAddress: idleInterface.interfaceAddress, 
        response: response.data 
      });
      
      // AI server返回格式： { taskId, status: "accepted", message, maskVideoPath }
      if (response.data && response.data.status === "accepted") {
        logger.info(`任务 #${task.id} 已成功分配到接口`, { 
          taskId: task.id, 
          interfaceAddress: idleInterface.interfaceAddress 
        });
        
        // 3.1 记录接口响应次数 +1
        await InterfaceUsage.incrementResponse(idleInterface.interfaceAddress, true);
        logger.debug(`接口 ${idleInterface.interfaceAddress} 响应次数 +1, 成功次数 +1`, { 
          taskId: task.id, 
          interfaceAddress: idleInterface.interfaceAddress 
        });
        
        // 3.2 更新接口的当前任务消息
        await InterfaceUsage.setInterfaceBusy(
          idleInterface.interfaceAddress, 
          task.id, 
          response.data.message || '任务处理中'
        );
        
        // 3.3 如果任务关联了模型，记录模型使用次数 +1
        if (task.modelName) {
          await ModelUsage.incrementUsage(task.modelName);
          logger.debug(`模型 ${task.modelName} 使用次数 +1`, { 
            taskId: task.id, 
            modelName: task.modelName,
            modelAlias: task.modelAlias || null
          });
        }
        
        // 4. 更新任务状态为processing
        task.taskStatus = 'processing';
        task.taskProgress = 0;
        task.foreVideoPath = response.data.maskVideoPath;
        task.outputVideoPath = response.data.compositeVideoPath;
        task.interfaceAddress = idleInterface.interfaceAddress;
        await task.save();
        
        logger.info(`任务 #${task.id} 状态已更新为processing`, { 
          taskId: task.id, 
          interfaceAddress: idleInterface.interfaceAddress 
        });
      } else {
        // 记录接口响应，但不计为成功
        await InterfaceUsage.incrementResponse(idleInterface.interfaceAddress, false);
        logger.debug(`接口 ${idleInterface.interfaceAddress} 响应次数 +1, 请求被拒绝`, { 
          taskId: task.id, 
          interfaceAddress: idleInterface.interfaceAddress 
        });
        
        throw new Error(response.data?.message || '接口服务拒绝任务');
      }
    } catch (error) {
      logger.error(`为任务 #${task.id} 分配接口失败:`, { 
        taskId: task.id, 
        error: error.message, 
        stack: error.stack 
      });
      
      // 如果是因为接口连接失败，标记接口为离线
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        const interfaceAddress = task.interfaceAddress || error.config?.url?.split('/')[0];
        if (interfaceAddress) {
          logger.warn(`接口 ${interfaceAddress} 连接失败，标记为离线`, { 
            taskId: task.id, 
            interfaceAddress, 
            errorCode: error.code 
          });
          await InterfaceUsage.setInterfaceOffline(interfaceAddress);
        }
      }
      
      // 记录失败原因，但不改变任务状态，下次轮询会再次尝试
    }
  }
}

// 创建单例
const scheduler = new TaskScheduler();

module.exports = scheduler; 