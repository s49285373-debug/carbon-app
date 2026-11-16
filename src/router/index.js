import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import MemberView from '../views/MemberView.vue' // 1. 引入會員設定頁面

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/dashboard', component: DashboardView },
  { path: '/member', component: MemberView } // 2. 註冊會員設定頁面路由
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router