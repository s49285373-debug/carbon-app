<template>
  <div class="dashboard-container" :class="{ 'scan-mode': currentTab === 'scan' }">

    <!-- 頂部導覽列：僅在「首頁 (home)」時顯示 -->
    <header class="header" v-if="currentTab === 'home'">
      <div class="title-area">
        <div class="logo-circle">
          <span>🌱</span>
        </div>
        <span class="user-nickname-tag">{{ nickname }}</span>
        <h1>帳本</h1>
      </div>
    </header>

    <!-- 主要內容區塊 -->
    <main class="main-content">

      <!-- 1. 【首頁】分頁內容 -->
      <template v-if="currentTab === 'home'">
        <section class="banner-card">
          <div class="banner-content">
            <h2>🌿 開始記錄您的低碳綠色生活</h2>
            <p>輕鬆掃描發票，追蹤個人碳足跡與隱形碳成本，讓每筆消費都對地球更友善！</p>
          </div>
          <div class="banner-stats">
            <div class="mini-stat">
              <span class="stat-num">{{ totalCarbonSum }}</span>
              <span class="stat-label">當期總碳排 (kg)</span>
            </div>
            <div class="mini-stat">
              <span class="stat-num">{{ invoiceList.length }}</span>
              <span class="stat-label">已解析發票 (筆)</span>
            </div>
            <div class="mini-stat">
              <span class="stat-num">8.2%</span>
              <span class="stat-label">較上期減少</span>
            </div>
          </div>
        </section>

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
              <button class="action-plus-btn" @click="openScanTab">+</button>
            </div>

            <div class="task-card">
              <div class="task-info">
                <div class="task-icon blue-bg">📒</div>
                <div>
                  <h4>檢視本期發票存摺明細</h4>
                  <p>瀏覽所有已擷取的發票品項、金額與來源紀錄</p>
                </div>
              </div>
              <button class="action-plus-btn" @click="currentTab = 'invoices'">&gt;</button>
            </div>

            <div class="task-card">
              <div class="task-info">
                <div class="task-icon orange-bg">🛒</div>
                <div>
                  <h4>消費類別碳排佔比</h4>
                  <p>檢視食品、日用品與交通的碳排佔比分佈</p>
                </div>
              </div>
              <button class="action-plus-btn" @click="currentTab = 'plan'">+</button>
            </div>
          </div>
        </section>
      </template>

      <!-- 2. 【發票存摺】分頁內容 -->
      <template v-if="currentTab === 'invoices'">
        <div class="passbook-wrapper">
          <div class="passbook-top-bar">
            <button class="passbook-icon-btn" @click="toggleSearchInput" title="搜尋發票、地點或品項">🔍</button>
            <span class="passbook-bar-title">發票存摺</span>
            <button class="passbook-icon-btn" @click="openScanTab" title="新增掃描發票">＋</button>
          </div>

          <div v-if="showSearchBar" class="passbook-search-bar">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜尋發票號碼、購買地點或品項..."
              class="passbook-search-input"
            />
          </div>

          <div class="passbook-body">
            <div class="period-selector">
              <button class="period-arrow-btn" @click="prevPeriod">&lt;</button>
              <span class="period-text">{{ periods[currentPeriodIndex] }}</span>
              <button class="period-arrow-btn" @click="nextPeriod">&gt;</button>
            </div>

            <div class="period-summary-card">
              <span class="summary-corner-badge">本期盤查中</span>
              <div class="summary-subtitle">本期消費總金額</div>
              <div class="summary-main-row">
                <span class="summary-amount">TWD {{ filteredTotalAmount.toLocaleString() }}</span>
                <span class="summary-divider">|</span>
                <span class="summary-count">{{ filteredInvoices.length }} 張</span>
              </div>
              <div class="summary-carbon-pill">
                🌱 本期累積碳排 <strong>{{ filteredTotalCarbon }}</strong> kg CO₂e ｜ 隱形碳成本 <strong>{{ filteredHiddenCost }}</strong> 元
              </div>
            </div>

            <div class="passbook-filter-row">
              <button class="filter-pill-btn" @click="cycleSourceFilter">
                🧾 {{ sourceFilterLabel }}
              </button>
              <button class="sort-text-btn" @click="toggleSortOrder">
                ⇅ {{ sortDesc ? '日期新到舊' : '日期舊到新' }}
              </button>
            </div>

            <div class="invoice-record-list" v-if="filteredInvoices.length > 0">
              <div
                class="invoice-record-item"
                v-for="inv in filteredInvoices"
                :key="inv.id"
                @click="selectedInvoiceDetail = inv"
              >
                <div class="record-top-meta">
                  <span>{{ inv.purchase_datetime || inv.purchase_date }}</span>
                  <span class="meta-sep">|</span>
                  <span>{{ inv.invoice_number }}</span>
                  <span class="meta-sep">|</span>
                  <span>{{ inv.merchant_name }}</span>
                </div>

                <div class="record-middle-main">
                  <div class="record-title">
                    {{ inv.summary_title }}
                  </div>
                  <div class="record-amount">
                    TWD {{ inv.total_amount }}
                  </div>
                </div>

                <div class="record-bottom-tags">
                  <span class="tag-carbon">🌿 {{ inv.carbon_kg }} kg CO₂e</span>
                  <div class="record-right-actions">
                    <span
                      class="tag-source"
                      :class="inv.source_type === 'manual' ? 'source-manual' : 'source-electronic'"
                    >
                      {{ inv.source_type === 'manual' ? '手動輸入' : '電子發票' }}
                    </span>
                    <button
                      type="button"
                      class="tag-delete-btn"
                      @click.stop="deleteInvoice(inv.id)"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-invoice-state">
              <p>尚未掃描或輸入任何發票</p>
              <button class="primary-action-btn" @click="openScanTab">前往掃描或手動輸入</button>
            </div>
          </div>
        </div>
      </template>

      <!-- 3. 【掃 QR】分頁內容 -->
      <template v-if="currentTab === 'scan'">
        <div class="scanner-wrapper">

          <div class="scanner-top-bar">
            <button class="scanner-text-btn" @click="currentTab = 'home'">&lt; 返回</button>
            <span class="scanner-bar-title">掃描發票</span>
            <button class="scanner-text-btn" @click="openManualModal">手動輸入</button>
          </div>

          <!-- 中間滿版相機取景與動態 QR 綠框定位區 -->
          <div class="camera-viewport" ref="viewportRef">
            <video
              ref="videoRef"
              class="native-camera-video"
              autoplay
              playsinline
              webkit-playsinline
              muted
            ></video>
            <canvas ref="decodeCanvasRef" class="hidden-decode-canvas"></canvas>

            <!-- 即時追蹤 QR Code 實際座標的動態綠色方框層 -->
            <div class="qr-bounding-layer">
              <div
                v-for="(box, idx) in detectedBoxes"
                :key="idx"
                class="qr-live-green-box"
                :style="box.style"
              ></div>
            </div>

            <div class="camera-overlay-content">
              <div class="camera-controls-top">
                <button
                  class="icon-circle-btn"
                  :class="{ active: flashOn }"
                  @click="toggleTorch"
                  title="切換閃光燈"
                >
                  {{ flashOn ? '⚡' : '🔦' }}
                </button>
                <button
                  class="icon-circle-btn"
                  :class="{ active: soundOn }"
                  @click="soundOn = !soundOn"
                  title="掃描音效"
                >
                  {{ soundOn ? '🔊' : '🔇' }}
                </button>
              </div>

              <!-- 中央白色四角對焦框 -->
              <div class="focus-frame" :class="{ 'is-detected': detectedBoxes.length > 0 || qrPulseDetected }">
                <span class="corner top-left"></span>
                <span class="corner top-right"></span>
                <span class="corner bottom-left"></span>
                <span class="corner bottom-right"></span>

                <div v-if="duplicateAlertMsg" class="duplicate-pill-toast">
                  <span class="dup-icon">!</span>
                  <span>{{ duplicateAlertMsg }}</span>
                </div>

                <div v-else-if="successToastMsg" class="success-pill-toast">
                  <span>✅ {{ successToastMsg }}</span>
                </div>

                <div class="camera-hint-box" v-else-if="isExtracting || scanError || !isCameraRunning">
                  <p v-if="isExtracting" class="hint-text">⏳ 正在解析發票與碳足跡...</p>
                  <div v-else-if="scanError" class="error-hint-box">
                    <p class="error-text">⚠️ {{ cameraStatusMsg || '無法啟動相機，請確認 HTTPS 與權限或點「手動輸入」' }}</p>
                    <button class="retry-btn" @click="startCameraScanner">重新開啟相機</button>
                  </div>
                  <p v-else class="hint-text">正在啟動相機，請稍候...</p>
                </div>
              </div>

              <div class="camera-controls-bottom">
                <button class="help-circle-btn" @click="alertHelp" title="掃描說明">?</button>

                <div class="continuous-toggle">
                  <span>連續掃描</span>
                  <label class="switch">
                    <input type="checkbox" v-model="continuousScan">
                    <span class="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部白色操作與示意說明區 -->
          <div class="scanner-bottom-sheet">
            <div class="invoice-type-tabs">
              <button
                class="type-tab"
                :class="{ active: invoiceType === 'electronic' }"
                @click="invoiceType = 'electronic'"
              >
                電子發票證明聯
              </button>
              <button
                class="type-tab"
                :class="{ active: invoiceType === 'traditional' }"
                @click="invoiceType = 'traditional'"
              >
                傳統發票
              </button>
            </div>

            <div v-if="lastExtractedInvoice" class="latest-extracted-box">
              <div class="latest-extracted-header">
                <span>
                  ✅ <strong>{{ lastExtractedInvoice.invoice_number }}</strong>｜{{ lastExtractedInvoice.merchant_name }}（{{ lastExtractedInvoice.purchase_datetime || lastExtractedInvoice.purchase_date }}）
                </span>
                <div class="latest-extracted-actions">
                  <button class="view-passbook-link" @click="currentTab = 'invoices'">前往發票存摺 &gt;</button>
                  <button class="view-passbook-link" @click="lastExtractedInvoice = null">清除</button>
                </div>
              </div>
              <div v-if="lastExtractedInvoice.items && lastExtractedInvoice.items.length > 0" class="latest-extracted-items">
                <span v-for="(item, idx) in lastExtractedInvoice.items" :key="idx" class="item-chip">
                  {{ item.item_name }} × {{ item.quantity }}（${{ item.amount }}）
                </span>
              </div>
              <div v-else class="fallback-preview-text">
                📌 {{ lastExtractedInvoice.calc_label }}
              </div>
            </div>

            <div class="invoice-guide-illustration" v-else>
              <div class="guide-corners">
                <div class="mock-receipt" v-if="invoiceType === 'electronic'">
                  <div class="receipt-header">電子發票證明聯</div>
                  <div class="receipt-period">115年09-10月</div>
                  <div class="receipt-num">FG-49916892</div>
                  <div class="receipt-barcode">|||| ||| || |||| |||</div>
                  <div class="receipt-qrs">
                    <div class="qr-box">QR左</div>
                    <div class="qr-box">QR右</div>
                  </div>
                </div>
                <div class="mock-receipt" v-else>
                  <div class="receipt-header">傳統長條型統一發票</div>
                  <div class="receipt-period">115年09-10月</div>
                  <div class="receipt-num">CD-55667788</div>
                  <p class="trad-hint">請點擊右上角「手動輸入」登錄發票資訊</p>
                </div>
              </div>
            </div>

            <p class="scanner-footer-note">
              先掃描左側主 QR Code 建檔；若右側延伸 QR Code 有額外品項，再掃描右側可自動補齊明細。
            </p>

            <div class="demo-actions">
              <button class="primary-action-btn" :disabled="isExtracting" @click="simulateScan">
                {{ isExtracting ? '解析中...' : '模擬成功掃描解析' }}
              </button>
              <button class="secondary-outline-btn" @click="scanError = true">模擬光線不足失敗</button>
            </div>
          </div>

          <!-- 手動輸入發票彈窗 -->
          <div v-if="showManualModal" class="manual-modal-overlay" @click.self="showManualModal = false">
            <div class="manual-modal-card manual-sheet-card">
              <div class="manual-modal-topbar">
                <button type="button" class="manual-back-btn" @click="showManualModal = false">&lt; 返回</button>
                <h4>手動輸入</h4>
                <span class="manual-topbar-spacer"></span>
              </div>

              <div class="input-group">
                <label>發票類型 <span class="req-star">*</span></label>
                <select v-model="manualForm.invoiceType" class="form-input form-select">
                  <option value="electronic">電子發票證明聯</option>
                  <option value="traditional">傳統發票</option>
                </select>
              </div>

              <div class="input-group">
                <label>發票日期 <span class="req-star">*</span></label>
                <input
                  type="text"
                  v-model="manualForm.invoiceDate"
                  placeholder="請輸入發票日期（例如：2026-10-30）"
                  class="form-input"
                />
              </div>

              <div class="input-group">
                <label>發票號碼 <span class="req-star">*</span></label>
                <div class="split-code-row">
                  <input
                    type="text"
                    v-model="manualForm.trackCode"
                    maxlength="2"
                    placeholder="發票字軌2碼"
                    class="form-input split-prefix"
                  />
                  <input
                    type="text"
                    v-model="manualForm.serialNumber"
                    maxlength="8"
                    placeholder="發票號碼8碼"
                    class="form-input split-number"
                  />
                </div>
              </div>

              <div class="input-group">
                <label>發票金額 <span class="req-star">*</span></label>
                <input
                  type="number"
                  v-model.number="manualForm.totalAmount"
                  placeholder="請輸入總計"
                  class="form-input"
                />
              </div>

              <div class="input-group">
                <label>隨機碼 <span class="req-star">*</span></label>
                <input
                  type="text"
                  v-model="manualForm.randomCode"
                  maxlength="4"
                  placeholder="請輸入隨機碼4碼"
                  class="form-input"
                />
              </div>

              <button
                type="button"
                class="save-passbook-btn"
                :disabled="isExtracting || !isManualFormValid"
                @click="submitManualInvoice"
              >
                {{ isExtracting ? '儲存與解析中...' : '確認儲存至發票存摺' }}
              </button>
            </div>
          </div>

        </div>
      </template>

      <!-- 4. 【計畫】分頁內容 -->
      <template v-if="currentTab === 'plan'">
        <section class="page-card">
          <h3 class="section-title mb-3 text-dark">🌱 進行中的低碳改善計畫</h3>
          <div class="ongoing-card mb-3">
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
      </template>

      <!-- 5. 【設定會員】分頁內容 -->
      <template v-if="currentTab === 'member'">
        <section class="page-card">
          <h3 class="section-title mb-3 text-dark">⚙️ 設定會員</h3>
          <div class="settings-list-card">
            <div class="setting-item" @click="$router.push('/profile')">
              <div class="setting-text">
                <span class="setting-title-text">個人資料設定</span>
                <span class="setting-desc">管理您的暱稱與基本資料</span>
              </div>
              <span class="arrow">&gt;</span>
            </div>

            <div class="setting-item" @click="$router.push('/barcode')">
              <div class="setting-text">
                <span class="setting-title-text">綁定載具條碼</span>
                <span class="setting-desc">手機條碼設定與雲端發票同步</span>
              </div>
              <span class="arrow">&gt;</span>
            </div>

            <div class="setting-item logout-item" @click="handleLogout">
              <div class="setting-text">
                <span class="setting-title-text text-red">登出系統</span>
                <span class="setting-desc">安全登出目前帳號並返回登入頁</span>
              </div>
              <span class="arrow text-red">&gt;</span>
            </div>
          </div>
        </section>
      </template>

    </main>

    <!-- 發票明細檢視彈窗 -->
    <div v-if="selectedInvoiceDetail" class="manual-modal-overlay" @click.self="selectedInvoiceDetail = null">
      <div class="manual-modal-card">
        <h4>🧾 發票消費與碳排明細</h4>
        <div class="detail-meta-box">
          <p><strong>發票號碼：</strong>{{ selectedInvoiceDetail.invoice_number }}</p>
          <p><strong>推估方式：</strong>{{ selectedInvoiceDetail.calc_label }}</p>
          <p><strong>店家／類別：</strong>{{ selectedInvoiceDetail.merchant_name }}</p>
          <p><strong>購買時間：</strong>{{ selectedInvoiceDetail.purchase_datetime || selectedInvoiceDetail.purchase_date }}</p>
          <p><strong>隨機碼：</strong>{{ selectedInvoiceDetail.random_code || '—' }}</p>
          <p><strong>登錄方式：</strong>{{ selectedInvoiceDetail.source_type === 'manual' ? '手動輸入' : '電子發票' }}</p>
          <p><strong>推估碳排：</strong>{{ selectedInvoiceDetail.carbon_kg }} kg CO₂e（隱形碳成本 {{ selectedInvoiceDetail.hidden_carbon_cost }} 元）</p>
        </div>
        <div class="detail-items-list" v-if="selectedInvoiceDetail.items && selectedInvoiceDetail.items.length > 0">
          <div class="detail-item-row" v-for="(item, idx) in selectedInvoiceDetail.items" :key="idx">
            <span>{{ item.item_name }} × {{ item.quantity }}</span>
            <span>TWD {{ item.amount }}</span>
          </div>
        </div>
        <p v-else class="fallback-detail-note">
          此筆發票無逐項商品明細，不產生假商品，已依發票金額與預設類別係數完成碳排推估。
        </p>
        <div class="modal-btn-row">
          <button class="delete-modal-btn" @click="deleteInvoice(selectedInvoiceDetail.id)">刪除此筆</button>
          <button class="primary-action-btn" @click="selectedInvoiceDetail = null">關閉</button>
        </div>
      </div>
    </div>

    <!-- 底部固定導覽列：進入掃描發票 (scan) 分頁時隱藏 -->
    <nav class="bottom-nav" v-if="currentTab !== 'scan'">
      <div class="nav-item" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首頁</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'invoices' }" @click="currentTab = 'invoices'">
        <span class="nav-icon">🧾</span>
        <span class="nav-label">發票存摺</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'scan' }" @click="openScanTab">
        <span class="nav-icon">📷</span>
        <span class="nav-label">掃 QR</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'plan' }" @click="currentTab = 'plan'">
        <span class="nav-icon">📊</span>
        <span class="nav-label">計畫</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'member' }" @click="currentTab = 'member'">
        <span class="nav-icon">👤</span>
        <span class="nav-label">會員</span>
      </div>
    </nav>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import jsQR from 'jsqr'

