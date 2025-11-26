<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '../../lib/axios/axios.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const userData = ref({
  name: '',
  position: ''
})

const salaryData = ref([])
const loading = ref(false)
const error = ref('')
const selectedYear = ref('2025')

async function dashboardKaryawan() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axiosInstance.get('/slipka/getDashboardKaryawan')
    
    userData.value = {
      name: data.name,
      position: data.jabatan
    }
    
    const slipMap = {}
    data.slipgajis.forEach(slip => {
      const date = new Date(slip.createdAt)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const key = `${year}-${month}`
      slipMap[key] = {
        id: slip.id,
        amount: slip.upah_yang_diterima
      }
    })
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    
    salaryData.value = months.map((monthName, index) => {
      const monthNumber = index + 1
      const key = `${selectedYear.value}-${monthNumber}`
      const slip = slipMap[key]
      
      return {
        id: slip?.id || null,
        month: monthName,
        year: parseInt(selectedYear.value),
        amount: slip?.amount || null,
        hasData: !!slip
      }
    })
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal memuat data'
    console.error('Error fetching dashboard data:', e)
  } finally {
    loading.value = false
  }
}

function viewDetail(slipId) {
  if (!slipId) return  // kalau belum ada data, tidak bisa klik
  router.push(`/employee/detail/${slipId}`)
}

function goToProfile() {
  router.push('/employee/profile')
}

onMounted(() => {
  dashboardKaryawan()
})
</script>

<template>
  <div class="page">
    <!-- Header Profile -->
    <header class="header">
      <div class="profile-section">
        <div class="avatar">👤</div>
        <div class="user-info">
          <h2 class="user-name">{{ userData.name }}</h2>
          <p class="user-position">{{ userData.position }}</p>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="content">
      <!-- Chart Section -->
      <section class="chart-section">
        <div class="chart-header">
          <select v-model="selectedYear" class="year-select">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        <div class="chart-placeholder">
          <svg viewBox="0 0 300 120" class="chart">
            <polyline
              points="0,80 30,85 60,40 90,45 120,20 150,25 180,60 210,30 240,70 270,50 300,60"
              fill="none"
              stroke="#1e40af"
              stroke-width="2"
            />
            <polyline
              points="0,80 30,85 60,40 90,45 120,20 150,25 180,60 210,30 240,70 270,50 300,60 300,120 0,120"
              fill="url(#gradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.4" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      <!-- Salary Cards Grid -->
      <section class="salary-grid">
        <p v-if="loading" class="loading-text">Memuat data...</p>
        <p v-if="error" class="error-text">{{ error }}</p>
        
        <div 
          v-for="item in salaryData" 
          :key="`${item.month}-${item.year}`"
          class="salary-card"
          :class="{ 'no-data': !item.hasData }"
        >
          <div class="card-header">
            <h3 class="month">{{ item.month }}</h3>
            <button 
              v-if="item.hasData"
              class="detail-btn" 
              @click="viewDetail(item.id)"
            >
              ⊕
            </button>
          </div>
          <p class="amount" v-if="item.hasData">
            Rp {{ item.amount.toLocaleString('id-ID') }}
          </p>
          <p class="no-data-label" v-else>
            Belum ada gaji
          </p>
        </div>
      </section>
    </main>

    <!-- Bottom Navigation (Mobile only) -->
    <nav class="bottom-nav">
      <button class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </button>
      <button class="nav-item" @click="goToProfile">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Profile</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #3b82f6, #60a5fa);
  padding-bottom: 80px;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}

.user-info {
  color: white;
}

.user-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.user-position {
  margin: 4px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

/* Content */
.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Chart Section */
.chart-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.year-select {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.chart-placeholder {
  width: 100%;
  height: 150px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* Salary Grid */
.salary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.salary-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.salary-card:hover {
  transform: translateY(-4px);
}

.salary-card.no-data {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.7);
}

.salary-card.no-data:hover {
  transform: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.detail-btn {
  background: #3b82f6;
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
}

.detail-btn:hover {
  background: #2563eb;
}

.amount {
  margin: 0;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.no-data-label {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

.loading-text,
.error-text,
.empty-text {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: white;
}

.error-text {
  color: #fecaca;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(43, 82, 120, 0.95);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  transition: color 0.2s;
}

.nav-item.active {
  color: white;
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 12px;
}

/* Desktop Styles */
@media (min-width: 768px) {
  .page {
    padding-bottom: 40px;
  }

  .header {
    padding: 32px 40px;
  }

  .avatar {
    width: 80px;
    height: 80px;
    font-size: 40px;
  }

  .user-name {
    font-size: 28px;
  }

  .user-position {
    font-size: 16px;
  }

  .content {
    padding: 40px;
  }

  .chart-section {
    padding: 32px;
    margin-bottom: 32px;
  }

  .chart-placeholder {
    height: 250px;
  }

  .salary-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
  }

  .salary-card {
    padding: 24px;
  }

  .month {
    font-size: 18px;
  }

  .amount {
    font-size: 16px;
  }

  /* Hide bottom nav on desktop */
  .bottom-nav {
    display: none;
  }
}

@media (min-width: 1024px) {
  .salary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>