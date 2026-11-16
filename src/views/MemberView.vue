<template>
  <div class="member-container">
    <!-- 頂部導覽列 -->
    <header class="header">
      <div class="title-area">
        <button @click="goBack" class="back-btn">&lt; 返回</button>
        <h1>會員中心 / 設定</h1>
      </div>
    </header>

    <!-- 主要設定清單 -->
    <main class="main-content">
      <div class="settings-card">
        
        <div class="setting-section-title">個人資料管理</div>
        
        <!-- 個人資料設定 -->
        <div class="setting-item" @click="handleProfileSetting">
          <div class="setting-text">
            <span class="setting-title-text">個人資料設定</span>
            <span class="setting-desc">管理您的暱稱與基本資料</span>
          </div>
          <span class="arrow">&gt;</span>
        </div>

        <!-- 綁定載具條碼 -->
        <div class="setting-item" @click="handleBarcodeBinding">
          <div class="setting-text">
            <span class="setting-title-text">綁定載具條碼</span>
            <span class="setting-desc">手機條碼設定與雲端發票同步</span>
          </div>
          <span class="arrow">&gt;</span>
        </div>

        <div class="setting-section-title mt-4">帳號安全</div>

        <!-- 登出 -->
        <div class="setting-item logout-item" @click="handleLogout">
          <div class="setting-text">
            <span class="setting-title-text text-red">登出系統</span>
            <span class="setting-desc">安全登出目前帳號並返回登入頁</span>
          </div>
          <span class="arrow text-red">&gt;</span>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一頁（儀表板）
const goBack = () => {
  router.push('/dashboard')
}

// 點擊個人資料設定
const handleProfileSetting = () => {
  const phone = localStorage.getItem('user_phone') || '未知'
  const nickname = localStorage.getItem('user_nickname') || '使用者'
  alert(`目前登入帳號：${phone}\n您的暱稱：${nickname}`)
}

// 點擊綁定載具條碼
const handleBarcodeBinding = () => {
  const currentBarcode = localStorage.getItem('user_barcode') || '尚未綁定'
  const newBarcode = prompt('請輸入您的手機條碼 (例如: /AB1234Q)：', currentBarcode === '尚未綁定' ? '' : currentBarcode)
  if (newBarcode !== null) {
    if (newBarcode.trim() === '') {
      localStorage.removeItem('user_barcode')
      alert('已清除載具條碼綁定')
    } else {
      localStorage.setItem('user_barcode', newBarcode.trim())
      alert(`載具條碼綁定成功：${newBarcode.trim()}`)
    }
  }
}

// 登出系統並跳轉回登入畫面
const handleLogout = () => {
  if (confirm('確定要登出系統嗎？')) {
    localStorage.removeItem('user_nickname')
    localStorage.removeItem('user_phone')
    localStorage.removeItem('user_barcode')
    alert('已成功登出')
    router.push('/login')
  }
}
</script>

<style scoped>
/* 頁面整體深綠色系背景 */
.member-container {
  min-height: 100vh;
  background-color: #064e3b;
  color: #f3f4f6;
  padding: 2rem 1.5rem;
  font-family: sans-serif;
  box-sizing: border-box;
}

/* 頂部導覽列 */
.header {
  max-width: 600px;
  margin: 0 auto 1.5rem auto;
  display: flex;
  align-items: center;
  background-color: #3e2723;
  border: 1px solid #5d4037;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.back-btn {
  background-color: #8d6e63;
  color: white;
  border: none;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s;
}

.back-btn:hover {
  background-color: #6d4c41;
}

.title-area h1 {
  font-size: 1.1rem;
  font-weight: bold;
  color: #efebe9;
  margin: 0;
}

/* 主要內容卡片 */
.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.settings-card {
  background-color: #ffffff;
  color: #1f2937;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  padding: 0.5rem 0;
}

.setting-section-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: #6b7280;
  padding: 1rem 1.5rem 0.5rem 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mt-4 {
  margin-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s;
}

.setting-item:hover {
  background-color: #f9fafb;
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.setting-title-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.setting-desc {
  font-size: 0.78rem;
  color: #6b7280;
}

.arrow {
  font-size: 1rem;
  color: #9ca3af;
  font-weight: bold;
}

.logout-item {
  border-bottom: none;
}

.text-red {
  color: #dc2626 !important;
}
</style>