const router = useRouter()
const nickname = ref('使用者')
const currentTab = ref('home')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// 常見賣方統編店名對照
const SELLER_NAME_MAP = {
  '60826810': '木棉花國際(股)公司台中一中營業所'
}

// 原生相機與掃描狀態
const viewportRef = ref(null)
const videoRef = ref(null)
const decodeCanvasRef = ref(null)
const mediaStream = ref(null)
const flashOn = ref(false)
const soundOn = ref(true)
const continuousScan = ref(true)
const invoiceType = ref('electronic')
const scanError = ref(false)
const isExtracting = ref(false)
const lastExtractedInvoice = ref(null)
const isCameraRunning = ref(false)
const cameraStatusMsg = ref('')

// 動態綠框座標、「發票已存在」提示與掃碼綠框脈衝狀態
const detectedBoxes = ref([])
const qrPulseDetected = ref(false)
const duplicateAlertMsg = ref('')
const successToastMsg = ref('')
let scanLoopTimer = null
let qrPulseTimer = null
let lastRawScannedText = ''
let lastRawScannedAt = 0

// 手動輸入表單狀態
const showManualModal = ref(false)
const manualForm = reactive({
  invoiceType: 'electronic',
  invoiceDate: '',
  trackCode: '',
  serialNumber: '',
  totalAmount: null,
  randomCode: ''
})

