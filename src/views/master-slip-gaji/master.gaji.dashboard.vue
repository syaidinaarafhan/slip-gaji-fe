<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NDatePicker, NSpin } from 'naive-ui'
import { logoutAuth } from '@/composables/logoutAuth.js'
import { useUserFilter } from '../../composables/month.year.filter.js'
import * as XLSX from 'xlsx'

const router = useRouter()
const route = useRoute()

// Fetch semua users
const allUsers = ref([])
const loading = ref(false)
const error = ref('')

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20

const isDeleteModalOpen = ref(false)

const isImporting = ref(false)

// State untuk result modal
const resultModal = ref({
  show: false,
  type: 'success', // 'success' or 'error'
  message: ''
})

function showSuccessModal(message) {
  resultModal.value = {
    show: true,
    type: 'success',
    message: message
  }
}

function showErrorModal(message) {
  resultModal.value = {
    show: true,
    type: 'error',
    message: message
  }
}

function closeResultModal() {
  resultModal.value.show = false
}

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/slipmaster')
    
    // ✅ FIX: Ambil array dari property "data"
    allUsers.value = data.data || data
    
    console.log('Data loaded:', allUsers.value.length, 'users')
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('Error fetching users:', e)
  } finally {
    loading.value = false
  }
}

// Filter users
const { usersFilter, loadingFilter, errorFilter, filterUsers } = useUserFilter()
const selectedDate = ref(null)
const isFilterActive = ref(false)

