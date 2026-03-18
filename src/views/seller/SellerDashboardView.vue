<script setup>
/**
 * 셀러 대시보드 화면.
 * 실제 API 연동 전까지 로컬 mock 데이터를 사용해 운영 현황을 렌더링한다.
 */
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: 'Dashboard' }]

// 셀러 대시보드 API 가 준비되기 전까지 화면에서 사용하는 로컬 mock 데이터.
const dashboardData = {
  // 상단 KPI 카드에 표시할 요약 수치.
  summary: {
    availableStockQty: 12840,
    availableSkuCount: 236,
    todayNewOrders: 87,
    outbound: {
      pending: 12,
      inProgress: 31,
      completed: 44,
    },
    lowStockSkuCount: 9,
  },
  // 운영 메모나 임시 공지를 보여주는 배너 데이터.
  memoBanner: {
    title: '운영 메모',
    message: '금주 입고 예정 물량이 증가하여 ASN 등록 일정 확인 필요',
    updatedAt: '2026-03-17 09:00',
  },
  // 최근 7일 주문/출고 추이를 직접 그리기 위한 데이터.
  weeklyTrend: [
    { label: '03/11', orders: 42, shipped: 35 },
    { label: '03/12', orders: 51, shipped: 39 },
    { label: '03/13', orders: 48, shipped: 41 },
    { label: '03/14', orders: 66, shipped: 52 },
    { label: '03/15', orders: 73, shipped: 61 },
    { label: '03/16', orders: 58, shipped: 46 },
    { label: '03/17', orders: 87, shipped: 44 },
  ],
  // 재고 상태 비율 영역에 사용하는 데이터.
  ratioChart: [
    { label: '정상 재고', value: 78 },
    { label: '할당 재고', value: 15 },
    { label: '부족 재고', value: 7 },
  ],
  // 하단 최근 활동 패널에 사용하는 피드 데이터.
  recentActivities: [
    { id: 1, type: 'ORDER', message: '주문 12건이 신규 등록됨', time: '10분 전' },
    { id: 2, type: 'ASN', message: 'ASN-20260317-001 입고 완료', time: '32분 전' },
    { id: 3, type: 'ALERT', message: 'SKU-203 재고 부족 알림 발생', time: '1시간 전' },
  ],
  // 하단 입고 예정 재고 목록 패널에 사용하는 데이터.
  inboundInventory: [
    { id: 1, asnNo: 'ASN-20260317-001', warehouse: 'NJ Warehouse', qty: 1200, eta: '2026-03-19', status: '입고예정' },
    { id: 2, asnNo: 'ASN-20260316-004', warehouse: 'LA Warehouse', qty: 860, eta: '2026-03-18', status: '입고중' },
  ],
}

</script>