// 發票存摺狀態
const periods = ['115年07–08月', '115年09–10月', '115年11–12月']
const currentPeriodIndex = ref(1)
const showSearchBar = ref(false)
const searchKeyword = ref('')
const sourceFilter = ref('all')
const sortDesc = ref(true)
const selectedInvoiceDetail = ref(null)
const invoiceList = ref([])

const isManualFormValid = computed(() => {
  return (
    manualForm.invoiceDate.trim().length > 0 &&
    manualForm.trackCode.trim().length === 2 &&
    manualForm.serialNumber.trim().length === 8 &&
    Number(manualForm.totalAmount) > 0 &&
    manualForm.randomCode.trim().length === 4
  )
})

const openManualModal = () => {
  manualForm.invoiceType = invoiceType.value
  manualForm.invoiceDate = ''
  manualForm.trackCode = ''
  manualForm.serialNumber = ''
  manualForm.totalAmount = null
  manualForm.randomCode = ''
  showManualModal.value = true
}

const triggerGreenPulse = () => {
  qrPulseDetected.value = true
  if (qrPulseTimer) clearTimeout(qrPulseTimer)
  qrPulseTimer = setTimeout(() => {
    qrPulseDetected.value = false
  }, 1100)
}

const stopScanLoop = () => {
  if (scanLoopTimer) {
    clearInterval(scanLoopTimer)
    scanLoopTimer = null
  }
  if (qrPulseTimer) {
    clearTimeout(qrPulseTimer)
    qrPulseTimer = null
  }
  detectedBoxes.value = []
  qrPulseDetected.value = false
}

