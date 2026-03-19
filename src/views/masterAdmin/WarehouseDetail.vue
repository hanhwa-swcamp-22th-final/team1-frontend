<script setup>
/**
 * WarehouseDetail.vue — 창고 상세 (masterAdmin)
 *
 * 레이아웃:
 *   상단 KPI 바  (총 SKU / 출고 대기 / Bin 가용률 / 처리 완료)
 *   하단 3패널   재고현황 | 출고현황 | 주문처리상세
 *   우측 드로어  로케이션 가용률 (슬라이드 인)
 *
 * 데이터:   onMounted + watch(warehouseId) → fetchDetail (Promise.all 5개 병렬)
 * 창고전환: 헤더 wh-select 드롭다운 → router.push → warehouseId watch 트리거 → 재조회
 */
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { ROUTE_NAMES, ORDER_STATUS } from '@/constants'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  getWarehouseList,
  getWarehouseInventory,
  getWarehouseOutbound,
  getWarehouseOrders,
  getWarehouseLocations,
} from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import SkuDetailModal   from '@/components/masterAdmin/SkuDetailModal.vue'
import OrderDetailModal from '@/components/masterAdmin/OrderDetailModal.vue'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

// ── 상태 ─────────────────────────────────────────────────────────────────────
const warehouseId     = computed(() => Number(route.params.id))
const allWarehouses   = ref([])
const warehouse       = ref(null)
const inventory       = ref([])
const outboundTab     = ref('today')
const outboundData    = ref({ today: [], week: [], month: [] })
const orderStats      = ref({ waiting: 0, inProgress: 0, done: 0 })
const orders          = ref([])
const zones           = ref([])
const selectedZoneIdx = ref(0)
const errorMsg        = ref('')

// 드로어 열림 상태
const drawerOpen = ref(false)

// ── SKU 상세 모달 (SkuDetailModal 컴포넌트 위임) ────────────────────────────
const showSkuModal = ref(false)
const selectedSku  = ref('')

function openSkuDetail(item) {
  selectedSku.value  = item.sku
  showSkuModal.value = true
}

// ── 주문 상세 모달 (OrderDetailModal 컴포넌트 위임) ─────────────────────────
const showOrderModal  = ref(false)
const selectedOrderId = ref('')

function openOrderDetail(orderId) {
  selectedOrderId.value = orderId
  showOrderModal.value  = true
}

// ── computed ─────────────────────────────────────────────────────────────────
const currentOutbound = computed(() => outboundData.value[outboundTab.value] ?? [])
const currentZone     = computed(() => zones.value[selectedZoneIdx.value] ?? null)

/** KPI: 전 Zone 통합 Bin 가용률 (가용 Bin / 전체 Bin) */
const kpiAvailBinPct = computed(() => {
  if (!zones.value.length) return 0
  let avail = 0, total = 0
  zones.value.forEach(z => { avail += z.available; total += z.total })
  return total ? Math.round((avail / total) * 100) : 0
})

const breadcrumb = computed(() => [
  { label: '창고 관리' },
  { label: '창고 목록' },
  { label: warehouse.value?.name ?? '...' },
])

