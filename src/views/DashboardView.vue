<template>
  <div class="dashboard-container" :class="{ 'scan-mode': currentTab === 'scan' || currentTab === 'manual' }">

    <!-- 頂部導覽列：僅在「首頁 (home)」時顯示 -->
    <header class="header" v-if="currentTab === 'home'">
      <div class="title-area">
        <div class="logo-circle">
          <span>🧾</span>
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
            <h2>🧾 發票與消費紀錄帳本</h2>
            <p>快速掃描電子發票 QR Code 或手動登錄傳統發票／消費明細，輕鬆管理每筆消費紀錄與金額。</p>
          </div>
          <div class="banner-stats">
            <div class="mini-stat">
              <span class="stat-num">{{ invoiceList.length }}</span>
              <span class="stat-label">已登錄發票 (筆)</span>
            </div>
            <div class="mini-stat">
              <span class="stat-num">TWD {{ totalAmountSum.toLocaleString() }}</span>
              <span class="stat-label">累積消費金額</span>
            </div>
            <div class="mini-stat">
              <span class="stat-num">{{ totalItemsSum }}</span>
              <span class="stat-label">累積商品品項</span>
            </div>
          </div>
        </section>

        <section class="section-group">
          <h3 class="section-title">✨ 常用功能</h3>
          <div class="task-list">
            <div class="task-card">
              <div class="task-info">
                <div class="task-icon green-bg">📷</div>
                <div>
                  <h4>發票掃描</h4>
                  <p>掃描電子發票證明聯 QR Code，自動擷取消費與品項明細</p>
                </div>
              </div>
              <button class="action-plus-btn" @click="openScanTab">+</button>
            </div>

            <div class="task-card">
              <div class="task-info">
                <div class="task-icon purple-bg">✍️</div>
                <div>
                  <h4>手動輸入發票</h4>
                  <p>登錄傳統發票或手動填寫發票日期、號碼、金額與商品明細</p>
                </div>
              </div>
              <button class="action-plus-btn" @click="openManualTab">+</button>
            </div>

            <div class="task-card">
              <div class="task-info">
                <div class="task-icon blue-bg">📒</div>
                <div>
                  <h4>檢視發票存摺明細</h4>
                  <p>瀏覽所有已擷取的發票品項、金額與來源紀錄</p>
                </div>
              </div>
              <button class="action-plus-btn" @click="currentTab = 'invoices'">&gt;</button>
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
            <button class="passbook-icon-btn" @click="openManualTab" title="手動輸入發票">＋</button>
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
              <span class="summary-corner-badge">本期紀錄</span>
              <div class="summary-subtitle">本期消費總金額</div>
              <div class="summary-main-row">
                <span class="summary-amount">TWD {{ filteredTotalAmount.toLocaleString() }}</span>
                <span class="summary-divider">|</span>
                <span class="summary-count">{{ filteredInvoices.length }} 張</span>
              </div>
              <div class="summary-info-pill">
                📦 本期共 <strong>{{ filteredTotalItemsCount }}</strong> 項商品明細
              </div>
            </div>

            <div class="passbook-filter-row">
              <div class="filter-left-group">
                <button class="filter-pill-btn" @click="cycleSourceFilter">
                  🧾 {{ sourceFilterLabel }}
                </button>
                <button class="manual-entry-pill-btn" @click="openManualTab">
                  ✍️ 手動輸入
                </button>
              </div>
              <button class="sort-text-btn" @click="toggleSortOrder">
                ⇅ {{ sortDesc ? '日期新到舊' : '日期舊到新' }}
              </button>
            </div>

            <div class="invoice-record-list" v-if="filteredInvoices.length > 0">
              <div
                class="invoice-record-item"
                v-for="inv in filteredInvoices"
                :key="inv.id"
                @click="openInvoiceDetail(inv)"
              >
                <div class="record-top-meta">
                  <span>{{ inv.purchase_date }}</span>
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
                  <span class="tag-items">📦 {{ getSubstantiveItems(inv.items).length }} 項</span>
                  <div class="record-right-actions">
                    <span
                      class="tag-source"
                      :class="inv.source_type === 'traditional' ? 'source-traditional' : 'source-electronic'"
                    >
                      {{ inv.source_type === 'traditional' ? '傳統發票' : '電子發票' }}
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
              <p>{{ isSyncingInvoices ? '正在同步雲端發票...' : '尚未掃描或登錄任何發票' }}</p>
              <div v-if="!isSyncingInvoices" class="empty-action-group">
                <button class="primary-action-btn" @click="openScanTab">前往掃描發票</button>
                <button class="secondary-manual-btn" @click="openManualTab">手動輸入發票</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 3. 【掃 QR（僅電子發票）】分頁內容 -->
      <template v-if="currentTab === 'scan'">
        <div class="scanner-wrapper">
          <div class="scanner-top-bar">
            <button class="scanner-text-btn" @click="currentTab = 'home'">
              &lt; 返回
            </button>
            <span class="scanner-bar-title">掃描發票</span>
            <span class="scanner-topbar-spacer"></span>
          </div>

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

              <div
                class="focus-frame"
                :class="{ 'is-detected': detectedBoxes.length > 0 || qrPulseDetected }"
              >
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
                  <p v-if="isExtracting" class="hint-text">⏳ 正在解析發票資料...</p>
                  <div v-else-if="scanError" class="error-hint-box">
                    <p class="error-text">⚠️ {{ cameraStatusMsg || '無法啟動相機，請確認 HTTPS 與相機權限' }}</p>
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

          <div class="scanner-bottom-sheet">
            <div class="single-mode-badge">
              電子發票證明聯
            </div>

            <div v-if="lastExtractedInvoice" class="latest-extracted-box">
              <div class="latest-extracted-header">
                <span>
                  ✅ <strong>{{ lastExtractedInvoice.invoice_number }}</strong>｜{{ lastExtractedInvoice.merchant_name }}（{{ lastExtractedInvoice.purchase_date }}）
                </span>
                <div class="latest-extracted-actions">
                  <button class="view-passbook-link" @click="currentTab = 'invoices'">前往發票存摺 &gt;</button>
                  <button class="view-passbook-link" @click="lastExtractedInvoice = null">清除</button>
                </div>
              </div>
              <div v-if="lastExtractedInvoice.items && lastExtractedInvoice.items.length > 0" class="latest-extracted-items">
                <span
                  v-for="(item, idx) in lastExtractedInvoice.items"
                  :key="idx"
                  class="item-chip"
                  :class="{ 'discount-chip': !isSubstantiveProductItem(item) }"
                >
                  {{ item.item_name }} × {{ item.quantity }}（${{ item.amount }}）
                </span>
              </div>
              <div v-else class="fallback-preview-text">
                📌 {{ lastExtractedInvoice.calc_label || `實付金額：TWD ${Number(lastExtractedInvoice.total_amount || 0).toLocaleString()}` }}
              </div>
            </div>

            <div class="invoice-guide-illustration">
              <div class="guide-corners">
                <div class="mock-receipt">
                  <div class="receipt-header">電子發票證明聯</div>
                  <div class="receipt-period">115年09-10月</div>
                  <div class="receipt-num">FG-49916892</div>
                  <div class="receipt-barcode">|||| ||| || |||| |||</div>
                  <div class="receipt-qrs">
                    <div class="qr-box">QR左</div>
                    <div class="qr-box">QR右</div>
                  </div>
                </div>
              </div>
            </div>
            <p class="scanner-footer-note">
              左右 QR Code 可同時入鏡合併建檔；若分開掃描，系統會短暫等待另一側 QR Code 補齊明細後再寫入。
            </p>
          </div>
        </div>
      </template>

      <!-- 4. 【手動輸入（編輯）】獨立畫面：完全比照指定截圖欄位 -->
      <template v-if="currentTab === 'manual'">
        <div class="scanner-wrapper is-trad-editor">
          <div class="scanner-top-bar official-editor-header">
            <button
              class="scanner-text-btn"
              @click="currentTab = previousTabBeforeManual"
            >
              &lt; 返回
            </button>
            <span class="scanner-bar-title">編輯</span>
            <span class="scanner-topbar-spacer"></span>
          </div>

          <div class="official-editor-body">
            <div class="official-field">
              <div class="official-label-row">
                <label class="official-label">
                  <span>發票類型 <span class="official-req">*</span></span>
                </label>
              </div>
              <div class="official-select-wrap">
                <select v-model="tradEditorForm.invoice_type_label" class="official-control official-select">
                  <option value="傳統發票">傳統發票</option>
                  <option value="電子發票">電子發票</option>
                </select>
                <span class="official-select-arrow">⌄</span>
              </div>
            </div>

            <div class="official-field">
              <div class="official-label-row">
                <label class="official-label">
                  <span>發票日期 <span class="official-req">*</span></span>
                </label>
              </div>
              <input
                type="text"
                v-model="tradEditorForm.purchase_date"
                placeholder="請輸入發票日期"
                class="official-control official-manual-date"
              />
            </div>

            <div class="official-field">
              <div class="official-label-row">
                <label class="official-label">
                  <span>發票號碼 <span class="official-req">*</span></span>
                </label>
              </div>
              <div class="official-code-split">
                <input
                  type="text"
                  v-model="tradEditorForm.track_alpha"
                  maxlength="2"
                  placeholder="EF"
                  class="official-control official-alpha"
                />
                <input
                  type="text"
                  v-model="tradEditorForm.track_digits"
                  maxlength="8"
                  inputmode="numeric"
                  placeholder="54403818"
                  class="official-control official-digits"
                />
              </div>
            </div>

            <div class="official-field">
              <div class="official-label-row">
                <label class="official-label">
                  <span>發票金額 <span class="official-req">*</span></span>
                </label>
              </div>
              <input
                type="number"
                min="0"
                v-model.number="tradEditorForm.total_amount"
                placeholder="0"
                class="official-control"
              />
            </div>

            <div class="official-field">
              <div class="official-label-row">
                <label class="official-label">
                  <span>商家名稱 <span class="official-count">{{ (tradEditorForm.merchant_name || '').length }}/20</span></span>
                </label>
              </div>
              <input
                type="text"
                maxlength="20"
                v-model="tradEditorForm.merchant_name"
                placeholder="請輸入商家名稱"
                class="official-control"
              />
            </div>

            <div class="official-items-block">
              <div class="official-items-title">商品明細</div>

              <div
                v-for="(item, idx) in tradEditorForm.items"
                :key="idx"
                class="official-item-box"
              >
                <div class="official-item-top">
                  <span>品項 {{ idx + 1 }}</span>
                  <button type="button" class="official-item-del" @click="removeTradItemRow(idx)">移除</button>
                </div>
                <input
                  type="text"
                  v-model="item.item_name"
                  placeholder="請輸入商品名稱"
                  class="official-control official-item-name"
                />
                <div class="official-item-grid">
                  <input
                    type="number"
                    min="1"
                    v-model.number="item.quantity"
                    placeholder="數量"
                    class="official-control"
                  />
                  <input
                    type="number"
                    min="0"
                    v-model.number="item.amount"
                    placeholder="金額"
                    class="official-control"
                  />
                </div>
              </div>

              <button type="button" class="official-add-item-btn" @click="addTradItemRow">
                <span class="official-plus-circle">+</span>
                <span>新增商品明細</span>
              </button>

              <button
                type="button"
                class="official-confirm-passbook-btn"
                @click="submitTraditionalInvoice"
              >
                確認儲存至發票存摺
              </button>

              <button
                type="button"
                class="official-modal-delete-btn"
                @click="resetTradEditorForm"
              >
                刪除
              </button>

              <div class="official-notice-card">
                <div class="official-notice-title">
                  <span class="official-notice-icon">!</span>
                  <span>注意事項</span>
                </div>
                <p class="official-notice-text">
                  自行輸入之發票僅提供對獎服務，非屬中獎之領獎憑據，請務必保留紙本發票；發票如有中獎，請於領獎期限內攜帶身分證
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 5. 【計畫】分頁內容 -->
      <template v-if="currentTab === 'plan'">
        <section class="page-card">
          <h3 class="section-title mb-3 text-dark">📋 消費紀錄摘要</h3>
          <div class="ongoing-card mb-3">
            <div class="ongoing-header">
              <div class="task-info">
                <div class="task-icon yellow-bg">🧾</div>
                <div>
                  <h4>本期發票登錄進度</h4>
                  <p class="ongoing-desc">目前已累積 {{ invoiceList.length }} 張發票，總金額 TWD {{ totalAmountSum.toLocaleString() }}。</p>
                </div>
              </div>
              <span class="badge-tag">{{ invoiceList.length }} 張</span>
            </div>
            <div class="ongoing-footer">
              <span>已記錄商品：<strong>{{ totalItemsSum }} 項</strong></span>
              <button class="action-go-btn" @click="currentTab = 'invoices'">查看存摺</button>
            </div>
          </div>
        </section>
      </template>

      <!-- 6. 【設定會員】分頁內容 -->
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
      <div class="manual-modal-card receipt-detail-modal">
        <div class="detail-top-header">
          <span class="detail-period-badge">{{ formatRocPeriodBadge(selectedInvoiceDetail.purchase_date) }}</span>
          <h4 class="detail-invoice-no">{{ selectedInvoiceDetail.invoice_number }}</h4>
          <p class="detail-date-line">{{ selectedInvoiceDetail.purchase_date }}</p>
        </div>

        <div class="detail-meta-box">
          <p>
            <strong>店家／類別：</strong>
            {{
              selectedInvoiceDetail.merchant_name ||
              `${selectedInvoiceDetail.store_name || '未提供店家'} · ${selectedInvoiceDetail.category_name || '一般消費'}`
            }}
          </p>
          <p v-if="selectedInvoiceDetail.seller_tax_id">
            <strong>營業人統編：</strong>{{ selectedInvoiceDetail.seller_tax_id }}
          </p>
          <p v-if="selectedInvoiceDetail.random_code">
            <strong>隨機碼：</strong>{{ selectedInvoiceDetail.random_code }}
          </p>
          <p>
            <strong>登錄方式：</strong>
            {{ selectedInvoiceDetail.source_type === 'traditional' ? '傳統發票（手動輸入）' : '電子發票' }}
          </p>
        </div>

        <div class="detail-items-section" v-if="selectedInvoiceDetail.items && selectedInvoiceDetail.items.length > 0">
          <div class="detail-items-head">
            <span>品名</span>
            <span>數量</span>
            <span>小計</span>
          </div>
          <div
            class="detail-item-row"
            :class="{ 'is-discount-row': !isSubstantiveProductItem(item) }"
            v-for="(item, idx) in selectedInvoiceDetail.items"
            :key="idx"
          >
            <span class="detail-item-name">
              {{ item.item_name }}
              <small v-if="!isSubstantiveProductItem(item)" class="discount-tag">折扣／折讓</small>
            </span>
            <span class="detail-item-qty">x{{ item.quantity }}</span>
            <span class="detail-item-amt">{{ item.amount }}</span>
          </div>
          <div v-if="Number(selectedInvoiceDetail.unmatched_diff || 0) > 0" class="detail-diff-row">
            <span>其他／未列明細金額</span>
            <span>+{{ Number(selectedInvoiceDetail.unmatched_diff).toLocaleString() }}</span>
          </div>
        </div>
        <p v-else class="fallback-detail-note">
          此筆發票無逐項商品明細。
        </p>

        <div class="detail-total-bar">
          <span>合計金額</span>
          <strong>TWD {{ Number(selectedInvoiceDetail.total_amount || 0).toLocaleString() }}</strong>
        </div>

        <div class="modal-btn-row">
          <button class="delete-modal-btn" @click="deleteInvoice(selectedInvoiceDetail.id)">刪除此筆</button>
          <button class="primary-action-btn" @click="selectedInvoiceDetail = null">關閉</button>
        </div>
      </div>
    </div>

    <!-- 底部固定導覽列：進入掃描發票 (scan) 或手動輸入 (manual) 時隱藏 -->
    <nav class="bottom-nav" v-if="currentTab !== 'scan' && currentTab !== 'manual'">
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import jsQR from 'jsqr'

