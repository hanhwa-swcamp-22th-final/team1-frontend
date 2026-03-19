<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import { ACCOUNT_STATUS } from '@/constants'

const ZONES = ['A', 'B', 'C', 'D']

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  worker: { type: Object,  default: null  },
})

const emit = defineEmits(['confirm', 'reset-password', 'cancel'])

const form = ref({ name: '', id: '', accountStatus: ACCOUNT_STATUS.ACTIVE, email: '', zones: [], memo: '' })
const errors = ref({})

watch(() => props.worker, (w) => {
  if (!w) return
  form.value = {
    name:          w.name          ?? '',
    id:            w.id            ?? '',
    accountStatus: w.accountStatus ?? ACCOUNT_STATUS.ACTIVE,
    email:         w.email         ?? '',
    zones:         [...(w.zones    ?? [])],
    memo:          w.memo          ?? '',
  }
  errors.value = {}
}, { immediate: true })

function toggleZone(zone) {
  const idx = form.value.zones.indexOf(zone)
  if (idx === -1) form.value.zones.push(zone)
  else form.value.zones.splice(idx, 1)
}

function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = '이름을 입력해 주세요.'
  errors.value = e
  return Object.keys(e).length === 0
}

function handleConfirm() {
  if (!validate()) return
  emit('confirm', {
    workerId:      props.worker.id,
    name:          form.value.name.trim(),
    accountStatus: form.value.accountStatus,
    email:         form.value.email.trim(),
    zones:         form.value.zones,
    memo:          form.value.memo.trim(),
  })
}

function handleResetPassword() {
  emit('reset-password', { workerId: props.worker.id })
}
</script>

<template>
  <BaseModal
    title="작업자 정보 수정"
    :isOpen="isOpen"
    @cancel="$emit('cancel')"
  >
    <template v-if="worker">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Account Settings</div>
            <div class="hero-title">{{ worker.name }} · <span class="mono">{{ worker.id }}</span></div>
            <div class="hero-copy">계정 상태와 담당 구역을 수정합니다.</div>
          </div>
        </div>
      </div>

      <!-- 기본 정보 -->
      <div class="section">
        <div class="form-grid">
          <BaseForm label="이름" required :error="errors.name">
            <input class="form-input" v-model="form.name" type="text" placeholder="홍길동" />
          </BaseForm>
          <BaseForm label="작업자 코드">
            <input class="form-input form-input--readonly" :value="form.id" type="text" readonly />
          </BaseForm>
          <BaseForm label="계정 상태">
            <select class="form-select" v-model="form.accountStatus">
              <option :value="ACCOUNT_STATUS.ACTIVE">활성</option>
              <option :value="ACCOUNT_STATUS.INACTIVE">비활성</option>
              <option :value="ACCOUNT_STATUS.TEMP_PASSWORD">임시비밀번호</option>
            </select>
          </BaseForm>
          <BaseForm label="이메일">
            <input class="form-input" v-model="form.email" type="email" placeholder="worker@example.com" />
          </BaseForm>
        </div>
      </div>

      <!-- 담당 구역 -->
      <div class="section">
        <div class="section-label">담당 구역</div>
        <div class="zone-row">
          <button
            v-for="zone in ZONES"
            :key="zone"
            type="button"
            class="zone-chip"
            :class="{ 'zone-chip--active': form.zones.includes(zone) }"
            @click="toggleZone(zone)"
          >
            {{ zone }} 존
          </button>
        </div>
      </div>

      <!-- 메모 -->
      <div class="section">
        <BaseForm label="메모">
          <textarea class="form-textarea" v-model="form.memo" rows="2" placeholder="작업자 관련 메모" />
        </BaseForm>
      </div>

      <!-- 비밀번호 초기화 안내 -->
      <div class="callout callout--warning">
        <div class="callout-title">비밀번호 초기화 안내</div>
        <div class="callout-copy">
          임시 비밀번호를 재발급하면 다음 로그인 시 비밀번호 변경이 강제됩니다.
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="handleResetPassword">비밀번호 초기화</button>
        <div class="footer-right">
          <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">취소</button>
          <button class="ui-btn ui-btn--primary" :disabled="!worker" @click="handleConfirm">저장</button>
        </div>
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
}

.eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
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

.mono {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.section {
  margin-bottom: var(--space-4);
}

.section-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t2);
  margin-bottom: var(--space-2);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-1);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.form-input:focus { outline: none; border-color: var(--blue); }
.form-input--readonly { background: var(--surface-2); color: var(--t3); cursor: default; }

.form-select {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-1);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.form-select:focus { outline: none; border-color: var(--blue); }

.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-1);
  color: var(--t1);
  font-size: var(--font-size-sm);
  resize: vertical;
}

.form-textarea:focus { outline: none; border-color: var(--blue); }

.zone-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.zone-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 5px var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.zone-chip--active {
  border-color: var(--blue);
  background: var(--blue-pale);
  color: var(--blue);
}

.callout {
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.callout--warning {
  background: var(--amber-pale);
  border: 1px solid #d97706;
}

.callout-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #b45309;
  margin-bottom: var(--space-1);
}

.callout-copy {
  font-size: var(--font-size-xs);
  color: var(--t2);
  line-height: 1.5;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.footer-right {
  display: flex;
  gap: var(--space-2);
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
.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>