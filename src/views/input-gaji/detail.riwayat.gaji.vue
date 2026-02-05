<script setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter, useRoute } from 'vue-router'

const user = ref(null)
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()
const id = route.params.id

async function fetchUser() {
  try {
    loading.value = true
    error.value = ''
    const { data } = await axiosInstance.get(`/slip-gaji/${id}`)
    user.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Gagal memuat user'
  } finally {
    loading.value = false
  }
}

// Format rupiah
const formatRupiah = (value) => {
  if (!value && value !== 0) return 'Rp. 0'
  return 'Rp. ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Hitung total potongan
const totalPotongan = computed(() => {
  if (!user.value) return 0
  return (user.value.bpjs_tk || 0) + 
         (user.value.bpjs_ks || 0) + 
         (user.value.kasbon || 0) + 
         (user.value.sawb || 0) + 
         (user.value.seragam || 0) + 
         (user.value.diklat || 0)
})

// Hitung total transaksi khusus
const totalTransaksi = computed(() => {
  if (!user.value) return 0
  return (user.value.bonus || 0) - (user.value.pengurangan || 0)
})

onMounted(() => {
  fetchUser()
})

function goBack() { 
  router.back() 
}
</script>

<template>
  <div class="page">
    <header class="header">
      <button class="back-btn" @click="goBack" aria-label="Kembali">←</button>
      <h1 class="title">Detail Gaji</h1>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-box">
        <p class="error-text">{{ error }}</p>
        <button @click="fetchUser" class="retry-btn">Coba Lagi</button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="user" class="content">
      <div class="container">

        <!-- Section Potongan -->
        <section class="section">
          <h2 class="section-title">Section Potongan</h2>
          
          <div class="item-list">
            <div class="item">
              <span class="item-label">BPJS TK</span>
              <span class="item-value">{{ formatRupiah(user.bpjs_tk) }}</span>
            </div>
            
            <div class="item">
              <span class="item-label">BPJS KES II</span>
              <span class="item-value">{{ formatRupiah(user.bpjs_ks) }}</span>
            </div>
            
            <div class="item">
              <span class="item-label">KASBON</span>
              <span class="item-value">{{ formatRupiah(user.kasbon) }}</span>
            </div>
            
            <div class="item">
              <span class="item-label">SAWB</span>
              <span class="item-value">{{ formatRupiah(user.sawb) }}</span>
            </div>
            
            <div class="item">
              <span class="item-label">SERAGAM</span>
              <span class="item-value">{{ formatRupiah(user.seragam) }}</span>
            </div>
            
            <div class="item">
              <span class="item-label">DIKLAT</span>
              <span class="item-value">{{ formatRupiah(user.diklat) }}</span>
            </div>
          </div>

          <div class="subtotal">
            <span class="subtotal-label">Total Potongan</span>
            <span class="subtotal-value">{{ formatRupiah(totalPotongan) }}</span>
          </div>
        </section>

        <!-- Section Transaksi Khusus -->
        <section class="section">
          <h2 class="section-title">Section Transaksi Khusus</h2>
          
          <div class="item-list">
            <div class="item positive">
              <span class="item-label">Bonus</span>
              <span class="item-value">{{ formatRupiah(user.bonus) }}</span>
            </div>
            
            <div class="item negative">
              <span class="item-label">Pengurangan</span>
              <span class="item-value">{{ formatRupiah(user.pengurangan) }}</span>
            </div>
          </div>

          <div class="subtotal">
            <span class="subtotal-label">Total Transaksi</span>
            <span class="subtotal-value" :class="{ 'positive-text': totalTransaksi >= 0, 'negative-text': totalTransaksi < 0 }">
              {{ formatRupiah(totalTransaksi) }}
            </span>
          </div>
        </section>

        <!-- Total Upah Yang Diterima -->
        <div class="final-total">
          <div class="final-label">Upah Yang Diterima :</div>
          <div class="final-value">{{ formatRupiah(user.upah_yang_diterima) }}</div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset & Base */
* {
  box-sizing: border-box;
}

/* Layout umum & header */
.page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2c5282;
  color: #fff;
  padding: 16px 20px;
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
  background: rgba(255, 255, 255, 0.15);
}

.export-btn {
  background: #38a169;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  margin-left: auto;
}

.export-btn:hover {
  background: #2f855a;
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
}

.error-box {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #fc8181;
}

.error-text {
  color: #c53030;
  margin: 0 0 16px 0;
  font-size: 15px;
}

.retry-btn {
  background: #2c5282;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.retry-btn:hover {
  background: #2a4365;
}

/* Content */
.content {
  flex: 1;
  padding: 24px 16px;
  overflow-y: auto;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Info Card (Hari Kerja) */
.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.info-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #edf2f7;
  border-radius: 8px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.info-value {
  font-size: 20px;
  color: #2d3748;
  font-weight: 700;
}

/* Section */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

/* Item List */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
}

.item.positive {
  background: #f0fff4;
  border: 1px solid #9ae6b4;
}

.item.negative {
  background: #fff5f5;
  border: 1px solid #feb2b2;
}

.item-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.item-value {
  font-size: 14px;
  color: #2d3748;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* Subtotal */
.subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #2c5282;
  border-radius: 6px;
  color: #fff;
  margin-top: 8px;
}

.subtotal-label {
  font-size: 14px;
  font-weight: 600;
}

.subtotal-value {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.positive-text {
  color: #48bb78;
}

.negative-text {
  color: #f56565;
}

/* Final Total */
.final-total {
  background: #38a169;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.final-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.final-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

/* Responsive Design */
@media (min-width: 768px) {
  .content {
    padding: 32px 24px;
  }

  .container {
    max-width: 900px;
  }

  .header {
    padding: 16px 24px;
  }

  .title {
    font-size: 20px;
  }

  .section {
    padding: 24px;
  }

  .section-title {
    font-size: 16px;
  }

  .item-label, .item-value {
    font-size: 15px;
  }

  .info-value {
    font-size: 22px;
  }

  .final-value {
    font-size: 32px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1000px;
    gap: 20px;
  }

  .content {
    padding: 40px 32px;
  }

  .section {
    padding: 28px;
  }

  .info-card {
    padding: 20px 24px;
  }
}

/* Print Styles */
@media print {
  .page {
    background: #fff;
  }

  .header {
    background: #2c5282;
    position: static;
  }

  .back-btn, .export-btn {
    display: none;
  }

  .section, .info-card, .final-total {
    box-shadow: none;
    break-inside: avoid;
  }
}
</style>