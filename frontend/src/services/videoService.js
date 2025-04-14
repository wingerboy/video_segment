import axios from 'axios';

const API_URL = 'http://localhost:5001/api/videos';

// 配置axios默认设置
axios.defaults.withCredentials = true;

// Get all videos for current user
export const getAllVideos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data.videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

// Get a single video by ID
export const getVideoById = async (videoId) => {
  try {
    const response = await axios.get(`${API_URL}/${videoId}`);
    return response.data.video;
  } catch (error) {
    console.error(`Error fetching video ${videoId}:`, error);
    throw error;
  }
};

// Upload a new video
export const uploadVideo = async (videoFile) => {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.video;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

// Upload a background image for a video
export const uploadBackgroundImage = async (videoId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await axios.post(`${API_URL}/background/${videoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.video;
  } catch (error) {
    console.error('Error uploading background image:', error);
    throw error;
  }
};

// Delete a video
export const deleteVideo = async (videoId) => {
  try {
    const response = await axios.delete(`${API_URL}/${videoId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting video ${videoId}:`, error);
    throw error;
  }
}; 