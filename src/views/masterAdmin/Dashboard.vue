<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNumber } from '@/utils/format'
import { getOutboundStats } from '@/api/order'
import { getAsnStats, getInventoryStats, getWarehouseStatus } from '@/api/wms'
import { getSellerStats } from '@/api/member'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const breadcrumb = [{ label: 'CONK' }, { label: '통합 대시보드' }]

const ui           = useUiStore()
const summaryCards = ref([])
const warehouses   = ref([])
const fetchedAt    = ref(null)
const errorMsg     = ref('')

const sectionDate = computed(() =>
  fetchedAt.value ? formatDate(fetchedAt.value, 'datetime') + ' 실시간 기준' : ''
)

async function fetchDashboard() {
  errorMsg.value = ''
  ui.setLoading(true)
  try {
    const [outboundRes, asnRes, inventoryRes, sellerRes, whRes] = await Promise.all([
      getOutboundStats(),
      getAsnStats(),
      getInventoryStats(),
      getSellerStats(),
      getWarehouseStatus(),
    ])
    const o = outboundRes.data.data
    const a = asnRes.data.data
    const i = inventoryRes.data.data
    const s = sellerRes.data.data

    summaryCards.value = [
      {
        label: '전체 출고 예정 건수',
        value: formatNumber(o.pendingOutboundCount),
        trend: o.trend,
        trendLabel: o.trendLabel,
        trendType: o.trendType,
      },
      {
        label: '미처리 ASN (검수 대기)',
        value: String(a.unprocessedCount),
        trend: a.trend,
        trendLabel: a.trendLabel,
        trendType: a.trendType,
        valueColor: 'amber',
      },
      {
        label: '재고 부족 경고 SKU',
        value: String(i.lowStockSkuCount),
        trend: i.trend,
        trendLabel: i.trendLabel,
        trendType: i.trendType,
        valueColor: 'red',
      },
      {
        label: '활성 셀러 업체 수',
        value: String(s.activeSellerCount),
        trend: `${s.newThisMonth}개사`,
        trendLabel: '이번 달 신규',
        trendType: s.trendType,
      },
    ]
    warehouses.value = whRes.data.data
    fetchedAt.value  = new Date()
  } catch (err) {
    errorMsg.value = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[Dashboard] fetchDashboard error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="통합 대시보드">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-export">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <path
            d="M7 1v8M3.5 6.5L7 10l3.5-3.5"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          />
          <path
            d="M1.5 11v1.5h11V11"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.5"
          />
        </svg>
        데이터 내보내기
      </button>
      <button class="ui-btn btn-gold">
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <line
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            x1="7"
            x2="7"
            y1="2"
            y2="12"
          />
          <line
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            x1="2"
            x2="12"
            y1="7"
            y2="7"
          />
        </svg>
        신규 출고 지시
      </button>
    </template>

    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div v-if="errorMsg" class="fetch-error">
      {{ errorMsg }}
      <button @click="fetchDashboard">다시 시도</button>
    </div>

    <!-- ① 요약 카드 그리드 -->
    <div class="summary-grid">
      <div v-for="card in summaryCards" :key="card.label" class="summary-card">
        <span class="summary-label">{{ card.label }}</span>
        <span
          :class="{
            'summary-value--amber': card.valueColor === 'amber',
            'summary-value--red': card.valueColor === 'red',
          }"
          class="summary-value"
        >{{ card.value }}</span>
        <div
          :class="{
            'trend-up': card.trendType === 'up',
            'trend-down': card.trendType === 'down',
          }"
          class="summary-trend"
        >
          {{ card.trend }}
          <span class="trend-sub">{{ card.trendLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ② 섹션 헤더 -->
    <div class="section-header">
      <span class="section-title">주요 창고 운영 현황</span>
      <span class="section-date">{{ sectionDate }}</span>
    </div>

    <!-- ③ 창고 카드 목록 -->
    <div class="warehouse-cards">
      <div v-for="wh in warehouses" :key="wh.name" class="wh-card">
        <!-- 카드 헤더 -->
        <div class="wh-card-header">
          <div class="wh-info-top">
            <span class="wh-name">{{ wh.name }}</span>
            <span v-if="wh.tag" class="wh-tag">{{ wh.tag }}</span>
          </div>
          <div class="wh-header-right">
            <div class="progress-group">
              <div class="progress-meta">
                <span class="progress-label">금일 출고 진행률</span>
                <span class="progress-pct">{{ wh.progress }}%</span>
              </div>
              <div class="progress-bar">
                <div :style="{ width: wh.progress + '%' }" class="progress-fill" />
              </div>
            </div>
            <span
              :class="{
                'status-badge--active': wh.status === 'active',
                'status-badge--idle': wh.status === 'idle',
              }"
              class="status-badge"
            >
              <span class="status-dot" />
              {{ wh.statusLabel }}
            </span>
          </div>
        </div>

        <!-- 카드 바디 (KPI 4칸) -->
        <div class="wh-card-body">
          <div v-for="kpi in wh.kpis" :key="kpi.label" class="kpi-box">
            <span class="kpi-label">{{ kpi.label }}</span>
            <!-- 수치 KPI -->
            <template v-if="!kpi.carriers">
              <span :class="{ 'kpi-value--alert': kpi.alert }" class="kpi-value">
                {{ kpi.value }}<span class="kpi-unit">{{ kpi.unit }}</span>
              </span>
            </template>
            <!-- 캐리어 스케줄 -->
            <template v-else>
              <div class="carrier-schedule">
                <div v-for="carrier in kpi.carriers" :key="carrier.name" class="carrier-row">
                  <span class="carrier-name">{{ carrier.name }}</span>
                  <span class="carrier-time">{{ carrier.time }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.btn-export {
  border-radius: var(--radius-sm);   /* ui-btn의 --radius-md 대신 sm 사용 */
  font-family: var(--font-barlow);   /* ui-btn 기본 폰트(Inter) 대신 Barlow */
  font-weight: 500;                  /* ui-btn 기본 600 대신 500 */
}
.btn-export svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-gold {
  border-radius: var(--radius-sm);      /* ui-btn의 --radius-md 대신 sm */
  background: var(--gold);
  font-family: var(--font-barlow);
  font-weight: 700;
  color: var(--t1);
  border: none;
}
.btn-gold:hover {
  background: var(--gold-lt);
}
.btn-gold svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── 에러 배너 ─────────────────────────────────────────── */
.fetch-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-5);
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid var(--red);
  border-radius: var(--radius-md);
  color: var(--red);
  font-size: var(--font-size-sm);
}