const router = useRouter()
const nickname = ref('使用者')
const userPhone = ref('')
const currentTab = ref('home')
const previousTabBeforeManual = ref('home')

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

const viewportRef = ref(null)
const videoRef = ref(null)
const decodeCanvasRef = ref(null)
const mediaStream = ref(null)
const flashOn = ref(false)
const soundOn = ref(true)
const continuousScan = ref(true)
const scanError = ref(false)
const isExtracting = ref(false)
const isSyncingInvoices = ref(false)
const lastExtractedInvoice = ref(null)
const isCameraRunning = ref(false)
const cameraStatusMsg = ref('')

const detectedBoxes = ref([])
const qrPulseDetected = ref(false)
const duplicateAlertMsg = ref('')
const successToastMsg = ref('')
let scanLoopTimer = null
let qrPulseTimer = null

let pendingLeftQr = null
let pendingRightItems = []
let pendingRightAt = 0
let mergeFlushTimer = null
let rightFallbackTimer = null
const RIGHT_QR_HOLD_MS = 6000
const LEFT_WAIT_RIGHT_MS = 1800

const periods = ['115年07–08月', '115年09–10月', '115年11–12月']
const currentPeriodIndex = ref(2)
const showSearchBar = ref(false)
const searchKeyword = ref('')
const sourceFilter = ref('all')
const sortDesc = ref(true)
const selectedInvoiceDetail = ref(null)
const invoiceList = ref([])

