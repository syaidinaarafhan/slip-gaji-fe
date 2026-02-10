<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NModal, NDatePicker, NSpin } from 'naive-ui'
import { logoutAuth } from '@/composables/logoutAuth.js'

import { useUserFilter } from '../../composables/month.year.filter.js'
import { useSearch } from '@/composables/search.js'

import * as XLSX from 'xlsx'

const router = useRouter()
const route = useRoute()

// Fetch semua users
const allUsers = ref([])
const loading = ref(false)
const error = ref('')

const isDeleteModalOpen = ref(false)

const isImporting = ref(false)

// ✅ TAMBAH STATE MASS GENERATE
const isMassGenerateModalOpen = ref(false)
const selectedPeriodeMass = ref(new Date().getMonth())
const currentYear = new Date().getFullYear()
const jobId = ref(null)
const jobStatus = ref(null)
const isGenerating = ref(false)
const pollInterval = ref(null)

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
    // ✅ Tambahkan timestamp untuk bypass cache
    const { data } = await axiosInstance.get('/slipmaster', {
      params: { _t: Date.now() }
    })
    
    allUsers.value = data.data || data
    
    console.log('✅ Data refreshed:', allUsers.value.length, 'users')
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('❌ Error fetching users:', e)
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
    event.target.value = ''
    return
  }

  isUploading.value = true
  isImporting.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post('/slipmaster', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    console.log('📦 Response:', response.data)

    // Reset state
    selectedDate.value = null
    isFilterActive.value = false
    event.target.value = ''

    // ✅ PERBAIKAN: Cek status response dengan lebih teliti
    // Axios tidak lempar error untuk status 200, jadi harus cek success manual
    if (response.status === 200 && response.data.success) {
      showSuccessModal(response.data.message || 'Import berhasil!')
    } else {
      // Ini seharusnya jarang terjadi kalau backend sudah fix
      showErrorModal(response.data.message || 'Import gagal')
    }
    
    // ✅ Tunggu cache clear
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // ✅ Refresh data
    await fetchUsers()
    
  } catch (error) {
    console.error('❌ Import error:', error)
    console.error('❌ Error response:', error.response?.data)
    
    // ✅ PERBAIKAN: Tampilkan error message yang jelas
    const errorMsg = error.response?.data?.message ||
                     'Import gagal, silakan coba lagi'
    
    showErrorModal(errorMsg)
    
    // Tetap refresh meskipun error
    await fetchUsers()
    
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

const formatRupiah = (value) => {
  if (!value && value !== 0) return 'Rp. 0'
  return 'Rp. ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ========== MASS GENERATE FUNCTIONS ==========

// Helper: Convert month index ke nama bulan
function getMonthName(monthIndex) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[monthIndex]
}

// Computed: List bulan untuk dropdown
const monthOptionsMass = computed(() => {
  return [
    { value: 0, label: 'Januari' },
    { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Desember' }
  ]
})

// Show modal konfirmasi
function showMassGenerateModal() {
  selectedPeriodeMass.value = new Date().getMonth()
  isMassGenerateModalOpen.value = true
}

// Start mass generate
async function startMassGenerate() {
  if (isGenerating.value) return
  
  const periodeGaji = new Date(currentYear, selectedPeriodeMass.value, 1).toISOString()
  
  isGenerating.value = true
  jobStatus.value = null
  
  try {
    const { data } = await axiosInstance.post('/slip-gaji/master-generate', {
      periode_gaji: periodeGaji
    })
    
    jobId.value = data.jobId
    
    // Start polling
    startPolling(data.jobId)
    
  } catch (error) {
    console.error('Error starting mass generate:', error)
    showErrorModal(error.response?.data?.error || 'Gagal memulai proses')
    isGenerating.value = false
    isMassGenerateModalOpen.value = false
  }
}

// Polling job status
function startPolling(id) {
  pollInterval.value = setInterval(async () => {
    try {
      const { data } = await axiosInstance.get(`/slip-gaji/job-status/${id}`)
      
      jobStatus.value = data
      
      // Stop polling jika selesai
      if (data.state === 'completed' || data.state === 'failed') {
        stopPolling()
        handleJobComplete(data)
      }
      
    } catch (error) {
      console.error('Polling error:', error)
      stopPolling()
      showErrorModal('Gagal mengecek status proses')
      isGenerating.value = false
    }
  }, 2000) // Poll setiap 2 detik
}

// Stop polling
function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

// Handle job selesai
function handleJobComplete(data) {
  isGenerating.value = false
  isMassGenerateModalOpen.value = false
  
  if (data.state === 'completed') {
    const result = data.returnValue
    const successMsg = `Berhasil: ${result.successCount} | Gagal: ${result.failedCount} | Total: ${result.total} data`
    
    showSuccessModal(successMsg)
    
    // Refresh data
    fetchUsers()
  } else {
    showErrorModal('Proses gagal, silakan coba lagi')
  }
  
  // Reset state
  jobId.value = null
  jobStatus.value = null
}

// Close modal & stop polling
function closeMassGenerateModal() {
  if (isGenerating.value) {
    const confirm = window.confirm('Proses sedang berjalan. Yakin ingin membatalkan?')
    if (!confirm) return
  }
  
  stopPolling()
  isMassGenerateModalOpen.value = false
  isGenerating.value = false
  jobId.value = null
  jobStatus.value = null
}

// Computed: Progress percentage
const progressPercentage = computed(() => {
  if (!jobStatus.value?.progress) return 0
  const { processed, total } = jobStatus.value.progress
  return Math.round((processed / total) * 100)
})

// TAMBAH INI: Use search composable
const {
  searchQuery,
  currentPage,
  pageSize,
  filteredData: filteredUsers,
  totalItems,
  totalPages,
  paginatedData: paginatedUsers
} = useSearch(displayedUsers, ['nama', 'nik_baru', 'area', 'bagian'])

// TAMBAH INI: Reset page saat filter berubah
watch(selectedDate, () => {
  currentPage.value = 1
})

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
            <img src="../../icons/download.png" alt="Import">
            Import Excel
            <input 
              id="file-upload" 
              type="file" 
              accept=".xlsx,.xls"
              @change="handleFileUpload"
              style="display: none;"
            />
          </label>
          
          <button class="delete-all-data-btn" @click="showDeleteModal">
            <img src="../../icons/delete.png" alt="Delete">
            Delete Data Slip Bulan Ini
          </button>
          <button class="mass-generate-btn" @click="showMassGenerateModal">
            <img src="../../icons/clipboard.png" alt="Buat Slip">
              Buat Semua Slip Gaji
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
              <th>Area</th>
              <th>Bagian</th>
              <th>Total Upah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in paginatedUsers" :key="user.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ user.nama }}</td>
              <td>{{ user.area }}</td>
              <td>{{ user.bagian }}</td>
              <td>{{ formatRupiah(user.total_upah_bersih) }}</td>
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

      <!-- Mass Generate Modal -->
      <n-modal
        v-model:show="isMassGenerateModalOpen"
        :mask-closable="false"
        :close-on-esc="false"
        class="mass-generate-modal"
      >
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <h3>{{ isGenerating ? 'Membuat Slip Gaji Massal...' : 'Generate Slip Gaji Massal' }}</h3>
            <button 
              v-if="!isGenerating" 
              class="modal-close-btn" 
              @click="closeMassGenerateModal"
            >✕</button>
          </div>
          
          <!-- Body -->
          <div class="modal-body">
            <!-- Pilih Bulan (hanya tampil jika belum generating) -->
            <div v-if="!isGenerating" class="form-group">
              <label class="form-label">Pilih Periode Gaji:</label>
              <select v-model="selectedPeriodeMass" class="month-select">
                <option 
                  v-for="month in monthOptionsMass" 
                  :key="month.value" 
                  :value="month.value"
                >
                  {{ month.label }} {{ currentYear }}
                </option>
              </select>
            </div>
            
            <p v-if="!isGenerating" class="modal-info">
              ℹ️ Sistem akan membuat slip gaji untuk <strong>SEMUA karyawan</strong> yang ada di Master Slip Gaji untuk periode <strong>{{ getMonthName(selectedPeriodeMass) }} {{ currentYear }}</strong>
            </p>
            
            <!-- Progress Bar (tampil saat generating) -->
            <div v-if="isGenerating && jobStatus" class="progress-section">
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">Progress:</span>
                  <span class="stat-value">{{ jobStatus.progress?.processed || 0 }} / {{ jobStatus.progress?.total || 0 }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">Berhasil:</span>
                  <span class="stat-value">{{ jobStatus.progress?.successCount || 0 }}</span>
                </div>
                <div class="stat-item error">
                  <span class="stat-label">Gagal:</span>
                  <span class="stat-value">{{ jobStatus.progress?.failedCount || 0 }}</span>
                </div>
              </div>
              
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: progressPercentage + '%' }">
                  <span class="progress-text">{{ progressPercentage }}%</span>
                </div>
              </div>
              
              <div class="spinner-container">
                <n-spin size="medium" />
                <p class="spinner-text">Memproses data...</p>
              </div>
            </div>
            
            <!-- Loading awal (sebelum dapat status pertama) -->
            <div v-if="isGenerating && !jobStatus" class="loading-initial">
              <n-spin size="large" />
              <p>Memulai proses...</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div v-if="!isGenerating" class="modal-footer">
            <button class="modal-btn-cancel" @click="closeMassGenerateModal">
              Batal
            </button>
            <button class="modal-btn-confirm" @click="startMassGenerate">
              Mulai
            </button>
          </div>
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
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  margin: 0 auto 24px;
  color: white;
}