/**
 * 解析台灣電子發票 QR Code 字串（支援左側表頭 77 碼起算 + 右側 ** 延伸明細）
 */
const parseTaiwanInvoiceQr = (rawPayload) => {
  const result = {
    isExtensionOnly: false,
    invoiceNumber: '',
    rocDate: '',
    isoDate: '',
    randomCode: '',
    salesAmount: 0,
    totalAmount: 0,
    buyerBan: '',
    sellerBan: '',
    merchantName: '',
    items: []
  }

  if (typeof rawPayload !== 'string') return result
  const text = rawPayload.trim()
  if (!text) return result

  // 右側延伸 QR Code（通常以 ** 開頭，接續品名:數量:單價/金額）
  if (text.startsWith('**')) {
    result.isExtensionOnly = true
    const body = text.slice(2)
    const parts = body.split(':')
    for (let i = 0; i + 2 < parts.length; i += 3) {
      const name = (parts[i] || '').trim()
      const qty = Number(parts[i + 1]) || 1
      const amt = Number(parts[i + 2]) || 0
      if (name && !/^\d+$/.test(name)) {
        result.items.push({ item_name: name, quantity: qty, amount: amt })
      }
    }
    return result
  }

  if (text.length >= 21 && /^[A-Z]{2}\d{8}/i.test(text)) {
    result.invoiceNumber = text.slice(0, 10).toUpperCase()

    // 民國 7 碼（YYYMMDD），例如 1150930 -> 2026-09-30
    const roc = text.slice(10, 17)
    if (/^\d{7}$/.test(roc)) {
      result.rocDate = roc
      const westernYear = Number(roc.slice(0, 3)) + 1911
      const mm = roc.slice(3, 5)
      const dd = roc.slice(5, 7)
      result.isoDate = `${westernYear}-${mm}-${dd}`
    }

    // 隨機碼 4 碼
    const rand = text.slice(17, 21)
    if (/^\d{4}$/.test(rand)) {
      result.randomCode = rand
    }

    // 銷售額（21..29）與總計金額（29..37）
    if (text.length >= 37) {
      const salesHex = text.slice(21, 29)
      const totalHex = text.slice(29, 37)
      const parseAmountField = (str) => {
        if (!str || str === '00000000') return 0
        if (/^[0-9A-Fa-f]{8}$/.test(str)) {
          const hexVal = parseInt(str, 16)
          if (!Number.isNaN(hexVal) && hexVal > 0 && hexVal < 100000000) {
            return hexVal
          }
        }
        const decVal = Number(str)
        return Number.isFinite(decVal) && decVal > 0 ? decVal : 0
      }
      result.salesAmount = parseAmountField(salesHex)
      result.totalAmount = parseAmountField(totalHex) || result.salesAmount
    }

    // 買方統編（37..45）與賣方統編（45..53）
    if (text.length >= 53) {
      const buyer = text.slice(37, 45)
      const seller = text.slice(45, 53)
      if (/^\d{8}$/.test(buyer) && buyer !== '00000000') {
        result.buyerBan = buyer
      }
      if (/^\d{8}$/.test(seller)) {
        result.sellerBan = seller
        if (SELLER_NAME_MAP[seller]) {
          result.merchantName = SELLER_NAME_MAP[seller]
        }
      }
    }

    // 77 碼之後通常為「編碼/品項數/筆數/語系:品名:數量:單價/金額:...」
    if (text.length > 77) {
      const tail = text.slice(77)
      const colonIdx = tail.indexOf(':')
      const itemSection = colonIdx >= 0 ? tail.slice(colonIdx + 1) : ''
      if (itemSection) {
        const tokens = itemSection.split(':')
        for (let i = 0; i + 2 < tokens.length; i += 3) {
          const name = (tokens[i] || '').trim()
          const qty = Number(tokens[i + 1]) || 1
          const amt = Number(tokens[i + 2]) || 0
          if (name && !/^\d+$/.test(name)) {
            result.items.push({ item_name: name, quantity: qty, amount: amt })
          }
        }
      }
    }
  }

  return result
}

/**
 * 若掃到右側延伸 QR（** 開頭），將新明細併入最新或同期間發票，避免開出空白 TWD 0 紀錄
 */
const mergeExtensionItemsToLatestInvoice = (extItems) => {
  const target = lastExtractedInvoice.value
    ? invoiceList.value.find(inv => inv.invoice_number === lastExtractedInvoice.value.invoice_number)
    : invoiceList.value[0]

  if (!target) {
    successToastMsg.value = '請先掃描左側主 QR Code'
    setTimeout(() => {
      successToastMsg.value = ''
    }, 2000)
    return
  }

  const existingNames = new Set((target.items || []).map(it => `${it.item_name}_${it.amount}`))
  const newUniqueItems = (extItems || []).filter(it => !existingNames.has(`${it.item_name}_${it.amount}`))

  if (newUniqueItems.length > 0) {
    target.items = [...(target.items || []), ...newUniqueItems]
    target.summary_title =
      target.items.length > 1
        ? `${target.items[0].item_name} 等 ${target.items.length} 項`
        : target.items[0].item_name
    target.calc_label = '逐項商品明細推估'
    if (lastExtractedInvoice.value && lastExtractedInvoice.value.invoice_number === target.invoice_number) {
      lastExtractedInvoice.value = { ...target }
    }
    successToastMsg.value = `已補齊 ${newUniqueItems.length} 筆明細`
  } else {
    successToastMsg.value = '右側明細已存在或無新增品項'
  }

  setTimeout(() => {
    successToastMsg.value = ''
  }, 2000)
}

