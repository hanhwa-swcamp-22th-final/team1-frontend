<script setup>
/**
 * Seller 전용 모달 셸.
 * 공통 BaseModal을 건드리지 않고 Seller 범위 안에서만 규격을 확장한다.
 */
import { computed } from 'vue'

import { buildSellerModalPanelStyle } from '@/utils/sellerModal.utils.js'

const props = defineProps({
  title: { type: String, required: true },
  isOpen: { type: Boolean, required: true },
  width: { type: String, default: '' },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['compact', 'default', 'tall'].includes(value),
  },
  hideFooter: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const panelStyle = computed(() => {
  return buildSellerModalPanelStyle({
    size: props.size,
    width: props.width,
  })
})

const panelClass = computed(() => `seller-panel--${props.size}`)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="isOpen"
        class="seller-overlay"
        @click.self="emit('cancel')"
      >
        <Transition name="modal-panel">
          <div
            v-if="isOpen"
            :style="panelStyle"
            :class="panelClass"
            class="seller-panel"
          >
            <div class="seller-modal-header">
              <h3 class="seller-modal-title">{{ title }}</h3>
              <button
                type="button"
                aria-label="닫기"
                class="seller-close-btn"
                @click="emit('cancel')"
              >
                ✕
              </button>
            </div>

            <div class="seller-modal-body">
              <slot />
            </div>

            <div v-if="!hideFooter" class="seller-modal-footer">
              <slot name="footer">
                <button type="button" class="ui-btn ui-btn--ghost" @click="emit('cancel')">
                  취소
                </button>
                <button type="button" class="ui-btn ui-btn--primary" @click="emit('confirm')">
                  확인
                </button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.seller-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.55);
  backdrop-filter: blur(2px);
  z-index: var(--z-modal);
}

.seller-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.seller-panel--compact {
  border-radius: var(--radius-md);
}

.seller-panel--tall .seller-modal-body {
  padding-bottom: 28px;
}

.seller-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.seller-modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--t1);
}

.seller-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--t3);
  font-size: 14px;
  transition: all var(--ease-fast);
}

.seller-close-btn:hover {
  background: var(--surface-2);
  color: var(--t1);
}

.seller-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.seller-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
