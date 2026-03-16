<script setup>
/**
 * SellerDashboardView — Seller 메인 운영 현황 Dashboard 화면
 *
 * 현재 단계:
 *   - Dashboard 레이아웃 골격 구성
 *   - 상단 CTA 버튼 연결
 *   - 이후 mock 데이터와 섹션별 컴포넌트 확장 예정
 */
import { ROUTE_NAMES } from '@/constants'
import AppLayout from '@/components/layout/AppLayout.vue'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: 'Dashboard' }]
</script>

<template>
  <AppLayout title="Seller Dashboard" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ASN_CREATE }" class="ui-btn ui-
  btn--ghost">
        ASN 등록
      </RouterLink>
      <RouterLink
          :to="{ name: ROUTE_NAMES.SELLER_ORDER_REGISTER }"
          class="ui-btn ui-btn--primary"
      >
        주문 등록
      </RouterLink>
    </template>

    <section class="seller-dashboard">
      <!-- KPI 카드 4개 영역 -->
      <div class="kpi-grid">
        <div class="dashboard-card">가용 재고 총 수량</div>
        <div class="dashboard-card">금일 신규 주문</div>
        <div class="dashboard-card">출고 처리 현황</div>
        <div class="dashboard-card">재고 부족 알림</div>
      </div>

      <!-- 운영 메모 배너 -->
      <div class="dashboard-card dashboard-banner">운영 메모 배너</div>

      <!-- 차트 2개 영역 -->
      <div class="chart-grid">
        <div class="dashboard-card">주간 주문/출고 추이</div>
        <div class="dashboard-card">비율 차트</div>
      </div>

      <!-- 하단 테이블 2개 영역 -->
      <div class="table-grid">
        <div class="dashboard-card">최근 활동</div>
        <div class="dashboard-card">기간별 입고 재고 목록</div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
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
</style>
