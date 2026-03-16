<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'

const breadcrumb = [{label: 'CONK'}, {label: '통합 대시보드'}]

const summaryCards = [
  {
    label: '전체 출고 예정 건수',
    value: '1,284',
    trend: '+12.4%',
    trendLabel: 'vs 어제',
    trendType: 'up',
  },
  {
    label: '미처리 ASN (검수 대기)',
    value: '42',
    trend: '2건 증가',
    trendLabel: '지연 1시간',
    trendType: 'down',
    valueColor: 'amber',
  },
  {
    label: '재고 부족 경고 SKU',
    value: '18',
    trend: '4건 증가',
    trendLabel: '긴급 보충 필요',
    trendType: 'down',
    valueColor: 'red',
  },
  {
    label: '활성 셀러 업체 수',
    value: '156',
    trend: '3개사',
    trendLabel: '이번 달 신규',
    trendType: 'up',
  },
]

const warehouses = [
  {
    name: 'LA West Coast Hub',
    tag: '메인 거점',
    progress: 92,
    status: 'active',
    statusLabel: '정상 운영중',
    kpis: [
      {label: '출고 대기 건수', value: '142', unit: '건'},
      {label: '미처리 ASN', value: '12', unit: '건'},
      {label: '재고 부족 경고', value: '3', unit: 'SKU', alert: true},
      {
        label: '집하 마감중',
        carriers: [
          {name: 'USPS', time: '16:00'},
          {name: 'FedEx', time: '18:30'},
        ],
      },
    ],
  },
  {
    name: 'Central Dallas Center',
    tag: null,
    progress: 65,
    status: 'active',
    statusLabel: '정상 운영중',
    kpis: [
      {label: '출고 대기 건수', value: '81', unit: '건'},
      {label: '미처리 ASN', value: '4', unit: '건'},
      {label: '재고 부족 경고', value: '1', unit: 'SKU', alert: true},
      {
        label: '집하 마감중',
        carriers: [
          {name: 'UPS', time: '17:30'},
          {name: 'FedEx', time: '19:10'},
        ],
      },
    ],
  },
  {
    name: 'East NY Hub',
    tag: null,
    progress: 48,
    status: 'idle',
    statusLabel: '주의 모니터링',
    kpis: [
      {label: '출고 대기 건수', value: '96', unit: '건'},
      {label: '미처리 ASN', value: '26', unit: '건'},
      {label: '재고 부족 경고', value: '8', unit: 'SKU', alert: true},
      {
        label: '집하 마감중',
        carriers: [
          {name: 'USPS', time: '15:30'},
          {name: 'DHL', time: '17:00'},
        ],
      },
    ],
  },
]
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="통합 대시보드">
    <template #header-action>
      <button class="btn-export">
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
      <button class="btn-gold">
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
        >{{ card.value }}</span
        >
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
      <span class="section-date">2026.03.12 14:30 실시간 기준</span>
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
                <div :style="{ width: wh.progress + '%' }" class="progress-fill"/>
              </div>
            </div>
            <span
                :class="{
                'status-badge--active': wh.status === 'active',
                'status-badge--idle': wh.status === 'idle',
              }"
                class="status-badge"
            >
              <span class="status-dot"/>
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
/* ── 헤더 액션 버튼 ────────────────────────────── */
.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-barlow);
  font-size: 13px;
  font-weight: 500;
  color: var(--t2);
  cursor: pointer;
  transition: all var(--ease-fast);
}

.btn-export:hover {
  background: var(--surface-2);
  border-color: var(--border-dk);
}

.btn-export svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-gold {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--gold);
  font-family: var(--font-barlow);
  font-size: 13px;
  font-weight: 700;
  color: var(--t1);
  cursor: pointer;
  transition: background var(--ease-fast);
}

.btn-gold:hover {
  background: var(--gold-lt);
}

.btn-gold svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── 요약 카드 그리드 ─────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow-sm);
}

.summary-label {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: 11px;
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

.summary-value--amber {
  color: var(--amber);
}

.summary-value--red {
  color: var(--red);
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-base);
  font-size: 12px;
}

.trend-up {
  color: var(--green);
}

.trend-down {
  color: var(--red);
}

.trend-sub {
  font-size: 11px;
  color: var(--t3);
}

/* ── 섹션 헤더 ───────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  color: var(--t1);
}

.section-date {
  font-size: 12px;
  color: var(--t3);
}

/* ── 창고 카드 ───────────────────────────────── */
.warehouse-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 16px 24px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.wh-info-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wh-name {
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 22px;
  color: var(--t1);
}

.wh-tag {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--sidebar);
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: 10px;
  color: #fff;
  white-space: nowrap;
}

.wh-header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 출고 진행률 */
.progress-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 180px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.progress-label {
  font-family: var(--font-barlow);
  font-size: 11px;
  color: var(--t3);
}

.progress-pct {
  font-family: var(--font-base);
  font-weight: 600;
  font-size: 14px;
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
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-family: var(--font-barlow);
  font-weight: 700;
  font-size: 11px;
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
  padding: 24px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-box:last-child {
  border-right: none;
}

.kpi-label {
  font-family: var(--font-barlow);
  font-weight: 600;
  font-size: 10px;
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
  font-size: 14px;
  color: var(--t3);
  margin-left: 4px;
}

.kpi-value--alert .kpi-unit {
  color: var(--red);
}

/* 캐리어 스케줄 */
.carrier-schedule {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.carrier-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-base);
  font-size: 12px;
}

.carrier-name {
  font-weight: 600;
  color: var(--t2);
}

.carrier-time {
  color: var(--t3);
}
</style>
