<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { ROUTE_NAMES } from '@/constants'
import { getWhmDashboard } from '@/api/wh-manager'

const router = useRouter()

const today = computed(() =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
)

const kpi            = ref({ todayAsn: 0, pendingAsn: 0, availableSku: 0, shortageCount: 0, pendingOrders: 0, picking: 0, todayShipped: 0, shippedDiff: '0' })
const todoItems      = ref([])
const recentAsns     = ref([])
const lowStockAlerts = ref([])

onMounted(async () => {
  try {
    const { data } = await getWhmDashboard()
    kpi.value            = data.kpi
    todoItems.value      = data.todoItems
    recentAsns.value     = data.recentAsns
    lowStockAlerts.value = data.lowStockAlerts
  } catch (e) {
    console.error('대시보드 데이터 로드 실패:', e)
  }
})

const breadcrumb = [{ label: 'CONK' }, { label: '대시보드' }]

function go(name) {
  router.push({ name })
}
</script>

<template>
  <AppLayout title="대시보드" :breadcrumb="breadcrumb">

    <!-- ── KPI 카드 4개 ───────────────────────────────── -->
    <div class="kpi-grid">

      <!-- 오늘 입고 예정 -->
      <div class="kpi-card" @click="go(ROUTE_NAMES.WH_MANAGER_ASN_LIST)">
        <div class="kpi-icon kpi-icon--gold">
          <svg viewBox="0 0 18 18" fill="none" stroke="#92400e" stroke-width="1.6">
            <rect x="1" y="3" width="16" height="13" rx="1.5"/>
            <path d="M1 8h16" stroke-linecap="round"/>
            <path d="M5.5 12l3 2.5 3-2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="kpi-label">오늘 입고 예정</div>
        <div class="kpi-value">{{ kpi.todayAsn }}<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">ASN 처리 대기: <span class="acc acc--gold">{{ kpi.pendingAsn }}건</span></div>
      </div>

      <!-- 가용 재고 SKU -->
      <div class="kpi-card" @click="go(ROUTE_NAMES.WH_MANAGER_INVENTORY)">
        <div class="kpi-icon kpi-icon--green">
          <svg viewBox="0 0 18 18" fill="none" stroke="#065f46" stroke-width="1.6">
            <rect x="1" y="4" width="6" height="6" rx="0.5"/>
            <rect x="11" y="4" width="6" height="6" rx="0.5"/>
            <path d="M1 13h6M11 13h6" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="kpi-label">가용 재고 SKU</div>
        <div class="kpi-value">{{ kpi.availableSku }}<span class="kpi-unit">종</span></div>
        <div class="kpi-sub">재고 부족 경고: <span class="acc acc--red">{{ kpi.shortageCount }}종</span></div>
      </div>

      <!-- 출고 대기 주문 -->
      <div class="kpi-card" @click="go(ROUTE_NAMES.WH_MANAGER_ORDER_LIST)">
        <div class="kpi-icon kpi-icon--blue">
          <svg viewBox="0 0 18 18" fill="none" stroke="#4C74FF" stroke-width="1.6">
            <rect x="1" y="1" width="16" height="16" rx="1.5"/>
            <path d="M4 5h10M4 9h10M4 13h6" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="kpi-label">출고 대기 주문</div>
        <div class="kpi-value">{{ kpi.pendingOrders }}<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">피킹 진행 중: <span class="acc acc--blue">{{ kpi.picking }}건</span></div>
      </div>

      <!-- 오늘 출고 완료 -->
      <div class="kpi-card" @click="go(ROUTE_NAMES.WH_MANAGER_OUTBOUND_CONFIRM)">
        <div class="kpi-icon kpi-icon--green">
          <svg viewBox="0 0 18 18" fill="none" stroke="#065f46" stroke-width="1.6">
            <path d="M2 9.5l4 4 10-8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="kpi-label">오늘 출고 완료</div>
        <div class="kpi-value">{{ kpi.todayShipped }}<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">전일 대비: <span class="acc acc--green">{{ kpi.shippedDiff }}건↑</span></div>
      </div>

    </div>

    <!-- ── 중간: 작업 현황 ──────────────────────────── -->
    <div class="card" style="margin-bottom: var(--space-4);">
      <div class="card-header">
        <span class="card-title">오늘의 작업 현황</span>
        <span class="card-sub">{{ today }}</span>
      </div>
      <div class="card-body">
        <ul class="todo-list">
          <li v-for="item in todoItems" :key="item.time" class="todo-item">
            <span class="dot" :class="`dot--${item.color}`"></span>
            <span class="todo-text">
              {{ item.text }}
              <span v-if="item.badge" class="badge badge--red">{{ item.badge }}</span>
            </span>
            <span class="todo-time">{{ item.time }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── 하단: ASN 목록 + 재고 부족 경고 ──────────── -->
    <div class="dash-grid-3">

      <!-- 최근 ASN 목록 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">최근 입고 예정 (ASN)</span>
          <button class="ui-btn ui-btn--ghost ui-btn--sm" @click="go(ROUTE_NAMES.WH_MANAGER_ASN_LIST)">전체 보기</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ASN ID</th>
                <th>셀러</th>
                <th>SKU / 수량</th>
                <th>도착 예정일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asn in recentAsns" :key="asn.id">
                <td class="mono">{{ asn.id }}</td>
                <td>{{ asn.seller }}</td>
                <td>{{ asn.sku }} / <strong>{{ asn.qty }}</strong></td>
                <td class="nowrap">{{ asn.date }}</td>
                <td><StatusBadge :status="asn.status" type="asn" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 재고 부족 경고 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">재고 부족 경고</span>
          <span class="badge badge--red">{{ lowStockAlerts.length }}종</span>
        </div>
        <div class="card-body">
          <div v-for="item in lowStockAlerts" :key="item.sku" class="alert-row">
            <span class="dot" :class="`dot--${item.color}`"></span>
            <div class="alert-info">
              <div class="alert-sku">{{ item.sku }}</div>
              <div class="alert-threshold">임계값: {{ item.threshold }}개</div>
            </div>
            <span class="alert-remaining" :class="`alert-remaining--${item.color}`">잔여 {{ item.remaining }}개</span>
          </div>
          <button class="ui-btn ui-btn--ghost ui-btn--full" @click="go(ROUTE_NAMES.WH_MANAGER_INVENTORY)">
            재고 현황 보기
          </button>
        </div>
      </div>

    </div>

  </AppLayout>
</template>

<style scoped>
/* ── KPI Grid ─────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  cursor: pointer;
  transition: box-shadow var(--ease-default), transform var(--ease-fast);
}
.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-3);
}
.kpi-icon svg { width: 18px; height: 18px; }
.kpi-icon--gold  { background: var(--gold-pale); }
.kpi-icon--green { background: var(--green-pale); }
.kpi-icon--blue  { background: var(--blue-pale); }

.kpi-label { font-size: var(--font-size-sm); color: var(--t3); margin-bottom: var(--space-2); }
.kpi-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
  margin-bottom: var(--space-2);
}
.kpi-unit { font-family: var(--font-base); font-size: var(--font-size-sm); color: var(--t3); margin-left: 2px; }
.kpi-sub  { font-size: var(--font-size-xs); color: var(--t3); }

.acc { font-weight: 600; }
.acc--gold  { color: var(--gold); }
.acc--red   { color: var(--red); }
.acc--blue  { color: var(--blue); }
.acc--green { color: var(--green); }

/* ── Grids ────────────────────────────────────────────── */
.dash-grid-3 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

/* ── Card ─────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
}
.card-title { font-size: var(--font-size-md); font-weight: 700; color: var(--t1); }
.card-sub   { font-size: var(--font-size-xs); color: var(--t3); }
.card-body  { padding: var(--space-3) var(--space-5); }

/* ── Table ────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--surface-2); }
th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--t3);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}
td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--t2);
  border-bottom: 1px solid var(--border);
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--surface-2); }
.mono   { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--t3); }
.nowrap { white-space: nowrap; }

/* ── Badge ────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--blue   { background: var(--blue-pale);   color: var(--blue); }
.badge--green  { background: var(--green-pale);  color: var(--green); }
.badge--amber  { background: var(--amber-pale);  color: #b45309; }
.badge--red    { background: var(--red-pale);    color: var(--red); }

/* ── Dot ──────────────────────────────────────────────── */
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot--gold  { background: var(--gold); }
.dot--blue  { background: var(--blue); }
.dot--red   { background: var(--red); }
.dot--green { background: var(--green); }

/* ── Todo List ────────────────────────────────────────── */
.todo-list { list-style: none; }
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}
.todo-item:last-child { border-bottom: none; }
.todo-text {
  font-size: var(--font-size-sm);
  color: var(--t2);
  line-height: 1.4;
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.todo-time { font-size: var(--font-size-xs); color: var(--t3); white-space: nowrap; }

/* ── Buttons ──────────────────────────────────────────── */
.ui-btn--gold { background: var(--gold); color: #0d0d0d; border-color: var(--gold); font-weight: 700; }
.ui-btn--gold:hover { background: #e09415; border-color: #e09415; }
.ui-btn--sm   { height: 30px; padding: 0 12px; font-size: var(--font-size-xs); }
.ui-btn--full { width: 100%; margin-top: var(--space-4); justify-content: center; }

/* ── Alert Rows ───────────────────────────────────────── */
.alert-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}
.alert-row:last-of-type { border-bottom: none; }
.alert-info { flex: 1; }
.alert-sku       { font-size: var(--font-size-sm); font-weight: 600; color: var(--t1); }
.alert-threshold { font-size: var(--font-size-xs); color: var(--t3); margin-top: 2px; }
.alert-remaining { font-size: var(--font-size-xs); font-weight: 500; white-space: nowrap; }
.alert-remaining--red  { color: var(--red); }
.alert-remaining--gold { color: #92400e; }
</style>