<script setup>
/**
 * 셀러 대시보드 화면.
 * mock-server seller API를 기준으로 KPI, 추이 차트, 도넛 차트, 하단 테이블 레이아웃을 구성한다.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getSellerChannelOrders } from '@/api/integration.js'
import { getSellerOrderList } from '@/api/order.js'
import { getSellerAsnList, getSellerInventoryList } from '@/api/wms.js'
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'
import SellerInventoryDetailModal from '@/components/seller/SellerInventoryDetailModal.vue'
import SellerOrderDetailModal from '@/components/seller/SellerOrderDetailModal.vue'
import {
  buildSellerDashboardInboundRows,
  buildSellerDashboardKpiCards,
  buildSellerDashboardRecentActivityRows,
  buildSellerDashboardStockRatio,
  buildSellerDashboardTrendSeries,
  buildSellerDashboardDonutSegments,
  buildSellerDashboardTrendChart,
  buildSellerDashboardViewState,
  SELLER_DASHBOARD_PERIOD_OPTIONS,
} from '@/utils/seller/sellerDashboard.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '대시보드' }]
const activePeriod = ref('month')
const router = useRouter()
const isDashboardLoading = ref(false)
const dashboardErrorMessage = ref('')
const sellerOrderRows = ref([])
const sellerAsnRows = ref([])
const sellerInventoryRows = ref([])
const sellerChannelOrderRows = ref([])
const selectedRecentOrder = ref(null)
const selectedRecentOrderDetail = ref(null)
const isRecentOrderDetailOpen = ref(false)
const selectedInboundInventory = ref(null)
const selectedInboundInventoryDetail = ref(null)
const isInboundInventoryDetailOpen = ref(false)

const dashboardKpiCards = computed(() => {
  return buildSellerDashboardKpiCards({
    inventoryRows: sellerInventoryRows.value,
    orderRows: sellerOrderRows.value,
    channelOrderRows: sellerChannelOrderRows.value,
  })
})
const newOrdersCard = computed(() => {
  return dashboardKpiCards.value.find((card) => card.key === 'new-orders') ?? null
})
const outboundStatusCard = computed(() => {
  return dashboardKpiCards.value.find((card) => card.key === 'outbound-status') ?? null
})
const availableStockCard = computed(() => {
  return dashboardKpiCards.value.find((card) => card.key === 'available-stock') ?? null
})
const lowStockCard = computed(() => {
  return dashboardKpiCards.value.find((card) => card.key === 'low-stock') ?? null
})
const inventorySummaryRouteName = computed(() => {
  return lowStockCard.value?.routeName ?? availableStockCard.value?.routeName ?? null
})
const dashboardTrendSeries = computed(() => {
  return buildSellerDashboardTrendSeries({
    orderRows: sellerOrderRows.value,
    channelOrderRows: sellerChannelOrderRows.value,
  })
})
const currentTrendSeries = computed(() => {
  return dashboardTrendSeries.value[activePeriod.value] ?? dashboardTrendSeries.value.month
})
const trendChart = computed(() => {
  return buildSellerDashboardTrendChart(currentTrendSeries.value.points, {
    maxValue: currentTrendSeries.value.maxValue,
  })
})
const stockRatio = computed(() => {
  return buildSellerDashboardStockRatio({
    inventoryRows: sellerInventoryRows.value,
  })
})
const recentActivityRows = computed(() => {
  return buildSellerDashboardRecentActivityRows({
    orderRows: sellerOrderRows.value,
    channelOrderRows: sellerChannelOrderRows.value,
    asnRows: sellerAsnRows.value,
    inventoryRows: sellerInventoryRows.value,
  })
})
const inboundRows = computed(() => {
  return buildSellerDashboardInboundRows({
    asnRows: sellerAsnRows.value,
    inventoryRows: sellerInventoryRows.value,
  })
})
const dashboardViewState = computed(() => {
  return buildSellerDashboardViewState({
    kpiCards: dashboardKpiCards.value,
    trendSeries: currentTrendSeries.value,
    recentActivityRows: recentActivityRows.value,
    inboundRows: inboundRows.value,
    isLoading: isDashboardLoading.value,
    errorMessage: dashboardErrorMessage.value,
  })
})
const donutSegments = computed(() => buildSellerDashboardDonutSegments(stockRatio.value))
const donutTotal = computed(() => {
  return stockRatio.value.reduce((sum, item) => sum + Number(item.value || 0), 0)
})

async function fetchSellerDashboardData() {
  isDashboardLoading.value = true
  dashboardErrorMessage.value = ''

  try {
    const [ordersRes, asnsRes, inventoriesRes, channelOrdersRes] = await Promise.all([
      getSellerOrderList(),
      getSellerAsnList(),
      getSellerInventoryList(),
      getSellerChannelOrders(),
    ])

    sellerOrderRows.value = Array.isArray(ordersRes.data?.data)
      ? ordersRes.data.data.map((row) => ({ ...row }))
      : []
    sellerAsnRows.value = Array.isArray(asnsRes.data?.data)
      ? asnsRes.data.data.map((row) => ({ ...row }))
      : []
    sellerInventoryRows.value = Array.isArray(inventoriesRes.data?.data)
      ? inventoriesRes.data.data.map((row) => ({ ...row }))
      : []
    sellerChannelOrderRows.value = Array.isArray(channelOrdersRes.data?.data)
      ? channelOrdersRes.data.data.map((row) => ({ ...row }))
      : []
  } catch (error) {
    console.error('[SellerDashboardView] fetch error:', error)
    dashboardErrorMessage.value = '대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    sellerOrderRows.value = []
    sellerAsnRows.value = []
    sellerInventoryRows.value = []
    sellerChannelOrderRows.value = []
  } finally {
    isDashboardLoading.value = false
  }
}

onMounted(fetchSellerDashboardData)

function navigateToRoute(name) {
  if (!name) return
  router.push({ name })
}

function handleRecentActivityCodeClick(row) {
  if (row.type === '주문' && row.order) {
    selectedRecentOrder.value = row.order
    selectedRecentOrderDetail.value = row.orderDetail
    isRecentOrderDetailOpen.value = true
    return
  }

  navigateToRoute(row.routeName)
}

function handleCloseRecentOrderDetail() {
  isRecentOrderDetailOpen.value = false
  selectedRecentOrder.value = null
  selectedRecentOrderDetail.value = null
}

function handleInboundSkuClick(row) {
  if (!row.inventory) {
    navigateToRoute(row.routeName)
    return
  }

  selectedInboundInventory.value = row.inventory
  selectedInboundInventoryDetail.value = row.inventoryDetail
  isInboundInventoryDetailOpen.value = true
}

function handleCloseInboundInventoryDetail() {
  isInboundInventoryDetailOpen.value = false
  selectedInboundInventory.value = null
  selectedInboundInventoryDetail.value = null
}

function handleRetryDashboard() {
  fetchSellerDashboardData()
}
</script>

<template>
  <AppLayout title="대시보드" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ASN_CREATE }" class="ui-btn ui-btn--ghost">ASN 등록</RouterLink>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ORDER_REGISTER }" class="ui-btn ui-btn--primary">주문 등록</RouterLink>
    </template>

    <section class="seller-dashboard">
      <section v-if="dashboardViewState.isLoading" class="dashboard-state">
        <p class="dashboard-state__eyebrow">Loading</p>
        <strong class="dashboard-state__title">대시보드 데이터를 불러오는 중입니다.</strong>
        <p class="dashboard-state__copy">Seller 운영 현황을 정리하는 동안 잠시만 기다려주세요.</p>
      </section>

      <section v-else-if="dashboardViewState.hasError" class="dashboard-state dashboard-state--error">
        <p class="dashboard-state__eyebrow">Load Failed</p>
        <strong class="dashboard-state__title">대시보드 데이터를 불러오지 못했습니다.</strong>
        <p class="dashboard-state__copy">{{ dashboardViewState.errorMessage }}</p>
        <button type="button" class="ui-btn ui-btn--ghost" @click="handleRetryDashboard">다시 불러오기</button>
      </section>

      <section v-else-if="dashboardViewState.isEmpty" class="dashboard-state">
        <p class="dashboard-state__eyebrow">No Data</p>
        <strong class="dashboard-state__title">표시할 운영 데이터가 없습니다.</strong>
        <p class="dashboard-state__copy">주문 등록 또는 ASN 등록 후 운영 현황을 이 화면에서 확인할 수 있습니다.</p>
      </section>

      <template v-else>
        <section class="kpi-grid">
          <button
            v-if="newOrdersCard"
            type="button"
            class="dashboard-card kpi-card kpi-card--interactive"
            @click="navigateToRoute(newOrdersCard.routeName)"
          >
            <div class="kpi-card-head">
              <span class="kpi-label">{{ newOrdersCard.label }}</span>
              <span class="kpi-icon" :class="`kpi-icon--${newOrdersCard.tone}`" />
            </div>

            <strong class="kpi-value">{{ newOrdersCard.value }}</strong>

            <div class="kpi-meta">
              <span
                v-if="newOrdersCard.trend"
                class="kpi-trend"
                :class="`kpi-trend--${newOrdersCard.trendTone}`"
              >
                {{ newOrdersCard.trend }}
              </span>
              <span class="kpi-sub">{{ newOrdersCard.subtext }}</span>
            </div>
          </button>

          <button
            v-if="outboundStatusCard"
            type="button"
            class="dashboard-card kpi-card kpi-card--interactive"
            @click="navigateToRoute(outboundStatusCard.routeName)"
          >
            <div class="kpi-card-head">
              <span class="kpi-label">{{ outboundStatusCard.label }}</span>
              <span class="kpi-icon" :class="`kpi-icon--${outboundStatusCard.tone}`" />
            </div>

            <strong class="kpi-value">{{ outboundStatusCard.value }}</strong>

            <div class="kpi-meta">
              <span class="kpi-sub">{{ outboundStatusCard.subtext }}</span>
            </div>
          </button>

          <button
            v-if="availableStockCard || lowStockCard"
            type="button"
            class="dashboard-card kpi-card kpi-card--interactive kpi-card--split"
            @click="navigateToRoute(inventorySummaryRouteName)"
          >
            <div v-if="availableStockCard" class="kpi-split-item">
              <div class="kpi-card-head">
                <span class="kpi-label">{{ availableStockCard.label }}</span>
                <span class="kpi-icon" :class="`kpi-icon--${availableStockCard.tone}`" />
              </div>

              <strong class="kpi-value">{{ availableStockCard.value }}</strong>
              <div class="kpi-meta">
                <span class="kpi-sub">{{ availableStockCard.subtext }}</span>
              </div>
            </div>

            <div v-if="lowStockCard" class="kpi-split-item">
              <div class="kpi-card-head">
                <span class="kpi-label">{{ lowStockCard.label }}</span>
                <span class="kpi-icon" :class="`kpi-icon--${lowStockCard.tone}`" />
              </div>

              <strong class="kpi-value">{{ lowStockCard.value }}</strong>
              <div class="kpi-meta">
                <span class="kpi-sub">{{ lowStockCard.subtext }}</span>
              </div>
            </div>
          </button>
        </section>

        <section class="charts-row">
        <article class="dashboard-card chart-card chart-card--wide">
          <div class="chart-head">
            <div>
              <p class="section-eyebrow">Order Trend</p>
              <h2 class="section-title">기간별 주문 추이</h2>
            </div>

            <div class="period-toggle">
              <button
                v-for="option in SELLER_DASHBOARD_PERIOD_OPTIONS"
                :key="option.key"
                type="button"
                class="period-btn"
                :class="{ 'period-btn--active': activePeriod === option.key }"
                @click="activePeriod = option.key"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="line-chart-wrap">
            <div v-if="!dashboardViewState.hasTrendData" class="chart-empty">
              기간별 주문 데이터가 아직 없습니다.
            </div>
            <svg viewBox="0 0 680 220" preserveAspectRatio="none" aria-hidden="true">
              <template v-if="dashboardViewState.hasTrendData">
              <defs>
                <linearGradient id="sellerDashboardGoldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#F5A623" />
                  <stop offset="100%" stop-color="#F5A623" stop-opacity="0" />
                </linearGradient>
              </defs>

              <line x1="60" y1="20" x2="660" y2="20" class="chart-grid-line" stroke-dasharray="4" />
              <line x1="60" y1="60" x2="660" y2="60" class="chart-grid-line" stroke-dasharray="4" />
              <line x1="60" y1="100" x2="660" y2="100" class="chart-grid-line" stroke-dasharray="4" />
              <line x1="60" y1="140" x2="660" y2="140" class="chart-grid-line" stroke-dasharray="4" />
              <line x1="60" y1="180" x2="660" y2="180" class="chart-grid-line" />

              <text
                v-for="label in trendChart.yLabels"
                :key="`y-${label.value}`"
                x="50"
                :y="label.y"
                text-anchor="end"
                class="chart-axis-label"
              >
                {{ label.value }}
              </text>

              <text
                v-for="label in trendChart.xLabels"
                :key="`x-${label.label}`"
                :x="label.x"
                y="200"
                text-anchor="middle"
                class="chart-axis-label"
              >
                {{ label.label }}
              </text>

              <polygon :points="trendChart.areaPoints" class="chart-area" />
              <polyline :points="trendChart.linePoints" class="chart-line" />

              <circle
                v-for="point in trendChart.points"
                :key="`${point.label}-${point.x}`"
                :cx="point.x"
                :cy="point.y"
                :r="point.label === trendChart.points.at(-1)?.label ? 5 : 4"
                class="chart-dot"
              />
              </template>
            </svg>
          </div>
        </article>

        <article class="dashboard-card chart-card chart-card--narrow">
          <div class="chart-head">
            <div>
              <p class="section-eyebrow">Stock Mix</p>
              <h2 class="section-title">재고 구성 비율</h2>
            </div>
          </div>

          <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 160 160" aria-hidden="true">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#F3F5F8" stroke-width="22" />
              <circle
                v-for="segment in donutSegments"
                :key="segment.key"
                cx="80"
                cy="80"
                r="60"
                fill="none"
                :stroke="segment.color"
                stroke-width="22"
                :stroke-dasharray="segment.dasharray"
                :stroke-dashoffset="segment.dashoffset"
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="76" text-anchor="middle" class="donut-total">
                {{ donutTotal }}
              </text>
              <text x="80" y="94" text-anchor="middle" class="donut-copy">재고 구성 비율</text>
            </svg>

            <div class="donut-legend">
              <div
                v-for="segment in stockRatio"
                :key="segment.key"
                class="legend-item"
              >
                <span class="legend-dot" :style="{ backgroundColor: segment.color }" />
                <span class="legend-label">{{ segment.label }}</span>
                <strong class="legend-value">{{ segment.value }}%</strong>
              </div>
            </div>
          </div>
        </article>
        </section>

        <section class="tables-row">
        <article class="dashboard-card table-card">
          <div class="table-head">
            <div>
              <p class="section-eyebrow">Recent Feed</p>
              <h2 class="section-title">최근 활동</h2>
            </div>
            <button
              type="button"
              class="table-more"
              @click="navigateToRoute(ROUTE_NAMES.SELLER_NOTIFICATIONS)"
            >
              전체보기 →
            </button>
          </div>

          <div class="table-wrap">
            <table v-if="dashboardViewState.hasRecentActivity" class="dash-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>번호</th>
                  <th>대상</th>
                  <th>수량</th>
                  <th>상태</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentActivityRows" :key="row.id">
                  <td>
                    <span class="row-tag" :class="`row-tag--${row.typeTone}`">{{ row.type }}</span>
                  </td>
                  <td>
                    <button type="button" class="row-link" @click="handleRecentActivityCodeClick(row)">
                      {{ row.code }}
                    </button>
                  </td>
                  <td>{{ row.target }}</td>
                  <td>{{ row.quantity }}</td>
                  <td>
                    <span class="status-badge" :class="`status-badge--${row.statusTone}`">
                      {{ row.statusLabel }}
                    </span>
                  </td>
                  <td>{{ row.occurredAt }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="table-empty">
              최근 활동이 아직 없습니다.
            </div>
          </div>
        </article>

        <article class="dashboard-card table-card">
          <div class="table-head">
            <div>
              <p class="section-eyebrow">Inbound Schedule</p>
              <h2 class="section-title">기간별 입고 재고 목록</h2>
            </div>
            <button
              type="button"
              class="table-more"
              @click="navigateToRoute(ROUTE_NAMES.SELLER_ASN_LIST)"
            >
              전체보기 →
            </button>
          </div>

          <div class="table-wrap">
            <table v-if="dashboardViewState.hasInboundRows" class="dash-table">
              <thead>
                <tr>
                  <th>기간</th>
                  <th>SKU</th>
                  <th>상품</th>
                  <th>입고 예정</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in inboundRows" :key="row.id">
                  <td class="row-code">{{ row.period }}</td>
                  <td>
                    <button type="button" class="row-link" @click="handleInboundSkuClick(row)">
                      {{ row.sku }}
                    </button>
                  </td>
                  <td>{{ row.productName }}</td>
                  <td>{{ row.expectedQty }}</td>
                  <td>
                    <span class="status-badge" :class="`status-badge--${row.etaTone}`">
                      {{ row.etaLabel }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="table-empty">
              예정된 입고 재고가 없습니다.
            </div>
          </div>
        </article>
        </section>
      </template>
    </section>

    <SellerOrderDetailModal
      :is-open="isRecentOrderDetailOpen"
      :order="selectedRecentOrder"
      :detail="selectedRecentOrderDetail"
      @cancel="handleCloseRecentOrderDetail"
    />

    <SellerInventoryDetailModal
      :is-open="isInboundInventoryDetailOpen"
      :inventory="selectedInboundInventory"
      :detail="selectedInboundInventoryDetail"
      @cancel="handleCloseInboundInventoryDetail"
    />
  </AppLayout>
</template>

<style scoped>
.seller-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.dashboard-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: 28px 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.dashboard-state--error {
  border-color: rgba(191, 38, 38, 0.18);
  background: rgba(191, 38, 38, 0.03);
}

.dashboard-state__eyebrow {
  margin: 0;
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-state__title {
  color: var(--t1);
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.dashboard-state__copy {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.charts-row,
.tables-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: var(--space-4);
}

.dashboard-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.kpi-card {
  padding: 22px 24px;
  text-align: left;
}

.kpi-card--split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-column: span 2;
  padding: 0;
  overflow: hidden;
}

.kpi-card--interactive {
  width: 100%;
  border: 1px solid var(--border);
  cursor: pointer;
}

.kpi-split-item {
  width: 100%;
  padding: 22px 24px;
  text-align: left;
}

.kpi-split-item + .kpi-split-item {
  border-left: 1px solid var(--border);
}

.kpi-card--interactive:hover {
  border-color: rgba(245, 166, 35, 0.45);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.kpi-card-head,
.chart-head,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.kpi-label,
.kpi-sub,
.section-eyebrow,
.chart-axis-label,
.legend-label,
.table-more,
.dash-table th,
.dash-table td {
  font-size: var(--font-size-xs);
}

.kpi-label,
.kpi-sub,
.section-eyebrow,
.chart-axis-label,
.legend-label,
.dash-table th {
  color: var(--t3);
}

.chart-axis-label {
  font-weight: 600;
  letter-spacing: 0;
  text-rendering: geometricPrecision;
}

.section-eyebrow {
  margin: 0 0 var(--space-2);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue);
}

.section-title {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.kpi-icon--gold {
  background: var(--gold-pale);
}

.kpi-icon--green {
  background: var(--green-pale);
}

.kpi-icon--blue {
  background: var(--blue-pale);
}

.kpi-icon--amber {
  background: rgba(245, 166, 35, 0.16);
}

.kpi-value {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-condensed);
  font-size: 32px;
  line-height: 1.1;
  color: var(--t1);
}

.kpi-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: var(--space-2);
}

.kpi-trend {
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.kpi-trend--up {
  color: var(--green);
}

.kpi-trend--down {
  color: var(--red);
}

.chart-card,
.table-card {
  padding: 24px;
}

.chart-card--narrow .chart-head {
  margin-bottom: var(--space-5);
}

.period-toggle {
  display: flex;
  gap: 4px;
}

.period-btn {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
}

.period-btn--active {
  border-color: var(--gold);
  background: var(--gold);
  color: #0d0d0d;
}

.line-chart-wrap {
  width: 100%;
  height: 220px;
  overflow-x: auto;
}

.chart-empty,
.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--t3);
  font-size: var(--font-size-sm);
  text-align: center;
}

.line-chart-wrap svg {
  width: 100%;
  height: 100%;
  min-width: 680px;
}

.chart-grid-line {
  stroke: var(--border);
  stroke-width: 1;
}

.chart-line {
  fill: none;
  stroke: var(--gold);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-area {
  fill: url(#sellerDashboardGoldGrad);
  opacity: 0.18;
}

.chart-dot {
  fill: var(--gold);
  stroke: #fff;
  stroke-width: 2;
}

.donut-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.donut-svg {
  width: 160px;
  height: 160px;
}

.donut-total {
  fill: var(--t1);
  font-family: var(--font-condensed);
  font-size: 22px;
  font-weight: 700;
}

.donut-copy {
  fill: var(--t3);
  font-size: 10px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 140px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-value {
  margin-left: auto;
  color: var(--t1);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.table-more {
  border: none;
  background: transparent;
  color: var(--blue);
  font-weight: 600;
  cursor: pointer;
}

.table-wrap {
  margin-top: var(--space-4);
  overflow-x: auto;
}

.dash-table {
  width: 100%;
  border-collapse: collapse;
}

.dash-table th,
.dash-table td {
  padding: 11px 12px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}

.dash-table th {
  background: var(--surface-2);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.dash-table td {
  color: var(--t2);
}

.dash-table tr:last-child td {
  border-bottom: none;
}

.row-code {
  color: var(--blue);
  font-weight: 700;
}

.row-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
}

.row-link:hover {
  text-decoration: underline;
}

.row-tag,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.row-tag--gold {
  background: var(--gold-pale);
  color: #92400e;
}

.row-tag--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.row-tag--default {
  background: var(--surface-2);
  color: var(--t3);
}

.status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.status-badge--amber {
  background: rgba(245, 166, 35, 0.16);
  color: #92400e;
}

.status-badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.status-badge--red {
  background: var(--red-pale);
  color: #7f1d1d;
}

.status-badge--gold {
  background: var(--gold-pale);
  color: #92400e;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-card--split {
    grid-column: span 2;
  }

  .charts-row,
  .tables-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card--split {
    grid-template-columns: 1fr;
    grid-column: auto;
  }

  .kpi-split-item + .kpi-split-item {
    border-left: none;
    border-top: 1px solid var(--border);
  }

  .kpi-card,
  .chart-card,
  .table-card {
    padding: 20px;
  }

  .chart-head,
  .table-head,
  .donut-wrap {
    flex-direction: column;
    align-items: flex-start;
  }

  .period-toggle {
    flex-wrap: wrap;
  }

  .donut-svg {
    width: 144px;
    height: 144px;
  }
}
</style>
