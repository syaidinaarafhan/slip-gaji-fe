import { ref } from 'vue';
import axiosInstance from '@/lib/axios/axios';

export function useUserFilter() {
    const usersFilter = ref([]);
    const loadingFilter = ref(false);
    const errorFilter = ref(null);

    async function filterUsers(year, month = null) {
        loadingFilter.value = true;
        errorFilter.value = null;

        try {
            const params = { year }
            if (month) params.month = month

            const { data } = await axiosInstance.get('/user/with-slips', { params });
            usersFilter.value = data
        } catch (e) {
            errorFilter.value = e.response?.data?.message || 'Gagal memuat data'
            console.error('Error filtering:', e)
        } finally {
            loadingFilter.value = false;
        }
    }
    return {
    usersFilter,
    loadingFilter,
    errorFilter,
    filterUsers
  }
}