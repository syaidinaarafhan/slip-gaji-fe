import { ref } from "vue";
import axiosInstance from "../lib/axios/axios.js"

export function logoutAuth() {
  const isLoggingOut = ref(false)

  async function logout() {
    isLoggingOut.value = true
    try {
      await axiosInstance.post('/api/auth/logout')
      
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      alert('Gagal logout. Silakan coba lagi.')
    } finally {
      isLoggingOut.value = false
    }
  }

  return {
    logout,
    isLoggingOut
  }
}