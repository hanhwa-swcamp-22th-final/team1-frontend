<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import { ACCOUNT_STATUS, WORKER_PRESENCE_STATUS } from '@/constants'

const ZONES = ['A', 'B', 'C', 'D']

const props = defineProps({
  isOpen: { type: Boolean, required: true },
})

const emit = defineEmits(['confirm', 'cancel'])

const initialForm = () => ({ name: '', id: '', password: '', email: '', zones: [], memo: '' })
const form = ref(initialForm())
const errors = ref({})

function toggleZone(zone) {
  const idx = form.value.zones.indexOf(zone)
  if (idx === -1) form.value.zones.push(zone)
  else form.value.zones.splice(idx, 1)
}

function validate() {
  const e = {}
  if (!form.value.name.trim())     e.name     = '이름을 입력해 주세요.'
  if (!form.value.id.trim())       e.id       = '작업자 코드를 입력해 주세요.'
  if (!form.value.password.trim()) e.password = '초기 비밀번호를 입력해 주세요.'
  errors.value = e
  return Object.keys(e).length === 0
}

function handleConfirm() {
  if (!validate()) return
  emit('confirm', {
    name:          form.value.name.trim(),
    id:            form.value.id.trim(),
    password:      form.value.password.trim(),
    email:         form.value.email.trim(),
    zones:         form.value.zones,
    memo:          form.value.memo.trim(),
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    presenceStatus: WORKER_PRESENCE_STATUS.OFFLINE,
    lastWorkAt:    null,
    registeredAt:  new Date().toISOString().slice(0, 10),
  })
}

function handleCancel() {
  form.value = initialForm()
  errors.value = {}
  emit('cancel')
}
</script>

<template>
  <BaseModal
    title="작업자 계정 생성"
    :isOpen="isOpen"
    @cancel="handleCancel"
  >
    <!-- 히어로 -->
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow">Direct Issuance</div>
          <div class="hero-title">현장 작업자 계정 신규 발급</div>
          <div class="hero-copy">
            작업자 코드를 즉시 발급하고 비밀번호를 직접 설정합니다.
            이메일은 선택값이며, 계정은 생성 즉시 활성 상태가 됩니다.
          </div>
        </div>
        <span class="badge badge--green">즉시 활성</span>
      </div>
    </div>

    <!-- 기본 정보 -->
    <div class="section">
      <div class="section-label">기본 정보</div>
      <div class="form-grid">
        <BaseForm label="이름" required :error="errors.name">
          <input class="form-input" v-model="form.name" type="text" placeholder="홍길동" />
        </BaseForm>
        <BaseForm label="작업자 코드" required :error="errors.id">
          <input class="form-input" v-model="form.id" type="text" placeholder="WK-A-001" />
        </BaseForm>
        <BaseForm label="초기 비밀번호" required :error="errors.password">
          <input class="form-input" v-model="form.password" type="password" placeholder="Temp!2026" />
        </BaseForm>
        <BaseForm label="이메일 (선택)">
          <input class="form-input" v-model="form.email" type="email" placeholder="worker@example.com" />
        </BaseForm>
      </div>
    </div>

    <!-- 담당 구역 -->
    <div class="section">
      <div class="section-label">담당 구역 설정</div>
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
        <textarea class="form-textarea" v-model="form.memo" rows="2" placeholder="신규 채용 작업자. 특이사항 입력" />
      </BaseForm>
    </div>

    <!-- 안내 callout -->
    <div class="callout callout--info">
      <div class="callout-title">운영 메모</div>
      <div class="callout-copy">
        임시 비밀번호 정책을 함께 쓰면 첫 로그인 시 비밀번호 변경을 강제할 수 있습니다.
      </div>
    </div>

    <template #footer>
      <div class="footer-row">
        <button class="ui-btn ui-btn--ghost" @click="handleCancel">취소</button>
        <button class="ui-btn ui-btn--primary" @click="handleConfirm">생성</button>
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
  color: var(--green);
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
.badge--green { background: var(--green-pale); color: var(--green); }

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

.callout--info {
  background: var(--blue-pale);
  border: 1px solid var(--blue);
}

.callout-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--blue);
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

.ui-btn--primary { background: var(--blue); color: #fff; }
.ui-btn--primary:hover { opacity: 0.9; }
.ui-btn--ghost { border-color: var(--border); background: transparent; color: var(--t2); }
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
</style>