const TRACK_CATEGORY_MAP = {
  FT: '一般消費',
  FG: '餐飲消費'
}

const getTodayFormatted = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

const tradEditorForm = ref({
  invoice_type_label: '傳統發票',
  purchase_date: '',
  track_alpha: '',
  track_digits: '',
  total_amount: 0,
  merchant_name: '',
  items: []
})

const resetTradEditorForm = () => {
  tradEditorForm.value = {
    invoice_type_label: '傳統發票',
    purchase_date: '',
    track_alpha: '',
    track_digits: '',
    total_amount: 0,
    merchant_name: '',
    items: []
  }
}

const isNonProductCode = (name) => {
  const s = String(name || '').trim()
  if (!s || s.length > 100) return true
  if (/^\*+$/.test(s)) return true
  if (/^-?\d+(\.\d+)?$/.test(s)) return true
  if (/^[A-Za-z]{1,4}\d{1,}$/.test(s)) return true
  if (/^[012]$/.test(s)) return true
  return false
}

const isSubstantiveProductItem = (item) => {
  const name = String(item?.item_name || '').trim()
  const amount = Number(item?.amount || 0)
  if (!name || amount <= 0) return false
  if (/折扣|折讓|折抵|特價|調整|滿額贈|點數折/.test(name)) return false
  return true
}

const getSubstantiveItems = (items = []) => {
  return (Array.isArray(items) ? items : []).filter(isSubstantiveProductItem)
}

const normalizeDateOnly = (rawVal) => {
  const str = String(rawVal || '')
    .trim()
    .replaceAll('—', '-')
    .replaceAll('–', '-')

  if (!str) return getTodayFormatted()

  const rocMatch = str.match(/^(\d{2,3})\s*[年/.-]\s*(\d{1,2})\s*[月/.-]\s*(\d{1,2})\s*日?$/)
  if (rocMatch) {
    const adYear = Number(rocMatch[1]) + 1911
    const mm = rocMatch[2].padStart(2, '0')
    const dd = rocMatch[3].padStart(2, '0')
    return `${adYear}/${mm}/${dd}`
  }

  const adMatch = str.match(/^(\d{4})\s*[年/.-]\s*(\d{1,2})\s*[月/.-]\s*(\d{1,2})\s*日?$/)
  if (adMatch) {
    const yyyy = adMatch[1]
    const mm = adMatch[2].padStart(2, '0')
    const dd = adMatch[3].padStart(2, '0')
    return `${yyyy}/${mm}/${dd}`
  }

  return str.slice(0, 10).replaceAll('-', '/')
}

const formatRocPeriodBadge = (dateStr) => {
  const match = String(dateStr || '').match(/^(\d{4})[/-](\d{2})[/-](\d{2})/)
  if (!match) return periods[currentPeriodIndex.value]
  const year = Number(match[1])
  const month = Number(match[2])
  const rocYear = year - 1911
  const evenEnd = month % 2 === 0 ? month : month + 1
  const oddStart = evenEnd - 1
  const pad = (n) => String(n).padStart(2, '0')
  return `${rocYear}年${pad(oddStart)}–${pad(evenEnd)}月`
}

const buildSummaryTitle = (items = [], merchantName = '') => {
  const substantive = getSubstantiveItems(items)
  if (substantive.length > 1) {
    return `${substantive[0].item_name} 等 ${substantive.length} 項`
  }
  if (substantive.length === 1) {
    return substantive[0].item_name
  }
  return `${merchantName || '一般消費'}（無逐項明細）`
}

const decodeTextSafely = (str) => {
  const cleaned = String(str || '').trim()
  if (!cleaned) return ''
  if (cleaned.length >= 4 && cleaned.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(cleaned)) {
    try {
      const binary = atob(cleaned)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      for (const enc of ['utf-8', 'big5']) {
        try {
          const decoded = new TextDecoder(enc, { fatal: true }).decode(bytes).trim()
          if (decoded && !/[\x00-\x08\x0E-\x1F\uFFFD]/.test(decoded)) {
            return decoded
          }
        } catch {
          // 嘗試下一個編碼
        }
      }
    } catch {
      // 非 Base64 則維持原字串
    }
  }
  return cleaned
}

