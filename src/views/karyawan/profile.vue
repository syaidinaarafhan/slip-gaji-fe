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
    const { data } = await axiosInstance.get('/slipka/getProfile')
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

          <!-- Email -->
          <p class="profile-email">{{ user.email }}</p>
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

            <!-- Email Detail -->
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="info-content">
                <span class="info-label">Email</span>
                <span class="info-value">{{ user.email }}</span>
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
  background: linear-gradient(135deg, #1f3654 0%, #2b5278 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(43, 82, 120, 0.95);
  backdrop-filter: blur(10px);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
  background: rgba(255, 71, 87, 0.15);
  border: 1px solid rgba(255, 71, 87, 0.3);
  color: #ff4757;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
}

.logout-btn:hover:not(:disabled) {
  background: rgba(255, 71, 87, 0.25);
  border-color: rgba(255, 71, 87, 0.5);
  transform: translateY(-1px);
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
  color: #fff;
  gap: 16px;
  padding-bottom: 80px; /* Space for bottom nav */
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
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
  padding-bottom: 100px; /* Space for bottom nav */
}

.error-box {
  background: rgba(255, 255, 255, 0.98);
  padding: 32px 24px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.error-icon {
  color: #ff4757;
  margin-bottom: 16px;
}

.error-text {
  color: #d32f2f;
  margin: 0 0 20px 0;
  font-size: 15px;
  line-height: 1.5;
}

.retry-btn {
  background: #2b5278;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #1f3654;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(43, 82, 120, 0.3);
}

/* Content */
.content {
  flex: 1;
  padding: 24px 16px;
  padding-bottom: 100px; /* IMPORTANT: Space for bottom nav on mobile */
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
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 40px 24px 32px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
}

.avatar-initials {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
  z-index: 1;
}

/* Profile Info */
.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #1f3654;
  margin: 0 0 8px 0;
  position: relative;
  z-index: 1;
}

.profile-email {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  position: relative;
  z-index: 1;
}

.reset-password-btn {
  background: none;
  border: none;
  color: #00b4d8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  border-radius: 8px;
}

.reset-password-btn:hover {
  background: rgba(0, 180, 216, 0.1);
  color: #0096c7;
}

/* Info Section */
.info-section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

/* Info List */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.2s;
}

.info-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.info-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #212529;
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
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.action-btn.danger {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  border: 2px solid rgba(255, 71, 87, 0.3);
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(255, 71, 87, 0.2);
  border-color: rgba(255, 71, 87, 0.5);
  transform: translateY(-2px);
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
  background: rgba(43, 82, 120, 0.95);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
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
  transition: color 0.2s;
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
  /* Hide bottom nav on tablet and desktop */
  .bottom-nav {
    display: none;
  }

  /* Remove bottom padding when bottom nav is hidden */
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