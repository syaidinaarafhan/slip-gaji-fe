<!-- src/views/Login.vue -->
<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute  } from 'vue-router'
import { useAuthStore } from '../../lib/stores/auth.js'
import axiosInstance  from '../../lib/axios/axios.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const form = reactive({ nik: '', password: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const response = await axiosInstance.post('/auth/login', { nik: form.nik, password: form.password })
    auth.setUser(response.data.user)
    auth.hydrated = true

    const fallback = auth.role === 'Admin' ? '/admin' : '/employee'
    router.push(route.query.redirect || fallback)
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
      <h1 class="title">Selamat Datang</h1>
      <p class="subtitle">Silakan Login Dengan Akun Anda</p>

      <form class="form" @submit.prevent="onSubmit">
        <label class="label">NIK</label>
        <input
          v-model="form.nik"
          class="input"
          placeholder="NIK"
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

        <button class="btn" :disabled="loading">
          {{ loading ? 'Memproses…' : 'Login' }}
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
  padding: 0 16px;
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

@media (max-width: 480px) {
  .btn {
    width: 100%;
    max-width: 420px;
    padding: 14px 28px; /* sedikit lebih besar di mobile */
  }
}

</style>