const normalizeItemRow = (item) => {
  const name = decodeTextSafely(item?.item_name ?? item?.name ?? '').trim()
  const qtyNum = Number(String(item?.quantity ?? item?.qty ?? 1).replaceAll(',', ''))
  const quantity = Number.isFinite(qtyNum) && qtyNum !== 0 ? Math.abs(qtyNum) : 1
  const rawPrice = Number(String(item?.unit_price ?? item?.price ?? '').replaceAll(',', ''))
  const rawAmt = Number(String(item?.amount ?? '').replaceAll(',', ''))

  const unitPrice = Number.isFinite(rawPrice) && rawPrice !== 0
    ? rawPrice
    : Number.isFinite(rawAmt) && rawAmt !== 0
    ? Number((rawAmt / quantity).toFixed(2))
    : 0

  const amount = Number.isFinite(rawAmt) && rawAmt !== 0
    ? Number(rawAmt.toFixed(2))
    : Number((quantity * unitPrice).toFixed(2))

  const row = {
    item_name: name,
    quantity,
    unit_price: unitPrice,
    amount
  }

  return {
    ...row,
    is_substantive: isSubstantiveProductItem(row)
  }
}

const isValidParsedItem = (item) => {
  const name = String(item?.item_name || '').trim()
  if (isNonProductCode(name)) return false
  return Number.isFinite(Number(item?.amount)) && Number(item?.amount) !== 0 && Math.abs(Number(item?.amount)) < 1000000
}