// ── 데이터 fetch ──────────────────────────────────────────────────────────────
async function fetchDetail() {
  errorMsg.value = ''
  ui.setLoading(true)
  try {
    const id = warehouseId.value
    const [listRes, invRes, outRes, ordRes, locRes] = await Promise.all([
      getWarehouseList(),
      getWarehouseInventory(id),
      getWarehouseOutbound(id),
      getWarehouseOrders(id),
      getWarehouseLocations(id),
    ])

    const allWh        = listRes.data.data ?? []
    allWarehouses.value = allWh.filter(w => w.status !== 'INACTIVE')
    warehouse.value     = allWh.find(w => w.id === id) ?? null

    inventory.value     = invRes.data.data ?? []
    outboundData.value  = outRes.data.data ?? { today: [], week: [], month: [] }
    outboundTab.value   = 'today'

    const ordData       = ordRes.data.data ?? {}
    orderStats.value    = ordData.stats ?? { waiting: 0, inProgress: 0, done: 0 }
    orders.value        = ordData.list  ?? []

    zones.value         = locRes.data.data ?? []
    selectedZoneIdx.value = 0
  } catch (err) {
    errorMsg.value = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[WarehouseDetail] fetchDetail error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchDetail)
watch(warehouseId, fetchDetail)

// ── 출고 처리 확인 다이얼로그 ─────────────────────────────────────────────────
const confirmDialog = reactive({
  open: false, title: '', message: '', danger: false, action: null,
})

function openConfirm(title, message, danger, action) {
  Object.assign(confirmDialog, { open: true, title, message, danger, action })
}

async function onConfirmAction() {
  if (confirmDialog.action) await confirmDialog.action()
  confirmDialog.open = false
}

function onCancelConfirm() {
  confirmDialog.open = false
}

function handleProcessOutbound(row) {
  openConfirm(
    '출고 처리',
    `주문 ${row.orderId}을(를) 출고 완료로 처리하시겠습니까?`,
    false,
    () => {
      // 로컬 상태 업데이트 (API stub)
      const tabData = outboundData.value[outboundTab.value]
      const target = tabData.find(r => r.orderId === row.orderId)
      if (target) target.status = ORDER_STATUS.SHIPPED
    },
  )
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function binClass(state) {
  return { avail: 'bin-avail', used: 'bin-used', off: 'bin-off' }[state] ?? ''
}

/** Zone 가용률 바 색상: 가용 비율 기준 (utilPct = 점유율이므로 100-utilPct 로 가용 판단) */
function utilFillClass(utilPct) {
  const avail = 100 - utilPct
  if (avail >= 40) return 'util-fill-ok'
  if (avail >= 20) return 'util-fill-mid'
  return 'util-fill-high'
}

/** KPI Bin 가용률 뱃지 색상 */
function binPctClass(pct) {
  if (pct >= 40) return 'kpi-accent-green'
  if (pct >= 20) return 'kpi-accent-amber'
  return 'kpi-accent-red'
}

function goToWarehouse(evt) {
  const id = Number(evt.target.value)
  if (id !== warehouseId.value) {
    router.push({ name: ROUTE_NAMES.MASTER_WAREHOUSE_DETAIL, params: { id } })
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" :title="warehouse?.name ?? '창고 상세'" :loading="ui.isLoading">

    <!-- ── 헤더 액션 슬롯 ─────────────────────────────────────────────────── -->
    <template #header-action>
      <select
        v-if="allWarehouses.length"
        class="wh-select"
        :value="warehouseId"
        @change="goToWarehouse"
      >
        <option v-for="wh in allWarehouses" :key="wh.id" :value="wh.id">
          {{ wh.name }}
        </option>
      </select>

      <!-- 로케이션 드로어 열기 버튼 -->
      <button class="ui-btn ui-btn--ghost btn-location" @click="drawerOpen = true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        로케이션 현황
      </button>

      <button class="ui-btn ui-btn--ghost btn-report">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        리포트 다운로드
      </button>
    </template>

    <!-- ── 에러 배너 ──────────────────────────────────────────────────────── -->
    <div v-if="errorMsg" class="fetch-error">
      {{ errorMsg }}
      <button @click="fetchDetail">다시 시도</button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         페이지 루트 (flex column)
    ═══════════════════════════════════════════════════════════════════════ -->
    <div class="wd-page">

      <!-- ── KPI 요약 바 ────────────────────────────────────────────────── -->
      <div class="kpi-bar">

        <!-- KPI 1: 총 SKU -->
        <div class="kpi-card">
          <div class="kpi-icon kpi-accent-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="kpi-text">
            <div class="kpi-num">{{ inventory.length }}</div>
            <div class="kpi-label">총 SKU</div>
          </div>
          <div class="kpi-tag kpi-tag-blue">재고</div>
        </div>

        <!-- KPI 2: 출고 대기 -->
        <div class="kpi-card">
          <div class="kpi-icon kpi-accent-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="kpi-text">
            <div class="kpi-num kpi-num-amber">{{ orderStats.waiting }}</div>
            <div class="kpi-label">출고 대기</div>
          </div>
          <div class="kpi-tag kpi-tag-amber">처리 필요</div>
        </div>

        <!-- KPI 3: Bin 가용률 -->
        <div class="kpi-card">
          <div class="kpi-icon" :class="binPctClass(kpiAvailBinPct)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="kpi-text">
            <div class="kpi-num" :class="binPctClass(kpiAvailBinPct) + '-text'">
              {{ kpiAvailBinPct }}<span class="kpi-unit">%</span>
            </div>
            <div class="kpi-label">Bin 가용률</div>
          </div>
          <!-- 미니 가용률 바 -->
          <div class="kpi-bin-bar-wrap">
            <div class="kpi-bin-bar-track">
              <div
                class="kpi-bin-bar-fill"
                :class="binPctClass(kpiAvailBinPct)"
                :style="{ height: kpiAvailBinPct + '%' }"
              />
            </div>
          </div>
        </div>

        <!-- KPI 4: 처리 완료 -->
        <div class="kpi-card">
          <div class="kpi-icon kpi-accent-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="kpi-text">
            <div class="kpi-num kpi-num-green">{{ orderStats.done }}</div>
            <div class="kpi-label">처리 완료</div>
          </div>
          <div class="kpi-progress-wrap">
            <div class="kpi-progress-ring">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" stroke-width="3"/>
                <circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke="var(--green)" stroke-width="3"
                  stroke-dasharray="113"
                  :stroke-dashoffset="113 - (113 * (orderStats.done / Math.max(orderStats.done + orderStats.inProgress + orderStats.waiting, 1)))"
                  stroke-linecap="round"
                  transform="rotate(-90 22 22)"
                  style="transition: stroke-dashoffset .5s ease"
                />
              </svg>
            </div>
          </div>
        </div>

      </div><!-- /.kpi-bar -->

      <!-- ── 하단 3패널 ────────────────────────────────────────────────── -->
      <div class="panels-row">

        <!-- ══════ Panel 1: 재고 현황 ══════ -->
        <div class="panel panel-stock">
          <div class="panel-hd">
            재고 현황
            <span class="panel-hd-sub">{{ inventory.length }} SKU</span>
          </div>
          <div class="panel-body">
            <table class="data-tbl">
              <thead>
                <tr>
                  <th>상품명</th>
                  <th class="col-num">가용</th>
                  <th class="col-num">할당</th>
                  <th class="col-num">총합</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in inventory" :key="item.sku">
                  <td>
                    <button class="product-name-btn" @click="openSkuDetail(item)">
                      {{ item.productName }}
                    </button>
                    <div class="sku-code-sub">{{ item.sku }}</div>
                  </td>
                  <td class="col-num">
                    <span :class="item.available < 15 ? 'num-low' : 'num-ok'">
                      {{ item.available }}
                    </span>
                  </td>
                  <td class="col-num num-alloc">{{ item.allocated }}</td>
                  <td class="col-num num-total">{{ item.total }}</td>
                </tr>
                <tr v-if="!inventory.length && !ui.isLoading">
                  <td colspan="4" class="empty-cell">데이터 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ══════ Panel 2: 출고 현황 ══════ -->
        <div class="panel panel-shipping">
          <div class="panel-hd">출고 현황</div>

          <div class="tab-row">
            <button
              v-for="t in [{ k: 'today', l: '금일' }, { k: 'week', l: '주간' }, { k: 'month', l: '월간' }]"
              :key="t.k"
              :class="['tab-btn', { active: outboundTab === t.k }]"
              @click="outboundTab = t.k"
            >
              {{ t.l }}
              <span v-if="t.k === 'today' && outboundData.today.length" class="tab-count">
                {{ outboundData.today.length }}
              </span>
            </button>
          </div>

          <div class="panel-body">
            <table class="data-tbl">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>셀러</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in currentOutbound" :key="row.orderId">
                  <td>
                    <button class="order-id-btn" @click="openOrderDetail(row.orderId)">
                      {{ row.orderId }}
                    </button>
                  </td>
                  <td>{{ row.seller }}</td>
                  <td>
                    <StatusBadge :status="row.status" type="order" />
                  </td>
                  <td class="action-cell">
                    <button
                      v-if="row.status !== ORDER_STATUS.SHIPPED"
                      class="btn-action-sm"
                      @click="handleProcessOutbound(row)"
                    >
                      처리
                    </button>
                  </td>
                </tr>
                <tr v-if="!currentOutbound.length && !ui.isLoading">
                  <td colspan="4" class="empty-cell">데이터 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ══════ Panel 3: 주문 처리 상세 ══════ -->
        <div class="panel panel-orders">
          <div class="panel-hd">
            주문 처리 상세
          </div>

          <!-- 통계 바 -->
          <div class="order-stat-bar">
            <div class="order-stat stat-wait">
              <span class="stat-num">{{ orderStats.waiting }}</span>
              <span class="stat-lbl">대기 중</span>
            </div>
            <div class="order-stat stat-prog">
              <span class="stat-num">{{ orderStats.inProgress }}</span>
              <span class="stat-lbl">작업 진행중</span>
            </div>
            <div class="order-stat stat-done">
              <span class="stat-num">{{ orderStats.done }}</span>
              <span class="stat-lbl">처리 완료</span>
            </div>
          </div>

          <div class="panel-body">
            <table class="data-tbl">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>상품(SKU)</th>
                  <th class="col-num">수량</th>
                  <th>배송지</th>
                  <th>상태</th>
                  <th>담당 작업자</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ord in orders" :key="ord.orderId">
                  <td>
                    <button class="order-id-btn" @click="openOrderDetail(ord.orderId)">
                      {{ ord.orderId }}
                    </button>
                  </td>
                  <td>
                    <span class="product-name-cell">{{ ord.productName }}</span>
                    <div class="sku-code-sub">{{ ord.sku }}</div>
                  </td>
                  <td class="col-num">{{ ord.qty }}</td>
                  <td class="dest-cell">{{ ord.dest }}</td>
                  <td>
                    <StatusBadge :status="ord.status" type="order" />
                  </td>
                  <td>{{ ord.worker }}</td>
                </tr>
                <tr v-if="!orders.length && !ui.isLoading">
                  <td colspan="6" class="empty-cell">데이터 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div><!-- /.panels-row -->
    </div><!-- /.wd-page -->

    <!-- ══════════════════════════════════════════════════════════════════════
         로케이션 드로어 (Teleport → body)
    ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- 반투명 backdrop -->
      <Transition name="drawer-backdrop">
        <div
          v-if="drawerOpen"
          class="drawer-backdrop"
          @click="drawerOpen = false"
        />
      </Transition>

      <!-- 드로어 패널 -->
      <Transition name="drawer-slide">
        <div v-if="drawerOpen" class="location-drawer">

          <!-- 드로어 헤더 -->
          <div class="drawer-hd">
            <span class="drawer-title">로케이션 가용률</span>
            <button class="drawer-close" @click="drawerOpen = false" aria-label="닫기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Zone 선택 탭 -->
          <div class="drawer-zone-tabs">
            <button
              v-for="(z, i) in zones"
              :key="z.zone"
              :class="['zone-tab', { active: selectedZoneIdx === i }]"
              @click="selectedZoneIdx = i"
            >
              {{ z.label }}
            </button>
          </div>

          <!-- 가용률 요약 -->
          <div v-if="currentZone" class="drawer-util-summary">
            <div class="util-pct-row">
              <span class="util-pct-label">점유율</span>
              <span class="util-pct-num" :class="utilFillClass(currentZone.utilPct) + '-text'">
                {{ currentZone.utilPct }}%
              </span>
            </div>
            <div class="util-bar-track">
              <div
                class="util-bar-fill"
                :class="utilFillClass(currentZone.utilPct)"
                :style="{ width: currentZone.utilPct + '%' }"
              />
            </div>
            <div class="util-avail-row">
              <span class="util-avail-chip">
                <span class="chip-dot chip-dot-avail" />
                가용 {{ currentZone.available }}
              </span>
              <span class="util-avail-chip">
                <span class="chip-dot chip-dot-used" />
                사용 {{ currentZone.total - currentZone.available }}
              </span>
              <span class="util-avail-chip util-avail-total">
                전체 {{ currentZone.total }} Bin
              </span>
            </div>
          </div>

          <!-- 범례 -->
          <div class="loc-legend">
            <span class="leg-item leg-avail">가용</span>
            <span class="leg-item leg-used">사용 중</span>
            <span class="leg-item leg-off">비활성</span>
          </div>

          <!-- Rack + Bin 그리드 -->
          <div class="drawer-body">
            <div v-if="currentZone" class="location-map">
              <div
                v-for="rack in currentZone.racks"
                :key="rack.name"
                class="rack-group"
              >
                <div class="rack-name">{{ rack.name }}</div>
                <div class="bin-grid">
                  <div
                    v-for="bin in rack.bins"
                    :key="bin.id"
                    :class="['bin-cell', binClass(bin.state)]"
                    :title="bin.id"
                  >
                    {{ bin.id.split('-').pop() }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!ui.isLoading" class="empty-cell">Zone 데이터 없음</div>
          </div>

        </div><!-- /.location-drawer -->
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════════
         SKU 상세 모달 (SkuDetailModal 컴포넌트)
    ═══════════════════════════════════════════════════════════════════════ -->
    <SkuDetailModal
      :warehouse-id="warehouseId"
      :sku="selectedSku"
      :is-open="showSkuModal"
      @close="showSkuModal = false"
    />

    <!-- ══════════════════════════════════════════════════════════════════════
         주문 상세 모달 (OrderDetailModal 컴포넌트)
    ═══════════════════════════════════════════════════════════════════════ -->
    <OrderDetailModal
      :warehouse-id="warehouseId"
      :order-id="selectedOrderId"
      :is-open="showOrderModal"
      @close="showOrderModal = false"
    />

    <!-- ── 출고 처리 확인 다이얼로그 ── -->
    <ConfirmDialog
      :is-open="confirmDialog.open"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :danger="confirmDialog.danger"
      confirm-label="처리 완료"
      @confirm="onConfirmAction"
      @cancel="onCancelConfirm"
    />

  </AppLayout>
</template>

<style scoped>
/* ── 헤더 버튼 ───────────────────────────────────────────────────────────── */
.btn-report,
.btn-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
}

.wh-select {
  height: 36px;
  padding: 0 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--t1);
  cursor: pointer;
  outline: none;
  transition: border-color .15s;
}
.wh-select:hover { border-color: var(--gold); }
.wh-select:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(245,166,35,.2); }

/* ── 에러 배너 ───────────────────────────────────────────────────────────── */
.fetch-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  background: rgba(239, 68, 68, .08);
  border: 1px solid rgba(239, 68, 68, .3);
  color: var(--red);
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
  flex-shrink: 0;
}
.fetch-error button {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: var(--red);
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 3px 10px;
  cursor: pointer;
}

/* ── 페이지 루트 (flex column) ──────────────────────────────────────────── */
.wd-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--content-py) * 2 - 6px);
  min-height: 0;
}

