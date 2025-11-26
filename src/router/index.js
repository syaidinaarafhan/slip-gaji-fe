import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/auth/login.vue'
import { useAuthStore } from '../lib/stores/auth.js'

// halaman admin
const AdminDashboard = () => import('../views/dashboard/dashboard.admin.vue')
const AdminRegisterKaryawan = () => import('../views/auth/tambah.karyawan.vue')
const AdminUpdateKaryawan = () => import('../views/auth/update.karyawan.vue')
const AdminDashboardInputGaji = () => import('../views/input-gaji/input.gaji.dashboard.vue')
const AdminInputGaji = () => import('../views/input-gaji/input.gaji.karyawan.vue')
const AdminRiwayatGaji = () => import('../views/input-gaji/riwayat.gaji.vue')
const AdminMasterGaji = () => import('../views/master-slip-gaji/master.gaji.dashboard.vue')
const AdminRiwayatDetailGaji = () => import('../views/input-gaji/detail.riwayat.gaji.vue')

//halaman karyawan
const EmployeeDashboard = () => import('../views/dashboard/dashboard.user.vue')
const EmployeeProfile = () => import('../views/karyawan/profile.vue')
const EmployeeDetailSlip = () => import('../views/karyawan/detail.slip.vue')

export const router = createRouter({
  history: createWebHistory(),            // / tanpa '#'
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },

    // admin only
    { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/register', component: AdminRegisterKaryawan, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/editK/:id', component: AdminUpdateKaryawan, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/input-gaji', component: AdminDashboardInputGaji, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/input-gaji-karyawan/:id', component: AdminInputGaji, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/riwayat-gaji-karyawan/:id', component: AdminRiwayatGaji, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/master-slip-gaji', component: AdminMasterGaji, meta: { requiresAuth: true, roles: ['Admin'] } },
    { path: '/admin/riwayat-gaji-karyawan/detail/:id', component: AdminRiwayatDetailGaji, meta: { requiresAuth: true, roles: ['Admin'] } },


    // karyawan only
    { path: '/employee', component: EmployeeDashboard, meta: { requiresAuth: true, roles: ['Karyawan'] } },
    { path: '/employee/profile', component: EmployeeProfile, meta: { requiresAuth: true, roles: ['Karyawan'] } },
    { path: '/employee/detail/:id', component: EmployeeDetailSlip, meta: { requiresAuth: true, roles: ['Karyawan'] } },

    // (opsional) 404
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // hydrate sekali setelah reload tab (ambil /auth/me)
  if (!auth.hydrated) {
    await auth.hydrate()
  }

  // rute publik
  if (!to.meta?.requiresAuth) {
    // kalau sudah login & menuju /login → lempar ke dashboard sesuai role
    if (to.path === '/login' && auth.isAuthed) {
      return next(auth.role === 'Admin' ? '/admin' : '/employee')
    }
    return next()
  }

  // butuh login
  if (!auth.isAuthed) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // cek role
  const allowed = Array.isArray(to.meta.roles) ? to.meta.roles : []
  if (allowed.length && !allowed.includes(auth.role)) {
    return next(auth.role === 'Admin' ? '/admin'
              : auth.role === 'Karyawan' ? '/employee'
              : '/403')
  }

  next()
})
