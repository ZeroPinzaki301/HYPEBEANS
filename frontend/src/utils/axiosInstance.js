import axios from "axios";

const axiosInstance = axios.create({
  baseURL: 
    process.env.NODE_ENV === "production"
      ? "https://hypebeans.onrender.com/api"
      : "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For cookies/sessions if used
});

// Add request interceptor for auth tokens if needed
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
