const Queue = require('bull');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Video } = require('../models');

// Create queues
const extractVideoQueue = new Queue('extract-video');

// Mock API function (until real AI API is ready)
const mockApiCall = async (endpoint, data, delay = 2000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Mock API call to ${endpoint}`);
      resolve({ success: true, data: { url: `mock_${Date.now()}.mp4` } });
    }, delay);
  });
};

// Process extract video queue
extractVideoQueue.process(async (job) => {
  try {
    const { videoId } = job.data;
    
    // Get video from database
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error('Video not found');
    }
    
    // Update status
    video.oriVideoStatus = 'processing';
    await video.save();
    
    // Call AI API to extract video (mock for now)
    const response = await mockApiCall('extract_video', {
      video_path: video.oriVideoPath
    });
    
    // Update video with extracted foreground
    const extractedVideoPath = `uploads/extracted_${path.basename(video.oriVideoPath)}`;
    
    // In a real implementation, we would save the returned video from AI API
    // For mock purposes, we're just creating a path
    video.foreVideoPath = extractedVideoPath;
    video.foreVideoStatus = 'exists';
    video.oriVideoStatus = 'exists';
    
    await video.save();
    return { success: true, videoId };
  } catch (error) {
    console.error('Extract video processing error:', error);
    // Update video status to failed
    const { videoId } = job.data;
    const video = await Video.findByPk(videoId);
    if (video) {
      video.oriVideoStatus = 'failed';
      await video.save();
    }
    throw error;
  }
});

// Handle completed jobs
extractVideoQueue.on('completed', (job, result) => {
  console.log(`Extract video job ${job.id} completed for video ${result.videoId}`);
});

// Handle failed jobs
extractVideoQueue.on('failed', (job, error) => {
  console.error(`Extract video job ${job.id} failed:`, error);
});

module.exports = {
  extractVideoQueue
}; 