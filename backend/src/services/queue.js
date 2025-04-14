const Queue = require('bull');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Video } = require('../models');

// Create queues
const extractVideoQueue = new Queue('extract-video');
const applyBackgroundQueue = new Queue('apply-background');

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
    video.status = 'processing';
    await video.save();
    
    // Call AI API to extract video (mock for now)
    const response = await mockApiCall('extract_video', {
      video_path: video.originalVideo
    });
    
    // Update video with extracted foreground
    const extractedVideoPath = `uploads/extracted_${path.basename(video.originalVideo)}`;
    
    // In a real implementation, we would save the returned video from AI API
    // For mock purposes, we're just creating a path
    video.extractedForeground = extractedVideoPath;
    
    // If there's a background image, queue the apply background job
    if (video.backgroundImage) {
      await applyBackgroundQueue.add({
        videoId: video.id
      });
    } else {
      video.status = 'completed';
    }
    
    await video.save();
    return { success: true, videoId };
  } catch (error) {
    console.error('Extract video processing error:', error);
    // Update video status to failed
    const { videoId } = job.data;
    const video = await Video.findByPk(videoId);
    if (video) {
      video.status = 'failed';
      await video.save();
    }
    throw error;
  }
});

// Process apply background queue
applyBackgroundQueue.process(async (job) => {
  try {
    const { videoId } = job.data;
    
    // Get video from database
    const video = await Video.findByPk(videoId);
    if (!video || !video.extractedForeground || !video.backgroundImage) {
      throw new Error('Video, extracted foreground or background image not found');
    }
    
    // Update status
    video.status = 'processing';
    await video.save();
    
    // Call AI API to apply background (mock for now)
    const response = await mockApiCall('apply_custom_background', {
      video_path: video.extractedForeground,
      background_path: video.backgroundImage
    });
    
    // Update video with final video
    const finalVideoPath = `uploads/final_${path.basename(video.originalVideo)}`;
    
    // In a real implementation, we would save the returned video from AI API
    // For mock purposes, we're just creating a path
    video.finalVideo = finalVideoPath;
    video.status = 'completed';
    
    await video.save();
    return { success: true, videoId };
  } catch (error) {
    console.error('Apply background processing error:', error);
    // Update video status to failed
    const { videoId } = job.data;
    const video = await Video.findByPk(videoId);
    if (video) {
      video.status = 'failed';
      await video.save();
    }
    throw error;
  }
});

// Handle completed jobs
extractVideoQueue.on('completed', (job, result) => {
  console.log(`Extract video job ${job.id} completed for video ${result.videoId}`);
});

applyBackgroundQueue.on('completed', (job, result) => {
  console.log(`Apply background job ${job.id} completed for video ${result.videoId}`);
});

// Handle failed jobs
extractVideoQueue.on('failed', (job, error) => {
  console.error(`Extract video job ${job.id} failed:`, error);
});

applyBackgroundQueue.on('failed', (job, error) => {
  console.error(`Apply background job ${job.id} failed:`, error);
});

module.exports = {
  extractVideoQueue,
  applyBackgroundQueue
}; 