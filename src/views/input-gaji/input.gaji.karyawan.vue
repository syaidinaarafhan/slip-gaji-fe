<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NButton, NCard, NDivider, NForm, NFormItem, NGrid, NGi,
  NInput, NInputNumber, NSpace, NText
} from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import axiosInstance from '../../lib/axios/axios.js'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const user = ref(null)
const loading = ref(false)
const error = ref('')

const form = reactive({
  // inputan wajib / bebas edit
  tunjangan_jabatan: null,
  // potongan
  bpjs_tk: null,
  bpjs_ks: null,
  kasbon: null,
  sawb: null,
  seragam: null,
  diklat: null,
  // transaksi khusus
  bonus: null,
  pengurangan: null
})

/** MAP upah harian per jabatan (boleh kamu pindah ke backend kalau mau) */
const RATE_PER_DAY = {
  Karyawan: 180000,
  Karyawan1: 200000
}

/* ===== Utils Rupiah ===== */
const formatRp = (num) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`

/* ===== Hitungan otomatis sesuai rumus kamu ===== */
// upah harian otomatis dari jabatan user
const upahHarianOtomatis = computed(() => {
  const j = user.value?.jabatan
  return RATE_PER_DAY[j] ?? 0
})

// gaji pokok = upah harian × hari kerja
const gajiPokok = computed(() => upahHarianOtomatis.value )
const total_upah_kotor = computed(() =>
  gajiPokok.value + (+form.tunjangan_jabatan || 0)
)

// total potongan (inkl. “pengurangan” khusus yang kamu tambahkan)
const totalPotongan = computed(() => {
  const f = form
  return (+f.bpjs_tk || 0) + (+f.bpjs_ks || 0) + (+f.kasbon || 0) +
         (+f.sawb || 0) + (+f.seragam || 0) + (+f.diklat || 0) + (+f.pengurangan || 0)
})

// upah yang diterima = gaji pokok + tunjangan jabatan + bonus − total potongan
const gajiBersih = computed(() =>
  gajiPokok.value + (+form.tunjangan_jabatan || 0) + (+form.bonus || 0) - totalPotongan.value
)

async function fetchUser () {
  try {
    loading.value = true
    error.value = ''
    const { data } = await axiosInstance.get(`/user/${id}`)
    user.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Gagal memuat user'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUser)

/* ===== Submit: tidak mengirim upah_harian/gaji_pokok karena hanya hitungan UI ===== */
async function submitGaji () {
  error.value = ''
  if (!user.value?.id) { error.value = 'User tidak ditemukan.'; return }

  const payload = {
    user_id: user.value.id,
    jabatan: user.value.jabatan,
    tunjangan_jabatan: +form.tunjangan_jabatan || 0,
    total_upah_kotor: total_upah_kotor.value,
    bpjs_tk: +form.bpjs_tk || 0,
    bpjs_ks: +form.bpjs_ks || 0,
    kasbon: +form.kasbon || 0,
    sawb: +form.sawb || 0,
    seragam: +form.seragam || 0,
    diklat: +form.diklat || 0,
    bonus: +form.bonus || 0,
    pengurangan: +form.pengurangan || 0
    // NOTE: gajiPokok/upahHarian tidak dikirim
  }

  try {
    loading.value = true
    await axiosInstance.post('/slip-gaji', payload)
    router.back()
  } catch (e) {
    error.value = e.response?.data?.error || e.response?.data?.message || e.message || 'Gagal input gaji'
  } finally {
    loading.value = false
  }
}

function goBack () { router.back() }
</script>


<template>
  <div class="page">
    <header class="header">
      <button class="back-btn" @click="goBack" aria-label="Kembali">←</button>
      <h1 class="title">Input Gaji</h1>
    </header>

    <div class="container">
      <NCard class="form-card" :content-style="{ padding: '16px 16px 6px' }">
        <NForm label-placement="top" :disabled="loading">
          
          <!-- Baris atas: Nama (text), Jabatan (text), Hari Kerja (input) -->
          <NGrid :cols="12" :x-gap="16" :y-gap="8">
            <NGi :span="6">
              <NFormItem label="Nama Karyawan">
                <div class="readonly-field">{{ user?.name ?? '—' }}</div>
              </NFormItem>
            </NGi>

            <NGi :span="4">
              <NFormItem label="Jabatan">
                <div class="readonly-field">{{ user?.jabatan ?? '—' }}</div>
              </NFormItem>
            </NGi>
          </NGrid>

          <!-- Gaji otomatis -->
          <NDivider />
          <NGrid :cols="12" :x-gap="16" :y-gap="8">
            <NGi :span="4">
              <NFormItem label="Upah Harian (otomatis)">
                <div class="readonly-field">{{ formatRp(upahHarianOtomatis) }}</div>
              </NFormItem>
            </NGi>

            <NGi :span="5">
              <NFormItem label="Gaji Pokok (Upah × Hari)">
                <div class="readonly-field">{{ formatRp(gajiPokok) }}</div>
              </NFormItem>
            </NGi>

            <NGi :span="6">
              <NFormItem label="Tunjangan Jabatan">
                <NInputNumber v-model:value="form.tunjangan_jabatan" :min="0" />
              </NFormItem>
            </NGi>
          </NGrid>

          <!-- Section Potongan -->
          <NDivider>
            <span class="section-title">Section Potongan</span>
          </NDivider>

          <NGrid :cols="12" :x-gap="16" :y-gap="8">
            <NGi :span="6">
              <NFormItem label="BPJS TK">
                <NInputNumber v-model:value="form.bpjs_tk" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="BPJS KS">
                <NInputNumber v-model:value="form.bpjs_ks" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="KASBON">
                <NInputNumber v-model:value="form.kasbon" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="SAWB">
                <NInputNumber v-model:value="form.sawb" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="SERAGAM">
                <NInputNumber v-model:value="form.seragam" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="DIKLAT">
                <NInputNumber v-model:value="form.diklat" :min="0" />
              </NFormItem>
            </NGi>
          </NGrid>

          <!-- Section Transaksi Khusus -->
          <NDivider>
            <span class="section-title">Section Transaksi Khusus</span>
          </NDivider>

          <NGrid :cols="12" :x-gap="16" :y-gap="8">
            <NGi :span="6">
              <NFormItem label="Bonus">
                <NInputNumber v-model:value="form.bonus" :min="0" />
              </NFormItem>
            </NGi>
            <NGi :span="6">
              <NFormItem label="Pengurangan">
                <NInputNumber v-model:value="form.pengurangan" :min="0" />
              </NFormItem>
            </NGi>
          </NGrid>

          <!-- Ringkasan -->
          <NDivider />
          <div class="summary">
            <div><NText depth="3">Gaji Pokok (Upah × Hari)</NText> <strong>{{ formatRp(gajiPokok) }}</strong></div>
            <div><NText depth="3">Tunjangan Tetap</NText> <strong>{{ formatRp(form.tunjangan_jabatan) }}</strong></div>
            <div><NText depth="3">Bonus</NText> <strong>{{ formatRp(form.bonus) }}</strong></div>
            <div><NText depth="3">Total Potongan (incl. Pengurangan)</NText> <strong>- {{ formatRp(totalPotongan) }}</strong></div>
            <div class="net">
              <span>Upah yang Diterima</span>
              <strong>{{ formatRp(gajiBersih) }}</strong>
            </div>
          </div>

          <NSpace justify="end" style="margin-top: 16px;">
            <NButton type="primary" strong round :loading="loading" @click="submitGaji">
              Input Gaji
            </NButton>
          </NSpace>

          <div v-if="error" class="error-text">{{ error }}</div>
        </NForm>
      </NCard>
    </div>
  </div>
</template>


<style scoped>
/* Layout umum */
.page {
  min-height: 100vh;
  background: #2c5282;
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

.container {
  width: 100%;
  max-width: 1100px;
  margin: 16px auto 32px;
  padding: 0 12px;
}
.form-card { border-radius: 10px; }

/* Field readonly (teks) agar selaras dengan NInput */
.readonly-field {
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #e5e7eb;     /* mirip border input */
  border-radius: 6px;
  background: #f7fafc;           /* subtle */
  color: #1a202c;
  font-size: 14px;
  line-height: 1;
  user-select: text;
}

/* Judul section di tengah seperti screenshot */
.section-title {
  font-weight: 600;
  color: #1a202c;
}

/* Ringkasan */
.summary {
  display: grid;
  gap: 8px;
  color: #1a202c;
}
.summary > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary .net {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e0;
  font-size: 18px;
}

/* Error */
.error-text { margin-top: 10px; color: #c53030; }
</style>
