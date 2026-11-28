<template>
  <div class="ledger-container">
    <!-- 頂部導覽列 -->
    <header class="ledger-top-bar">
      <button class="back-btn" @click="$router.push('/dashboard')">
        &lt; 返回帳本
      </button>
      <span class="bar-title">🌱 個人碳帳本</span>
      <button class="advice-shortcut-btn" @click="$router.push('/advice')">
        減碳建議 &gt;
      </button>
    </header>

    <main class="ledger-main">
      <!-- 1. 選擇查看碳排時間區段（對應 4.1.1.1.3） -->
      <section class="filter-card">
        <div class="period-mode-tabs">
          <button
            v-for="mode in ['week', 'month', 'custom']"
            :key="mode"
            class="mode-tab-btn"
            :class="{ active: rangeMode === mode }"
            @click="switchRangeMode(mode)"
          >
            {{ mode === 'week' ? '本週' : mode === 'month' ? '本月' : '自訂區間' }}
          </button>
        </div>

        <div class="date-range-row">
          <div class="date-input-group">
            <label>起始日期</label>
            <input type="date" v-model="startDate" class="date-control" />
          </div>
          <span class="range-sep">～</span>
          <div class="date-input-group">
            <label>結束日期</label>
            <input type="date" v-model="endDate" class="date-control" />
          </div>
          <button class="query-btn" @click="applyDateFilter">查詢</button>
        </div>
        <p v-if="rangeErrorMsg" class="range-error-text">⚠️ {{ rangeErrorMsg }}</p>
      </section>

      <!-- 2. 碳排摘要與生活化指標換算（對應 4.1.1.2.1 欄位 A） -->
      <section class="summary-grid">
        <div class="kpi-card highlight-green">
          <span class="kpi-label">區間總碳排放量</span>
          <strong class="kpi-value">{{ totalCarbonKg.toFixed(2) }} <small>kg CO₂e</small></strong>
          <span class="kpi-sub">含隱形碳成本 {{ hiddenCarbonKg.toFixed(2) }} kg</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">相當於家庭用電</span>
          <strong class="kpi-value">{{ equivalentElectricityKwh }} <small>度</small></strong>
          <span class="kpi-sub">依經濟部電力排碳係數 0.495 換算</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">高碳排／待確認品項</span>
          <strong class="kpi-value">{{ highCarbonCount }} <small>項</small></strong>
          <span class="kpi-sub">估算品項（信心 &lt; 0.75）：{{ estimatedCount }} 項</span>
        </div>
      </section>

      <!-- 無資料提示（對應 4.1.1.2.1 例外狀況） -->
      <section v-if="filteredCarbonRecords.length === 0" class="empty-card">
        <p>{{ isLoading ? '正在彙整碳足跡數據...' : '所選時間區段內尚無發票或餐點碳排紀錄' }}</p>
        <button class="primary-btn" @click="$router.push('/dashboard')">前往掃描發票或新增餐點</button>
      </section>

      <template v-else>
        <!-- 3. 類別佔比圓餅圖（對應 4.1.1.2.1 欄位 B） -->
        <section class="chart-card">
          <div class="card-header-row">
            <h3>📊 消費類別碳排佔比</h3>
            <span class="badge-pill">共 {{ filteredCarbonRecords.length }} 筆明細</span>
          </div>

          <div class="pie-layout">
            <div class="donut-chart" :style="{ background: donutGradientStyle }">
              <div class="donut-hole">
                <span class="hole-title">總碳排</span>
                <strong class="hole-val">{{ totalCarbonKg.toFixed(1) }} kg</strong>
              </div>
            </div>

            <div class="pie-legend-list">
              <div
                v-for="cat in categoryBreakdown"
                :key="cat.name"
                class="legend-item"
              >
                <div class="legend-left">
                  <span class="color-dot" :style="{ backgroundColor: cat.color }"></span>
                  <span class="legend-name">{{ cat.name }}</span>
                </div>
                <div class="legend-right">
                  <strong>{{ cat.kg.toFixed(2) }} kg</strong>
                  <span class="legend-pct">({{ cat.percent }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. 各週比較長條圖 ＆ 每日趨勢折線圖（對應 4.1.1.2.1 欄位 C & D） -->
        <section class="chart-card">
          <div class="card-header-row">
            <h3>📈 碳排週比較與每日趨勢</h3>
            <div class="chart-switch">
              <button
                :class="{ active: trendChartType === 'bar' }"
                @click="trendChartType = 'bar'"
              >
                各週長條圖
              </button>
              <button
                :class="{ active: trendChartType === 'line' }"
                @click="trendChartType = 'line'"
              >
                每日折線圖
              </button>
            </div>
          </div>

          <!-- 各週長條圖 -->
          <div v-if="trendChartType === 'bar'" class="bar-chart-box">
            <div
              v-for="w in weeklyComparison"
              :key="w.label"
              class="bar-col"
            >
              <span class="bar-val">{{ w.kg.toFixed(1) }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ height: `${w.heightPct}%` }"
                ></div>
              </div>
              <span class="bar-label">{{ w.label }}</span>
            </div>
          </div>

          <!-- 每日趨勢折線圖 (SVG) -->
          <div v-else class="line-chart-box">
            <svg viewBox="0 0 360 150" class="trend-svg">
              <line x1="24" y1="125" x2="345" y2="125" stroke="#d1d5db" stroke-width="1.5" />
              <line x1="24" y1="15" x2="24" y2="125" stroke="#d1d5db" stroke-width="1.5" />
              <polyline
                v-if="dailySvgPoints"
                fill="none"
                stroke="#059669"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="dailySvgPoints"
              />
              <g v-for="(pt, idx) in dailyTrendNodes" :key="idx">
                <circle :cx="pt.x" :cy="pt.y" r="4.5" fill="#047857" stroke="#ffffff" stroke-width="1.5" />
                <text :x="pt.x" :y="pt.y - 8" text-anchor="middle" font-size="9" fill="#374151">
                  {{ pt.kg.toFixed(1) }}
                </text>
                <text :x="pt.x" y="140" text-anchor="middle" font-size="9" fill="#6b7280">
                  {{ pt.shortDate }}
                </text>
              </g>
            </svg>
          </div>
        </section>

        <!-- 5. 碳排明細與信心分數列表（對應 4.1.1.2.2） -->
        <section class="chart-card">
          <div class="card-header-row">
            <h3>🧾 碳排明細與 AI 語意對齊依據</h3>
            <label class="only-est-toggle">
              <input type="checkbox" v-model="onlyLowConfidence" />
              <span>僅看估算品項 (&lt;0.75)</span>
            </label>
          </div>

          <div class="detail-table-wrap">
            <table class="carbon-detail-table">
              <thead>
                <tr>
                  <th>原始品名</th>
                  <th>對齊標準名稱</th>
                  <th>碳係數</th>
                  <th>碳排量</th>
                  <th>信心分數</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in displayedDetailRows"
                  :key="row.uid"
                  class="clickable-row"
                  @click="selectedDetailRow = row"
                >
                  <td>
                    <div class="raw-name">{{ row.raw_name }}</div>
                    <small class="source-mini">{{ row.date }} · {{ row.source_badge }}</small>
                  </td>
                  <td>{{ row.standard_name }}</td>
                  <td class="num-col">{{ row.unit_factor.toFixed(2) }}</td>
                  <td class="num-col"><strong>{{ row.carbon_kg.toFixed(2) }}</strong> kg</td>
                  <td>
                    <span
                      class="conf-badge"
                      :class="row.confidence < 0.75 ? 'is-estimated' : 'is-verified'"
                    >
                      {{ row.confidence.toFixed(2) }}
                      <template v-if="row.confidence < 0.75"> 估算</template>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="table-hint">💡 點擊任一列可檢視係數來源說明，或手動校正標準分類</p>
        </section>
      </template>
    </main>

    <!-- 係數來源與手動校正彈窗（對應 4.1.1.2.2 & 2.2.3 手動校正） -->
    <div v-if="selectedDetailRow" class="modal-overlay" @click.self="selectedDetailRow = null">
      <div class="modal-card">
        <h4>🔍 碳排推估依據與手動校正</h4>

        <div class="info-box">
          <p><strong>原始品名：</strong>{{ selectedDetailRow.raw_name }}（數量：{{ selectedDetailRow.quantity }}）</p>
          <p><strong>目前對齊：</strong>{{ selectedDetailRow.standard_name }}</p>
          <p><strong>單位碳係數：</strong>{{ selectedDetailRow.unit_factor.toFixed(4) }} kg CO₂e</p>
          <p><strong>推估碳排量：</strong>{{ selectedDetailRow.carbon_kg.toFixed(4) }} kg CO₂e</p>
          <p>
            <strong>信心分數：</strong>{{ selectedDetailRow.confidence.toFixed(2) }}
            <span v-if="selectedDetailRow.confidence < 0.75" class="warn-tag">（低於 0.75，目前採類別平均估算）</span>
          </p>
          <p><strong>係數來源：</strong>{{ selectedDetailRow.factor_source }}</p>
        </div>

        <div class="correct-box">
          <label>手動校正標準碳係數類別：</label>
          <select v-model="selectedCorrectionKey" class="select-control">
            <option
              v-for="opt in STANDARD_FACTOR_OPTIONS"
              :key="opt.standard_name"
              :value="opt.standard_name"
            >
              {{ opt.standard_name }}（{{ opt.unit_factor }} kg CO₂e / {{ opt.category }}）
            </option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="selectedDetailRow = null">關閉</button>
          <button class="primary-btn" @click="applyManualCorrection">確認校正</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

// 預設對照環境部產品碳足跡常見標準係數庫（前端離線備援與手動校正選項）
const STANDARD_FACTOR_OPTIONS = [
  { standard_name: '包裝茶飲料', category: '食品飲料', unit_factor: 0.45, source: '環境部產品碳足跡資訊網（包裝茶飲類）' },
  { standard_name: '含乳冷熱飲品', category: '食品飲料', unit_factor: 1.10, source: '環境部產品碳足跡資訊網（含乳咖啡/奶茶）' },
  { standard_name: '米飯類食品', category: '食品飲料', unit_factor: 0.85, source: '環境部產品碳足跡資訊網（鮮食米飯類）' },
  { standard_name: '牛肉餐食製品', category: '食品飲料', unit_factor: 4.80, source: 'LCA 生命週期評估資料庫（紅肉類）' },
  { standard_name: '豬肉餐食製品', category: '食品飲料', unit_factor: 1.95, source: 'LCA 生命週期評估資料庫（白肉/豬肉類）' },
  { standard_name: '禽肉餐食製品', category: '食品飲料', unit_factor: 1.25, source: 'LCA 生命週期評估資料庫（雞肉類）' },
  { standard_name: '蔬食與穀物類', category: '食品飲料', unit_factor: 0.42, source: '環境部產品碳足跡資訊網（農產蔬食類）' },
  { standard_name: '瓶裝飲用水', category: '包裝耗材', unit_factor: 0.32, source: '環境部產品碳足跡資訊網（PET瓶裝水）' },
  { standard_name: '一次性包裝與袋材', category: '包裝耗材', unit_factor: 0.28, source: '環境部產品碳足跡資訊網（塑膠/紙容器）' },
  { standard_name: '清潔與個人日用品', category: '日用品', unit_factor: 0.95, source: '環境部產品碳足跡資訊網（家用品類）' },
  { standard_name: '一般綜合消費（類別平均）', category: '日用品', unit_factor: 0.75, source: '系統類別平均備援係數（估算）' }
]

const rangeMode = ref('month')
const startDate = ref('')
const endDate = ref('')
const rangeErrorMsg = ref('')
const isLoading = ref(false)
const trendChartType = ref('bar')
const onlyLowConfidence = ref(false)

const allCarbonRecords = ref([])
const selectedDetailRow = ref(null)
const selectedCorrectionKey = ref('')

watch(selectedDetailRow, (row) => {
  if (row) {
    selectedCorrectionKey.value = row.standard_name
  }
})

const formatIsoDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const switchRangeMode = (mode) => {
  rangeMode.value = mode
  rangeErrorMsg.value = ''
  const now = new Date()
  if (mode === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    startDate.value = formatIsoDate(start)
    endDate.value = formatIsoDate(now)
  } else if (mode === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = formatIsoDate(start)
    endDate.value = formatIsoDate(now)
  }
}

const applyDateFilter = () => {
  rangeErrorMsg.value = ''
  if (!startDate.value || !endDate.value) {
    rangeErrorMsg.value = '請完整選擇起始日期與結束日期'
    return
  }
  if (endDate.value < startDate.value) {
    rangeErrorMsg.value = '結束日期不可早於起始日期'
  }
}

// 關鍵字規則語意推估（當後端尚未回傳 AI 對齊欄位時自動補齊）
const inferSemanticMatch = (rawName, isMealIngredient = false) => {
  const name = String(rawName || '').trim()
  if (/牛|steak|漢堡排/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[3], confidence: 0.89 }
  }
  if (/豬|排骨|控肉|培根|火腿/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[4], confidence: 0.88 }
  }
  if (/雞|鴨|鵝|卡啦/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[5], confidence: 0.86 }
  }
  if (/拿鐵|鮮奶|牛奶|奶茶|優酪|豆漿/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[1], confidence: 0.87 }
  }
  if (/茶|紅茶|綠茶|烏龍|青茶|咖啡|美式/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[0], confidence: 0.92 }
  }
  if (/飯|御飯糰|便當|麵|吐司|麵包/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[2], confidence: 0.81 }
  }
  if (/菜|果|沙拉|玉米|地瓜|蛋/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[6], confidence: 0.84 }
  }
  if (/水|礦泉水/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[7], confidence: 0.91 }
  }
  if (/袋|杯|餐具|衛生紙|紙巾/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[8], confidence: 0.78 }
  }
  if (/洗|牙|沐浴|清潔|皂/.test(name)) {
    return { ...STANDARD_FACTOR_OPTIONS[9], confidence: 0.79 }
  }
  return {
    ...STANDARD_FACTOR_OPTIONS[10],
    confidence: isMealIngredient ? 0.72 : 0.61
  }
}