const mergeUniqueItems = (baseItems = [], extraItems = []) => {
  const merged = []
  const seen = new Set()
  for (const raw of [...baseItems, ...extraItems]) {
    const norm = normalizeItemRow(raw)
    if (!isValidParsedItem(norm)) continue
    const key = `${norm.item_name}__${norm.quantity}__${norm.unit_price}__${norm.amount}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(norm)
    }
  }
  return merged
}

const reconcileInvoiceAmounts = (items = [], qrTotalAmount = 0) => {
  const cleanItems = mergeUniqueItems(Array.isArray(items) ? items : [], [])
  const itemsSum = Number(
    cleanItems.reduce((acc, it) => acc + Number(it.amount || 0), 0).toFixed(2)
  )

  const totalAmount =
    Number(qrTotalAmount) > 0 ? Number(qrTotalAmount) : itemsSum

  const diff = Number((totalAmount - itemsSum).toFixed(2))

  if (cleanItems.length > 0 && Number(qrTotalAmount) > 0 && diff < 0) {
    return {
      items: mergeUniqueItems(cleanItems, [
        {
          item_name: '折扣／折讓調整',
          quantity: 1,
          unit_price: diff,
          amount: diff
        }
      ]),
      totalAmount,
      unmatchedDiff: 0
    }
  }

  return {
    items: cleanItems,
    totalAmount,
    unmatchedDiff: diff > 0 ? diff : 0
  }
}

const loadUserSession = () => {
  const savedNickname = localStorage.getItem('user_nickname')
  if (savedNickname) {
    nickname.value = savedNickname
  }

  let phone = (localStorage.getItem('user_phone') || '').trim()
  if (!phone) {
    try {
      const rawUser = localStorage.getItem('carbon_user') || localStorage.getItem('user')
      if (rawUser) {
        const parsed = JSON.parse(rawUser)
        const obj = parsed?.data || parsed
        if (obj?.phone) phone = String(obj.phone).trim()
        if (obj?.nickname && !savedNickname) nickname.value = String(obj.nickname)
      }
    } catch {
      // 忽略解析例外
    }
  }
  userPhone.value = phone
}

const syncInvoicesFromCloud = async () => {
  if (!userPhone.value) return
  isSyncingInvoices.value = true
  try {
    const url = `${API_BASE_URL}/api/invoices?phone=${encodeURIComponent(userPhone.value)}`
    const res = await fetch(url)
    if (!res.ok) return
    const result = await res.json()
    if (result?.status === 'success' && Array.isArray(result.data)) {
      invoiceList.value = result.data.map((inv) => {
        const formattedDate = normalizeDateOnly(inv.purchase_date)
        const reconciled = reconcileInvoiceAmounts(
          Array.isArray(inv.items) ? inv.items : [],
          Number(inv.total_amount || 0)
        )
        return {
          ...inv,
          purchase_date: formattedDate,
          total_amount: reconciled.totalAmount,
          unmatched_diff: reconciled.unmatchedDiff,
          summary_title: buildSummaryTitle(reconciled.items, inv.merchant_name),
          items: reconciled.items
        }
      })
    }
  } catch (err) {
    console.warn('同步雲端發票失敗：', err)
  } finally {
    isSyncingInvoices.value = false
  }
}

const saveInvoiceToCloud = async (record, sourceType = 'qr') => {
  if (!userPhone.value) return record
  try {
    const normalizedItems = (Array.isArray(record.items) ? record.items : []).map((it) => ({
      ...it,
      is_substantive: isSubstantiveProductItem(it)
    }))

    const res = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: userPhone.value,
        invoice_number: record.invoice_number,
        purchase_date: normalizeDateOnly(record.purchase_date),
        random_code: record.random_code || null,
        seller_tax_id: record.seller_tax_id || null,
        merchant_name: record.merchant_name,
        store_name: record.store_name || null,
        category_name: record.category_name || '一般消費',
        total_amount: Number(record.total_amount || 0),
        calc_label: record.calc_label || null,
        source_type: sourceType,
        items: normalizedItems
      })
    })
    if (res.ok) {
      const result = await res.json()
      const savedData = result?.data || {}
      return {
        ...record,
        id: savedData.id || record.id
      }
    }
  } catch (err) {
    console.warn('寫入雲端發票失敗，保留本地紀錄：', err)
  }
  return record
}

const openInvoiceDetail = (inv) => {
  selectedInvoiceDetail.value = inv
}

const triggerGreenPulse = () => {
  qrPulseDetected.value = true
  if (qrPulseTimer) clearTimeout(qrPulseTimer)
  qrPulseTimer = setTimeout(() => {
    qrPulseDetected.value = false
  }, 1100)
}

const clearPendingTimersOnly = () => {
  if (mergeFlushTimer) {
    clearTimeout(mergeFlushTimer)
    mergeFlushTimer = null
  }
  if (rightFallbackTimer) {
    clearTimeout(rightFallbackTimer)
    rightFallbackTimer = null
  }
}

const resetPendingQrMerge = () => {
  clearPendingTimersOnly()
  pendingLeftQr = null
  pendingRightItems = []
  pendingRightAt = 0
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
  resetPendingQrMerge()
  detectedBoxes.value = []
  qrPulseDetected.value = false
}

const addTradItemRow = () => {
  tradEditorForm.value.items.push({
    item_name: '',
    quantity: 1,
    amount: 0
  })
}

const removeTradItemRow = (idx) => {
  tradEditorForm.value.items.splice(idx, 1)
}

const submitTraditionalInvoice = async () => {
  const alpha = String(tradEditorForm.value.track_alpha || '').toUpperCase().replace(/[^A-Z]/g, '')
  const digits = String(tradEditorForm.value.track_digits || '').replace(/\D/g, '')
  const manualDate = String(tradEditorForm.value.purchase_date || '').trim()
  const manualTotal = Math.max(0, Number(tradEditorForm.value.total_amount || 0))
  const isElectronicManual = tradEditorForm.value.invoice_type_label === '電子發票'

  if (!manualDate) {
    alert('請輸入發票日期')
    return
  }

  if (alpha.length !== 2 || digits.length !== 8) {
    alert('請輸入完整發票號碼（2碼英文＋8碼數字）')
    return
  }

  const validItems = (Array.isArray(tradEditorForm.value.items) ? tradEditorForm.value.items : [])
    .filter((it) => String(it.item_name || '').trim().length > 0)
    .map((it) => {
      const qty = Math.max(1, Number(it.quantity || 1))
      const amt = Math.max(0, Number(it.amount || 0))
      return {
        item_name: String(it.item_name || '').trim(),
        quantity: qty,
        unit_price: amt > 0 ? Number((amt / qty).toFixed(2)) : 0,
        amount: amt,
        is_substantive: true
      }
    })

  const itemsSum = validItems.reduce((sum, it) => sum + Number(it.amount || 0), 0)
  const finalTotalAmount = manualTotal > 0 ? manualTotal : itemsSum

  if (finalTotalAmount <= 0 && validItems.length === 0) {
    alert('請輸入發票金額或新增商品明細')
    return
  }

  const invoiceNumber = `${alpha}${digits}`
  const defaultTypeLabel = isElectronicManual ? '電子發票' : '傳統發票'
  const storeName = String(tradEditorForm.value.merchant_name || '').trim() || defaultTypeLabel
  const categoryName = TRACK_CATEGORY_MAP[alpha] || '一般消費'
  const formattedDate = normalizeDateOnly(manualDate)
  const sourceType = isElectronicManual ? 'electronic' : 'traditional'

  const reconciled = reconcileInvoiceAmounts(validItems, finalTotalAmount)
  const substantiveCount = getSubstantiveItems(reconciled.items).length

  const record = {
    id: Date.now() + Math.random(),
    invoice_number: invoiceNumber,
    merchant_name: `${storeName} · ${categoryName}`,
    store_name: storeName,
    category_name: categoryName,
    seller_tax_id: '',
    purchase_date: formattedDate,
    random_code: '',
    summary_title:
      substantiveCount > 0
        ? buildSummaryTitle(reconciled.items, storeName)
        : `${storeName}（${defaultTypeLabel}）`,
    total_amount: reconciled.totalAmount,
    unmatched_diff: reconciled.unmatchedDiff,
    calc_label: substantiveCount > 0 ? '逐項商品明細' : `${defaultTypeLabel}金額登錄`,
    source_type: sourceType,
    items: reconciled.items
  }

  const saved = await saveInvoiceToCloud(record, sourceType)
  invoiceList.value.unshift(saved)
  lastExtractedInvoice.value = saved
  resetTradEditorForm()
  currentTab.value = 'invoices'
}

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
    expectedItemCount: 0,
    items: []
  }

  if (typeof rawPayload !== 'string') return result
  const text = rawPayload.trim()
  if (!text) return result

  const normalizeTokens = (str) => {
    const decoded = decodeTextSafely(str)
    return decoded
      .replaceAll('：', ':')
      .replaceAll('｜', ':')
      .replaceAll('|', ':')
      .replaceAll('/', ':')
      .replaceAll('\r\n', ':')
      .replaceAll('\n', ':')
      .split(':')
      .map((t) => decodeTextSafely(t).trim())
      .filter(Boolean)
  }

  const parseReceiptItems = (tokens = []) => {
    const parsedItems = []
    let i = 0

    while (i < tokens.length) {
      const t0 = decodeTextSafely(tokens[i] || '').trim()
      const t1 = String(tokens[i + 1] || '').trim().replaceAll(',', '')
      const t2 = String(tokens[i + 2] || '').trim().replaceAll(',', '')

      if (
        i + 2 < tokens.length &&
        !isNonProductCode(t0) &&
        /^-?\d+(\.\d+)?$/.test(t1) &&
        /^-?\d+(\.\d+)?$/.test(t2)
      ) {
        const qty = Number(t1)
        const priceOrAmt = Number(t2)
        if (
          Number.isFinite(qty) &&
          Number.isFinite(priceOrAmt) &&
          qty > 0 &&
          qty < 10000 &&
          priceOrAmt !== 0 &&
          Math.abs(priceOrAmt) < 1000000
        ) {
          const cleanQty = Number(qty.toFixed(2))
          const amount =
            priceOrAmt < 0
              ? Number(priceOrAmt.toFixed(2))
              : Number((cleanQty * priceOrAmt).toFixed(2))

          parsedItems.push({
            item_name: t0,
            quantity: cleanQty,
            unit_price: priceOrAmt,
            amount
          })
          i += 3
          continue
        }
      }

      if (
        i + 1 < tokens.length &&
        !isNonProductCode(t0) &&
        /^-\d+(\.\d+)?$/.test(t1)
      ) {
        const negAmt = Number(t1)
        if (Number.isFinite(negAmt) && negAmt < 0 && Math.abs(negAmt) < 1000000) {
          parsedItems.push({
            item_name: t0,
            quantity: 1,
            unit_price: Number(negAmt.toFixed(2)),
            amount: Number(negAmt.toFixed(2))
          })
          i += 2
          continue
        }
      }

      i += 1
    }

    return mergeUniqueItems([], parsedItems)
  }

  if (text.startsWith('**')) {
    result.isExtensionOnly = true
    const rawTokens = normalizeTokens(text.slice(2))
    let startIdx = 0
    if (
      rawTokens.length >= 3 &&
      /^\d+$/.test(rawTokens[0]) &&
      /^[012]$/.test(rawTokens[1])
    ) {
      startIdx = 2
    }
    result.items = parseReceiptItems(rawTokens.slice(startIdx))
    return result
  }

  if (text.length >= 21 && /^[A-Z]{2}\d{8}/i.test(text)) {
    result.invoiceNumber = text.slice(0, 10).toUpperCase()

    const roc = text.slice(10, 17)
    if (/^\d{7}$/.test(roc)) {
      result.rocDate = roc
      const westernYear = Number(roc.slice(0, 3)) + 1911
      const mm = roc.slice(3, 5)
      const dd = roc.slice(5, 7)
      result.isoDate = `${westernYear}/${mm}/${dd}`
    }

    const rand = text.slice(17, 21)
    if (/^\d{4}$/.test(rand)) {
      result.randomCode = rand
    }

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

    if (text.length >= 53) {
      const buyer = text.slice(37, 45)
      const seller = text.slice(45, 53)
      if (/^\d{8}$/.test(buyer) && buyer !== '00000000') {
        result.buyerBan = buyer
      }
      if (/^\d{8}$/.test(seller)) {
        result.sellerBan = seller
      }
    }

    if (text.length > 77) {
      const parts = normalizeTokens(text.slice(77))
      if (parts.length > 0 && parts[0].startsWith('**')) {
        parts.shift()
      }
      if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
        result.expectedItemCount = Number(parts[0])
        parts.shift()
        if (parts.length > 0 && /^[012]$/.test(parts[0])) {
          parts.shift()
        }
      }
      result.items = parseReceiptItems(parts)
    }
  }

  return result
}

const flushPendingInvoice = async () => {
  clearPendingTimersOnly()
  if (!pendingLeftQr || isExtracting.value) return

  const leftSnapshot = pendingLeftQr
  const hasFreshRight =
    pendingRightItems.length > 0 && Date.now() - pendingRightAt <= RIGHT_QR_HOLD_MS
  const rightSnapshot = hasFreshRight ? [...pendingRightItems] : []

  pendingLeftQr = null
  pendingRightItems = []
  pendingRightAt = 0

  const mergedItems = mergeUniqueItems(leftSnapshot.parsed.items || [], rightSnapshot)

  await processInvoiceLookup(
    {
      invoiceType: 'electronic',
      invoiceNumber: leftSnapshot.parsed.invoiceNumber,
      invoiceDate: leftSnapshot.parsed.isoDate,
      randomCode: leftSnapshot.parsed.randomCode,
      totalAmount: leftSnapshot.parsed.totalAmount,
      merchantName: leftSnapshot.parsed.merchantName,
      sellerBan: leftSnapshot.parsed.sellerBan,
      items: mergedItems
    },
    leftSnapshot.rawText,
    'qr'
  )
}

const scheduleFlushForLeftQr = () => {
  if (mergeFlushTimer) {
    clearTimeout(mergeFlushTimer)
    mergeFlushTimer = null
  }
  if (!pendingLeftQr) return

  const expectedCount = Number(pendingLeftQr.parsed.expectedItemCount || 0)
  const currentCount = (pendingLeftQr.parsed.items || []).length + pendingRightItems.length
  const hasAllExpectedItems = expectedCount > 0 && currentCount >= expectedCount

  if (hasAllExpectedItems || pendingRightItems.length > 0) {
    flushPendingInvoice()
    return
  }

  successToastMsg.value = `已掃描 ${pendingLeftQr.parsed.invoiceNumber}，可靠近右 QR 補明細`

  mergeFlushTimer = setTimeout(() => {
    successToastMsg.value = ''
    flushPendingInvoice()
  }, LEFT_WAIT_RIGHT_MS)
}

const handleFrameQrTexts = async (rawTexts = []) => {
  const uniqueTexts = Array.from(
    new Set((rawTexts || []).map((t) => String(t || '').trim()).filter(Boolean))
  )
  if (uniqueTexts.length === 0) return

  triggerGreenPulse()

  const leftEntries = []
  const rightEntries = []

  for (const text of uniqueTexts) {
    const parsed = parseTaiwanInvoiceQr(text)
    if (parsed.isExtensionOnly || text.startsWith('**')) {
      rightEntries.push({ rawText: text, parsed })
    } else if (parsed.invoiceNumber && /^[A-Z]{2}\d{8}$/.test(parsed.invoiceNumber)) {
      leftEntries.push({ rawText: text, parsed })
    }
  }

  if (leftEntries.length > 0 && rightEntries.length > 0) {
    clearPendingTimersOnly()
    const mainLeft = leftEntries[0]
    const exists = invoiceList.value.some(
      (inv) => inv.invoice_number === mainLeft.parsed.invoiceNumber
    )
    if (exists) {
      pendingLeftQr = null
      pendingRightItems = []
      pendingRightAt = 0
      duplicateAlertMsg.value = '發票已存在'
      setTimeout(() => {
        duplicateAlertMsg.value = ''
      }, 2200)
      return
    }

    let combinedRightItems = [...pendingRightItems]
    for (const r of rightEntries) {
      combinedRightItems = mergeUniqueItems(combinedRightItems, r.parsed.items || [])
    }
    const mergedItems = mergeUniqueItems(mainLeft.parsed.items || [], combinedRightItems)

    pendingLeftQr = null
    pendingRightItems = []
    pendingRightAt = 0

    await processInvoiceLookup(
      {
        invoiceType: 'electronic',
        invoiceNumber: mainLeft.parsed.invoiceNumber,
        invoiceDate: mainLeft.parsed.isoDate,
        randomCode: mainLeft.parsed.randomCode,
        totalAmount: mainLeft.parsed.totalAmount,
        merchantName: mainLeft.parsed.merchantName,
        sellerBan: mainLeft.parsed.sellerBan,
        items: mergedItems
      },
      mainLeft.rawText,
      'qr'
    )
    return
  }

  if (rightEntries.length > 0) {
    for (const r of rightEntries) {
      pendingRightItems = mergeUniqueItems(pendingRightItems, r.parsed.items || [])
    }
    pendingRightAt = Date.now()

    if (pendingLeftQr) {
      await flushPendingInvoice()
      return
    }

    if (rightFallbackTimer) clearTimeout(rightFallbackTimer)
    rightFallbackTimer = setTimeout(() => {
      if (!pendingLeftQr && pendingRightItems.length > 0) {
        pendingRightItems = []
        pendingRightAt = 0
      }
    }, RIGHT_QR_HOLD_MS)
    return
  }

  if (leftEntries.length > 0) {
    const mainLeft = leftEntries[0]
    const exists = invoiceList.value.some(
      (inv) => inv.invoice_number === mainLeft.parsed.invoiceNumber
    )
    if (exists) {
      duplicateAlertMsg.value = '發票已存在'
      setTimeout(() => {
        duplicateAlertMsg.value = ''
      }, 2200)
      return
    }

    if (pendingLeftQr && pendingLeftQr.parsed.invoiceNumber !== mainLeft.parsed.invoiceNumber) {
      await flushPendingInvoice()
    }

    pendingLeftQr = mainLeft
    scheduleFlushForLeftQr()
  }
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

const decodeCanvasFrame = (srcVideo, tempCanvas, cropRect) => {
  const vw = srcVideo.videoWidth
  const vh = srcVideo.videoHeight
  const sx = Math.max(0, Math.floor((cropRect?.x ?? 0) * vw))
  const sy = Math.max(0, Math.floor((cropRect?.y ?? 0) * vh))
  const sw = Math.max(1, Math.floor((cropRect?.w ?? 1) * vw))
  const sh = Math.max(1, Math.floor((cropRect?.h ?? 1) * vh))

  const targetW = Math.min(sw, 640)
  const targetH = Math.max(1, Math.round((sh / sw) * targetW))
  if (tempCanvas.width !== targetW || tempCanvas.height !== targetH) {
    tempCanvas.width = targetW
    tempCanvas.height = targetH
  }

  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  ctx.drawImage(srcVideo, sx, sy, sw, sh, 0, 0, targetW, targetH)
  const imageData = ctx.getImageData(0, 0, targetW, targetH)
  const code = jsQR(imageData.data, targetW, targetH, {
    inversionAttempts: 'attemptBoth'
  })

  if (!code || !code.data) return []

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

  return [
    {
      rawValue: code.data,
      normBox: {
        x: (sx + (minX / targetW) * sw) / vw,
        y: (sy + (minY / targetH) * sh) / vh,
        w: (Math.max(maxX - minX, 20) / targetW) * sw / vw,
        h: (Math.max(maxY - minY, 20) / targetH) * sh / vh
      }
    }
  ]
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
    if (
      !isCameraRunning.value ||
      currentTab.value !== 'scan' ||
      isExtracting.value
    ) return

    const video = videoRef.value
    const canvas = decodeCanvasRef.value
    const viewport = viewportRef.value
    if (!video || !canvas || !viewport || video.readyState < 2 || !video.videoWidth) return

    const vw = video.videoWidth
    const vh = video.videoHeight

    const hits = []
    const seenValues = new Set()
    const pushHits = (arr) => {
      for (const item of arr || []) {
        const val = (item.rawValue || '').trim()
        if (val && !seenValues.has(val)) {
          seenValues.add(val)
          hits.push({ ...item, rawValue: val })
        }
      }
    }

    if (detector) {
      try {
        const barcodes = await detector.detect(video)
        if (barcodes && barcodes.length > 0) {
          pushHits(
            barcodes.map((b) => ({
              rawValue: b.rawValue,
              normBox: {
                x: b.boundingBox.x / vw,
                y: b.boundingBox.y / vh,
                w: b.boundingBox.width / vw,
                h: b.boundingBox.height / vh
              }
            }))
          )
        }
      } catch {
        // 改走 jsQR 備援
      }
    }

    try {
      const hasLeft = hits.some((h) => !h.rawValue.startsWith('**'))
      const hasRight = hits.some((h) => h.rawValue.startsWith('**'))

      if (!hasLeft || !hasRight) {
        pushHits(decodeCanvasFrame(video, canvas, { x: 0, y: 0.12, w: 0.65, h: 0.76 }))
        pushHits(decodeCanvasFrame(video, canvas, { x: 0.35, y: 0.12, w: 0.65, h: 0.76 }))
      }
      if (hits.length === 0) {
        pushHits(decodeCanvasFrame(video, canvas, { x: 0, y: 0, w: 1, h: 1 }))
      }

      if (hits.length > 0) {
        detectedBoxes.value = hits.map((h) => ({
          rawValue: h.rawValue,
          style: computeViewportBoxStyle(
            h.normBox.x * vw,
            h.normBox.y * vh,
            h.normBox.w * vw,
            h.normBox.h * vh,
            vw,
            vh,
            viewport
          )
        }))
        await handleFrameQrTexts(hits.map((h) => h.rawValue))
      } else {
        detectedBoxes.value = []
      }
    } catch {
      // 忽略單幀例外
    }
  }, 220)
}

const stopCameraScanner = async () => {
  if (pendingLeftQr) {
    await flushPendingInvoice()
  }
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
    cameraStatusMsg.value = '此瀏覽器不支援相機存取，請使用 HTTPS 並允許相機權限'
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
  } else {
    if (oldTab === 'scan') {
      await stopCameraScanner()
    }
    if (newTab === 'invoices' || newTab === 'home') {
      await syncInvoicesFromCloud()
    }
  }
})

onMounted(async () => {
  loadUserSession()
  await syncInvoicesFromCloud()
  if (currentTab.value === 'scan') {
    startCameraScanner()
  }
})

onBeforeUnmount(async () => {
  await stopCameraScanner()
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

const openManualTab = () => {
  if (currentTab.value !== 'manual') {
    previousTabBeforeManual.value = currentTab.value
  }
  currentTab.value = 'manual'
}

const deleteInvoice = async (targetId) => {
  if (userPhone.value && targetId) {
    try {
      const url = `${API_BASE_URL}/api/invoices/${encodeURIComponent(
        targetId
      )}?phone=${encodeURIComponent(userPhone.value)}`
      await fetch(url, { method: 'DELETE' })
    } catch (err) {
      console.warn('刪除雲端發票失敗：', err)
    }
  }
  invoiceList.value = invoiceList.value.filter(item => item.id !== targetId)
  if (selectedInvoiceDetail.value && selectedInvoiceDetail.value.id === targetId) {
    selectedInvoiceDetail.value = null
  }
}

const totalAmountSum = computed(() => {
  return invoiceList.value.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
})

const totalItemsSum = computed(() => {
  return invoiceList.value.reduce((acc, item) => acc + getSubstantiveItems(item.items).length, 0)
})

const sourceFilterLabel = computed(() => {
  if (sourceFilter.value === 'electronic') return '僅看電子發票'
  if (sourceFilter.value === 'traditional') return '僅看傳統發票'
  return '全部發票來源'
})

const filteredInvoices = computed(() => {
  let list = [...invoiceList.value]

  if (sourceFilter.value === 'electronic') {
    list = list.filter(i => i.source_type !== 'traditional')
  } else if (sourceFilter.value === 'traditional') {
    list = list.filter(i => i.source_type === 'traditional')
  }

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(
      i =>
        (i.invoice_number || '').toLowerCase().includes(kw) ||
        (i.merchant_name || '').toLowerCase().includes(kw) ||
        (i.summary_title || '').toLowerCase().includes(kw) ||
        (Array.isArray(i.items) && i.items.some(it => (it.item_name || '').toLowerCase().includes(kw)))
    )
  }

  list.sort((a, b) => {
    const dateA = String(a.purchase_date || '').replaceAll('/', '').replaceAll('-', '')
    const dateB = String(b.purchase_date || '').replaceAll('/', '').replaceAll('-', '')
    return sortDesc.value ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB)
  })

  return list
})

const filteredTotalAmount = computed(() => {
  return filteredInvoices.value.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
})

const filteredTotalItemsCount = computed(() => {
  return filteredInvoices.value.reduce(
    (acc, item) => acc + getSubstantiveItems(item.items).length,
    0
  )
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
  if (sourceFilter.value === 'all') {
    sourceFilter.value = 'electronic'
  } else if (sourceFilter.value === 'electronic') {
    sourceFilter.value = 'traditional'
  } else {
    sourceFilter.value = 'all'
  }
}

const toggleSortOrder = () => {
  sortDesc.value = !sortDesc.value
}

const alertHelp = () => {
  alert('【掃描說明】\n電子發票證明聯：左右 QR Code 可同時入鏡合併；若分開掃描，系統會短暫等待另一側 QR Code 補齊明細後再寫入。\n若要手動輸入發票，請由首頁「手動輸入發票」或發票存摺內的「手動輸入」進入。')
}

const resolveInvoiceRecord = (inputMeta = {}, backendData = {}) => {
  const cleanNum = (
    backendData.invoice_number ||
    inputMeta.invoiceNumber ||
    '未提供字軌'
  )
    .toUpperCase()
    .replaceAll('-', '')
    .trim()

  const trackPrefix = cleanNum.slice(0, 2)
  const sellerBan = String(
    backendData.seller_tax_id || backendData.seller_ban || inputMeta.sellerBan || ''
  ).trim()
  const categoryName =
    backendData.category_name ||
    inputMeta.categoryName ||
    TRACK_CATEGORY_MAP[trackPrefix] ||
    '一般消費'

  const rawBackendMerchant = String(backendData.merchant_name || '').trim()
  const cleanBackendMerchant = rawBackendMerchant.includes(' · ')
    ? rawBackendMerchant.split(' · ')[0].trim()
    : rawBackendMerchant

  const isGenericBackendMerchant =
    !cleanBackendMerchant ||
    /^賣方\s*\d+$/.test(cleanBackendMerchant) ||
    /^統編\s*\d+$/.test(cleanBackendMerchant) ||
    /字軌$/.test(cleanBackendMerchant) ||
    cleanBackendMerchant === sellerBan

  const storeDisplay =
    (!isGenericBackendMerchant && cleanBackendMerchant) ||
    inputMeta.merchantName ||
    (sellerBan ? `統編 ${sellerBan}` : `${trackPrefix}字軌`)

  const merchantName = `${storeDisplay} · ${categoryName}`

  const formattedDate = normalizeDateOnly(
    inputMeta.invoiceDate || backendData.purchase_date || backendData.purchase_datetime || getTodayFormatted()
  )

  const qrItems = mergeUniqueItems(Array.isArray(inputMeta.items) ? inputMeta.items : [], [])
  const backendItems = mergeUniqueItems(Array.isArray(backendData.items) ? backendData.items : [], [])
  const rawItems = qrItems.length > 0 ? qrItems : backendItems

  const rawTotalAmount =
    Number(inputMeta.totalAmount) > 0
      ? Number(inputMeta.totalAmount)
      : Number(backendData.total_amount) > 0
      ? Number(backendData.total_amount)
      : 0

  const reconciled = reconcileInvoiceAmounts(rawItems, rawTotalAmount)
  const items = reconciled.items
  const totalAmount = reconciled.totalAmount
  const substantiveCount = getSubstantiveItems(items).length
  const calcLabel =
    substantiveCount > 0
      ? '逐項商品明細'
      : `發票總金額（${categoryName}）`

  const summaryTitle = buildSummaryTitle(items, merchantName)

  return {
    id: backendData.invoice_id || backendData.id || Date.now() + Math.random(),
    invoice_number: cleanNum,
    merchant_name: merchantName,
    store_name: storeDisplay,
    category_name: categoryName,
    seller_tax_id: sellerBan,
    purchase_date: formattedDate,
    random_code: inputMeta.randomCode || backendData.random_code || '',
    summary_title: summaryTitle,
    total_amount: totalAmount,
    unmatched_diff: reconciled.unmatchedDiff,
    calc_label: calcLabel,
    source_type: 'electronic',
    items
  }
}

const processInvoiceLookup = async (inputMeta, rawPayload, sourceType = 'qr') => {
  isExtracting.value = true
  scanError.value = false
  if (!userPhone.value) {
    loadUserSession()
  }
  const phoneToUse = userPhone.value || localStorage.getItem('user_phone') || ''

  let backendData = {}
  try {
    const res = await fetch(`${API_BASE_URL}/api/invoices/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneToUse,
        invoice_type: 'electronic',
        source_type: sourceType,
        qr_raw_data: rawPayload
      })
    })
    if (res.ok) {
      const result = await res.json()
      backendData = result?.data || {}
    }
  } catch (err) {
    console.warn('後端未回應，改用前端 QR 解析：', err)
  } finally {
    let record = resolveInvoiceRecord(inputMeta, backendData)

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

    record = await saveInvoiceToCloud(record, sourceType)

    lastExtractedInvoice.value = record
    invoiceList.value.unshift(record)
    isExtracting.value = false

    successToastMsg.value = `已擷取 ${record.invoice_number}`
    setTimeout(() => {
      successToastMsg.value = ''
    }, 2000)
  }
}

