<template>
  <div class="dashboard-container">
    
    <!-- 頂部導覽列：Logo -> 暱稱 -> 帳本 -->
    <header class="header">
      <div class="title-area">
        <div class="logo-circle">
          <span>🌱</span>
        </div>
        <span class="user-nickname-tag">{{ nickname }}</span>
        <h1>帳本</h1>
      </div>
      <div class="user-area">
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
    </header>

    <!-- 主要內容區塊 -->
    <main class="main-content">

      <!-- 1. 上方插畫/視覺橫幅區塊 -->
      <section class="banner-card">
        <div class="banner-content">
          <h2>🌿 開始記錄您的低碳綠色生活</h2>
          <p>輕鬆掃描發票，追蹤個人碳足跡與隱形碳成本，讓每筆消費都對地球更友善！</p>
        </div>
        <div class="banner-stats">
          <div class="mini-stat">
            <span class="stat-num">12.8</span>
            <span class="stat-label">當期總碳排 (kg)</span>
          </div>
          <div class="mini-stat">
            <span class="stat-num">14</span>
            <span class="stat-label">已解析發票 (筆)</span>
          </div>
          <div class="mini-stat">
            <span class="stat-num">8.2%</span>
            <span class="stat-label">較上期減少</span>
          </div>
        </div>
      </section>

      <!-- 2. 中間白色圓角卡片清單 -->
      <section class="section-group">
        <h3 class="section-title">✨ 試試這些碳排盤查與低碳任務</h3>
        
        <div class="task-list">
          <div class="task-card">
            <div class="task-info">
              <div class="task-icon green-bg">🧾</div>
              <div>
                <h4>發票載具碳足跡掃描</h4>
                <p>即時解析每筆消費的碳排量與隱形碳成本</p>
              </div>
            </div>
            <button class="action-plus-btn">+</button>
          </div>

          <div class="task-card">
            <div class="task-info">
              <div class="task-icon blue-bg">💡</div>
              <div>
                <h4>家庭用電與生活化指標</h4>
                <p>將碳排量轉換為日常消耗電度與生活對比</p>
              </div>
            </div>
            <button class="action-plus-btn">+</button>
          </div>

          <div class="task-card">
            <div class="task-info">
              <div class="task-icon orange-bg">🛒</div>
              <div>
                <h4>消費類別碳排佔比</h4>
                <p>檢視食品、日用品與交通的碳排佔比分佈</p>
              </div>
            </div>
            <button class="action-plus-btn">+</button>
          </div>
        </div>
      </section>

      <!-- 3. 下方進行中的任務與智慧建議 -->
      <section class="section-group">
        <h3 class="section-title">進行中的低碳改善計畫</h3>
        
        <div class="ongoing-card">
          <div class="ongoing-header">
            <div class="task-info">
              <div class="task-icon yellow-bg">⚠️</div>
              <div>
                <h4>本週乳製品與瓶裝茶類攝取偏高</h4>
                <p class="ongoing-desc">系統建議：改以燕麥奶替換全脂牛奶，或自備環保杯購買手搖飲。</p>
              </div>
            </div>
            <span class="badge-tag">進行中 65%</span>
          </div>

          <div class="ongoing-footer">
            <span>預估可減少：<strong>1.4 公斤碳排</strong> (省下約 45 元)</span>
            <button class="action-go-btn">查看詳情</button>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nickname = ref('使用者')

onMounted(() => {
  const savedNickname = localStorage.getItem('user_nickname')
  if (savedNickname) {
    nickname.value = savedNickname
  }
})

const handleLogout = () => {
  localStorage.removeItem('user_nickname')
  alert('已成功登出')
  router.push('/login')
}
</script>

<style scoped>
/* 整體頁面底色（綠色系） */
.dashboard-container {
  min-height: 100vh;
  background-color: #064e3b;
  color: #f3f4f6;
  padding: 2rem 1.5rem;
  font-family: sans-serif;
  box-sizing: border-box;
}

/* 頂部導覽列：咖啡色系 */
.header {
  max-width: 900px;
  margin: 0 auto 1.5rem auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #3e2723;
  border: 1px solid #5d4037;
  padding: 1rem 1.75rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.logo-circle {
  width: 38px;
  height: 38px;
  background-color: #d7ccc8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

/* 放在 Logo 與帳本中間的暱稱標籤樣式 */
.user-nickname-tag {
  font-size: 0.9rem;
  color: #d7ccc8;
  background-color: rgba(255, 255, 255, 0.08);
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(215, 204, 200, 0.2);
  margin: 0 0.25rem;
}

.title-area h1 {
  font-size: 1.15rem;
  font-weight: bold;
  color: #efebe9;
  margin: 0;
}

.user-area {
  display: flex;
  align-items: center;
}

.logout-btn {
  background-color: #8d6e63;
  color: white;
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background-color: #6d4c41;
}

/* 主要容器 */
.main-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 上方橫幅卡片 */
.banner-card {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  border: 1px solid #10b981;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.banner-content h2 {
  font-size: 1.4rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.banner-content p {
  font-size: 0.95rem;
  color: #a7f3d0;
  margin: 0;
  line-height: 1.5;
}

.banner-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background-color: rgba(2, 44, 34, 0.5);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
}

.stat-label {
  font-size: 0.75rem;
  color: #6ee7b7;
  margin-top: 0.2rem;
}

.section-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 1.05rem;
  color: #d1fae5;
  margin: 0 0 0.2rem 0;
}

/* 白色圓角卡片清單 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.task-card {
  background-color: #ffffff;
  color: #1f2937;
  padding: 1.1rem 1.5rem;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
}

.task-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-icon {
  width: 45px;
  height: 45px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.green-bg { background-color: #d1fae5; }
.blue-bg { background-color: #e0f2fe; }
.orange-bg { background-color: #fef3c7; }
.yellow-bg { background-color: #fef9c3; }

.task-info h4 {
  font-size: 1rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 0.2rem 0;
}

.task-info p {
  font-size: 0.825rem;
  color: #4b5563;
  margin: 0;
}

.action-plus-btn {
  width: 36px;
  height: 36px;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-plus-btn:hover {
  background-color: #059669;
  color: white;
  border-color: #059669;
}

/* 進行中的任務卡片 */
.ongoing-card {
  background-color: #ffffff;
  color: #1f2937;
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ongoing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ongoing-desc {
  font-size: 0.825rem;
  color: #4b5563;
  margin: 0;
}

.badge-tag {
  background-color: #fef3c7;
  color: #d97706;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #fde68a;
  flex-shrink: 0;
}

.ongoing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.85rem;
  color: #4b5563;
}

.ongoing-footer strong {
  color: #059669;
}

.action-go-btn {
  background-color: #059669;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: background 0.2s;
}

.action-go-btn:hover {
  background-color: #047857;
}
</style>