import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Point to your backend port
    withCredentials: true,                // Essential for sending/receiving cookies
});

export default API;