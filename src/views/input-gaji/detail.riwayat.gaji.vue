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
    const { data } = await axiosInstance.get('/slipka/getDetailSlipGaji', { params: { id } })
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
         (user.value.bpjs_kes_ii || 0) + 
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
        
        <!-- Info Hari Kerja -->
        <div class="info-card">
          <div class="info-icon">📅</div>
          <div class="info-content">
            <span class="info-label">Hari Kerja</span>
            <span class="info-value">{{ user.hari_kerja }} Hari</span>
          </div>
        </div>

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
              <span class="item-value">{{ formatRupiah(user.bpjs_kes_ii) }}</span>
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
  background: linear-gradient(135deg, #1f3654 0%, #2b5278 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(43, 82, 120, 0.95);
  backdrop-filter: blur(10px);
  color: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
  border-radius: 6px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
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
}

.error-box {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.error-text {
  color: #d32f2f;
  margin: 0 0 16px 0;
  font-size: 15px;
}

.retry-btn {
  background: #2b5278;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #1f3654;
  transform: translateY(-1px);
}

/* Content */
.content {
  flex: 1;
  padding: 20px 16px;
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
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 20px;
  color: #1f3654;
  font-weight: 700;
}

/* Section */
.section {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

/* Item List */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.item.positive {
  background: rgba(46, 213, 115, 0.08);
  border-left: 3px solid #2ed573;
}

.item.negative {
  background: rgba(255, 71, 87, 0.08);
  border-left: 3px solid #ff4757;
}

.item-label {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

.item-value {
  font-size: 14px;
  color: #212529;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* Subtotal */
.subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
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
  color: #2ed573;
}

.negative-text {
  color: #ff4757;
}

/* Final Total */
.final-total {
  background: linear-gradient(135deg, #2ed573 0%, #1abc9c 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(46, 213, 115, 0.3);
  margin-top: 8px;
}

.final-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.95;
}

.final-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

  /* Grid Layout untuk Desktop */
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
    background: #2b5278;
    position: static;
  }

  .back-btn {
    display: none;
  }

  .section, .info-card, .final-total {
    box-shadow: none;
    break-inside: avoid;
  }
}
</style>