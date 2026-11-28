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
      <!-- 1. 選擇查看碳排時間區段 -->
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

      <!-- 2. 區間總碳排放量摘要 -->
      <section class="summary-single">
        <div class="kpi-card highlight-green">
          <span class="kpi-label">區間總碳排放量</span>
          <strong class="kpi-value">{{ totalCarbonKg.toFixed(2) }} <small>kg CO₂e</small></strong>
          <span class="kpi-sub">含隱形碳成本 {{ hiddenCarbonKg.toFixed(2) }} kg</span>
        </div>
      </section>

      <!-- 無資料提示 -->
      <section v-if="filteredCarbonRecords.length === 0" class="empty-card">
        <p>{{ isLoading ? '正在彙整碳足跡數據...' : '所選時間區段內尚無發票或餐點碳排紀錄' }}</p>
        <button class="primary-btn" @click="$router.push('/dashboard')">前往掃描發票或新增餐點</button>
      </section>

      <template v-else>
        <!-- 3. 類別佔比圓餅圖 -->
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

        <!-- 4. 碳排明細與信心分數列表 -->
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
                  <th class="col-raw">原始品名</th>
                  <th class="col-std">對齊標準名稱</th>
                  <th class="col-num">碳係數</th>
                  <th class="col-num">碳排量</th>
                  <th class="col-conf">信心分數</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in displayedDetailRows"
                  :key="row.uid"
                  class="clickable-row"
                  @click="selectedDetailRow = row"
                >
                  <td class="col-raw">
                    <div class="raw-name">{{ row.raw_name }}</div>
                    <small class="source-mini">{{ row.date }} · {{ row.source_badge }}</small>
                  </td>
                  <td class="col-std">{{ row.standard_name }}</td>
                  <td class="num-col">{{ row.unit_factor.toFixed(2) }}</td>
                  <td class="num-col"><strong>{{ row.carbon_kg.toFixed(2) }}</strong> kg</td>
                  <td class="col-conf">
                    <span
                      class="conf-badge"
                      :class="row.confidence < 0.75 || row.is_estimated ? 'is-estimated' : 'is-verified'"
                    >
                      {{ row.confidence.toFixed(2) }}
                      <template v-if="row.confidence < 0.75 || row.is_estimated"> 估算</template>
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

    <!-- 係數來源與手動校正彈窗 -->
    <div v-if="selectedDetailRow" class="modal-overlay" @click.self="selectedDetailRow = null">
      <div class="modal-card">
        <h4>🔍 碳排推估依據與手動校正</h4>

        <div class="info-box">
          <p><strong>原始品名：</strong>{{ selectedDetailRow.raw_name }}（數量：{{ selectedDetailRow.quantity }}）</p>
          <p><strong>目前對齊：</strong>{{ selectedDetailRow.standard_name }}</p>
          <p><strong>單位碳係數：</strong>{{ selectedDetailRow.unit_factor.toFixed(4) }} kg CO₂e / {{ selectedDetailRow.declared_unit }}</p>
          <p><strong>推估碳排量：</strong>{{ selectedDetailRow.carbon_kg.toFixed(4) }} kg CO₂e（隱形碳：{{ selectedDetailRow.hidden_carbon_cost_kg.toFixed(4) }} kg）</p>
          <p>
            <strong>信心分數：</strong>{{ selectedDetailRow.confidence.toFixed(2) }}
            <span v-if="selectedDetailRow.confidence < 0.75 || selectedDetailRow.is_estimated" class="warn-tag">
              （低於 0.75，目前採類別平均估算）
            </span>
          </p>
          <p><strong>係數來源：</strong>{{ selectedDetailRow.factor_source }}</p>
          <p v-if="selectedDetailRow.basis"><strong>計算依據：</strong>{{ selectedDetailRow.basis }}</p>
        </div>

        <div class="correct-box">
          <label for="correction-select">手動校正標準碳係數類別：</label>
          <select
            id="correction-select"
            v-model="selectedCorrectionKey"
            class="select-control"
          >
            <option
              v-for="opt in factorOptions"
              :key="opt.factor_code"
              :value="opt.factor_code"
            >
              {{ opt.factor_name }}（{{ opt.unit_factor }} kg CO₂e / {{ opt.declared_unit }} · {{ opt.category }}）
            </option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="selectedDetailRow = null">關閉</button>
          <button class="primary-btn" :disabled="isCorrecting" @click="applyManualCorrection">
            {{ isCorrecting ? '校正中...' : '確認校正' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://carbon-backend-production-fcf9bbe5.up.railway.app'
).replace(/\/+$/, '')

const FALLBACK_FACTOR_OPTIONS = [
  {
    factor_name: '一般綜合消費（類別平均）',
    factor_code: 'CFP-GEN-001',
    category: '日用品',
    category_key: 'living',
    unit_factor: 0.75,
    declared_unit: '件',
    hidden_ratio: 0.3,
    source: '系統類別平均備援係數（估算）'
  }
]

const rangeMode = ref('month')
const startDate = ref('')
const endDate = ref('')
const rangeErrorMsg = ref('')
const isLoading = ref(false)
const isCorrecting = ref(false)
const onlyLowConfidence = ref(false)

const factorOptions = ref(FALLBACK_FACTOR_OPTIONS)
const defaultHiddenRatio = ref(0.3)
const allCarbonRecords = ref([])
const selectedDetailRow = ref(null)
const selectedCorrectionKey = ref(FALLBACK_FACTOR_OPTIONS[0].factor_code)

const alignmentCache = new Map()

watch(selectedDetailRow, (row) => {
  if (row) {
    const matchedByCode = factorOptions.value.find((o) => o.factor_code === row.factor_code)
    const matchedByName = factorOptions.value.find((o) => o.factor_name === row.standard_name)
    const target = matchedByCode || matchedByName || factorOptions.value[0]
    selectedCorrectionKey.value = target ? target.factor_code : ''
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

const normalizeDateDash = (str) => {
  return String(str || '').trim().replaceAll('/', '-').slice(0, 10)
}

const isDiscountOrInvalidItem = (item) => {
  const name = String(item?.item_name || '').trim()
  const amt = Number(item?.amount || 0)
  if (!name || amt <= 0) return true
  if (item?.is_substantive === false) return true
  return /折扣|折讓|折抵|特價|調整|滿額贈|點數折/.test(name)
}

const resolveFallbackCategoryKey = (text = '', defaultKey = 'living') => {
  const s = String(text || '').toLowerCase()
  if (/茶|咖啡|拿鐵|奶茶|綠豆沙|可可|飲料|飲品|果汁|汽水|水|豆漿/.test(s)) {
    return 'beverage'
  }
  if (/筆電|手機|耳機|滑鼠|鍵盤|螢幕|充電器|3c|電子|平板|相機/.test(s)) {
    return 'electronics'
  }
  if (/捷運|公車|高鐵|火車|客運|加油|停車|uber|計程車|交通|票/.test(s)) {
    return 'transport'
  }
  if (/便當|餐|飯|麵|肉|蛋|菜|蔬|果|餅乾|麵包|零食|滷味|火鍋|食品|飲料/.test(s)) {
    return 'food'
  }
  return defaultKey
}

const normalizeDisplayCategory = (rawCat = '', fallbackKey = 'living') => {
  const s = String(rawCat || '').trim().toLowerCase()
  if (s.includes('食品') || s.includes('飲料') || s.includes('餐飲') || s === 'food' || s === 'beverage') {
    return '食品飲料'
  }
  if (s.includes('包裝') || s.includes('耗材') || s === 'packaging') {
    return '包裝耗材'
  }
  if (s.includes('日用') || s.includes('生活') || s.includes('交通') || s.includes('電子') || s === 'living') {
    return '日用品'
  }
  return fallbackKey === 'food' || fallbackKey === 'beverage' ? '食品飲料' : '日用品'
}

const loadFactorOptions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/carbon/factors`)
    if (!res.ok) return
    const data = await res.json()

    if (data?.carbon_split?.hidden_ratio !== undefined) {
      const hRatio = Number(data.carbon_split.hidden_ratio)
      if (!Number.isNaN(hRatio) && hRatio >= 0 && hRatio <= 1) {
        defaultHiddenRatio.value = hRatio
      }
    }

    if (Array.isArray(data?.factors) && data.factors.length > 0) {
      factorOptions.value = data.factors.map((f) => {
        const kg = Number(f.kg_co2e || 0)
        const hiddenKg = Number(f.hidden_supply_kg_co2e ?? kg * defaultHiddenRatio.value)
        return {
          factor_name: f.factor_name,
          factor_code: f.factor_code,
          category: f.category_label || '日用品',
          category_key: f.category_key || 'living',
          unit_factor: kg,
          declared_unit: f.declared_unit || '件',
          hidden_ratio: kg > 0 ? hiddenKg / kg : defaultHiddenRatio.value,
          source: f.source || '環境部產品碳足跡係數庫（MOENV CFP_P_02）'
        }
      })
    }
  } catch (err) {
    console.warn('載入後端碳係數清單失敗，使用備援選項：', err)
  }
}

const requestItemAlignment = async ({ itemName, quantity = 1, fallbackCategoryKey = 'food' }) => {
  const cleanQty = Math.max(0.01, Number(quantity || 1))
  const cacheKey = `${itemName}__${cleanQty}__${fallbackCategoryKey}`
  if (alignmentCache.has(cacheKey)) {
    return alignmentCache.get(cacheKey)
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/carbon/ai/align-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: itemName,
        quantity: cleanQty,
        fallback_category_key: fallbackCategoryKey
      })
    })

    if (res.ok) {
      const data = await res.json()
      const totalKg = Number(data.total_kg_co2e ?? data.kg_co2e ?? 0)
      const unitFactor = Number(data.unit_kg_co2e ?? data.kg_co2e ?? (cleanQty > 0 ? totalKg / cleanQty : 0))
      const hiddenKg = Number(data.hidden_carbon_cost_kg ?? totalKg * defaultHiddenRatio.value)
      const confidence = Number(data.confidence ?? 0)
      const standardName = data.factor_name || data.standard_name || '一般綜合消費（類別平均）'
      const factorCode = data.factor_code || null
      const category = normalizeDisplayCategory(
        data.category_label || data.category || '',
        fallbackCategoryKey
      )
      const sourceText = data.factor_source || data.source || (
        factorCode
          ? `環境部產品碳足跡係數庫（${factorCode}）`
          : '後端語意對齊／類別平均係數'
      )

      const mapped = {
        standard_name: standardName,
        factor_code: factorCode,
        category,
        unit_factor: Number(unitFactor.toFixed(4)),
        carbon_kg: Number(totalKg.toFixed(4)),
        hidden_carbon_cost_kg: Number(hiddenKg.toFixed(4)),
        declared_unit: data.declared_unit || '件',
        confidence,
        is_estimated: Boolean(data.is_estimated) || confidence < 0.75,
        factor_source: sourceText,
        basis: data.basis || ''
      }

      alignmentCache.set(cacheKey, mapped)
      return mapped
    }
  } catch (err) {
    console.warn('呼叫 /api/carbon/ai/align-item 失敗：', err)
  }

  const fallbackFactor = 0.75
  const fallbackTotal = Number((cleanQty * fallbackFactor).toFixed(4))
  const fallbackResult = {
    standard_name: '一般綜合消費（類別平均）',
    factor_code: 'CFP-GEN-001',
    category: normalizeDisplayCategory('', fallbackCategoryKey),
    unit_factor: fallbackFactor,
    carbon_kg: fallbackTotal,
    hidden_carbon_cost_kg: Number((fallbackTotal * defaultHiddenRatio.value).toFixed(4)),
    declared_unit: '件',
    confidence: 0.5,
    is_estimated: true,
    factor_source: '前端備援估算（後端暫時無法連線）',
    basis: '後端無法連線，採前端類別平均備援係數估算'
  }
  alignmentCache.set(cacheKey, fallbackResult)
  return fallbackResult
}

const buildIngredientQuery = (name, portion, unit) => {
  const cleanName = String(name || '').trim()
  const u = String(unit || '').trim()
  const uLower = u.toLowerCase()
  if (u === '公克' || u.includes('公克') || uLower === 'g' || uLower.includes('(g)')) {
    return { queryName: `${cleanName} ${portion}g`, queryQty: 1 }
  }
  if (u === '公斤' || u.includes('公斤') || uLower === 'kg' || uLower.includes('(kg)')) {
    return { queryName: `${cleanName} ${portion * 1000}g`, queryQty: 1 }
  }
  if (u === '毫升' || u.includes('毫升') || uLower === 'ml' || uLower.includes('(ml)')) {
    return { queryName: `${cleanName} ${portion}ml`, queryQty: 1 }
  }
  return { queryName: cleanName, queryQty: Math.max(0.01, portion) }
}

const loadCarbonData = async () => {
  isLoading.value = true
  const phone = (localStorage.getItem('user_phone') || '').trim()
  const alignmentTasks = []

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
    } catch (err) {
      console.warn('讀取發票清單失敗：', err)
    }
  }

  invoices.forEach((inv, invIdx) => {
    const dateDash = normalizeDateDash(inv.purchase_date)
    const items = Array.isArray(inv.items) ? inv.items : []
    items.forEach((it, itemIdx) => {
      if (isDiscountOrInvalidItem(it)) return
      const qty = Math.max(1, Number(it.quantity || 1))
      const fallbackCatKey = resolveFallbackCategoryKey(
        `${it.item_name || ''} ${inv.merchant_name || ''} ${inv.category_name || ''}`,
        'living'
      )

      alignmentTasks.push(
        requestItemAlignment({
          itemName: it.item_name,
          quantity: qty,
          fallbackCategoryKey: fallbackCatKey
        }).then((aligned) => ({
          uid: `inv-${inv.id || invIdx}-${itemIdx}`,
          date: dateDash,
          source_badge: inv.invoice_number ? `發票(${inv.invoice_number})` : '發票',
          raw_name: it.item_name,
          quantity: qty,
          category: aligned.category,
          standard_name: aligned.standard_name,
          factor_code: aligned.factor_code,
          unit_factor: aligned.unit_factor,
          carbon_kg: aligned.carbon_kg,
          hidden_carbon_cost_kg: aligned.hidden_carbon_cost_kg,
          declared_unit: aligned.declared_unit,
          confidence: aligned.confidence,
          is_estimated: aligned.is_estimated,
          factor_source: aligned.factor_source,
          basis: aligned.basis
        }))
      )
    })
  })

  try {
    const rawMeals = localStorage.getItem(`carbon_meal_records_${phone || 'guest'}`)
    const meals = rawMeals ? JSON.parse(rawMeals) : []
    if (Array.isArray(meals)) {
      meals.forEach((meal, mIdx) => {
        const dateDash = normalizeDateDash(meal.created_date)
        const ings = Array.isArray(meal.ingredients) ? meal.ingredients : []
        ings.forEach((ing, iIdx) => {
          const portion = Number(ing.portion_amount || 0)
          if (!ing.ingredient_name || portion <= 0) return

          const { queryName, queryQty } = buildIngredientQuery(
            ing.ingredient_name,
            portion,
            ing.unit || 'g'
          )
          const fallbackCatKey = resolveFallbackCategoryKey(ing.ingredient_name, 'food')

          alignmentTasks.push(
            requestItemAlignment({
              itemName: queryName,
              quantity: queryQty,
              fallbackCategoryKey: fallbackCatKey
            }).then((aligned) => ({
              uid: `meal-${meal.record_id || mIdx}-${iIdx}`,
              date: dateDash,
              source_badge: `餐點(${meal.meal_name || '自製'})`,
              raw_name: `${ing.ingredient_name} (${portion}${ing.unit || 'g'})`,
              quantity: queryQty,
              category: aligned.category,
              standard_name: aligned.standard_name,
              factor_code: aligned.factor_code,
              unit_factor: aligned.unit_factor,
              carbon_kg: aligned.carbon_kg,
              hidden_carbon_cost_kg: aligned.hidden_carbon_cost_kg,
              declared_unit: aligned.declared_unit,
              confidence: aligned.confidence,
              is_estimated: aligned.is_estimated,
              factor_source: aligned.factor_source,
              basis: aligned.basis
            }))
          )
        })
      })
    }
  } catch (err) {
    console.warn('讀取餐點紀錄失敗：', err)
  }

  const rows = await Promise.all(alignmentTasks)
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
  const sum = filteredCarbonRecords.value.reduce((sumVal, r) => sumVal + Number(r.carbon_kg || 0), 0)
  return Number(sum.toFixed(2))
})

const hiddenCarbonKg = computed(() => {
  const sum = filteredCarbonRecords.value.reduce(
    (acc, r) => acc + Number(r.hidden_carbon_cost_kg || 0),
    0
  )
  return Number(sum.toFixed(2))
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
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
  return Object.keys(totals).map((name) => {
    const kgVal = Number(totals[name].toFixed(2))
    const pct = grandTotal > 0 ? Number(((totals[name] / grandTotal) * 100).toFixed(1)) : 0
    return {
      name,
      kg: kgVal,
      percent: pct,
      color: palette[name]
    }
  })
})

const donutGradientStyle = computed(() => {
  let acc = 0
  const segments = categoryBreakdown.value.map((c) => {
    const start = acc
    acc += c.percent
    return `${c.color} ${start}% ${acc}%`
  })
  if (acc === 0) return 'conic-gradient(#e5e7eb 0% 100%)'
  return `conic-gradient(${segments.join(', ')})`
})

const displayedDetailRows = computed(() => {
  if (!onlyLowConfidence.value) return filteredCarbonRecords.value
  return filteredCarbonRecords.value.filter((r) => r.confidence < 0.75 || r.is_estimated)
})

const applyManualCorrection = async () => {
  if (!selectedDetailRow.value || isCorrecting.value) return
  const chosen = factorOptions.value.find(
    (o) => o.factor_code === selectedCorrectionKey.value
  )
  if (!chosen) return

  isCorrecting.value = true
  const row = selectedDetailRow.value
  const newCarbonKg = Number((row.quantity * chosen.unit_factor).toFixed(4))
  const newHiddenKg = Number((newCarbonKg * (chosen.hidden_ratio ?? defaultHiddenRatio.value)).toFixed(4))

  try {
    await fetch(`${API_BASE_URL}/api/carbon/ai/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: row.raw_name,
        factor_code: chosen.factor_code,
        category_key: chosen.category_key,
        custom_kg_co2e: chosen.unit_factor
      })
    })
  } catch (err) {
    console.warn('同步手動校正至後端失敗：', err)
  } finally {
    row.standard_name = chosen.factor_name
    row.factor_code = chosen.factor_code
    row.category = normalizeDisplayCategory(chosen.category, chosen.category_key)
    row.unit_factor = chosen.unit_factor
    row.carbon_kg = newCarbonKg
    row.hidden_carbon_cost_kg = newHiddenKg
    row.declared_unit = chosen.declared_unit || '件'
    row.confidence = 1.0
    row.is_estimated = false
    row.factor_source = `${chosen.source}（使用者手動校正）`
    row.basis = `使用者手動校正為 ${chosen.factor_name}（${chosen.unit_factor} kg CO2e / ${row.declared_unit}）× 數量 ${row.quantity}`
    alignmentCache.clear()
    isCorrecting.value = false
    selectedDetailRow.value = null
  }
}

