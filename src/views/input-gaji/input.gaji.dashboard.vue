<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NDatePicker } from 'naive-ui'
import { logoutAuth } from '@/composables/logoutAuth.js'
import { useUserFilter } from '../../composables/month.year.filter.js'
import * as XLSX from 'xlsx'

const router = useRouter()
const route = useRoute()

// Fetch semua users
const allUsers = ref([])
const loading = ref(false)
const error = ref('')

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/user')
    allUsers.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('Error fetching users:', e)
  } finally {
    loading.value = false
  }
}

// ========== CREATE SLIP MODAL ==========
const isCreateSlipModalOpen = ref(false)
const selectedUser = ref(null)

function confirmCreateSlip(user) {
  selectedUser.value = user
  isCreateSlipModalOpen.value = true
}

async function createSlipGaji() {
  if (!selectedUser.value) return
  
  loading.value = true
  error.value = ''
  try {
    await axiosInstance.post('/slip-gaji/generate-from-master', { 
      user_id: selectedUser.value.id 
    })
    alert('Slip gaji berhasil dibuat!') // Atau bisa pakai toast notification
    isCreateSlipModalOpen.value = false
    selectedUser.value = null
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal membuat slip gaji'
    console.error('Error creating slip:', e)
  } finally {
    loading.value = false
  }
}

// ========== SEARCH ==========
const searchQuery = ref('')

// Filter users
const { usersFilter, loadingFilter, errorFilter, filterUsers } = useUserFilter()
const selectedDate = ref(null)
const isFilterActive = ref(false)

watch(selectedDate, (timestamp) => {
  currentPage.value = 1 // Reset pagination
  if (timestamp) {
    isFilterActive.value = true
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    filterUsers(year, month)
  } else {
    isFilterActive.value = false
  }
})

// ========== COMPUTED: DATA YANG DITAMPILKAN ==========
const baseUsers = computed(() => {
  return isFilterActive.value ? usersFilter.value : allUsers.value
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return baseUsers.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return baseUsers.value.filter(user => 
    user.name.toLowerCase().includes(query) ||
    user.nik.toLowerCase().includes(query) ||
    user.jabatan.toLowerCase().includes(query) ||
    user.area.toLowerCase().includes(query)
  )
})

const isLoading = computed(() => {
  return isFilterActive.value ? loadingFilter.value : loading.value
})

const displayError = computed(() => {
  return isFilterActive.value ? errorFilter.value : error.value
})

// ========== PAGINATION ==========
const currentPage = ref(1)
const pageSize = 20

const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

// Reset page ketika search
watch(searchQuery, () => {
  currentPage.value = 1
})

// ========== LOGOUT ==========
const { logout, isLoggingOut } = logoutAuth()
const isLogoutModalOpen = ref(false)

function showLogoutModal() {
  isLogoutModalOpen.value = true
}

// ========== NAVIGATION ==========
function inputGaji(user) {
  router.push(`/admin/input-gaji-karyawan/${user.id}`)
}

function riwayatGajiPengguna(user) {
  router.push(`/admin/riwayat-gaji-karyawan/${user.id}`)
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
  return route.path === path
}

// ========== EXPORT EXCEL ==========
function exportToExcel() {
  const dataToExport = baseUsers.value // Gunakan baseUsers (bisa search/filter result)

  if (dataToExport.length === 0) {
    alert('Tidak ada data untuk di-export')
    return
  }

  const worksheetData = dataToExport.map((user, index) => ({
    'No': index + 1,
    'Nama': user.name,
    'NIK': user.nik,
    'Jabatan': user.jabatan,
  }))

  const ws = XLSX.utils.json_to_sheet(worksheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan')

  const filename = selectedDate.value 
    ? `slip-gaji-${new Date(selectedDate.value).toISOString().slice(0, 7)}.xlsx`
    : `slip-gaji-all.xlsx`

  XLSX.writeFile(wb, filename)
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <button class="menu-btn"
          @click="toggleNav"
          :aria-expanded="isNavOpen"
          aria-controls="side-nav"
          aria-label="Open Menu">☰</button>
      <h1 class="title">Input Gaji</h1>
      <button 
        class="logout-btn" 
        @click="showLogoutModal"
        title="Logout"
      >
        {{ isLoggingOut ? '...' : 'Logout →' }}
      </button>
    </header>

    <!-- Toolbar: Search + Filter + Export -->
    <div class="toolbar">
      <div class="search-section">
        <input 
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="🔍 Cari nama, NIK, atau jabatan..."
        />
      </div>
      
      <div class="filter-section">
        <div class="filter-group">
          <label class="filter-label">Slip Gaji Bulan:</label>
          <n-date-picker 
            v-model:value="selectedDate" 
            type="month" 
            placeholder="Pilih Bulan & Tahun"
            clearable
            class="date-picker"
          />
        </div>
        <button class="export-btn" @click="exportToExcel">
          📥 Export Excel
        </button>
      </div>
    </div>

    <!-- Overlay -->
    <transition name="fade">
      <div v-if="isNavOpen" class="overlay" @click="closeNav"></div>
    </transition>

    <!-- Sidebar Navigation -->
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

    <!-- Loading State -->
    <p v-if="isLoading" class="loading">Memuat data...</p>
    
    <!-- Error State -->
    <p v-if="displayError" class="error">{{ displayError }}</p>

    <!-- Table -->
    <div v-if="!isLoading && paginatedUsers.length > 0" class="table-container">
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
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.jabatan }}</td>
              <td>{{ user.nik }}</td>
              <td>{{ user.area }}</td>
              <td class="action-cell">
                <button class="icon-btn" @click="inputGaji(user)" title="Input Gaji Karyawan">
                  💵
                </button>
                <button class="icon-btn" @click="riwayatGajiPengguna(user)" title="Detail Riwayat Gaji">
                  ⬇️
                </button>
                <button class="icon-btn" @click="confirmCreateSlip(user)" title="Input Slip Gaji Lewat Master">
                  <img src="../../icons/salary-envelope.png" alt="Slip">
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

    <!-- Empty State -->
    <p v-if="!isLoading && paginatedUsers.length === 0" class="empty">
      {{ isFilterActive ? 'Tidak ada data untuk bulan/tahun yang dipilih.' : 'Belum ada data anggota.' }}
    </p>

    <!-- Logout Confirmation Modal -->
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

    <!-- Create Slip Confirmation Modal -->
    <n-modal
      v-model:show="isCreateSlipModalOpen"
      preset="dialog"
      title="Konfirmasi Buat Slip Gaji"
      :content="`Apakah Anda yakin ingin membuat slip gaji untuk ${selectedUser?.name}?`"
      positive-text="Ya, Buat"
      negative-text="Batal"
      @positive-click="createSlipGaji"
      @negative-click="isCreateSlipModalOpen = false"
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

/* Toolbar */
.toolbar {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  width: 100%;
}

.search-input {
  width: 100%;
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

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.date-picker {
  width: 100%;
}

.export-btn {
  background: #38a169;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.export-btn:hover {
  background: #2f855a;
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

/* Table */
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

.icon-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
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
  .toolbar {
    padding: 24px;
  }

  .filter-section {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .filter-group {
    flex: 1;
    max-width: 300px;
  }

  .date-picker {
    width: 300px;
  }

  .export-btn {
    align-self: flex-end;
  }
}

@media (min-width: 1024px) {
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
</style>