/* ── 요약 카드 그리드 ──────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);                 /* 20px */
  margin-bottom: var(--space-8);       /* 32px */
}

.summary-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6); /* 20px 24px */
  display: flex;
  flex-direction: column;
  gap: var(--space-2);                 /* 8px */
  box-shadow: var(--shadow-sm);
}

.summary-label {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);      /* 11px */
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--t3);
}

.summary-value {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 36px;
  color: var(--t1);
  line-height: 1;
}
.summary-value--amber { color: var(--amber); }
.summary-value--red   { color: var(--red); }

.summary-trend {
  display: flex;
  align-items: center;
  gap: var(--space-2);                 /* 6px */
  font-family: var(--font-base);
  font-size: var(--font-size-sm);      /* 12px */
}
.trend-up   { color: var(--green); }
.trend-down { color: var(--red); }

.trend-sub {
  font-size: var(--font-size-xs);      /* 11px */
  color: var(--t3);
}

/* ── 섹션 헤더 ─────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);       /* 16px */
}

.section-title {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: var(--font-size-xl);      /* clamp(15px, 0.938vw, 18px) */
  letter-spacing: 0.5px;
  color: var(--t1);
}

.section-date {
  font-size: var(--font-size-sm);      /* 12px */
  color: var(--t3);
}

/* ── 창고 카드 ─────────────────────────────────────────── */
.warehouse-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);                 /* 16px */
}

.wh-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--ease-default);
}
.wh-card:hover {
  border-color: var(--gold);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* 카드 헤더 */
.wh-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6); /* 16px 24px */
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.wh-info-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);                 /* 12px */
}

.wh-name {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: var(--font-size-2xl);     /* clamp(18px, 1.146vw, 22px) */
  color: var(--t1);
}

.wh-tag {
  padding: var(--space-1) var(--space-2); /* 2px 8px */
  border-radius: var(--radius-sm);
  background: var(--sidebar);
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);      /* 10px */
  color: #fff;
  white-space: nowrap;
}

.wh-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-6);                 /* 24px */
}

/* 출고 진행률 */
.progress-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);                 /* 4px */
  width: 180px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.progress-label {
  font-family: var(--font-barlow);
  font-size: var(--font-size-xs);      /* 11px */
  color: var(--t3);
}

.progress-pct {
  font-family: var(--font-base);
  font-weight: 600;
  font-size: var(--font-size-md);      /* 14px */
  color: var(--green);
}

.progress-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--green);
  border-radius: 3px;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);                 /* 6px */
  padding: var(--space-2) var(--space-3); /* 6px 12px */
  border-radius: var(--radius-full);
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: var(--font-size-xs);      /* 11px */
  white-space: nowrap;
}
.status-badge--active {
  background: var(--green-pale);
  color: var(--green);
}
.status-badge--idle {
  background: var(--amber-pale);
  color: #b45309;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 카드 바디 */
.wh-card-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.kpi-box {
  padding: var(--space-6);             /* 24px */
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);                 /* 4px */
}
.kpi-box:last-child {
  border-right: none;
}

.kpi-label {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: var(--font-size-xs);      /* 10px */
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--t3);
}

.kpi-value {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 34px;
  color: var(--t1);
  line-height: 1.1;
}
.kpi-value--alert {
  color: var(--red);
}

.kpi-unit {
  font-family: var(--font-barlow);
  font-weight: 500;
  font-size: var(--font-size-md);      /* 14px */
  color: var(--t3);
  margin-left: var(--space-1);         /* 4px */
}
.kpi-value--alert .kpi-unit {
  color: var(--red);
}

/* 캐리어 스케줄 */
.carrier-schedule {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);                 /* 6px */
  margin-top: var(--space-1);          /* 4px */
}

.carrier-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-base);
  font-size: var(--font-size-sm);      /* 12px */
}

.carrier-name {
  font-weight: 600;
  color: var(--t2);
}
.carrier-time {
  color: var(--t3);
}
</style>