/* ══════════════════════════════════════════════════════════════════════════
   KPI BAR
══════════════════════════════════════════════════════════════════════════ */
.kpi-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  position: relative;
}

/* 아이콘 원형 배경 */
.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-accent-blue  { background: rgba(76, 116, 255, .12); color: var(--blue); }
.kpi-accent-amber { background: rgba(245, 200,  66, .15); color: #B45309; }
.kpi-accent-green { background: rgba(46,  204, 135, .12); color: var(--green); }
.kpi-accent-red   { background: rgba(239,  68,  68, .12); color: var(--red); }

.kpi-text {
  flex: 1;
  min-width: 0;
}

.kpi-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(26px, 2vw, 34px);
  line-height: 1;
  color: var(--t1);
}
.kpi-unit { font-size: .55em; font-weight: 600; margin-left: 1px; }
.kpi-num-amber { color: #B45309; }
.kpi-num-green { color: var(--green); }
.kpi-accent-red-text   { color: var(--red); }
.kpi-accent-amber-text { color: #B45309; }
.kpi-accent-green-text { color: var(--green); }

.kpi-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 11px;
  color: var(--t3);
  margin-top: 3px;
  letter-spacing: .3px;
}

/* 우상단 태그 */
.kpi-tag {
  position: absolute;
  top: 10px;
  right: 12px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}
.kpi-tag-blue  { background: rgba(76, 116, 255, .1);  color: var(--blue); }
.kpi-tag-amber { background: rgba(245, 166,  35, .12); color: #B45309; }

/* Bin 가용률 미니 세로 바 */
.kpi-bin-bar-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
}
.kpi-bin-bar-track {
  width: 8px;
  height: 40px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.kpi-bin-bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height .5s ease;
  min-height: 3px;
}
.kpi-accent-green { background: rgba(46,  204, 135, .12); color: var(--green); }
.kpi-bin-bar-fill.kpi-accent-green { background: var(--green); }
.kpi-bin-bar-fill.kpi-accent-amber { background: var(--amber); }
.kpi-bin-bar-fill.kpi-accent-red   { background: var(--red); }

/* 처리 완료 링 프로그레스 */
.kpi-progress-wrap {
  flex-shrink: 0;
  opacity: .8;
}

/* ══════════════════════════════════════════════════════════════════════════
   3패널 행
══════════════════════════════════════════════════════════════════════════ */
.panels-row {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* ── 패널 공통 ──────────────────────────────────────────────────────────── */
.panel {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.panel-stock    { width: 320px; }
.panel-shipping { width: 330px; }
.panel-orders   { flex: 1; min-width: 0; flex-shrink: 1; }

.panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, 1.1vw, 17px);
  letter-spacing: .3px;
  color: var(--t1);
  background: var(--surface-2);
  flex-shrink: 0;
}
.panel-hd-sub {
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 11px;
  color: var(--t3);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.panel-body::-webkit-scrollbar       { width: 4px; }
.panel-body::-webkit-scrollbar-track { background: transparent; }
.panel-body::-webkit-scrollbar-thumb { background: var(--border-dk); border-radius: 2px; }

/* ── 출고 탭 ──────────────────────────────────────────────────────────── */
.tab-row {
  display: flex;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 11px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: var(--t3);
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.tab-btn:hover  { color: var(--t1); }
.tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 700; }
.tab-count {
  min-width: 18px;
  height: 16px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: rgba(245, 166, 35, .15);
  color: #B45309;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ── 주문 처리 통계 바 ──────────────────────────────────────────────────── */
.order-stat-bar {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.order-stat {
  flex: 1;
  padding: 12px 10px;
  text-align: center;
}
.order-stat + .order-stat { border-left: 1px solid var(--border); }
.stat-num {
  display: block;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 1;
}
.stat-lbl {
  display: block;
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 10px;
  color: var(--t3);
  margin-top: 3px;
  letter-spacing: .3px;
}
.stat-wait .stat-num { color: var(--amber); }
.stat-prog .stat-num { color: #3B82F6; }
.stat-done .stat-num { color: var(--green); }

/* ── 공통 테이블 ──────────────────────────────────────────────────────── */
.data-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-tbl th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 12px;
  background: var(--surface-2);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--t3);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.data-tbl td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--t1);
  vertical-align: middle;
}
.data-tbl tr:last-child td { border-bottom: none; }
.data-tbl tr:hover td      { background: var(--surface-2); }

.col-num   { text-align: right; }
.empty-cell { text-align: center; color: var(--t4); padding: 32px; font-size: 13px; }
.dest-cell  { white-space: nowrap; font-size: 12px; color: var(--t2); }
.action-cell { white-space: nowrap; width: 1px; }

.num-ok    { font-weight: 600; color: var(--green); }
.num-low   { font-weight: 700; color: var(--red); }
.num-alloc { color: var(--t2); }
.num-total { font-weight: 700; color: var(--t1); }
.sku-code  { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--t2); }
.order-id  { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #3B82F6; }

/* ── 출고 액션 버튼 ─────────────────────────────────────────────────────── */
.btn-action-sm {
  height: 25px;
  padding: 0 10px;
  background: var(--gold);
  border: none;
  border-radius: 4px;
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-action-sm:hover { background: color-mix(in srgb, var(--gold) 85%, #fff); }

/* ══════════════════════════════════════════════════════════════════════════
   LOCATION DRAWER
══════════════════════════════════════════════════════════════════════════ */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, .35);
  z-index: 290;
  backdrop-filter: blur(1px);
}

.location-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-xl);
  z-index: 295;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 드로어 헤더 */
.drawer-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.drawer-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: .3px;
  color: var(--t1);
}
.drawer-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--t3);
  cursor: pointer;
  transition: background .15s, color .15s;
}
.drawer-close:hover { background: var(--border); color: var(--t1); }

