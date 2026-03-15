<script setup>
/**
 * TimelineStepper — 단계별 상태 타임라인
 *
 * Props:
 *   steps       : Array<{ key: string, label: string }> — 단계 정의 배열 (순서대로)
 *   currentStep : string — 현재 활성 단계의 key
 *
 * 단계 상태(stepState):
 *   index < currentIndex  → 'done'    (완료: 초록 배경 + 체크 SVG)
 *   index === currentIndex → 'active'  (진행 중: 파란 배경 + 숫자)
 *   index > currentIndex  → 'pending' (대기: 회색 배경 + 숫자)
 *
 * 커넥터 라인:
 *   각 단계 사이의 가로 선. i <= currentIndex이면 초록색(done), 아니면 회색.
 *
 * 사용 예:
 *   const ORDER_STEPS = [
 *     { key: 'PENDING',   label: '접수'  },
 *     { key: 'CONFIRMED', label: '확인'  },
 *     { key: 'PICKING',   label: '피킹'  },
 *     { key: 'PACKING',   label: '패킹'  },
 *     { key: 'SHIPPED',   label: '출고완료' },
 *   ]
 *   <TimelineStepper :steps="ORDER_STEPS" :currentStep="order.status" />
 */
import { computed } from 'vue'

const props = defineProps({
  steps:       { type: Array,  required: true },
  currentStep: { type: String, required: true },
})

/**
 * currentStep의 steps 배열 내 인덱스.
 * 일치하는 key가 없으면 -1 → 모든 단계가 pending 상태로 표시됨.
 */
const currentIndex = computed(
  () => props.steps.findIndex((s) => s.key === props.currentStep)
)

/**
 * 각 단계의 상태 계산
 * @param {number} index — steps 배열 내 인덱스
 * @returns {'done'|'active'|'pending'}
 */
function stepState(index) {
  if (index < currentIndex.value)  return 'done'    // 완료된 단계
  if (index === currentIndex.value) return 'active'  // 현재 단계
  return 'pending'                                   // 아직 안 된 단계
}
</script>

<template>
  <div class="stepper" role="list">
    <div
      v-for="(step, i) in steps"
      :key="step.key"
      class="step"
      :class="`step--${stepState(i)}`"
      role="listitem"
      :aria-current="i === currentIndex ? 'step' : undefined"
    >
      <!--
        커넥터 라인: 첫 번째 단계(i===0) 이후부터 표시.
        connector--done: i <= currentIndex (현재 단계 진입 전까지의 연결선을 초록으로)
      -->
      <div v-if="i > 0" class="connector" :class="{ 'connector--done': i <= currentIndex }" />

      <!-- 아이콘 영역 -->
      <div class="step-icon">
        <!--
          done 상태: SVG 체크마크 수동 경로 설명
            viewBox="0 0 16 16" 기준:
            M6.5 11.5 → 체크의 왼쪽 하단 꺾임점
            L3 8       → 체크의 왼쪽 상단
            l1.4-1.4   → 대각선 위
            l2.1 2.1   → 대각선 아래
            l5.1-5.1   → 오른쪽 긴 대각선
            L13 5      → 끝점
        -->
        <svg v-if="stepState(i) === 'done'" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1 5.1-5.1L13 5z"/>
        </svg>
        <!-- done이 아닌 상태: 단계 번호(1-based) 표시 -->
        <span v-else>{{ i + 1 }}</span>
      </div>

      <span class="step-label">{{ step.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  padding: 4px 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  min-width: 72px;
}

/* ── 커넥터 (단계 사이 가로선) ────────────────── */
.connector {
  position: absolute;
  top: 15px;                        /* 아이콘 중심 높이에 맞춤 (32px/2 - 1px) */
  right: calc(50% + 16px);          /* 오른쪽 아이콘 가장자리까지 */
  left: calc(-50% + 16px);          /* 왼쪽 아이콘 가장자리부터 */
  height: 2px;
  background: var(--border);
  transition: background var(--ease-default);
}
.connector--done { background: var(--green); }

/* ── 아이콘 원형 ────────────────────────────── */
.step-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  position: relative;
  z-index: 1;                       /* 커넥터 라인 위에 오도록 */
  transition: all var(--ease-default);
  flex-shrink: 0;
}

.step-icon svg { width: 16px; height: 16px; }

.step--done    .step-icon { background: var(--green);      color: #fff; }
.step--active  .step-icon {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 0 0 4px var(--blue-pale);  /* 활성 단계 강조 링 */
}
.step--pending .step-icon {
  background: var(--surface-2);
  color: var(--t4);
  border: 2px solid var(--border);
}

/* ── 라벨 ─────────────────────────────────── */
.step-label {
  margin-top: 8px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}
.step--done    .step-label { color: var(--green); }
.step--active  .step-label { color: var(--blue); font-weight: 700; }
.step--pending .step-label { color: var(--t4); }
</style>
