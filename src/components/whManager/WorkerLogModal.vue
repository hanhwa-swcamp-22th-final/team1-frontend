<script setup>
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  worker: { type: Object, default: null },
})

const emit = defineEmits(['cancel'])
</script>

<template>
  <BaseModal
    title="작업자 이력 및 처리 현황"
    :is-open="isOpen"
    width="680px"
    @cancel="emit('cancel')"
    @confirm="emit('cancel')"
  >
    <template v-if="worker">
      <!-- 히어로 섹션 -->
      <div class="worker-hero">
        <div class="worker-hero__avatar">{{ worker.name?.charAt(0) }}</div>
        <div class="worker-hero__info">
          <p class="worker-hero__eyebrow">Worker Snapshot</p>
          <h3 class="worker-hero__name">{{ worker.name }}</h3>
          <p class="worker-hero__id">{{ worker.id }}</p>
          <StatusBadge :status="worker.presenceStatus" type="workerPresence" />
        </div>
      </div>

      <!-- KPI 카드 4개 -->
      <div class="metric-grid">
        <div class="metric-card">
          <p class="metric-card__label">오늘 완료</p>
          <p class="metric-card__value">{{ worker.todayCompleted ?? '-' }}</p>
        </div>
        <div class="metric-card">
          <p class="metric-card__label">평균 처리시간</p>
          <p class="metric-card__value">{{ worker.avgProcessTime ?? '-' }}</p>
        </div>
        <div class="metric-card">
          <p class="metric-card__label">불일치 등록</p>
          <p class="metric-card__value">{{ worker.mismatchCount ?? '-' }}</p>
        </div>
        <div class="metric-card">
          <p class="metric-card__label">고정 Bin</p>
          <p class="metric-card__value">{{ worker.fixedBinCount ?? '-' }}</p>
        </div>
      </div>

      <!-- 현재 작업 목록 -->
      <div v-if="worker.currentTasks?.length" class="section">
        <h4 class="section__title">현재 진행 중인 작업</h4>
        <ul class="task-timeline">
          <li v-for="t in worker.currentTasks" :key="t.id" class="task-timeline__item">
            <span class="task-timeline__dot"></span>
            <span class="task-timeline__text">{{ t.refDoc }} — {{ t.type }}</span>
            <StatusBadge :status="t.status" type="taskStatus" />
          </li>
        </ul>
      </div>

      <!-- 최근 완료 작업 테이블 -->
      <div v-if="worker.recentTasks?.length" class="section">
        <h4 class="section__title">최근 완료 작업</h4>
        <table class="log-table">
          <thead>
            <tr>
              <th>일시</th>
              <th>작업ID</th>
              <th>유형</th>
              <th>처리수량</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in worker.recentTasks" :key="t.id">
              <td>{{ t.doneAt }}</td>
              <td>{{ t.id }}</td>
              <td>{{ t.type }}</td>
              <td>{{ t.qty }}</td>
              <td><StatusBadge :status="t.result" type="taskStatus" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!worker.currentTasks?.length && !worker.recentTasks?.length" class="empty-msg">
        작업 이력이 없습니다.
      </p>
    </template>
  </BaseModal>
</template>

<style scoped>
.worker-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}
.worker-hero__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--blue-pale);
  color: var(--blue);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.worker-hero__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin: 0 0 2px;
}
.worker-hero__name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--t1);
}
.worker-hero__id {
  font-size: var(--font-size-sm);
  color: var(--t3);
  margin: 0 0 6px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.metric-card {
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
}
.metric-card__label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin: 0 0 4px;
}
.metric-card__value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin: 0;
}

.section {
  margin-bottom: 20px;
}
.section__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t2);
  margin: 0 0 10px;
}

.task-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-timeline__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--t2);
}
.task-timeline__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--blue);
  flex-shrink: 0;
}
.task-timeline__text {
  flex: 1;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.log-table th,
.log-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-1);
}
.log-table th {
  color: var(--t3);
  font-weight: 600;
  background: var(--surface-2);
}

.empty-msg {
  text-align: center;
  color: var(--t3);
  font-size: var(--font-size-sm);
  padding: 20px 0;
}
</style>