import axios from 'axios'

// Get the current environment
const isDevelopment = import.meta.env.DEV

const axiosBase = axios.create({
    // In development, use localhost, in production use the environment variable
    baseURL: isDevelopment ? 'http://localhost:3000/api' : import.meta.env.VITE_API_BASE_URL,
    withCredentials: true
})

export default axiosBase
