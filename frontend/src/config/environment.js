const getApiUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  return window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
};

const config = {
  API_BASE_URL: getApiUrl(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development'
};

export default config;
