<template>
  <div class="login-container">
    <!-- 中間的白色背景登入卡片 -->
    <div class="login-card">
      
      <!-- 系統標題 -->
      <h1 class="system-title">
        日常發票載具之個人碳足跡與隱形碳成本智慧盤查推估系統
      </h1>

      <!-- 登入表單 -->
      <form @submit.prevent="handleLogin">
        
        <!-- 帳號輸入框 -->
        <div class="form-group">
          <label class="form-label">帳號</label>
          <input 
            v-model="phone" 
            type="text" 
            required
            placeholder="請輸入手機號碼" 
            class="form-input"
          />
        </div>

        <!-- 密碼輸入框 -->
        <div class="form-group">
          <label class="form-label">密碼</label>
          <input 
            v-model="password" 
            type="password" 
            required
            placeholder="請輸入密碼" 
            class="form-input"
          />
        </div>

        <!-- 綠色登入按鈕 -->
        <button type="submit" class="login-btn">
          登入
        </button>
      </form>

      <!-- 下方先註冊按鈕 (無框線) -->
      <div class="register-container">
        <router-link to="/register" class="register-link">
          先註冊
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const phone = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    console.log('送出登入:', { phone: phone.value, password: password.value })

    // 動態讀取環境變數的後端網址（支援 Railway 雲端或本機）
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

    // 呼叫後端登入 API
    const response = await axios.post(`${API_BASE_URL}/api/login`, {
      phone: phone.value,
      password: password.value
    })

    // 取得後端回傳的真實暱稱（支援多種常見的欄位回傳格式）
    const userNickname = response.data.nickname || response.data.user_nickname || response.data.user?.nickname || '使用者'

    // 將真實從資料庫拿到的暱稱與帳號存入 localStorage
    localStorage.setItem('user_nickname', userNickname)
    localStorage.setItem('user_phone', phone.value)

    alert('登入成功！')
    // 成功後跳轉至儀表板畫面
    router.push('/dashboard')

  } catch (error) {
    console.error('登入失敗:', error)
    alert('登入失敗，請檢查手機號碼或密碼是否正確')
  }
}
</script>

<style scoped>
/* 頁面整體背景與置中 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('/src/assets/forest-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem;
}

/* 中間白色卡片 */
.login-card {
  width: 100%;
  max-width: 440px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  padding: 2.5rem 2rem;
  box-sizing: border-box;
}

/* 標題樣式 */
.system-title {
  font-size: 1.15rem;
  font-weight: bold;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1.75rem;
  line-height: 1.5;
}

/* 表單欄位區塊 */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.35rem;
}

/* 有框線的文字輸入框 */
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #1f2937;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

/* 綠色登入按鈕 */
.login-btn {
  width: 100%;
  background-color: #059669;
  color: #ffffff;
  font-weight: 600;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);
  margin-top: 0.5rem;
}

.login-btn:hover {
  background-color: #047857;
}

/* 下方先註冊按鈕 (無框線) */
.register-container {
  text-align: center;
  margin-top: 1.5rem;
}

.register-link {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #059669;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.register-link:hover {
  color: #047857;
  text-decoration: underline;
}
</style>