.result-icon.success {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.result-icon.error {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #1f2937;
}

.result-message {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.result-close-btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.result-close-btn.success {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.result-close-btn.success:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.result-close-btn.error {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.result-close-btn.error:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.result-close-btn:active {
  transform: translateY(0);
}

/* Modal Overlay */
:deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.6);
}

:deep(.n-modal-container) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px;
}

:deep(.n-modal-body-wrapper) {
  max-width: 450px;
  margin: 0 auto;
}

:deep(.result-modal .n-modal) {
  background: transparent !important;
  box-shadow: none !important;
  max-width: 100% !important;
  width: auto !important;
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

.mass-generate-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s ease;
}

.mass-generate-btn:hover {
  background: #5568d3;
}

.import-btn img,
.delete-all-data-btn img,
.mass-generate-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  margin-right: 6px;
}

/* Mass Generate Modal */
.mass-generate-modal .modal-card {
  background: white !important;
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
  margin-left: 16px;
}

.modal-close-btn:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.month-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  background: white;
  cursor: pointer;
  outline: none;
}

.month-select:focus {
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.modal-info {
  margin: 0;
  padding: 12px 16px;
  background: #ebf8ff;
  border-left: 4px solid #3182ce;
  border-radius: 4px;
  font-size: 14px;
  color: #2c5282;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.modal-btn-cancel,
.modal-btn-confirm {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}

.modal-btn-cancel {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.modal-btn-cancel:hover {
  background: #edf2f7;
}

.modal-btn-confirm {
  background: #2c5282;
  color: white;
}

.modal-btn-confirm:hover {
  background: #234063;
}

.progress-section {
  padding: 20px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
}

.stat-item.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.stat-item.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.progress-bar-container {
  width: 100%;
  height: 40px;
  background: #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: #3182ce;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

.progress-text {
  color: white;
  font-weight: 700;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner-text {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.loading-initial {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
}

.loading-initial p {
  margin: 0;
  color: #4a5568;
  font-size: 15px;
  font-weight: 500;
}

.mass-generate-modal :deep(.n-modal) {
  background: white !important;
}

.mass-generate-modal :deep(.n-card) {
  background: white !important;
}

/* Alternatif: langsung target .modal-card */
.modal-card {
  background: white !important;
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

:deep(.n-modal-container) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important; /* ⚠️ PENTING: Hilangkan padding default */
}

:deep(.n-modal-body-wrapper) {
  max-width: 450px;
  margin: 0 auto;
  padding: 0 !important; /* ⚠️ PENTING: Hilangkan padding */
}

:deep(.result-modal .n-modal) {
  background: transparent !important;
  box-shadow: none !important;
  max-width: 100% !important;
  width: auto !important;
  padding: 0 !important; /* ⚠️ TAMBAHKAN INI */
  margin: 20px !important; /* ⚠️ TAMBAHKAN margin untuk mobile */
}

/* Mobile responsive fix */
@media (max-width: 640px) {
  .result-modal-content {
    padding: 32px 24px; /* Kurangi padding di mobile */
    max-width: 90vw; /* Jangan terlalu lebar di mobile */
  }
  
  .result-icon {
    width: 64px;
    height: 64px;
    font-size: 36px;
  }
}
</style>