/* Zone 탭 */
.drawer-zone-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.zone-tab {
  padding: 10px 14px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--t3);
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.zone-tab:hover  { color: var(--t1); }
.zone-tab.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 700; }

/* 가용률 요약 */
.drawer-util-summary {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.util-pct-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.util-pct-label {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.util-pct-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 22px;
  line-height: 1;
}
.util-fill-ok-text   { color: var(--green); }
.util-fill-mid-text  { color: #B45309; }
.util-fill-high-text { color: var(--red); }

.util-bar-track {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}
.util-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width .4s ease;
}
.util-fill-ok   { background: var(--green); }
.util-fill-mid  { background: var(--amber); }
.util-fill-high { background: var(--red); }

.util-avail-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.util-avail-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t2);
  font-weight: 500;
}
.util-avail-total { color: var(--t3); margin-left: auto; }
.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chip-dot-avail { background: var(--green); }
.chip-dot-used  { background: var(--amber); }

/* 범례 */
.loc-legend {
  display: flex;
  gap: 14px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.leg-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t2);
}
.leg-item::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.leg-avail::before { background: rgba(46,  204, 135, .25); border: 1px solid rgba(46,  204, 135, .5); }
.leg-used::before  { background: rgba(245, 166,  35, .25); border: 1px solid rgba(245, 166,  35, .5); }
.leg-off::before   { background: var(--surface-2); border: 1px dashed var(--border); }