watch(selectedDate, (timestamp) => {
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

const filteredUsers = computed(() => {
  let users = displayedUsers.value
  
  if (!searchQuery.value.trim()) {
    return users
  }
  
  const query = searchQuery.value.toLowerCase()
  return users.filter(user => 
    user.nama?.toLowerCase().includes(query) ||
    user.nik_baru?.toLowerCase().includes(query) ||
    user.area?.toLowerCase().includes(query) ||
    user.bagian?.toLowerCase().includes(query)
  )
})

const totalItems = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

watch([searchQuery, selectedDate], () => {
  currentPage.value = 1
})

// Computed: tentukan data mana yang ditampilkan
const displayedUsers = computed(() => {
  return isFilterActive.value ? usersFilter.value : allUsers.value
})

const isLoading = computed(() => {
  return isFilterActive.value ? loadingFilter.value : loading.value
})

const displayError = computed(() => {
  return isFilterActive.value ? errorFilter.value : error.value
})

const { logout, isLoggingOut } = logoutAuth()

const isLogoutModalOpen = ref(false)

function showLogoutModal() {
  isLogoutModalOpen.value = true
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

function exportToExcel() {
  const dataToExport = displayedUsers.value

  if (dataToExport.length === 0) {
    alert('Tidak ada data untuk di-export')
    return
  }

  // ✅ FIX: Pakai property name yang benar
  const worksheetData = dataToExport.map((user, index) => ({
    'No': index + 1,
    'Nama': user.nama,        // ✅ Pakai "nama" bukan "name"
    'NIK': user.nik_baru,
    'Area': user.area,
    'Bagian': user.bagian,
  }))

  const ws = XLSX.utils.json_to_sheet(worksheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan')

  const filename = selectedDate.value 
    ? `slip-gaji-${new Date(selectedDate.value).toISOString().slice(0, 7)}.xlsx`
    : `slip-gaji-all.xlsx`

  XLSX.writeFile(wb, filename)
}

const isUploading = ref(false)

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  
  if (!validTypes.includes(file.type)) {
    alert('Hanya file Excel (.xlsx, .xls) yang diperbolehkan')
    return
  }

  isUploading.value = true

  isImporting.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await axiosInstance.post('/slipmaster', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showSuccessModal(data.message || 'Import berhasil!')
    
    // Refresh data
    await fetchUsers()
    
    // Reset input file
    event.target.value = ''
  } catch (error) {
    showErrorModal(e.response?.data?.message || 'Import gagal')
  } finally {
    isImporting.value = false
    isUploading.value = false
  }
}

function showDeleteModal() {
  isDeleteModalOpen.value = true
}

async function deleteAllSlipGaji() {
  try {
    await axiosInstance.delete('/slipmaster')

    isDeleteModalOpen.value = false

    await fetchUsers()
  } catch (error) {
    console.error('Error deleting:', error)
  }
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
      <h1 class="title">Master Slip Gaji</h1>
      <button 
        class="logout-btn" 
        @click="showLogoutModal"
        title="Logout"
      >
        {{ isLoggingOut ? '...' : 'Logout →' }}
      </button>
    </header>

    <div class="toolbar">
      <!-- Search Bar -->
      <div class="search-section">
        <input 
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="🔍 Cari nama, NIK, area, atau bagian..."
        />
      </div>
      
      <!-- Filter & Actions Row -->
      <div class="filter-actions-row">
        
        <div class="action-buttons">
          <label for="file-upload" class="import-btn">
            📥 Import Excel
            <input 
              id="file-upload" 
              type="file" 
              accept=".xlsx,.xls"
              @change="handleFileUpload"
              style="display: none;"
            />
          </label>
          
          <button class="delete-all-data-btn" @click="showDeleteModal">
            🗑️ Delete Data Slip Bulan Ini
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="isNavOpen" class="overlay" @click="closeNav"></div>
    </transition>

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

    <!-- ✅ LOADING STATE DENGAN SPINNER -->
    <div v-if="isLoading" class="loading-container">
      <n-spin size="large" />
      <p class="loading-text">Memuat {{ displayedUsers.length > 0 ? displayedUsers.length : '550+' }} data karyawan...</p>
    </div>

    <!-- Loading Overlay saat Import -->
    <div v-if="isImporting" class="import-overlay">
      <div class="import-loading-box">
        <n-spin size="large" />
        <p class="import-loading-text">Mengimport data...</p>
      </div>
    </div>

    <p v-if="displayError && !isLoading" class="error">{{ displayError }}</p>

    <div v-if="!isLoading && paginatedUsers.length > 0" class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Anggota</th>
              <th>NIK/NIP</th>
              <th>Area</th>
              <th>Bagian</th>
              <th>Total Upah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in paginatedUsers" :key="user.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ user.nama }}</td>
              <td>{{ user.nik_baru }}</td>
              <td>{{ user.area }}</td>
              <td>{{ user.bagian }}</td>
              <td>{{ user.total_upah_bersih }}</td>
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

    <p v-if="!isLoading && paginatedUsers.length === 0" class="empty">
      {{ searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 
        isFilterActive ? 'Tidak ada data untuk bulan/tahun yang dipilih.' : 
        'Belum ada data anggota.' }}
    </p>

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

      <!-- Delete Confirmation Modal -->
      <n-modal
        v-model:show="isDeleteModalOpen"
        preset="dialog"
        title="Konfirmasi Hapus"
        content="Apakah Anda yakin ingin menghapus semua data slip gaji bulan ini? Tindakan ini tidak dapat dibatalkan."
        positive-text="Ya, Hapus"
        negative-text="Batal"
        @positive-click="deleteAllSlipGaji"
        @negative-click="isDeleteModalOpen = false"
      />

      <!-- Result Modal (Success/Error) -->
      <n-modal
        v-model:show="resultModal.show"
        :mask-closable="false"
        class="result-modal"
      >
        <div class="result-modal-content">
          <div 
            class="result-icon"
            :class="resultModal.type"
          >
            {{ resultModal.type === 'success' ? '✓' : '✕' }}
          </div>
          <h3 class="result-title">
            {{ resultModal.type === 'success' ? 'Berhasil!' : 'Gagal!' }}
          </h3>
          <p class="result-message">{{ resultModal.message }}</p>
          <button 
            class="result-close-btn"
            :class="resultModal.type"
            @click="closeResultModal"
          >
            OK
          </button>
        </div>
      </n-modal>
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

/* Search Section */
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

/* Filter & Actions Row */
.filter-actions-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.filter-picker {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.import-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.import-btn:hover {
  background: #2c5282;
}

/* Import Loading Overlay */
.import-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-loading-box {
  background: white;
  padding: 40px 60px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.import-loading-text {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

/* Custom Result Modal */
.result-modal-content {
  background: white;
  padding: 40px 32px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
}

.result-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto 20px;
  color: white;
}

.result-icon.success {
  background: #38a169;
}

.result-icon.error {
  background: #e53e3e;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.result-message {
  font-size: 15px;
  color: #4a5568;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.result-close-btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  color: white;
}

.result-close-btn.success {
  background: #38a169;
}

.result-close-btn.success:hover {
  background: #2f855a;
}

.result-close-btn.error {
  background: #e53e3e;
}

.result-close-btn.error:hover {
  background: #c53030;
}

.delete-all-data-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.delete-all-data-btn:hover {
  background: #c53030;
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

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
}

.loading-text {
  color: #4a5568;
  font-size: 16px;
  font-weight: 500;
}

/* States */
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

  .filter-actions-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .filter-bar {
    flex: 1;
    max-width: 300px;
  }

  .filter-picker {
    width: 300px;
  }

  .action-buttons {
    flex-shrink: 0;
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