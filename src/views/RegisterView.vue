<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 定義表單欄位資料
const phone = ref('')
const password = ref('')
const nickname = ref('')
const message = ref('')
const isSuccess = ref(false)

// 點擊註冊按鈕觸發的函式
const handleRegister = async () => {
  try {
    // 自動讀取 Vercel 的環境變數，若在本地則預設連到 127.0.0.1:8000
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

    const response = await fetch(`${apiBaseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone.value,
        password: password.value,
        nickname: nickname.value,
        role: 'general' // 預設身分為一般民眾
      })
    })

    const result = await response.json()

    if (response.ok) {
      isSuccess.value = true
      message.value = result.message || '註冊成功！3秒後將跳轉至登入頁面...'
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      isSuccess.value = false
      message.value = result.detail || '註冊失敗，請檢查輸入內容。'
    }
  } catch (error) {
    console.error('連線錯誤:', error)
    isSuccess.value = false
    message.value = '無法連線至後端伺服器，請確認後端是否已啟動！'
  }
}
</script>

<template>
  <!-- 背景與置中容器 -->
  <div class="register-container">
    <!-- 中間白色背景長方形卡片容器 -->
    <div class="register-card">
      
      <!-- 標題 -->
      <h2 class="system-title">
        註冊
      </h2>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <!-- 手機號碼欄位 -->
        <div class="form-group">
          <label for="phone" class="form-label">手機號碼 (帳號)</label>
          <input v-model="phone" id="phone" name="phone" type="text" required 
            class="form-input" 
            placeholder="請輸入手機號碼 (例如: 0912345678)">
        </div>

        <!-- 密碼欄位 -->
        <div class="form-group">
          <label for="password" class="form-label">密碼</label>
          <input v-model="password" id="password" name="password" type="password" required 
            class="form-input" 
            placeholder="請輸入密碼">
        </div>

        <!-- 暱稱欄位 -->
        <div class="form-group">
          <label for="nickname" class="form-label">暱稱</label>
          <input v-model="nickname" id="nickname" name="nickname" type="text" required 
            class="form-input" 
            placeholder="請輸入您的暱稱">
        </div>

        <!-- 註冊按鈕 -->
        <div class="pt-2">
          <button type="submit" class="register-btn">
            確認註冊
          </button>
        </div>
      </form>

      <!-- 顯示後端或前端驗證回傳的訊息 -->
      <div v-if="message" :class="isSuccess ? 'msg-success' : 'msg-error'" class="msg-box">
        {{ message }}
      </div>

      <!-- 返回登入連結 -->
      <div class="login-link">
        <router-link to="/login">已有帳號？返回登入</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 頁面整體背景與置中 */
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('@/assets/forest-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem;
}

/* 中間白色卡片容器 */
.register-card {
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
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1.5rem;
}

/* 表單群組 */
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

/* 輸入框樣式 */
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

/* 確認註冊按鈕 */
.register-btn {
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

.register-btn:hover {
  background-color: #047857;
}

/* 訊息提示框 */
.msg-box {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid;
}

.msg-success {
  color: #047857;
  background-color: #ecfdf5;
  border-color: #a7f3d0;
}

.msg-error {
  color: #b91c1c;
  background-color: #fef2f2;
  border-color: #fecaca;
}

/* 返回登入連結 */
.login-link {
  margin-top: 1.2rem;
  text-align: center;
}

.login-link a {
  color: #059669;
  text-decoration: none;
  font-size: 0.85rem;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>