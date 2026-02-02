import axiosInstance from '../axios/axios.js';

export async function getMe() {
    const { data } = await axiosInstance.get('/api/auth/me');
    return data;
}