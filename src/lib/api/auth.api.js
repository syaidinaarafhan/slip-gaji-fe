import axiosInstance from '../axios/axios.js';

export async function getMe() {
    const { data } = await axiosInstance.get('/auth/me');
    return data;
}