const normalizeDateDash = (str) => {
  return String(str || '').trim().replaceAll('/', '-').slice(0, 10)
}

const loadCarbonData = async () => {
  isLoading.value = true
  const phone = (localStorage.getItem('user_phone') || '').trim()
  const rows = []

  // 1. 優先嘗試從後端讀取發票明細（含未來 AI 對齊欄位）
  let invoices = []
  if (phone) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices?phone=${encodeURIComponent(phone)}`)
      if (res.ok) {
        const result = await res.json()
        if (result?.status === 'success' && Array.isArray(result.data)) {
          invoices = result.data
        }
      }
    } catch {
      // 忽略網路例外
    }
  }

  invoices.forEach((inv, invIdx) => {
    const dateDash = normalizeDateDash(inv.purchase_date)
    const items = Array.isArray(inv.items) ? inv.items : []
    items.forEach((it, itemIdx) => {
      const amt = Number(it.amount || 0)
      if (amt <= 0) return
      const qty = Math.max(1, Number(it.quantity || 1))
      const matched = inferSemanticMatch(it.item_name, false)
      const unitFactor = Number(it.unit_factor ?? matched.unit_factor)
      const confidence = Number(it.confidence ?? matched.confidence)

      rows.push({
        uid: `inv-${inv.id || invIdx}-${itemIdx}`,
        date: dateDash,
        source_badge: '發票',
        raw_name: it.item_name,
        quantity: qty,
        category: it.category || matched.category,
        standard_name: it.standard_name || matched.standard_name,
        unit_factor: unitFactor,
        carbon_kg: Number((qty * unitFactor).toFixed(4)),
        confidence,
        factor_source: it.factor_source || matched.source
      })
    })
  })

  // 2. 讀取本地餐點紀錄（carbon_meal_records_<phone>）
  try {
    const rawMeals = localStorage.getItem(`carbon_meal_records_${phone || 'guest'}`)
    const meals = rawMeals ? JSON.parse(rawMeals) : []
    if (Array.isArray(meals)) {
      meals.forEach((meal, mIdx) => {
        const dateDash = normalizeDateDash(meal.created_date)
        const ings = Array.isArray(meal.ingredients) ? meal.ingredients : []
        ings.forEach((ing, iIdx) => {
          const portion = Number(ing.portion_amount || 0)
          if (portion <= 0) return
          // 若單位為 g，以每 150g 換算為 1 基準份量計算係數
          const equivQty = ing.unit === 'g' ? Number((portion / 150).toFixed(2)) : portion
          const matched = inferSemanticMatch(ing.ingredient_name, true)
          rows.push({
            uid: `meal-${meal.record_id || mIdx}-${iIdx}`,
            date: dateDash,
            source_badge: `餐點(${meal.meal_name})`,
            raw_name: `${ing.ingredient_name} (${portion}${ing.unit})`,
            quantity: equivQty,
            category: matched.category,
            standard_name: matched.standard_name,
            unit_factor: matched.unit_factor,
            carbon_kg: Number((equivQty * matched.unit_factor).toFixed(4)),
            confidence: matched.confidence,
            factor_source: matched.source
          })
        })
      })
    }
  } catch {
    // 忽略解析例外
  }

  allCarbonRecords.value = rows.sort((a, b) => b.date.localeCompare(a.date))
  isLoading.value = false
}

const filteredCarbonRecords = computed(() => {
  if (!startDate.value || !endDate.value || endDate.value < startDate.value) {
    return allCarbonRecords.value
  }
  return allCarbonRecords.value.filter(
    (r) => r.date >= startDate.value && r.date <= endDate.value
  )
})

const totalCarbonKg = computed(() => {
  return filteredCarbonRecords.value.reduce((sum, r) => sum + Number(r.carbon_kg || 0), 0)
})

// 隱形碳成本（供應鏈上游間接排放約佔生命週期 34%）
const hiddenCarbonKg = computed(() => {
  return Number((totalCarbonKg.value * 0.34).toFixed(2))
})

// 生活化指標換算：台灣家庭用電排碳係數約 0.495 kg CO2e / 度
const equivalentElectricityKwh = computed(() => {
  return Math.round(totalCarbonKg.value / 0.495)
})

const highCarbonCount = computed(() => {
  return filteredCarbonRecords.value.filter((r) => r.carbon_kg >= 1.5).length
})

const estimatedCount = computed(() => {
  return filteredCarbonRecords.value.filter((r) => r.confidence < 0.75).length
})

const categoryBreakdown = computed(() => {
  const palette = {
    食品飲料: '#10b981',
    日用品: '#f59e0b',
    包裝耗材: '#3b82f6'
  }
  const totals = { 食品飲料: 0, 日用品: 0, 包裝耗材: 0 }
  filteredCarbonRecords.value.forEach((r) => {
    const key = totals[r.category] !== undefined ? r.category : '日用品'
    totals[key] += Number(r.carbon_kg || 0)
  })
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  return Object.keys(totals).map((name) => ({
    name,
    kg: totals[name],
    percent: Math.round((totals[name] / grandTotal) * 100),
    color: palette[name]
  }))
})

const donutGradientStyle = computed(() => {
  let acc = 0
  const segments = categoryBreakdown.value.map((c) => {
    const start = acc
    acc += c.percent
    return `${c.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${segments.join(', ')})`
})

const weeklyComparison = computed(() => {
  const buckets = [
    { label: '第1週', kg: 0 },
    { label: '第2週', kg: 0 },
    { label: '第3週', kg: 0 },
    { label: '第4週', kg: 0 },
    { label: '第5週', kg: 0 }
  ]
  filteredCarbonRecords.value.forEach((r) => {
    const dayNum = Number(r.date.slice(8, 10)) || 1
    const idx = Math.min(4, Math.floor((dayNum - 1) / 7))
    buckets[idx].kg += Number(r.carbon_kg || 0)
  })
  const maxKg = Math.max(...buckets.map((b) => b.kg), 1)
  return buckets.map((b) => ({
    ...b,
    heightPct: Math.max(8, Math.round((b.kg / maxKg) * 100))
  }))
})

const dailyTrendNodes = computed(() => {
  const map = new Map()
  filteredCarbonRecords.value.forEach((r) => {
    map.set(r.date, (map.get(r.date) || 0) + Number(r.carbon_kg || 0))
  })
  const sortedDates = Array.from(map.keys()).sort().slice(-7)
  if (sortedDates.length === 0) return []
  const values = sortedDates.map((d) => map.get(d))
  const maxVal = Math.max(...values, 1)
  const stepX = sortedDates.length > 1 ? 290 / (sortedDates.length - 1) : 0

  return sortedDates.map((d, idx) => ({
    date: d,
    shortDate: d.slice(5),
    kg: map.get(d),
    x: Math.round(40 + idx * stepX),
    y: Math.round(115 - (map.get(d) / maxVal) * 85)
  }))
})

const dailySvgPoints = computed(() => {
  return dailyTrendNodes.value.map((n) => `${n.x},${n.y}`).join(' ')
})

const displayedDetailRows = computed(() => {
  if (!onlyLowConfidence.value) return filteredCarbonRecords.value
  return filteredCarbonRecords.value.filter((r) => r.confidence < 0.75)
})

const applyManualCorrection = () => {
  if (!selectedDetailRow.value) return
  const chosen = STANDARD_FACTOR_OPTIONS.find(
    (o) => o.standard_name === selectedCorrectionKey.value
  )
  if (!chosen) return

  selectedDetailRow.value.standard_name = chosen.standard_name
  selectedDetailRow.value.category = chosen.category
  selectedDetailRow.value.unit_factor = chosen.unit_factor
  selectedDetailRow.value.carbon_kg = Number(
    (selectedDetailRow.value.quantity * chosen.unit_factor).toFixed(4)
  )
  selectedDetailRow.value.confidence = 1.0
  selectedDetailRow.value.factor_source = `${chosen.source}（使用者手動校正）`
  selectedDetailRow.value = null
}

onMounted(async () => {
  switchRangeMode('month')
  await loadCarbonData()
})
</script>

<style scoped>
.ledger-container {
  min-height: 100vh;
  background-color: #064e3b;
  color: #1f2937;
  padding: 1rem 1rem 3rem 1rem;
  font-family: sans-serif;
  box-sizing: border-box;
}

.ledger-top-bar {
  max-width: 900px;
  margin: 0 auto 1.25rem auto;
  background-color: #3e2723;
  border: 1px solid #5d4037;
  color: #ffffff;
  border-radius: 20px;
  padding: 0.9rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
}

.bar-title {
  font-size: 1.08rem;
  font-weight: 700;
}

.back-btn,
.advice-shortcut-btn {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fef3c7;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
}

.ledger-main {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.filter-card,
.chart-card,
.empty-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
}

.period-mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.mode-tab-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
}

.mode-tab-btn.active {
  background-color: #059669;
  border-color: #059669;
  color: #ffffff;
}

.date-range-row {
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.date-input-group {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input-group label {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 600;
}

.date-control {
  height: 40px;
  padding: 0 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
}

.range-sep {
  padding-bottom: 0.55rem;
  color: #6b7280;
  font-weight: 700;
}

.query-btn {
  height: 40px;
  padding: 0 1.2rem;
  border: none;
  border-radius: 10px;
  background-color: #3e2723;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

.range-error-text {
  margin: 0.6rem 0 0 0;
  font-size: 0.82rem;
  color: #dc2626;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  background-color: #ffffff;
  border-radius: 18px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
}

.kpi-card.highlight-green {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1.5px solid #10b981;
}

.kpi-label {
  font-size: 0.82rem;
  color: #4b5563;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #065f46;
}

.kpi-value small {
  font-size: 0.85rem;
  font-weight: 700;
}

.kpi-sub {
  font-size: 0.75rem;
  color: #6b7280;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.card-header-row h3 {
  margin: 0;
  font-size: 1.02rem;
  color: #111827;
}

.badge-pill {
  background-color: #ecfdf5;
  color: #047857;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
}

.pie-layout {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.donut-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.donut-hole {
  width: 92px;
  height: 92px;
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hole-title {
  font-size: 0.72rem;
  color: #6b7280;
}

.hole-val {
  font-size: 0.98rem;
  color: #111827;
}

.pie-legend-list {
  flex: 1;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0.75rem;
  background-color: #f9fafb;
  border-radius: 10px;
}

.legend-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.legend-pct {
  font-size: 0.8rem;
  color: #6b7280;
  margin-left: 0.3rem;
}

.chart-switch {
  display: flex;
  gap: 0.35rem;
}

.chart-switch button {
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.chart-switch button.active {
  background: #059669;
  color: #ffffff;
  border-color: #059669;
}

.bar-chart-box {
  height: 165px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 0.65rem;
  padding-top: 1rem;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.bar-val {
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
}

.bar-track {
  width: 100%;
  max-width: 44px;
  height: 110px;
  background-color: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #10b981 0%, #047857 100%);
  border-radius: 8px 8px 0 0;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 0.78rem;
  color: #4b5563;
  font-weight: 600;
}

.line-chart-box {
  width: 100%;
  overflow-x: auto;
}

.trend-svg {
  width: 100%;
  max-height: 175px;
}

.only-est-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #4b5563;
  cursor: pointer;
}

.detail-table-wrap {
  overflow-x: auto;
}

.carbon-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.carbon-detail-table th {
  text-align: left;
  padding: 0.6rem 0.5rem;
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 700;
}

.carbon-detail-table td {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.clickable-row:hover {
  background-color: #f0fdf4;
}

.raw-name {
  font-weight: 700;
  color: #111827;
}

.source-mini {
  color: #6b7280;
  font-size: 0.74rem;
}

.num-col {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.conf-badge {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.conf-badge.is-verified {
  background-color: #d1fae5;
  color: #065f46;
}

.conf-badge.is-estimated {
  background-color: #fef3c7;
  color: #92400e;
}

.table-hint {
  margin: 0.75rem 0 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.empty-card {
  text-align: center;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}

.primary-btn {
  background-color: #059669;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 2000;
}

.modal-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 1.4rem;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.modal-card h4 {
  margin: 0;
  font-size: 1.08rem;
}

.info-box {
  background: #f9fafb;
  padding: 0.85rem;
  border-radius: 12px;
  font-size: 0.86rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.info-box p {
  margin: 0;
}

.warn-tag {
  color: #b45309;
  font-weight: 700;
}

.correct-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.86rem;
  font-weight: 600;
}

.select-control {
  height: 42px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  padding: 0 0.75rem;
  font-size: 0.88rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}
</style>