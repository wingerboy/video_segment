export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
// 从环境变量获取API URL，默认为localhost:5001
export const API_URL = process.env.REACT_APP_API_URL || `${API_BASE_URL}/api`;

export const API_BASE_URL_JAVA = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const API_URL_JAVA = process.env.REACT_APP_API_URL || `${API_BASE_URL_JAVA}/api`;