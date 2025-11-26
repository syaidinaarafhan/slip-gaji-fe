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
  if (!user.value?.slipgajis) return []
  
  if (selectedYear.value) {
    return user.value.slipgajis.filter(slip => {
      const slipYear = new Date(slip.createdAt).getFullYear()
      return slipYear === selectedYear.value
    })
  }
  
  // Kalau tidak ada filter, tampilkan tahun sekarang
  const currentYear = new Date().getFullYear()
  return user.value.slipgajis.filter(slip => {
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

.filter-year {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.filter-year label {
  font-weight: 600;
}

/* Layout umum & header */
.page {
  min-height: 100vh;
  background: #1f3654; /* biru gelap seperti screenshot */
  display: flex;
  flex-direction: column;
}
.header {
  background: #2b5278;
  color: #fff;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.title { font-size: 18px; margin: 0; }
.back-btn { background: none; border: 0; color: #fff; cursor: pointer; font-size: 20px; }

/* Kanvas konten */
.container {
  background: #fff;
  width: calc(100% - 32px);
  max-width: 920px;
  margin: 16px auto 24px;
  padding: 18px 20px 28px;
  border-radius: 6px;
}

/* Label nama & tahun */
.name-label {
  color: #2d3748;
  font-size: 14px;
  margin-bottom: 6px;
}
.year-line {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}
.year {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
}
.year-line .line {
  flex: 1;
  height: 6px;
  background: #1f3654;
  border-radius: 3px;
}

/* Grid bulan */
.months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px 22px;
}

.month-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 12px 14px;
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #fff;
}
.month-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
}
.amount {
  font-size: 13px;
  color: #2d3748;
}
.empty {
  font-size: 13px;
  color: #a0aec0;
}

/* Hints & error */
.hint { margin-top: 12px; color: #4a5568; }
.error-text { margin-top: 12px; color: #c53030; }

/* Responsif kecil */
@media (max-width: 820px) {
  .months-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .months-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

 