onMounted(async () => {
  switchRangeMode('month')
  await loadFactorOptions()
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
  background-color: #ffffff;
  color: #111827;
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

.summary-single {
  display: block;
}

.kpi-card {
  background-color: #ffffff;
  border-radius: 18px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
}

.kpi-card.highlight-green {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1.5px solid #10b981;
}

.kpi-label {
  font-size: 0.85rem;
  color: #4b5563;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.65rem;
  font-weight: 800;
  color: #065f46;
}

.kpi-value small {
  font-size: 0.9rem;
  font-weight: 700;
}

.kpi-sub {
  font-size: 0.78rem;
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

.only-est-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #4b5563;
  cursor: pointer;
}

.detail-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.carbon-detail-table {
  width: 100%;
  min-width: 540px;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.carbon-detail-table th {
  text-align: left;
  padding: 0.6rem 0.55rem;
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 700;
  white-space: nowrap;
}

.carbon-detail-table td {
  padding: 0.65rem 0.55rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.col-raw {
  min-width: 120px;
  word-break: break-word;
}

.col-std {
  min-width: 130px;
  line-height: 1.4;
  word-break: break-word;
}

.col-conf {
  white-space: nowrap;
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
  color: #111827;
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
  color: #111827;
}

.info-box {
  background: #f9fafb;
  color: #1f2937;
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
  color: #111827;
}

.select-control {
  height: 42px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  padding: 0 0.75rem;
  font-size: 0.88rem;
  background-color: #ffffff;
  color: #111827;
}

.select-control option {
  background-color: #ffffff;
  color: #111827;
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