/* 드로어 바디 (스크롤) */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.drawer-body::-webkit-scrollbar       { width: 4px; }
.drawer-body::-webkit-scrollbar-track { background: transparent; }
.drawer-body::-webkit-scrollbar-thumb { background: var(--border-dk); border-radius: 2px; }

/* Bin 그리드 */
.location-map {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rack-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .6px;
  margin-bottom: 6px;
}
.bin-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
}
.bin-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  cursor: default;
  border: 1px solid transparent;
  transition: transform .1s;
  user-select: none;
}
.bin-cell:hover { transform: scale(1.1); }
.bin-avail {
  background: rgba(46,  204, 135, .15);
  color: var(--green);
  border-color: rgba(46,  204, 135, .3);
}
.bin-used {
  background: rgba(245, 166,  35, .2);
  color: #B45309;
  border-color: rgba(245, 166,  35, .35);
}
.bin-off {
  background: var(--surface-2);
  color: var(--t4, #555);
  border-color: var(--border);
  border-style: dashed;
}

/* ══════════════════════════════════════════════════════════════════════════
   상품명 클릭 버튼 (재고 현황 패널)
══════════════════════════════════════════════════════════════════════════ */
.product-name-btn {
  display: block;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--blue);
  cursor: pointer;
  transition: color .15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.product-name-btn:hover {
  color: color-mix(in srgb, var(--blue) 70%, #000);
  text-decoration: underline;
}
.product-name-cell {
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--t1);
}
.sku-code-sub {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--t4);
  margin-top: 2px;
}

