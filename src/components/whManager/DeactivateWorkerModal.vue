<script setup>
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen:  { type: Boolean, required: true },
  worker:  { type: Object,  default: null  },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleConfirm() {
  if (!props.worker) return
  emit('confirm', { workerId: props.worker.id })
}
</script>

<template>
  <BaseModal
    title="작업자 비활성화"
    :isOpen="isOpen"
    @cancel="$emit('cancel')"
  >
    <template v-if="worker">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Deactivate Worker</div>
            <div class="hero-title">{{ worker.name }} 계정을 비활성화합니다</div>
            <div class="hero-copy">
              로그인과 신규 자동 배정이 즉시 중지됩니다.
              담당 Bin 배정이 해제되며 관리자에게 재배정 알림이 전송됩니다.
            </div>
          </div>
          <span class="badge badge--red">즉시 반영</span>
        </div>
        <div class="data-grid">
          <div class="data-card">
            <span class="data-label">작업자 코드</span>
            <div class="data-value mono">{{ worker.id }}</div>
          </div>
          <div class="data-card">
            <span class="data-label">담당 구역</span>
            <div class="data-value">{{ worker.zones?.join(', ') || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- 경고 callout -->
      <div class="callout callout--danger">
        <div class="callout-title">영향 범위</div>
        <div class="callout-copy">
          계정이 비활성화되면 해당 작업자는 즉시 로그인할 수 없습니다.
          이력 데이터는 삭제되지 않습니다.
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">취소</button>
        <button class="ui-btn ui-btn--danger" :disabled="!worker" @click="handleConfirm">비활성화</button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--red);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-1);
}

.hero-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.5;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.data-card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
}

.data-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
  display: block;
  margin-bottom: 2px;
}

.data-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t1);
}

.mono {
  font-family: var(--font-mono);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge--red { background: var(--red-pale); color: var(--red); }

.callout {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.callout--danger {
  background: var(--red-pale);
  border: 1px solid var(--red);
}

.callout-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--red);
  margin-bottom: var(--space-1);
}

.callout-copy {
  font-size: var(--font-size-xs);
  color: var(--t2);
  line-height: 1.5;
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}

.ui-btn {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.ui-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-btn--danger { background: var(--red); color: #fff; }
.ui-btn--danger:not(:disabled):hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>