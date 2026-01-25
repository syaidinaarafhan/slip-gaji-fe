<script setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'
import { NDatePicker } from 'naive-ui'

const user = ref(null)
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()
const id = route.params.id

const selectedYearTimestamp = ref(null)

// Convert timestamp ke year integer
const selectedYear = computed(() => {
  if (!selectedYearTimestamp.value) return null
  return new Date(selectedYearTimestamp.value).getFullYear()
})

async function fetchUser() {
  try {
    loading.value = true
    error.value = ''
    const { data } = await axiosInstance.get('/slip/getUserByIdWithSlip', { params: { id } })
    user.value = data
    console.log(user.id)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Gagal memuat user'
  } finally {
    loading.value = false
  }
}

// Computed: filter slip gaji berdasarkan tahun yang dipilih
const filteredSlips = computed(() => {
  if (!user.value?.slipGaji) return []
  
  if (selectedYear.value) {
    return user.value.slipGaji.filter(slip => {
      const slipYear = new Date(slip.createdAt).getFullYear()
      return slipYear === selectedYear.value
    })
  }
  
  // Kalau tidak ada filter, tampilkan tahun sekarang
  const currentYear = new Date().getFullYear()
  return user.value.slipGaji.filter(slip => {
    const slipYear = new Date(slip.createdAt).getFullYear()
    return slipYear === currentYear
  })
})

// Computed: tahun yang ditampilkan
const displayYear = computed(() => {
  return selectedYear.value || new Date().getFullYear()
})

onMounted(() => {
  fetchUser()
})

function viewDetail(slipId) {
  if (!slipId) return  // kalau belum ada data, tidak bisa klik
  router.push(`/admin/riwayat-gaji-karyawan/detail/${slipId}`)
}

function goBack() { 
  router.back() 
}
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="back-btn" @click="goBack" aria-label="Kembali">←</button>
      <h1 class="title">Daftar Riwayat Gaji</h1>
    </header>

    <div class="container">
      <!-- Nama karyawan -->
      <div class="name-label">{{ user?.name }}</div>
      
      <!-- Filter Tahun -->
      <div class="filter-year">
        <label>Pilih Tahun:</label>
        <n-date-picker 
          v-model:value="selectedYearTimestamp" 
          type="year" 
          placeholder="Pilih Tahun"
          clearable
        />
      </div>

      <div class="year-line">
        <div class="year">{{ displayYear }}</div>
        <div class="line"></div>
      </div>

      <!-- Grid 12 bulan -->
      <div class="months-grid">
        <div
          v-for="(monthName, m) in ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']"
          :key="m"
          class="month-card"
        >
          <div class="month-title">{{ monthName }}</div>

          <!-- Cari slip untuk bulan m (0-11) dari slip yang sudah difilter -->
          <template v-if="filteredSlips.find(s => new Date(s.createdAt).getMonth() === m)">
            <div
              class="amount"
              v-text="
                'Rp. ' + (
                  (filteredSlips.find(s => new Date(s.createdAt).getMonth() === m)?.upah_yang_diterima || 0)
                ).toLocaleString('id-ID')
              "
            />
            <button 
              class="detail-btn" 
              @click="viewDetail(filteredSlips.find(s => new Date(s.createdAt).getMonth() === m)?.id)"
            >
              🔍
            </button>
          </template>
          <template v-else>
            <div class="empty">Belum ada gaji</div>
          </template>
          
        </div>
        
      </div>

      <div v-if="loading" class="hint">Memuat…</div>
      <div v-if="error" class="error-text">{{ error }}</div>
    </div>
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
  color: #fff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.title {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.back-btn {
  background: none;
  border: 0;
  color: #fff;
  cursor: pointer;
  font-size: 24px;
  padding: 4px 8px;
  margin: -4px;
  border-radius: 4px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Container */
.container {
  background: #fff;
  width: calc(100% - 32px);
  max-width: 1200px;
  margin: 24px auto;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* Name Label */
.name-label {
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* Filter Year */
.filter-year {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.filter-year label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

/* Year Line */
.year-line {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.year {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
}

.year-line .line {
  flex: 1;
  height: 4px;
  background: #2c5282;
  border-radius: 2px;
}

/* Months Grid */
.months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.month-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
}

.month-title {
  font-weight: 600;
  font-size: 15px;
  color: #2d3748;
  margin-bottom: 12px;
}

.amount {
  font-size: 14px;
  font-weight: 600;
  color: #2c5282;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
}

.empty {
  font-size: 14px;
  color: #a0aec0;
  font-style: italic;
  margin-bottom: 12px;
}

.detail-btn {
  background: #2c5282;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-btn:hover {
  background: #2a4365;
}

/* States */
.hint {
  margin-top: 20px;
  color: #4a5568;
  text-align: center;
  font-size: 14px;
}

.error-text {
  margin-top: 20px;
  color: #e53e3e;
  text-align: center;
  font-size: 14px;
}

/* Responsive */
@media (min-width: 768px) {
  .header {
    padding: 16px 24px;
  }

  .title {
    font-size: 20px;
  }

  .container {
    padding: 32px;
    margin: 32px auto;
  }

  .name-label {
    font-size: 18px;
  }
}

@media (max-width: 900px) {
  .months-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .months-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .container {
    width: calc(100% - 24px);
    padding: 20px;
    margin: 16px auto;
  }

  .year {
    font-size: 24px;
  }

  .month-card {
    min-height: 110px;
    padding: 14px;
  }
}

@media (max-width: 400px) {
  .months-grid {
    grid-template-columns: 1fr;
  }
}
</style>

 