/* ══════════════════════════════════════════════════════════════════════════
   SKU 상세 모달 내부 스타일
══════════════════════════════════════════════════════════════════════════ */
.sku-modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--t3);
  font-family: 'Barlow', sans-serif;
  font-size: 14px;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.sku-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 기본 정보 카드 */
.sku-info-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sku-info-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.sku-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.sku-info-label {
  font-family: 'Barlow', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.sku-category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(76, 116, 255, .1);
  color: var(--blue);
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  font-weight: 600;
}
.location-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: rgba(46, 204, 135, .1);
  border: 1px solid rgba(46, 204, 135, .25);
  color: var(--green);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
}
.sku-no-location {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t4);
  font-style: italic;
}
.sku-info-item--locations {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.location-qty {
  font-size: 11px;
  font-weight: 400;
  color: var(--green);
  opacity: 0.75;
}

/* 재고 수치 칩 */
.sku-stock-row {
  display: flex;
  gap: 10px;
}
.sku-stock-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}
.sku-stock-chip .chip-label {
  font-size: 11px;
  color: var(--t3);
  font-weight: 500;
}
.sku-stock-chip strong {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 18px;
}
.sku-stock-avail strong { color: var(--green); }
.sku-stock-alloc strong { color: var(--amber); }
.sku-stock-total strong { color: var(--t1); }