const handleDecodedQrText = async (decodedText) => {
  if (!decodedText || typeof decodedText !== 'string') return
  const cleanText = decodedText.trim()
  if (!cleanText) return

  triggerGreenPulse()

  const now = Date.now()
  if (cleanText === lastRawScannedText && now - lastRawScannedAt < 2500) {
    return
  }
  lastRawScannedText = cleanText
  lastRawScannedAt = now

  if (isExtracting.value) return

  const parsedQr = parseTaiwanInvoiceQr(cleanText)

  // 右側 QR 延伸明細：直接補齊到現有發票，不另建 TWD 0 發票
  if (parsedQr.isExtensionOnly || cleanText.startsWith('**')) {
    mergeExtensionItemsToLatestInvoice(parsedQr.items)
    return
  }

  if (parsedQr.invoiceNumber && /^[A-Z]{2}\d{8}$/.test(parsedQr.invoiceNumber)) {
    const exists = invoiceList.value.some(inv => inv.invoice_number === parsedQr.invoiceNumber)
    if (exists) {
      duplicateAlertMsg.value = '發票已存在'
      setTimeout(() => {
        duplicateAlertMsg.value = ''
      }, 2200)
      return
    }
  }

  if (!continuousScan.value) {
    await stopCameraScanner()
  }
  await processInvoiceLookup(
    {
      invoiceType: invoiceType.value,
      invoiceNumber: parsedQr.invoiceNumber,
      invoiceDate: parsedQr.isoDate,
      randomCode: parsedQr.randomCode,
      totalAmount: parsedQr.totalAmount,
      merchantName: parsedQr.merchantName,
      sellerBan: parsedQr.sellerBan,
      items: parsedQr.items
    },
    cleanText,
    'qr'
  )
}

const computeViewportBoxStyle = (x, y, w, h, srcW, srcH, viewport) => {
  const vpRect = viewport.getBoundingClientRect()
  const scale = Math.max(vpRect.width / srcW, vpRect.height / srcH)
  const renderedW = srcW * scale
  const renderedH = srcH * scale
  const offsetX = (vpRect.width - renderedW) / 2
  const offsetY = (vpRect.height - renderedH) / 2

  return {
    left: `${x * scale + offsetX}px`,
    top: `${y * scale + offsetY}px`,
    width: `${w * scale}px`,
    height: `${h * scale}px`
  }
}

const startNativeQrLoop = () => {
  stopScanLoop()
  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
  let detector = null
  if (hasBarcodeDetector) {
    try {
      detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    } catch {
      detector = null
    }
  }

  scanLoopTimer = setInterval(async () => {
    if (!isCameraRunning.value || currentTab.value !== 'scan' || isExtracting.value) return
    const video = videoRef.value
    const canvas = decodeCanvasRef.value
    const viewport = viewportRef.value
    if (!video || !canvas || !viewport || video.readyState < 2 || !video.videoWidth) return

    const vw = video.videoWidth
    const vh = video.videoHeight

    if (detector) {
      try {
        const barcodes = await detector.detect(video)
        if (barcodes && barcodes.length > 0) {
          detectedBoxes.value = barcodes.map((b) => {
            const bb = b.boundingBox
            return {
              rawValue: b.rawValue,
              style: computeViewportBoxStyle(bb.x, bb.y, bb.width, bb.height, vw, vh, viewport)
            }
          })
          const firstValid = barcodes.find(b => b.rawValue && b.rawValue.trim().length > 0)
          if (firstValid) {
            await handleDecodedQrText(firstValid.rawValue)
            return
          }
        }
      } catch {
        // 改走 jsQR 備援
      }
    }

    try {
      const targetW = Math.min(vw, 640)
      const targetH = Math.round((vh / vw) * targetW)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, targetW, targetH)
      const imageData = ctx.getImageData(0, 0, targetW, targetH)
      const code = jsQR(imageData.data, targetW, targetH, {
        inversionAttempts: 'attemptBoth'
      })

      if (code && code.data) {
        const xs = [
          code.location.topLeftCorner.x,
          code.location.topRightCorner.x,
          code.location.bottomLeftCorner.x,
          code.location.bottomRightCorner.x
        ]
        const ys = [
          code.location.topLeftCorner.y,
          code.location.topRightCorner.y,
          code.location.bottomLeftCorner.y,
          code.location.bottomRightCorner.y
        ]
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        detectedBoxes.value = [
          {
            rawValue: code.data,
            style: computeViewportBoxStyle(
              minX,
              minY,
              Math.max(maxX - minX, 24),
              Math.max(maxY - minY, 24),
              targetW,
              targetH,
              viewport
            )
          }
        ]
        await handleDecodedQrText(code.data)
      } else {
        detectedBoxes.value = []
      }
    } catch {
      // 忽略單幀例外
    }
  }, 200)
}

const stopCameraScanner = async () => {
  stopScanLoop()
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  isCameraRunning.value = false
  flashOn.value = false
}

const startCameraScanner = async () => {
  if (currentTab.value !== 'scan') return
  if (isCameraRunning.value) return

  scanError.value = false
  duplicateAlertMsg.value = ''
  successToastMsg.value = ''
  cameraStatusMsg.value = ''
  await nextTick()

  const video = videoRef.value
  if (!video || !navigator.mediaDevices?.getUserMedia) {
    scanError.value = true
    cameraStatusMsg.value = '此瀏覽器不支援相機存取，請使用 HTTPS 或點「手動輸入」'
    return
  }

  try {
    await stopCameraScanner()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    mediaStream.value = stream
    video.srcObject = stream
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.muted = true
    await video.play()

    isCameraRunning.value = true
    startNativeQrLoop()
  } catch (err) {
    console.error('啟動原生相機失敗：', err)
    isCameraRunning.value = false
    scanError.value = true
    cameraStatusMsg.value = err?.message || '無法存取相機，請確認使用 HTTPS 並允許相機權限'
  }
}

const toggleTorch = async () => {
  const nextTorch = !flashOn.value
  const track = mediaStream.value?.getVideoTracks?.()?.[0]
  if (track && track.applyConstraints) {
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }]
      })
      flashOn.value = nextTorch
    } catch (err) {
      console.warn('此裝置或瀏覽器不支援切換手電筒：', err)
      flashOn.value = nextTorch
    }
  } else {
    flashOn.value = nextTorch
  }
}

watch(currentTab, async (newTab, oldTab) => {
  if (newTab === 'scan') {
    await startCameraScanner()
  } else if (oldTab === 'scan') {
    await stopCameraScanner()
  }
})

watch(showManualModal, async (isOpen) => {
  if (isOpen) {
    await stopCameraScanner()
  } else if (currentTab.value === 'scan') {
    await startCameraScanner()
  }
})

onMounted(() => {
  const savedNickname = localStorage.getItem('user_nickname')
  if (savedNickname) {
    nickname.value = savedNickname
  }
  if (currentTab.value === 'scan') {
    startCameraScanner()
  }
})

onBeforeUnmount(() => {
  stopCameraScanner()
})

const openScanTab = async () => {
  lastExtractedInvoice.value = null
  scanError.value = false
  duplicateAlertMsg.value = ''
  successToastMsg.value = ''
  if (currentTab.value === 'scan') {
    await startCameraScanner()
  } else {
    currentTab.value = 'scan'
  }
}

const deleteInvoice = (targetId) => {
  invoiceList.value = invoiceList.value.filter(item => item.id !== targetId)
  if (selectedInvoiceDetail.value && selectedInvoiceDetail.value.id === targetId) {
    selectedInvoiceDetail.value = null
  }
}

