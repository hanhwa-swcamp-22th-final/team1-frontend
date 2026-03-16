<script setup>
/**
 * EmptyState — 데이터 없음 / 빈 상태 표시 컴포넌트
 *
 * Props:
 *   title       : string — 제목 (기본 '데이터가 없습니다')
 *   description : string — 설명 (없으면 표시 안함)
 *   icon        : string — 이모지 아이콘 (없으면 기본 SVG 클립보드 아이콘 표시)
 *
 * Slots:
 *   icon   — 커스텀 아이콘 SVG 또는 이미지 (icon prop 대신 사용)
 *   action — 버튼 등 액션 영역 (없으면 공간 미렌더링)
 *
 * action 슬롯 사용 예 (버튼 추가):
 *   <EmptyState title="주문이 없습니다" description="첫 주문을 등록해보세요.">
 *     <template #action>
 *       <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ORDER_REGISTER }">
 *         <button class="btn-gold">주문 등록</button>
 *       </RouterLink>
 *     </template>
 *   </EmptyState>
 *
 * icon 슬롯 사용 예:
 *   <EmptyState title="검색 결과 없음">
 *     <template #icon>
 *       <svg ...>...</svg>
 *     </template>
 *   </EmptyState>
 */
defineProps({
  title: { type: String, default: '데이터가 없습니다' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <!-- icon 슬롯이 있으면 우선 사용, 없으면 icon prop, 그것도 없으면 기본 SVG -->
      <slot name="icon">
        <span v-if="icon">{{ icon }}</span>
        <!-- 기본 아이콘: 클립보드 형태 SVG -->
        <svg v-else fill="none" viewBox="0 0 48 48">
          <rect height="28" rx="3" stroke="currentColor" stroke-width="2" width="32" x="8" y="12" />
          <path
            d="M16 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            x1="18"
            x2="30"
            y1="22"
            y2="22"
          />
          <line
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            x1="18"
            x2="26"
            y1="28"
            y2="28"
          />
        </svg>
      </slot>
    </div>

    <p class="empty-title">{{ title }}</p>
    <p v-if="description" class="empty-desc">{{ description }}</p>

    <!-- action 슬롯: $slots.action이 있을 때만 래퍼 div 렌더링 -->
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: var(--t4);
}
.empty-icon svg {
  width: 28px;
  height: 28px;
}
.empty-icon span {
  font-size: 24px;
}

.empty-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--t2);
}
.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--t3);
  line-height: 1.5;
}
.empty-action {
  margin-top: 12px;
}
</style>
