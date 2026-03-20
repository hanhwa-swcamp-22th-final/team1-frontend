<script setup>
/**
 * Seller 전용 확인 다이얼로그.
 * SellerBaseModal 위에 얇게 얹어 Seller 화면에만 사용한다.
 */
import SellerBaseModal from '@/components/seller/SellerBaseModal.vue'

defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, default: '확인' },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: '확인' },
  cancelLabel: { type: String, default: '취소' },
  danger: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <SellerBaseModal
    :isOpen="isOpen"
    :title="title"
    hide-footer
    size="compact"
    @cancel="emit('cancel')"
  >
    <p class="seller-confirm-message">{{ message }}</p>

    <div class="seller-confirm-actions">
      <button type="button" class="ui-btn ui-btn--ghost" @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        :class="danger ? 'ui-btn--danger' : 'ui-btn--primary'"
        class="ui-btn"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </SellerBaseModal>
</template>

<style scoped>
.seller-confirm-message {
  font-size: var(--font-size-md);
  color: var(--t2);
  line-height: 1.6;
  padding-bottom: 4px;
}

.seller-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
