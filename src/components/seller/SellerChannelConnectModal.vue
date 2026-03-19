<script setup>
/**
 * Seller 채널 연결 모달.
 * 채널 연결에 필요한 기본 설정 값을 입력받는다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'
import { getSellerChannelSyncStatusMeta } from '@/utils/channelOrders.utils.js'

defineProps({
  isOpen: { type: Boolean, required: true },
  channelCard: { type: Object, default: null },
  form: { type: Object, required: true },
})

const emit = defineEmits(['cancel', 'confirm'])
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="channelCard?.label ? `${channelCard.label} 채널 연결` : '채널 연결'"
    size="default"
    hide-footer
    @cancel="emit('cancel')"
  >
    <div v-if="channelCard" class="channel-connect-modal">
      <section class="hero-card">
        <div>
          <p class="hero-eyebrow">Seller Channel Connect</p>
          <h2 class="hero-title">{{ channelCard.label }}</h2>
          <p class="hero-copy">{{ channelCard.description }}</p>
        </div>

        <span
          class="sync-badge"
          :class="`sync-badge--${getSellerChannelSyncStatusMeta(channelCard.syncStatus).tone}`"
        >
          {{ getSellerChannelSyncStatusMeta(channelCard.syncStatus).label }}
        </span>
      </section>

      <div class="form-grid">
        <label class="field">
          <span class="field-label">스토어 별칭</span>
          <input v-model="form.storeAlias" type="text" placeholder="예: Qoo10 KR Store" />
        </label>

        <label class="field">
          <span class="field-label">운영 이메일</span>
          <input v-model="form.contactEmail" type="email" placeholder="ops@example.com" />
        </label>

        <label class="field field--full">
          <span class="field-label">동기화 정책</span>
          <select v-model="form.syncMode">
            <option value="AUTO">자동 수집</option>
            <option value="MANUAL">수동 확인 후 수집</option>
          </select>
        </label>
      </div>

      <p class="helper-text">실제 API 키 저장은 범위에서 제외하고, 연결 완료 상태와 운영 설정 UI만 확인합니다.</p>

      <div class="modal-actions">
        <button type="button" class="ui-btn ui-btn--ghost" @click="emit('cancel')">닫기</button>
        <button type="button" class="ui-btn ui-btn--primary" @click="emit('confirm')">연결 완료</button>
      </div>
    </div>
  </SellerBaseModal>
</template>

<style scoped>
.channel-connect-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
}

.hero-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0 0 var(--space-2);
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.hero-copy,
.helper-text {
  margin: 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.sync-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.sync-badge--gold {
  background: var(--gold-pale);
  color: #b45309;
}

.sync-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.sync-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

.sync-badge--default {
  background: var(--surface);
  color: var(--t3);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field--full {
  grid-column: 1 / -1;
}

.field-label {
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.field input,
.field select {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    flex-direction: column;
  }
}
</style>