/* 섹션 */
.sku-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sku-section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .3px;
  color: var(--t2);
  text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

/* 상세 테이블 (모달 내부) */
.detail-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.detail-tbl th {
  padding: 6px 10px;
  background: var(--surface-2);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: var(--t3);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.detail-tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--t1);
  vertical-align: middle;
}
.detail-tbl tr:last-child td { border-bottom: none; }
.detail-tbl tr:hover td      { background: var(--surface-2); }

/* 이력 구분 뱃지 */
.hist-type {
  display: inline-block;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  font-family: 'Barlow', sans-serif;
  font-size: 10px;
  font-weight: 700;
}
.hist-in     { background: rgba(46, 204, 135, .12); color: var(--green); }
.hist-out    { background: rgba(239,  68,  68, .1);  color: var(--red); }
.hist-adjust { background: rgba(245, 166,  35, .12); color: #B45309; }

.qty-in   { color: var(--green); font-weight: 600; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; }
.qty-out  { color: var(--red);   font-weight: 600; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; }

.date-cell   { color: var(--t3); white-space: nowrap; font-size: 12px; }
.reason-cell { color: var(--t2); max-width: 200px; }

/* ── 주문번호 버튼 ──────────────────────────────────────────────────────────── */
.order-id-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: #3B82F6;
  cursor: pointer;
  text-decoration: none;
  transition: color .15s;
  white-space: nowrap;
}
.order-id-btn:hover {
  color: color-mix(in srgb, #3B82F6 70%, #000);
  text-decoration: underline;
}

/* ── 주문 상세 모달 — 셀러 행 ────────────────────────────────────────────── */
.order-seller-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 0 4px;
  border-top: 1px solid var(--border);
  color: var(--t2);
}
.order-seller-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--t1);
}
.order-seller-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--t4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}