const totalCarbonSum = computed(() => {
  const sum = invoiceList.value.reduce((acc, item) => acc + Number(item.carbon_kg || 0), 0)
  return sum.toFixed(1)
})

const sourceFilterLabel = computed(() => {
  if (sourceFilter.value === 'electronic') return '僅看電子發票'
  if (sourceFilter.value === 'manual') return '僅看手動輸入'
  return '全部發票來源'
})

const filteredInvoices = computed(() => {
  let list = [...invoiceList.value]

  if (sourceFilter.value === 'electronic') {
    list = list.filter(i => i.source_type !== 'manual')
  } else if (sourceFilter.value === 'manual') {
    list = list.filter(i => i.source_type === 'manual')
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(
      i =>
        i.invoice_number.toLowerCase().includes(kw) ||
        i.merchant_name.toLowerCase().includes(kw) ||
        i.summary_title.toLowerCase().includes(kw)
    )
  }

  list.sort((a, b) => {
    const dateA = (a.purchase_datetime || a.purchase_date).replaceAll('/', '').replaceAll('-', '')
    const dateB = (b.purchase_datetime || b.purchase_date).replaceAll('/', '').replaceAll('-', '')
    return sortDesc.value ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB)
  })

  return list
})

const filteredTotalAmount = computed(() => {
  return filteredInvoices.value.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
})

const filteredTotalCarbon = computed(() => {
  const sum = filteredInvoices.value.reduce((acc, item) => acc + Number(item.carbon_kg || 0), 0)
  return sum.toFixed(2)
})

const filteredHiddenCost = computed(() => {
  const sum = filteredInvoices.value.reduce((acc, item) => acc + Number(item.hidden_carbon_cost || 0), 0)
  return Math.round(sum)
})

const prevPeriod = () => {
  if (currentPeriodIndex.value > 0) currentPeriodIndex.value--
}

const nextPeriod = () => {
  if (currentPeriodIndex.value < periods.length - 1) currentPeriodIndex.value++
}

const toggleSearchInput = () => {
  showSearchBar.value = !showSearchBar.value
  if (!showSearchBar.value) searchKeyword.value = ''
}

const cycleSourceFilter = () => {
  if (sourceFilter.value === 'all') sourceFilter.value = 'electronic'
  else if (sourceFilter.value === 'electronic') sourceFilter.value = 'manual'
  else sourceFilter.value = 'all'
}

const toggleSortOrder = () => {
  sortDesc.value = !sortDesc.value
}

const alertHelp = () => {
  alert('【掃描說明】\n1. 先將左側主 QR Code 置於中央對焦框完成建檔。\n2. 若右側延伸 QR Code 有額外品項，再掃描右側可自動補齊明細。\n3. 若發票已登錄過，中央會提示「發票已存在」。')
}

const resolveInvoiceRecord = (inputMeta = {}, backendData = {}, sourceType = 'qr') => {
  const cleanNum = (
    backendData.invoice_number ||
    inputMeta.invoiceNumber ||
    '未提供字軌'
  )
    .toUpperCase()
    .replaceAll('-', '')
    .trim()

  const categoryName = backendData.category_name || '一般消費'
  const sellerBan = backendData.seller_ban || inputMeta.sellerBan || ''
  const rawBackendMerchant = (backendData.merchant_name || '').trim()
  const isGenericBackendMerchant = !rawBackendMerchant || /^賣方\s*\d+$/.test(rawBackendMerchant)

  const merchantName =
    (!isGenericBackendMerchant && rawBackendMerchant) ||
    inputMeta.merchantName ||
    (sellerBan && SELLER_NAME_MAP[sellerBan]) ||
    (sellerBan ? `賣方 ${sellerBan}` : `預設${categoryName}推估（${cleanNum.slice(0, 2)}字軌）`)

  const inputDateClean = (inputMeta.invoiceDate || '').trim()
  const backendDt = (backendData.purchase_datetime || '').trim()
  const isBackendPlaceholderTime = backendDt.endsWith('19:34:37')

  const rawDatetime =
    (!isBackendPlaceholderTime && backendDt) ||
    (inputDateClean
      ? `${inputDateClean.replaceAll('/', '-')} 00:00:00`
      : backendData.purchase_date
      ? `${backendData.purchase_date.replaceAll('/', '-')} 00:00:00`
      : '2026-10-30 00:00:00')

  const formattedDate = inputDateClean
    ? inputDateClean.replaceAll('-', '/')
    : backendData.purchase_date
    ? backendData.purchase_date.replaceAll('-', '/')
    : rawDatetime.slice(0, 10).replaceAll('-', '/')

  const rawBackendItems = Array.isArray(backendData.items) ? backendData.items : []
  const validBackendItems = rawBackendItems.filter((it) => {
    const name = String(it.item_name || '').trim()
    const amt = Number(it.amount || 0)
    return name.length > 0 && !/^\d+$/.test(name) && amt > 0
  })

  const inputItems = Array.isArray(inputMeta.items) ? inputMeta.items : []
  const items = validBackendItems.length > 0 ? validBackendItems : inputItems
  const itemsSum = items.reduce((s, it) => s + Number(it.amount || 0), 0)

  const totalAmount =
    Number(inputMeta.totalAmount) > 0
      ? Number(inputMeta.totalAmount)
      : Number(backendData.total_amount) > 0
      ? Number(backendData.total_amount)
      : itemsSum > 0
      ? itemsSum
      : 0

  const calcLabel =
    items.length > 0
      ? '逐項商品明細推估'
      : `無逐項明細，套用預設「${categoryName}」係數推估`

  const summaryTitle =
    items.length > 1
      ? `${items[0].item_name} 等 ${items.length} 項`
      : items.length === 1
      ? items[0].item_name
      : `${merchantName}（無逐項明細）`

  const estimatedCarbon =
    backendData.carbon_kg !== undefined && Number(backendData.carbon_kg) > 0
      ? Number(Number(backendData.carbon_kg).toFixed(2))
      : Number((totalAmount * 0.0015).toFixed(2))

  const hiddenCost =
    backendData.hidden_carbon_cost !== undefined && Number(backendData.hidden_carbon_cost) > 0
      ? Number(Number(backendData.hidden_carbon_cost).toFixed(2))
      : Number((estimatedCarbon * 3.2).toFixed(2))

  return {
    id: backendData.invoice_id || Date.now() + Math.random(),
    invoice_number: cleanNum,
    merchant_name: merchantName,
    category_name: categoryName,
    purchase_datetime: rawDatetime,
    purchase_date: formattedDate,
    random_code: inputMeta.randomCode || backendData.random_code || '',
    summary_title: summaryTitle,
    total_amount: totalAmount,
    carbon_kg: estimatedCarbon,
    hidden_carbon_cost: hiddenCost,
    calc_label: calcLabel,
    source_type: sourceType === 'manual' ? 'manual' : 'electronic',
    items
  }
}