<template>
  <AppLayout title="Seller Dashboard" :breadcrumb="breadcrumb">
    <template #header-action>
      <!-- 현재 연결된 두 개의 셀러 작업 화면으로 바로 이동하는 CTA -->
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ASN_CREATE }" class="ui-btn ui-btn--ghost">ASN 등록</RouterLink>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ORDER_REGISTER }" class="ui-btn ui-btn--primary">주문 등록</RouterLink>
    </template>

    <section class="seller-dashboard">
      <!-- KPI 카드 4개 영역 -->
      <div class="kpi-grid">
        <div class="dashboard-card">
          <p class="card-label">가용 재고 총 수량</p>
          <strong class="card-value">{{ dashboardData.summary.availableStockQty }}</strong>
          <span class="card-sub">{{ dashboardData.summary.availableSkuCount }} SKU</span>
        </div>

        <div class="dashboard-card">
          <p class="card-label">금일 신규 주문</p>
          <strong class="card-value">{{ dashboardData.summary.todayNewOrders }}</strong>
          <span class="card-sub">오늘 기준 신규 등록 건수</span>
        </div>

        <div class="dashboard-card">
          <p class="card-label">출고 처리 현황</p>
          <strong class="card-value">{{ dashboardData.summary.outbound.completed }}</strong>
          <span class="card-sub">대기 {{ dashboardData.summary.outbound.pending }} / 진행 {{ dashboardData.summary.outbound.inProgress }}
          </span>
        </div>

        <div class="dashboard-card">
          <p class="card-label">재고 부족 알림</p>
          <strong class="card-value">{{ dashboardData.summary.lowStockSkuCount }}</strong>
          <span class="card-sub">안전재고 이하 SKU 수</span>
        </div>
      </div>


      <!-- 운영 메모 배너 -->
      <div class="dashboard-card dashboard-banner">
        <p class="card-label">{{ dashboardData.memoBanner.title }}</p>
        <strong class="banner-message">{{ dashboardData.memoBanner.message }}</strong>
        <span class="card-sub">업데이트: {{ dashboardData.memoBanner.updatedAt }}</span>
      </div>

      <!-- 차트 2개 영역 -->
      <div class="chart-grid">
        <div class="dashboard-card">
          <div class="section-head">
            <h2 class="section-title">주간 주문/출고 추이</h2>
            <span class="section-count">최근 7일</span>
          </div>

          <div class="trend-chart">
            <div
                v-for="item in dashboardData.weeklyTrend"
                :key="item.label"
                class="trend-item"
            >
              <div class="trend-bars">
                <span class="trend-bar trend-bar--orders" :style="{ height: `${item.orders}px` }" />
                <span class="trend-bar trend-bar--shipped" :style="{ height: `${item.shipped}px` }" />
              </div>
              <span class="trend-label">{{ item.label }}</span>
            </div>
          </div>

          <p class="chart-note">주문 / 출고</p>
        </div>

        <div class="dashboard-card">
          <div class="section-head">
            <h2 class="section-title">비율 차트</h2>
            <span class="section-count">재고 상태</span>
          </div>

          <ul class="ratio-list">
            <li
                v-for="(item, index) in dashboardData.ratioChart"
                :key="item.label"
                class="ratio-item"
            >
              <div class="ratio-meta">
                <span :class="`ratio-dot ratio-dot--${index}`" />
                <span class="ratio-label">{{ item.label }}</span>
                <strong class="ratio-value">{{ item.value }}%</strong>
              </div>
              <div class="ratio-track">
                <span :class="`ratio-fill ratio-fill--${index}`" :style="{ width: `${item.value}%` }" />
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 하단 테이블 2개 영역 - 최근 활동, 기간별 입고 재고 목록 -->
      <div class="table-grid">
        <div class="dashboard-card">
          <div class="section-head">
            <h2 class="section-title">최근 활동</h2>
            <span class="section-count">{{ dashboardData.recentActivities.length }}건</span>
          </div>

          <ul class="activity-list">
            <li
                v-for="activity in dashboardData.recentActivities"
                :key="activity.id"
                class="activity-item"
            >
              <div class="activity-main">
                <strong class="activity-type">{{ activity.type }}</strong>
                <p class="activity-message">{{ activity.message }}</p>
              </div>
              <span class="activity-time">{{ activity.time }}</span>
            </li>
          </ul>
        </div>

        <div class="dashboard-card">
          <div class="section-head">
            <h2 class="section-title">기간별 입고 재고 목록</h2>
            <span class="section-count">{{ dashboardData.inboundInventory.length }}건</span>
          </div>

          <ul class="inventory-list">
            <li
                v-for="item in dashboardData.inboundInventory"
                :key="item.id"
                class="inventory-item"
            >
              <div class="inventory-main">
                <strong class="inventory-id">{{ item.asnNo }}</strong>
                <p class="inventory-meta">{{ item.warehouse }} · ETA {{ item.eta }}</p>
              </div>

              <div class="inventory-side">
                <strong class="inventory-qty">{{ item.qty }}</strong>
                <span class="inventory-status">{{ item.status }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

    </section>
  </AppLayout>
</template>

<style scoped>
/* 대시보드 레이아웃 골격 Style */
.seller-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.chart-grid,
.table-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.dashboard-card {
  min-height: 180px;
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.dashboard-banner {
  min-height: 120px;
}
/* kpi 카드 style */
.card-label {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

.card-value {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-condensed);
  font-size: 32px;
  color: var(--t1);
  line-height: 1;
}

.card-sub {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--t3);
}
.banner-message {
  display: block;
  margin-top: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--t1);
  line-height: 1.5;
}

/* 최근 활등 Style */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--t1);
}

.section-count {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}

.activity-item:first-child {
  padding-top: 0;
  border-top: none;
}

.activity-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.activity-type {
  font-size: var(--font-size-xs);
  color: var(--blue);
}

.activity-message {
  font-size: var(--font-size-md);
  color: var(--t2);
}

.activity-time {
  font-size: var(--font-size-sm);
  color: var(--t3);
  white-space: nowrap;
}

/* 기간별 입고 재고 목록 Style */
.inventory-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.inventory-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}

.inventory-item:first-child {
  padding-top: 0;
  border-top: none;
}

.inventory-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.inventory-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--t1);
}

.inventory-meta {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

.inventory-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.inventory-qty {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  color: var(--t1);
}

.inventory-status {
  font-size: var(--font-size-sm);
  color: var(--blue);
}

/* 차트 부분 Style */
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 180px;
}

.trend-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.trend-bars {
  width: 100%;
  min-height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
}

.trend-bar {
  width: 14px;
  border-radius: var(--radius-full);
}

.trend-bar--orders {
  background: var(--blue);
}

.trend-bar--shipped {
  background: var(--gold);
}

.trend-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.chart-note {
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--t3);
}

.ratio-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ratio-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ratio-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ratio-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}

.ratio-dot--0,
.ratio-fill--0 {
  background: var(--green);
}

.ratio-dot--1,
.ratio-fill--1 {
  background: var(--blue);
}

.ratio-dot--2,
.ratio-fill--2 {
  background: var(--red);
}

.ratio-label {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--t2);
}

.ratio-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  color: var(--t1);
}

.ratio-track {
  width: 100%;
  height: 10px;
  background: var(--surface-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ratio-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-full);
}


</style>