/* ── 작은 location 태그 (모달 내부 테이블용) ─────────────────────────────── */
.location-tag--sm {
  font-size: 11px;
  padding: 2px 7px;
}

/* ── workStatus 뱃지 ────────────────────────────────────────────────────── */
.work-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.ws-waiting { background: rgba(156, 163, 175, .15); color: var(--t3); }
.ws-picking { background: rgba(59, 130, 246, .12);  color: #3B82F6; }
.ws-picked  { background: rgba(99, 102, 241, .12);  color: #6366F1; }
.ws-packing { background: rgba(245, 166, 35, .15);  color: #B45309; }
.ws-packed  { background: rgba(245, 166, 35, .2);   color: #92400E; }
.ws-shipped { background: rgba(46, 204, 135, .12);  color: var(--green); }

/* ══════════════════════════════════════════════════════════════════════════
   드로어 전환 애니메이션
══════════════════════════════════════════════════════════════════════════ */
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active { transition: opacity .25s ease; }
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to     { opacity: 0; }

.drawer-slide-enter-active { transition: transform .28s cubic-bezier(.25,.46,.45,.94); }
.drawer-slide-leave-active { transition: transform .22s cubic-bezier(.55,.0,.1,1); }
.drawer-slide-enter-from,
.drawer-slide-leave-to     { transform: translateX(100%); }
</style>
