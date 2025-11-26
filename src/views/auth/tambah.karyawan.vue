<!-- src/views/Login.vue -->
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance  from '../../lib/axios/axios.js'

const router = useRouter()
const form = reactive({name: '', password: '', nik: '', area: ''})
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await axiosInstance.post('/auth/register', {
        name: form.name, 
        password: form.password, 
        nik: form.nik,
        area: form.area,
    })

    router.back()
  } catch (e) {
    error.value =
      e.response?.data?.error ||
      e.response?.data?.message ||
      e.message ||
      'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="wrap">
      <p class="subtitle">Silakan Tambahkan Akun Karyawan</p>

      <form class="form" @submit.prevent="onSubmit">

        <label class="label">Nama</label>
        <input
          v-model="form.name"
          class="input"
          placeholder="Name"
          autocomplete="username"
          required
        />
        <label class="label">Password</label>
        <input
          v-model="form.password"
          type="password"
          class="input"
          placeholder="Password"
          autocomplete="current-password"
          required
        />
        <label class="label">NIK</label>
        <input
          v-model="form.nik"
          class="input"
          placeholder="NIK"
          autocomplete="username"
          required
        />
        <label class="label">Area</label>
        <input
          v-model="form.area"
          class="input"
          placeholder="Area"
          autocomplete="username"
          required
        />

        <button class="btn" :disabled="loading">
          {{ loading ? 'Memproses…' : 'Tambahkan' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Latar biru penuh seperti screenshot */
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #153b6e; /* biru tua */
  color: #fff;
  padding: 24px;
}

/* Konten terpusat */
.wrap {
  text-align: center;
  width: min(720px, 92vw);
}

/* Judul besar */
.title {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.2px;
  font-size: clamp(28px, 6vw, 64px);
}
.subtitle {
  margin: 8px 0 28px;
  opacity: 0.92;
}

/* Form */
.form {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.label {
  width: 100%;
  max-width: 420px;
  text-align: left;
  font-size: 12px;
  opacity: 0.9;
  padding-left: 10px;
}

/* Input kapsul putih */
.input {
  width: 100%;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: #f0f5ff;        /* putih kebiruan */
  color: #1b2a4a;
  box-shadow: 0 0 0 1px rgba(255,255,255,.15) inset;
}
.input::placeholder { color: #7f8fb2; }

/* Tombol kapsul */
.btn {
  margin-top: 8px;
  padding: 10px 28px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #e9f0ff;
  color: #1b2a4a;
  font-weight: 600;
  transition: transform .05s ease;
}
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .6; cursor: not-allowed; }

/* Error */
.error {
  margin-top: 10px;
  color: #ffd2d2;
}
</style>