const processInvoiceLookup = async (inputMeta, rawPayload, sourceType = 'qr') => {
  isExtracting.value = true
  scanError.value = false
  const userPhone = localStorage.getItem('user_phone') || ''

  let backendData = {}
  try {
    const res = await fetch(`${API_BASE_URL}/api/invoices/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: userPhone,
        invoice_type: inputMeta.invoiceType || invoiceType.value,
        source_type: sourceType,
        qr_raw_data: rawPayload
      })
    })
    if (res.ok) {
      const result = await res.json()
      backendData = result?.data || {}
    }
  } catch (err) {
    console.warn('後端未回應，改用前端 QR 解析與預設類別係數推估：', err)
  } finally {
    const record = resolveInvoiceRecord(inputMeta, backendData, sourceType)

    const alreadyExists = invoiceList.value.some(
      inv => inv.invoice_number === record.invoice_number
    )
    if (alreadyExists) {
      duplicateAlertMsg.value = '發票已存在'
      setTimeout(() => {
        duplicateAlertMsg.value = ''
      }, 2200)
      isExtracting.value = false
      return
    }

    lastExtractedInvoice.value = record
    invoiceList.value.unshift(record)
    isExtracting.value = false

    successToastMsg.value = `已擷取 ${record.invoice_number}`
    setTimeout(() => {
      successToastMsg.value = ''
    }, 2000)

    if (sourceType === 'manual' || !continuousScan.value) {
      await stopCameraScanner()
      currentTab.value = 'invoices'
    }
  }
}

const simulateScan = () => {
  triggerGreenPulse()
  const sampleQr =
    'FG499168921151030184800000593000005930000000087158388000000000000000000000000:招牌去骨炸雞:1:398:韓式炸年糕與薯條:1:195:'
  processInvoiceLookup(
    {
      invoiceNumber: 'FG49916892',
      invoiceDate: '2026-10-30',
      totalAmount: 593,
      randomCode: '1848',
      invoiceType: invoiceType.value
    },
    sampleQr,
    'qr_simulated'
  )
}

const submitManualInvoice = () => {
  if (!isManualFormValid.value) {
    alert('請完整填寫發票日期、字軌2碼、號碼8碼、發票金額與隨機碼4碼')
    return
  }

  const track = manualForm.trackCode.trim().toUpperCase()
  const serial = manualForm.serialNumber.trim()
  const fullNumber = `${track}${serial}`
  const meta = {
    invoiceType: manualForm.invoiceType,
    invoiceDate: manualForm.invoiceDate.trim(),
    invoiceNumber: fullNumber,
    totalAmount: Number(manualForm.totalAmount),
    randomCode: manualForm.randomCode.trim()
  }

  const payload = JSON.stringify(meta)
  showManualModal.value = false
  processInvoiceLookup(meta, payload, 'manual')
}

const handleLogout = async () => {
  if (confirm('確定要登出系統嗎？')) {
    await stopCameraScanner()
    localStorage.removeItem('user_nickname')
    localStorage.removeItem('user_phone')
    localStorage.removeItem('user_barcode')
    router.push('/login')
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #064e3b;
  color: #f3f4f6;
  padding: 2rem 2rem 7rem 2rem;
  font-family: sans-serif;
  box-sizing: border-box;
  position: relative;
}

.dashboard-container.scan-mode {
  padding: 0.75rem 0.75rem 2rem 0.75rem;
}

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
  box-sizing: border-box;
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

.main-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
}

.banner-card {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  border: 1px solid #10b981;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
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

.text-dark {
  color: #1f2937 !important;
}

.mb-3 {
  margin-bottom: 1rem;
}

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
  box-sizing: border-box;
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

.passbook-wrapper {
  background-color: #ffffff;
  color: #1f2937;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
  border: 1px solid #3e2723;
}

.passbook-top-bar {
  background-color: #3e2723;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.25rem;
}

.passbook-bar-title {
  font-size: 1.08rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.passbook-icon-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #efebe9;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.passbook-search-bar {
  padding: 0.75rem 1.25rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.passbook-search-input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.9rem;
  box-sizing: border-box;
  outline: none;
}

.passbook-body {
  padding: 1.25rem 1.5rem 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.period-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
}

.period-arrow-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  font-weight: bold;
  color: #374151;
  cursor: pointer;
  padding: 0.25rem 0.75rem;
}

.period-text {
  font-size: 1.18rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: 0.5px;
}

.period-summary-card {
  position: relative;
  border: 2px solid #f59e0b;
  border-radius: 18px;
  padding: 2.25rem 1.25rem 1.1rem 1.25rem;
  background-color: #fffdf7;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);
}

.summary-corner-badge {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #fde68a;
  color: #78350f;
  font-size: 0.82rem;
  font-weight: bold;
  padding: 0.32rem 0.95rem;
  border-top-left-radius: 15px;
  border-bottom-right-radius: 14px;
}

.summary-subtitle {
  font-size: 0.88rem;
  color: #4b5563;
  margin-bottom: 0.35rem;
}

.summary-main-row {
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.summary-amount {
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
}

.summary-divider {
  color: #d1d5db;
  font-weight: bold;
}

.summary-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
}

.summary-carbon-pill {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  font-size: 0.86rem;
  text-align: center;
}

.passbook-filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-pill-btn {
  background-color: #ede9fe;
  color: #4c1d95;
  border: none;
  padding: 0.42rem 0.95rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.sort-text-btn {
  background: none;
  border: none;
  color: #374151;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.invoice-record-list {
  display: flex;
  flex-direction: column;
}

.invoice-record-item {
  padding: 1rem 0.25rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.15s;
}

.invoice-record-item:hover {
  background-color: #f9fafb;
}

.record-top-meta {
  font-size: 0.85rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
}

.meta-sep {
  color: #d1d5db;
}

.record-middle-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.55rem;
}

.record-title {
  font-size: 1.02rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.record-amount {
  font-size: 1.05rem;
  font-weight: 800;
  color: #111827;
  white-space: nowrap;
}

.record-bottom-tags {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-right-actions {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}

.tag-carbon {
  background-color: #f3f4f6;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.22rem 0.65rem;
  border-radius: 6px;
}

.tag-source {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.22rem 0.65rem;
  border-radius: 6px;
}

.source-electronic {
  background-color: #e0e7ff;
  color: #3730a3;
}

.source-manual {
  background-color: #ccfbf1;
  color: #115e59;
}

.tag-delete-btn {
  background-color: #fee2e2;
  color: #b91c1c;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.22rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
}

.tag-delete-btn:hover {
  background-color: #fecaca;
}

.empty-invoice-state {
  text-align: center;
  padding: 2.25rem 1rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}

.empty-invoice-state p {
  margin: 0;
}

.latest-extracted-box {
  width: 100%;
  background-color: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.latest-extracted-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.86rem;
  color: #065f46;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.latest-extracted-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-shrink: 0;
}

.view-passbook-link {
  background: none;
  border: none;
  color: #047857;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.82rem;
}

.latest-extracted-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.item-chip {
  background-color: #ffffff;
  color: #1f2937;
  border: 1px solid #a7f3d0;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
}

.fallback-preview-text {
  font-size: 0.82rem;
  color: #065f46;
}

.detail-meta-box {
  background-color: #f9fafb;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.88rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail-meta-box p {
  margin: 0;
}

.detail-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.detail-item-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #1f2937;
}

.fallback-detail-note {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.ongoing-card {
  background-color: #ffffff;
  color: #1f2937;
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
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

.page-card {
  background-color: #ffffff;
  color: #1f2937;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.primary-action-btn {
  background-color: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-action-btn:hover {
  background-color: #047857;
}

.primary-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal-btn {
  background-color: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.settings-list-card {
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
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

.scanner-wrapper {
  background-color: #000000;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  border: 1px solid #3e2723;
}

.scanner-top-bar {
  background-color: #3e2723;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #5d4037;
}

.scanner-bar-title {
  font-size: 1.05rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.scanner-text-btn {
  background: none;
  border: none;
  color: #efebe9;
  font-size: 0.92rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
}

.camera-viewport {
  background-color: #0a0a0a;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 360px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.native-camera-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  background: #000;
}

.hidden-decode-canvas {
  display: none;
}

.qr-bounding-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.qr-live-green-box {
  position: absolute;
  border: 3px solid #22c55e;
  background-color: rgba(34, 197, 94, 0.22);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.85);
  border-radius: 4px;
}

.camera-overlay-content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  pointer-events: none;
}

.camera-controls-top,
.camera-controls-bottom,
.retry-btn {
  pointer-events: auto;
}

.camera-controls-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-circle-btn {
  background: rgba(0, 0, 0, 0.45);
  border: none;
  color: #ffffff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle-btn.active {
  background: #f59e0b;
  color: #000000;
}

.focus-frame {
  position: relative;
  width: 210px;
  height: 210px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: 16px;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: rgba(255, 255, 255, 0.92);
  border-style: solid;
  transition: border-color 0.2s ease;
}

.focus-frame.is-detected .corner {
  border-color: #22c55e;
}

.top-left {
  top: 0; left: 0;
  border-width: 4px 0 0 4px;
  border-top-left-radius: 12px;
}

.top-right {
  top: 0; right: 0;
  border-width: 4px 4px 0 0;
  border-top-right-radius: 12px;
}

.bottom-left {
  bottom: 0; left: 0;
  border-width: 0 0 4px 4px;
  border-bottom-left-radius: 12px;
}

.bottom-right {
  bottom: 0; right: 0;
  border-width: 0 4px 4px 0;
  border-bottom-right-radius: 12px;
}

.duplicate-pill-toast {
  background-color: rgba(239, 68, 68, 0.92);
  color: #ffffff;
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  font-size: 0.98rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  letter-spacing: 0.5px;
}

.dup-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #ffffff;
  color: #ef4444;
  font-size: 0.78rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.success-pill-toast {
  background-color: rgba(16, 185, 129, 0.92);
  color: #ffffff;
  padding: 0.45rem 1.05rem;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.camera-hint-box {
  text-align: center;
  max-width: 220px;
  background-color: rgba(0, 0, 0, 0.65);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
}

.hint-text {
  color: #e5e7eb;
  font-size: 0.86rem;
  line-height: 1.45;
  margin: 0;
}

.error-hint-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.error-text {
  color: #fca5a5;
  font-size: 0.86rem;
  font-weight: bold;
  margin: 0;
}

.retry-btn {
  background-color: #059669;
  color: #ffffff;
  border: none;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
}

.camera-controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-circle-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #ffffff;
  color: #111827;
  border: none;
  font-weight: bold;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.continuous-toggle {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #ffffff;
  font-size: 0.88rem;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #4b5563;
  transition: .3s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}
input:checked + .slider { background-color: #22c55e; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.scanner-bottom-sheet {
  background-color: #ffffff;
  color: #1f2937;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 1.35rem 1.35rem 1.65rem 1.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: -12px;
  position: relative;
  z-index: 4;
}

.invoice-type-tabs {
  display: flex;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 9999px;
  width: 100%;
  max-width: 340px;
}

.type-tab {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.type-tab.active {
  background-color: #ffffff;
  color: #111827;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.invoice-guide-illustration {
  padding: 0.35rem;
}

.guide-corners {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  background-color: #f9fafb;
}

.mock-receipt {
  width: 160px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.6rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.receipt-header {
  font-size: 0.72rem;
  font-weight: bold;
  color: #1f2937;
}

.receipt-period {
  font-size: 0.78rem;
  font-weight: bold;
  color: #374151;
  margin-top: 2px;
}

.receipt-num {
  font-size: 0.75rem;
  color: #059669;
  font-weight: bold;
  margin-bottom: 4px;
}

.receipt-barcode {
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: #4b5563;
  margin-bottom: 6px;
}

.receipt-qrs {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.qr-box {
  width: 44px;
  height: 44px;
  border: 2px solid #10b981;
  background-color: #ecfdf5;
  color: #047857;
  font-size: 0.65rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.trad-hint {
  font-size: 0.7rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.scanner-footer-note {
  font-size: 0.85rem;
  color: #4b5563;
  text-align: center;
  max-width: 460px;
  line-height: 1.5;
  margin: 0;
}

.demo-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.25rem;
}

.secondary-outline-btn {
  background-color: #ffffff;
  color: #4b5563;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-outline-btn:hover {
  background-color: #f3f4f6;
}

.manual-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.manual-modal-card {
  background-color: #ffffff;
  color: #1f2937;
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.manual-sheet-card {
  max-width: 430px;
  padding: 0 0 1.35rem 0;
  overflow: hidden;
  gap: 0.9rem;
}

.manual-modal-topbar {
  background-color: #7c5dfa;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.15rem;
}

.manual-modal-topbar h4 {
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.manual-back-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.manual-topbar-spacer {
  width: 44px;
}

.manual-sheet-card .input-group {
  padding: 0 1.25rem;
}

.req-star {
  color: #ef4444;
  font-weight: 700;
}

.form-select {
  background-color: #ffffff;
  color: #111827;
}

.split-code-row {
  display: grid;
  grid-template-columns: 115px 1fr;
  gap: 0.65rem;
}

.save-passbook-btn {
  margin: 0.35rem 1.25rem 0 1.25rem;
  background-color: #059669;
  color: #ffffff;
  border: none;
  padding: 0.85rem 1.25rem;
  border-radius: 999px;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-passbook-btn:hover:not(:disabled) {
  background-color: #047857;
}

.save-passbook-btn:disabled {
  background-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.manual-modal-card h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  width: 100%;
}

.form-input:focus {
  border-color: #059669;
}

.modal-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 900px;
  background-color: #3e2723;
  border: 1px solid #5d4037;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.6rem 1rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #d7ccc8;
  flex: 1;
  padding: 0.25rem 0;
  transition: color 0.2s;
}

.nav-icon {
  font-size: 1.3rem;
  margin-bottom: 0.15rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.nav-item.active {
  color: #ffeb3b;
}
</style>