const handleLogout = async () => {
  if (confirm('確定要登出系統嗎？')) {
    await stopCameraScanner()
    localStorage.removeItem('user_nickname')
    localStorage.removeItem('user_phone')
    localStorage.removeItem('user_barcode')
    localStorage.removeItem('carbon_user')
    localStorage.removeItem('user')
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
  font-size: 1.25rem;
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
.purple-bg { background-color: #ede9fe; }
.blue-bg { background-color: #e0f2fe; }
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
  flex-shrink: 0;
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

.summary-info-pill {
  background-color: #fef3c7;
  color: #78350f;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  font-size: 0.86rem;
  text-align: center;
}

.passbook-filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-left-group {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
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

.manual-entry-pill-btn {
  background-color: #7c5dfa;
  color: #ffffff;
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

.tag-items {
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

.source-traditional {
  background-color: #fef3c7;
  color: #92400e;
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

.empty-action-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.secondary-manual-btn {
  background-color: #7c5dfa;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
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

.item-chip.discount-chip {
  background-color: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.fallback-preview-text {
  font-size: 0.82rem;
  color: #065f46;
}

.receipt-detail-modal {
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  gap: 0.85rem;
}

.detail-top-header {
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #d1d5db;
}

.detail-period-badge {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #4c1d95;
  background-color: #ede9fe;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  margin-bottom: 0.35rem;
}

.detail-invoice-no {
  margin: 0.15rem 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: 0.5px;
}

.detail-date-line {
  margin: 0;
  font-size: 0.88rem;
  color: #4b5563;
}

.detail-meta-box {
  background-color: #f9fafb;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.88rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.detail-meta-box p {
  margin: 0;
}

.detail-items-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-items-head {
  display: grid;
  grid-template-columns: 1fr 48px 72px;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.detail-items-head span:nth-child(2),
.detail-items-head span:nth-child(3) {
  text-align: right;
}

.detail-item-row {
  display: grid;
  grid-template-columns: 1fr 48px 72px;
  gap: 0.5rem;
  align-items: start;
  font-size: 0.88rem;
  color: #1f2937;
}

.detail-item-row.is-discount-row {
  color: #92400e;
}

.detail-item-name {
  word-break: break-word;
  line-height: 1.35;
}

.discount-tag {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.08rem 0.4rem;
  font-size: 0.7rem;
  background-color: #fef3c7;
  color: #92400e;
  border-radius: 4px;
}

.detail-item-qty,
.detail-item-amt {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.detail-diff-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #6b7280;
  padding-top: 0.25rem;
  border-top: 1px dashed #e5e7eb;
}

.detail-total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  background-color: #ecfdf5;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #065f46;
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

.scanner-wrapper.is-trad-editor {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
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

.scanner-top-bar.official-editor-header {
  background-color: #7c5dfa;
  border-bottom: none;
}

.scanner-bar-title {
  font-size: 1.05rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.scanner-text-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
}

.scanner-topbar-spacer {
  width: 44px;
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
  transition: all 0.2s ease;
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
  padding: 1.25rem 1.25rem 1.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  margin-top: -12px;
  position: relative;
  z-index: 4;
}

.single-mode-badge {
  background-color: #f3f4f6;
  color: #111827;
  padding: 0.45rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.official-editor-body {
  background-color: #ffffff;
  color: #111827;
  padding: 1.25rem 1.25rem 1.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
  box-sizing: border-box;
}

.official-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.official-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.official-label {
  font-size: 0.98rem;
  font-weight: 600;
  color: #111827;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
}

.official-req {
  color: #ef4444;
  font-weight: 700;
}

.official-count {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin-left: 0.25rem;
}

.official-control {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0 0.9rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.98rem;
  color: #111827;
  background-color: #ffffff;
  box-sizing: border-box;
  outline: none;
}

.official-control:focus {
  border-color: #7c5dfa;
}

.official-manual-date {
  text-align: left;
}

.official-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.official-select {
  appearance: none;
  padding-right: 2.2rem;
  font-weight: 500;
}

.official-select-arrow {
  position: absolute;
  right: 0.95rem;
  font-size: 1.15rem;
  color: #374151;
  pointer-events: none;
}

.official-code-split {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
}

.official-alpha {
  text-transform: uppercase;
  font-weight: 500;
}

.official-digits {
  font-weight: 500;
}

.official-items-block {
  padding-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.official-items-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.official-item-box {
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-sizing: border-box;
}

.official-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: #4b5563;
}

.official-item-del {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.88rem;
  cursor: pointer;
}

.official-item-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.65rem;
}

.official-add-item-btn {
  width: 100%;
  height: 50px;
  border: 1.5px solid #9ca3af;
  border-radius: 999px;
  background-color: #ffffff;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
}

.official-plus-circle {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background-color: #111827;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.official-confirm-passbook-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 999px;
  background-color: #e5e7eb;
  color: #374151;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.official-confirm-passbook-btn:hover {
  background-color: #7c5dfa;
  color: #ffffff;
}

.official-modal-delete-btn {
  width: 100%;
  background: none;
  border: none;
  color: #dc2626;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.45rem 0;
  cursor: pointer;
}

.official-notice-card {
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.official-notice-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.official-notice-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #111827;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.official-notice-text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #4b5563;
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

.scanner-footer-note {
  font-size: 0.82rem;
  color: #4b5563;
  text-align: center;
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
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

.manual-modal-card h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
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