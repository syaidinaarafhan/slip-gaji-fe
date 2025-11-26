<!-- src/views/Login.vue -->
<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute  } from 'vue-router'
import axiosInstance  from '../../lib/axios/axios.js'

const router = useRouter()
const route = useRoute()
const form = reactive({name: '', jabatan: '', nik: ''})
const loading = ref(false)
const error = ref('')
const user_id = parseInt(route.params.id)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    
    await axiosInstance.put('/auth/editUser', {id: user_id, name: form.name, jabatan: form.jabatan, nik: form.nik})
    
    router.push('/admin')

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
      <h1 class="title">Silahkan Update</h1>

      <form class="form" @submit.prevent="onSubmit">

        <label class="label">Nama</label>
        <input
          v-model="form.name"
          class="input"
          placeholder="Nama"
          autocomplete="username"
          required
        />

        <label class="label">Jabatan</label>
        <input
          v-model="form.jabatan"
          class="input"
          placeholder="Jabatan"
          autocomplete="username"
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

        <button class="btn" :disabled="loading">
          {{ loading ? 'Memproses…' : 'Update' }}
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
