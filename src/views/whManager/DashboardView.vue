<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { ROUTE_NAMES } from '@/constants'

const router = useRouter()

const today = computed(() =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
)

const todoItems = [
  { color: 'red',   text: 'ASN-2024-0312-003 입고 검수 완료 처리 필요', badge: '미처리', time: '10:30' },
  { color: 'gold',  text: '출고 지시 대기 주문 34건 — 피킹 리스트 발행 필요',            time: '11:00' },
  { color: 'blue',  text: '작업자 박민준 피킹 배정 확인 필요',                            time: '13:00' },
  { color: 'green', text: '출고 확정 대기 — ORD-20240312-028 택배사 인계 완료 처리',       time: '15:00' },
  { color: 'gold',  text: '재고 부족 경고 5종 — 셀러 알림 발송 확인',                     time: '17:00' },
]

const outboundLegend = [
  { color: '#4C74FF', label: '출고 지시 대기', count: 34 },
  { color: '#F5A623', label: '피킹 진행 중',   count: 12 },
  { color: '#2ECC87', label: '포장/라벨 완료', count: 8  },
  { color: '#E4E8F0', label: '출고 완료',      count: 28, border: true },
]

const recentAsns = [
  { id: 'ASN-2024-0312-001', seller: '이수빈 대표 / (주)글로우뷰티', sku: '앰플 세럼',     qty: '1,000개', date: '2026-03-14', status: '입고 대기',   color: 'amber' },
  { id: 'ASN-2024-0311-005', seller: '박정훈 / K-Style',             sku: '티셔츠 외 3종', qty: '500개',   date: '2026-03-13', status: '운송 중',     color: 'blue'  },
  { id: 'ASN-2024-0310-003', seller: '최소연 / 에코팩',              sku: '텀블러',         qty: '200개',   date: '2026-03-12', status: '수량 불일치', color: 'red'   },
  { id: 'ASN-2024-0309-002', seller: '이수빈 대표 / (주)글로우뷰티', sku: '마스크팩',       qty: '800개',   date: '2026-03-12', status: '입고 완료',   color: 'green' },
  { id: 'ASN-2024-0308-001', seller: '강민철 / K-Farm',              sku: '홍삼 진액',      qty: '300개',   date: '2026-03-11', status: '입고 완료',   color: 'green' },
]

const lowStockAlerts = [
  { sku: '앰플 세럼 30ml',   threshold: 100, remaining: 23, color: 'red'  },
  { sku: '마스크팩 (10매입)', threshold: 200, remaining: 78, color: 'red'  },
  { sku: '텀블러 350ml',     threshold: 50,  remaining: 55, color: 'gold' },
  { sku: '홍삼 진액 30포',    threshold: 100, remaining: 12, color: 'red'  },
  { sku: '티셔츠 L사이즈',    threshold: 30,  remaining: 32, color: 'gold' },
]

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
        <div class="kpi-value">8<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">ASN 처리 대기: <span class="acc acc--gold">3건</span></div>
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
        <div class="kpi-value">142<span class="kpi-unit">종</span></div>
        <div class="kpi-sub">재고 부족 경고: <span class="acc acc--red">5종</span></div>
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
        <div class="kpi-value">34<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">피킹 진행 중: <span class="acc acc--blue">12건</span></div>
      </div>

      <!-- 오늘 출고 완료 -->
      <div class="kpi-card" @click="go(ROUTE_NAMES.WH_MANAGER_OUTBOUND_CONFIRM)">
        <div class="kpi-icon kpi-icon--green">
          <svg viewBox="0 0 18 18" fill="none" stroke="#065f46" stroke-width="1.6">
            <path d="M2 9.5l4 4 10-8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="kpi-label">오늘 출고 완료</div>
        <div class="kpi-value">28<span class="kpi-unit">건</span></div>
        <div class="kpi-sub">전일 대비: <span class="acc acc--green">+4건↑</span></div>
      </div>

    </div>

    <!-- ── 중간: 작업 현황 + 출고 요약 ───────────────── -->
    <div class="dash-grid">

      <!-- 오늘의 작업 현황 -->
      <div class="card">
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

      <!-- 출고 현황 요약 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">출고 현황 요약</span>
          <span class="card-sub">오늘 기준</span>
        </div>
        <div class="card-body">
          <div class="donut-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100" aria-label="출고 현황 요약">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F4F6FA" stroke-width="16"/>
              <path d="M 50 12 A 38 38 0 0 1 69.4187 82.6636"  fill="none" stroke="#4C74FF" stroke-width="16" stroke-linecap="butt"/>
              <path d="M 69.4187 82.6636 A 38 38 0 0 1 35.795 85.2451" fill="none" stroke="#F5A623" stroke-width="16" stroke-linecap="butt"/>
              <path d="M 35.795 85.2451 A 38 38 0 0 1 18.1041 70.6556" fill="none" stroke="#2ECC87" stroke-width="16" stroke-linecap="butt"/>
              <path d="M 18.1041 70.6556 A 38 38 0 0 1 50 12"          fill="none" stroke="#E4E8F0" stroke-width="16" stroke-linecap="butt"/>
              <circle cx="50" cy="50" r="22" fill="#FFFFFF"/>
              <text x="50" y="46" text-anchor="middle" font-family="Barlow Condensed" font-size="16" font-weight="700" fill="#1A1A2E">82</text>
              <text x="50" y="58" text-anchor="middle" font-family="Barlow" font-size="9" fill="#7B859A">총 주문</text>
            </svg>
            <div class="donut-legend">
              <div v-for="item in outboundLegend" :key="item.label" class="donut-item">
                <span
                  class="donut-dot"
                  :style="{ background: item.color, outline: item.border ? '1px solid #C8D0E0' : 'none' }"
                ></span>
                {{ item.label }} <strong>{{ item.count }}</strong>
              </div>
            </div>
          </div>
          <div class="quick-actions">
            <button class="ui-btn ui-btn--gold" @click="go(ROUTE_NAMES.WH_MANAGER_OUTBOUND)">출고 지시 발행</button>
            <button class="ui-btn ui-btn--ghost"   @click="go(ROUTE_NAMES.WH_MANAGER_PICKING_LIST)">피킹 리스트</button>
          </div>
        </div>
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
                <td><span class="badge" :class="`badge--${asn.color}`">{{ asn.status }}</span></td>
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
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  align-items: start;
}
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

/* ── Donut ────────────────────────────────────────────── */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-2) 0;
}
.donut-legend { display: flex; flex-direction: column; gap: var(--space-2); }
.donut-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--t2);
}
.donut-item strong { margin-left: var(--space-1); }
.donut-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

.quick-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
  flex-wrap: wrap;
}

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