import axios from 'axios'

const axiosBase = axios.create({
    // baseURL:'http://localhost:3333/api'
    baseURL: "https://evangadiforum-3-36du.onrender.com"
})
export default axiosBase