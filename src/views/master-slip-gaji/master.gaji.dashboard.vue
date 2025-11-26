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

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/masterSlips')
    
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

const isActive = (path) => route.path === path || route.path.startsWith(path)

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

  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await axiosInstance.post('/importMasterSlip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    alert(`Import berhasil!\nBerhasil: ${data.successCount}\nGagal: ${data.errorCount}`)
    
    // Refresh data
    await fetchUsers()
    
    // Reset input file
    event.target.value = ''
  } catch (error) {
    alert('Gagal import: ' + (error.response?.data?.message || error.message))
  } finally {
    isUploading.value = false
  }
}

async function deleteAllSlipGaji() {
  try {
    await axiosInstance.delete('/deleteAllMasterSlip')
    alert('Semua slip gaji berhasil dihapus')
    await fetchUsers()
  } catch (error) {
    alert('Gagal menghapus semua slip gaji: ' + (error.response?.data?.message || error.message))
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
        <div class="filter-bar">
            <label class="filter-label">Slip Gaji Bulan</label>
                <n-date-picker 
                v-model:value="selectedDate" 
                type="month" 
                placeholder="Pilih Bulan & Tahun"
                clearable
                class="filter-picker"
                />
        </div>
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
            
            <button class="export-btn" @click="exportToExcel">
            📤 Export Excel
            </button>
            <button class="delete-all-data-btn" @click="deleteAllSlipGaji">
            🗑️ Delete Data Slip Bulan Ini
            </button>
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

    <p v-if="displayError && !isLoading" class="error">{{ displayError }}</p>

    <div v-if="!isLoading && displayedUsers.length > 0" class="table-wrapper">
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
          <tr v-for="(user, index) in displayedUsers" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.nama }}</td>        <!-- ✅ FIX: Pakai "nama" -->
            <td>{{ user.nik_baru }}</td>
            <td>{{ user.area }}</td>
            <td>{{ user.bagian }}</td>
            <td>{{ user.total_upah_bersih }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!isLoading && displayedUsers.length === 0" class="empty">
      {{ isFilterActive ? 'Tidak ada data untuk bulan/tahun yang dipilih.' : 'Belum ada data anggota.' }}
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
  </div>
</template>

<style scoped>
.filter-picker {
  width: 250px;
}

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

.toolbar {
  background: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap; /* ✅ Biar responsive */
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 600;
  color: #1a202c;
}

.export-btn {
  background: #48bb78; /* 🟢 Hijau untuk Export */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
}

.export-btn:hover {
  background: #38a169;
}

.import-btn {
  background: #4299e1; /* 🔵 Biru untuk Import */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  display: inline-block;
}

.import-btn:hover {
  background: #3182ce; 
}

.import-btn:active {
  transform: scale(0.98);
}

.delete-all-data-btn {
  background: #ff2f00;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
}

.delete-all-data-btn:hover {
  background: #ca0909;
}

/* ✅ LOADING STYLES */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 16px;
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

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

.icon-btn:active {
  transform: scale(0.95);
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 9998;
}

/* Drawer */
.sidenav {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: #1f3f66;
  color: #fff;
  z-index: 9999;
  box-shadow: 2px 0 16px rgba(0,0,0,.25);
  display: flex;
  flex-direction: column;
}

.sidenav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}

.burger {
  letter-spacing: 3px;
}

.close-btn {
  background: none;
  border: 0;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.sidenav-nav {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.nav-item {
  width: 100%;
  text-align: left;
  border: 0;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 999px;
  background: #204874;
  color: #fff;
  transition: background .15s;
}

.nav-item:hover {
  background: #2b5b93;
}

.nav-item.active {
  background: #5a7ca7;
  color: #0b1220;
  font-weight: 600;
}

/* Transitions */
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform .18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .18s ease;
}
</style>