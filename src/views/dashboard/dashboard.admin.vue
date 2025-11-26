<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NModal } from 'naive-ui'
import { logoutAuth } from '@/composables/logoutAuth.js'

const users = ref([])
const loading = ref(false)
const error = ref('')
const router = useRouter()
const route = useRoute()

const { logout, isLoggingOut } = logoutAuth()

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/slip/getAllDataUsers')
    users.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('Error fetching users:', e)
  } finally {
    loading.value = false
  }
}

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
    await axiosInstance.delete(`/auth/deleteUser/${userToDelete.value.id}`)
    
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
      <input type="text" placeholder="Cari..." class="search-input" />
      <button class="action-btn" @click="tambahKaryawan" title="Tambah Anggota">Tambah Anggota</button>
    </div>

    <p v-if="loading" class="loading">Memuat data...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!loading && users.length > 0" class="table-wrapper">
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
          <tr v-for="(user, index) in users" :key="user.id">
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

    <p v-if="!loading && users.length === 0" class="empty">Belum ada data anggota.</p>

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
.page {
  min-height: 100vh;
  background: #2c5282;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2b5278;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}

.title {
  flex: 1;
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.logout-btn {
  background: red;
  border: 1px solid rgba(227, 41, 41, 0.3);
  color: rgb(255, 255, 255);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(255, 1, 1, 0.1);
}

.add-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.search-bar {
  background: white;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  outline: none;
}

.search-input:focus {
  border-color: #4299e1;
}

.action-btn {
  padding: 8px 16px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.action-btn:hover {
  background: #2c5282;
}

.loading,
.error,
.empty {
  padding: 24px;
  text-align: center;
  color: white;
}

.error {
  color: #fed7d7;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.table thead {
  background: #4a6fa5;
  color: white;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
}

.table tbody tr {
  background: #6b8db8;
  border-bottom: 2px solid #2c5282;
}

.table tbody tr:hover {
  background: #5a7ca7;
}

.table td {
  padding: 16px;
  color: white;
  font-size: 14px;
}

.action-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255,255,255,0.1);
}

.edit-btn:active {
  transform: scale(0.95);
}

.delete-btn:active {
  transform: scale(0.95);
}

/* Overlay */
.overlay{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 9998;
}

/* Drawer */
.sidenav{
  position: fixed; left: 0; top: 0; bottom: 0; width: 240px;
  background: #1f3f66; color: #fff; z-index: 9999;
  box-shadow: 2px 0 16px rgba(0,0,0,.25);
  display: flex; flex-direction: column;
}
.sidenav-header{
  display:flex; align-items:center; justify-content:space-between;
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.1);
}
.burger{ letter-spacing: 3px; }
.close-btn{
  background:none; border:0; color:#fff; font-size:18px; cursor:pointer;
}

.sidenav-nav{ padding: 12px; display: grid; gap: 10px; }
.nav-item{
  width: 100%; text-align: left; border: 0; cursor: pointer;
  padding: 10px 12px; border-radius: 999px;
  background: #204874; color: #fff; transition: background .15s;
}
.nav-item:hover{ background: #2b5b93; }
.nav-item.active{
  background: #5a7ca7;   /* biru muda saat aktif */
  color: #0b1220;         /* kontras sedikit lebih gelap */
  font-weight: 600;
}

/* Transitions */
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(-100%); }
.slide-left-enter-active, .slide-left-leave-active { transition: transform .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }

</style>