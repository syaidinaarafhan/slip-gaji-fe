<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { logoutAuth } from '@/composables/logoutAuth.js'
import { NModal } from 'naive-ui'

const user = ref(null)
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()

const { logout, isLoggingOut } = logoutAuth()

async function fetchUser() {
  try {
    loading.value = true
    error.value = ''
    const { data } = await axiosInstance.get('/user/profile')
    user.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Gagal memuat user'
  } finally {
    loading.value = false
  }
}

const isLogoutModalOpen = ref(false)

function showLogoutModal() {
  isLogoutModalOpen.value = true
}

function handleResetPassword() {
  // Navigate to reset password page or show modal
  router.push('/reset-password')
}

function goToHome() {
  router.push('/employee')
}

// Generate initials from name
const getInitials = (name) => {
  if (!name) return '?'
  const names = name.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Generate avatar color based on name
const getAvatarColor = (name) => {
  if (!name) return '#2b5278'
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="header-title">Profil Saya</h1>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat profil...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="error-text">{{ error }}</p>
        <button @click="fetchUser" class="retry-btn">Coba Lagi</button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="user" class="content">
      <div class="container">
        
        <!-- Profile Card -->
        <div class="profile-card">
          <!-- Avatar -->
          <div class="avatar-wrapper">
            <div 
              class="avatar" 
              :style="{ background: `linear-gradient(135deg, ${getAvatarColor(user.name)} 0%, ${getAvatarColor(user.name)}dd 100%)` }"
            >
              <span class="avatar-initials">{{ getInitials(user.name) }}</span>
            </div>
            <div class="avatar-ring"></div>
          </div>

          <!-- Name -->
          <h2 class="profile-name">{{ user.name }}</h2>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <h3 class="section-title">Informasi Akun</h3>
          
          <div class="info-list">
            <!-- Jabatan -->
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div class="info-content">
                <span class="info-label">Jabatan</span>
                <span class="info-value">{{ user.jabatan || 'Tidak ada jabatan' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <button class="action-btn primary" @click="handleResetPassword">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Ganti Password</span>
          </button>

          <button class="action-btn danger" @click="showLogoutModal" :disabled="isLoggingOut">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>{{ isLoggingOut ? 'Keluar...' : 'Keluar' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Bottom Navigation (Mobile only) -->
    <nav class="bottom-nav">
      <button class="nav-item" @click="goToHome">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </button>
      <button class="nav-item active">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Profile</span>
      </button>
    </nav>

    <!-- Logout Modal -->
    <n-modal
      v-model:show="isLogoutModalOpen"
      preset="dialog"
      title="Konfirmasi Logout"
      content="Apakah Anda yakin ingin keluar?"
      positive-text="Ya, Logout"
      negative-text="Batal"
      @positive-click="logout"
      @negative-click="isLogoutModalOpen = false"
    />
  </div>
</template>

<style scoped>
/* Reset & Base */
* {
  box-sizing: border-box;
}

/* Layout */
.page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2c5282;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.logout-btn {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #e53e3e;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
}

.logout-btn:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #feb2b2;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  gap: 16px;
  padding-bottom: 80px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #2c5282;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  padding-bottom: 100px;
}

.error-box {
  background: #fff;
  padding: 32px 24px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #fc8181;
}

.error-icon {
  color: #e53e3e;
  margin-bottom: 16px;
}

.error-text {
  color: #c53030;
  margin: 0 0 20px 0;
  font-size: 15px;
  line-height: 1.5;
}

.retry-btn {
  background: #2c5282;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.retry-btn:hover {
  background: #2a4365;
}

/* Content */
.content {
  flex: 1;
  padding: 24px 16px;
  padding-bottom: 100px;
  overflow-y: auto;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Profile Card */
.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px 24px 32px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: #edf2f7;
  z-index: 0;
}

/* Avatar */
.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
  z-index: 1;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  border: 4px solid #fff;
}

.avatar-initials {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  z-index: 1;
}

/* Profile Info */
.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
  position: relative;
  z-index: 1;
}

.profile-email {
  font-size: 14px;
  color: #718096;
  margin: 0 0 20px 0;
  position: relative;
  z-index: 1;
}

.reset-password-btn {
  background: none;
  border: none;
  color: #3182ce;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  border-radius: 6px;
}

.reset-password-btn:hover {
  background: #ebf8ff;
  color: #2c5282;
}

/* Info Section */
.info-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

/* Info List */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 8px;
  background: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #2d3748;
  font-weight: 600;
  word-break: break-word;
}

/* Action Section */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.action-btn.primary {
  background: #2c5282;
  color: #fff;
}

.action-btn.primary:hover {
  background: #2a4365;
}

.action-btn.danger {
  background: #fff;
  color: #e53e3e;
  border: 2px solid #feb2b2;
}

.action-btn.danger:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #fc8181;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2c5282;
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  flex: 1;
  max-width: 120px;
}

.nav-item.active {
  color: white;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.9);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

/* Responsive */
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }

  .content {
    padding: 40px 24px;
  }

  .loading-container {
    padding-bottom: 0;
  }

  .error-container {
    padding-bottom: 20px;
  }

  .container {
    max-width: 700px;
  }

  .header {
    padding: 16px 24px;
  }

  .header-title {
    font-size: 20px;
  }

  .profile-card {
    padding: 48px 32px 40px;
  }

  .avatar {
    width: 140px;
    height: 140px;
  }

  .avatar-initials {
    font-size: 48px;
  }

  .profile-name {
    font-size: 28px;
  }

  .profile-email {
    font-size: 15px;
  }

  .action-section {
    flex-direction: row;
  }

  .action-btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 800px;
  }

  .content {
    padding: 48px 32px;
  }
}
</style>