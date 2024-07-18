import axios from 'axios'

const axiosBase = axios.create({
    baseURL:'http://localhost:3333/api'
})
export default axiosBase