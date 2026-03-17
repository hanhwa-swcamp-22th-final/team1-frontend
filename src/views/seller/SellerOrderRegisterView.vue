<script setup>
/**
 * SellerOrderRegisterView — Seller 주문 등록 화면의 최소 골격 페이지
 *
 * 현재 단계:
 *   - Seller 라우트 import 오류 해결
 *   - AppLayout 연결
 *   - 이후 주문 등록 폼 구현을 위한 화면 자리 확보
 */
import AppLayout from '@/components/layout/AppLayout.vue'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: '주문 등록' }]
</script>

<template>
  <AppLayout title="주문 등록" :breadcrumb="breadcrumb">
    <section class="order-register-page">
      <div class="placeholder-card">
        <h2 class="placeholder-title">주문 등록</h2>
        <p class="placeholder-description">
          Seller 주문 등록 화면 작업 중
        </p>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.order-register-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.placeholder-card {
  min-height: 240px;
  padding: var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-3);
}

.placeholder-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
  color: var(--t1);
}

.placeholder-description {
  font-size: var(--font-size-md);
  color: var(--t3);
}
</style>