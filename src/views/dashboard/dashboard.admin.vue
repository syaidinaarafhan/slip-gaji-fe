<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NModal } from 'naive-ui'
import { logoutAuth } from '@/composables/logoutAuth.js'

const users = ref([])
const loading = ref(false)
const error = ref('')
const router = useRouter()
const route = useRoute()

// ✅ HANYA INI YANG DIPAKAI UNTUK SEARCH
const searchQuery = ref('')

const currentPage = ref(1)
const pageSize = 20

const { logout, isLoggingOut } = logoutAuth()

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/user')
    users.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('Error fetching users:', e)
  } finally {
    loading.value = false
  }
}

// ✅ CLIENT-SIDE FILTERING (sudah ada, tetap dipakai)
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name.toLowerCase().includes(query) ||
    user.nik.toLowerCase().includes(query) ||
    user.jabatan.toLowerCase().includes(query) ||
    user.area.toLowerCase().includes(query)
  )
})

const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

// ✅ Reset page saat search (tetap ada)
watch(searchQuery, () => {
  currentPage.value = 1
})

// ✅ Scroll to top saat ganti page
watch(currentPage, () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Smooth scroll
  })
})

const isLogoutModalOpen = ref(false)

function showLogoutModal() {
  isLogoutModalOpen.value = true
}

const isOpen = ref(false)
const userToDelete = ref(null)

function showDeleteModal(user) {
  userToDelete.value = user
  isOpen.value = true
}

function handleEdit(user) {
  router.push(`/admin/editK/${user.id}`)
}

function tambahKaryawan() {
  router.push('/admin/register')
}

async function handleDelete() {
  try {
    await axiosInstance.delete(`/user/${userToDelete.value.id}`)
    
    isOpen.value = false
    
    userToDelete.value = null
    
    fetchUsers()
  } catch (err) {
    console.error('Error deleting user:', err)
    error.value = 'Gagal menghapus anggota'
  }
}

const isNavOpen = ref(false)
const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Input Gaji', to: '/admin/input-gaji' },
  { label: 'Master Gaji', to: '/admin/master-slip-gaji' }
]

function toggleNav() { isNavOpen.value = !isNavOpen.value }
function closeNav()  { isNavOpen.value = false }
function go(to) {
  if (route.path !== to) router.push(to)
  closeNav()
}

const isActive = (path) => {
  const currentPath = route.path
  
  // Dashboard: harus exact match
  if (path === '/admin') {
    return currentPath === '/admin'
  }
  
  // Pages lain: exact match atau sub-routes
  return currentPath === path || currentPath.startsWith(path + '/')
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="menu-btn"
          @click="toggleNav"
          :aria-expanded="isNavOpen"
          aria-controls="side-nav"
          aria-label="Open Menu">☰</button>
      <h1 class="title">Daftar Anggota</h1>
      <button 
        class="logout-btn" 
        @click="showLogoutModal"
        title="Logout"
      >
        {{ isLoggingOut ? '...' : 'Logout →' }}
      </button>
      
    </header>

    <!-- Overlay -->
    <transition name="fade">
      <div v-if="isNavOpen" class="overlay" @click="closeNav"></div>
    </transition>

    <!-- Sidebar / Drawer -->
    <transition name="slide-left">
      <aside v-if="isNavOpen" id="side-nav" class="sidenav" @keydown.esc="closeNav">
        <div class="sidenav-header">
          <span class="burger">|||</span>
          <button class="close-btn" @click="closeNav" aria-label="Close">✕</button>
        </div>

        <nav class="sidenav-nav">
          <button v-for="item in navItems"
                  :key="item.to"
                  class="nav-item"
                  :class="{ active: isActive(item.to) }"
                  @click="go(item.to)">
            {{ item.label }}
          </button>
        </nav>
      </aside>
    </transition>

    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="🔍 Cari nama, NIK, jabatan, atau area..." 
        class="search-input"
      />
      <button class="action-btn" @click="tambahKaryawan" title="Tambah Anggota">Tambah Anggota</button>
    </div>

    <p v-if="loading" class="loading">Memuat data...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!loading && paginatedUsers.length > 0" class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Anggota</th>
              <th>Jabatan</th>
              <th>NIK/NIP</th>
              <th>Area</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in paginatedUsers" :key="user.id">
              <td>{{ index + 1 }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.jabatan }}</td>
              <td>{{ user.nik }}</td>
              <td>{{ user.area }}</td>
              <td class="action-cell">
                <button class="icon-btn edit-btn" @click="handleEdit(user)" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" @click="showDeleteModal(user)" title="Hapus">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="pagination">
        <button 
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          ← Previous
        </button>
        
        <div class="page-info">
          Halaman {{ currentPage }} dari {{ totalPages }} (Total: {{ totalItems }} data)
        </div>
        
        <button 
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next →
        </button>
      </div>
    </div>

    <p v-if="!loading && paginatedUsers.length === 0" class="empty">
      {{ searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data anggota.' }}
    </p>

    <n-modal
      v-if="userToDelete"
      v-model:show="isOpen"
      preset="dialog"
      title="Konfirmasi Hapus"
      :content="`Apakah Anda yakin ingin menghapus anggota '${userToDelete.name}'?`"
      positive-text="Hapus"
      negative-text="Batal"
      @positive-click="handleDelete"
      @negative-click="isOpen = false"
    />

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

/* Header */
.header {
  background: #2c5282;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title {
  flex: 1;
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.logout-btn {
  background: #e53e3e;
  border: 1px solid #c53030;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.logout-btn:hover {
  background: #c53030;
}

/* Search Bar */
.search-bar {
  background: white;
  padding: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.action-btn {
  padding: 12px 20px;
  background: #2c5282;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.action-btn:hover {
  background: #2a4365;
}

/* States */
.loading,
.error,
.empty {
  padding: 40px 20px;
  text-align: center;
  color: #4a5568;
  font-size: 15px;
}

.error {
  color: #e53e3e;
}

/* Table Container */
.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  flex: 1;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: #2c5282;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.table tbody tr {
  border-bottom: 1px solid #e2e8f0;
}

.table tbody tr:last-child {
  border-bottom: none;
}

.table td {
  padding: 16px;
  color: #2d3748;
  font-size: 14px;
}

.action-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: #edf2f7;
  border: 1px solid #cbd5e0;
  cursor: pointer;
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #e2e8f0;
  border-color: #a0aec0;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.page-btn {
  background: white;
  border: 1px solid #cbd5e0;
  color: #2d3748;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.page-btn:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #a0aec0;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

/* Sidebar Navigation */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

.sidenav {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: #2c5282;
  color: white;
  z-index: 9999;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.sidenav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.burger {
  letter-spacing: 3px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: 0;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sidenav-nav {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  width: 100%;
  text-align: left;
  border: 0;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 6px;
  background: transparent;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: #4a6fa5;
  font-weight: 600;
}

/* Transitions */
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

/* Responsive */
@media (min-width: 768px) {
  .search-bar {
    padding: 24px;
  }

  .table-container {
    margin: 24px 32px;
  }

  .header {
    padding: 16px 32px;
  }

  .title {
    font-size: 20px;
  }
}

@media (min-width: 1024px) {
  .table-container {
    margin: 24px 32px;
  }
}

</style>