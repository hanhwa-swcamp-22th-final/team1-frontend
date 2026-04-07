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

const isEditing = ref(false)
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
  isEditing.value = false
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

function handleCancel() {
  if (isEditing.value) {
    // 편집 취소: 원본 데이터로 복원
    const w = props.worker
    form.value = {
      name:          w.name          ?? '',
      id:            w.id            ?? '',
      accountStatus: w.accountStatus ?? ACCOUNT_STATUS.ACTIVE,
      email:         w.email         ?? '',
      zones:         [...(w.zones    ?? [])],
      memo:          w.memo          ?? '',
    }
    errors.value = {}
    isEditing.value = false
  } else {
    emit('cancel')
  }
}
</script>

<template>
  <BaseModal
    :title="isEditing ? '작업자 정보 수정' : '작업자 상세'"
    :isOpen="isOpen"
    @cancel="handleCancel"
  >
    <template v-if="worker">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Account Settings</div>
            <div class="hero-title">{{ worker.name }} · <span class="mono">{{ worker.id }}</span></div>
            <div class="hero-copy">{{ isEditing ? '정보를 수정하고 저장 버튼을 누르세요.' : '작업자 계정 정보를 확인합니다.' }}</div>
          </div>
        </div>
      </div>

      <!-- 기본 정보 -->
      <div class="section">
        <div class="form-grid">
          <BaseForm label="이름" :required="isEditing" :error="errors.name">
            <span v-if="!isEditing" class="read-value">{{ form.name }}</span>
            <input v-else class="form-input" v-model="form.name" type="text" placeholder="홍길동" />
          </BaseForm>
          <BaseForm label="작업자 코드">
            <span class="read-value read-value--muted">{{ form.id }}</span>
          </BaseForm>
          <BaseForm label="계정 상태">
            <span v-if="!isEditing" class="read-value">
              {{ form.accountStatus === ACCOUNT_STATUS.ACTIVE ? '활성' : form.accountStatus === ACCOUNT_STATUS.INACTIVE ? '비활성' : '임시비밀번호' }}
            </span>
            <select v-else class="form-select" v-model="form.accountStatus">
              <option :value="ACCOUNT_STATUS.ACTIVE">활성</option>
              <option :value="ACCOUNT_STATUS.INACTIVE">비활성</option>
              <option :value="ACCOUNT_STATUS.TEMP_PASSWORD">임시비밀번호</option>
            </select>
          </BaseForm>
          <BaseForm label="이메일">
            <span v-if="!isEditing" class="read-value">{{ form.email || '—' }}</span>
            <input v-else class="form-input" v-model="form.email" type="email" placeholder="worker@example.com" />
          </BaseForm>
        </div>
      </div>

      <!-- 담당 구역 -->
      <div class="section">
        <div class="section-label">담당 구역</div>
        <div class="zone-row">
          <template v-if="!isEditing">
            <span v-if="form.zones.length" v-for="zone in form.zones" :key="zone" class="zone-chip zone-chip--active zone-chip--static">{{ zone }} 존</span>
            <span v-else class="read-value read-value--muted">—</span>
          </template>
          <template v-else>
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
          </template>
        </div>
      </div>

      <!-- 메모 -->
      <div class="section">
        <BaseForm label="메모">
          <span v-if="!isEditing" class="read-value">{{ form.memo || '—' }}</span>
          <textarea v-else class="form-textarea" v-model="form.memo" rows="2" placeholder="작업자 관련 메모" />
        </BaseForm>
      </div>

      <!-- 비밀번호 초기화 안내 (편집 모드에서만) -->
      <div v-if="isEditing" class="callout callout--warning">
        <div class="callout-title">비밀번호 초기화 안내</div>
        <div class="callout-copy">
          임시 비밀번호를 재발급하면 다음 로그인 시 비밀번호 변경이 강제됩니다.
        </div>
      </div>
    </template>

    <!-- 커스텀 푸터 -->
    <template #footer>
      <div class="footer-row">
        <!-- 읽기 전용 모드 -->
        <template v-if="!isEditing">
          <button class="ui-btn ui-btn--ghost" @click="handleResetPassword">비밀번호 초기화</button>
          <div class="footer-right">
            <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
            <button class="ui-btn ui-btn--primary" :disabled="!worker" @click="isEditing = true">수정</button>
          </div>
        </template>
        <!-- 편집 모드 -->
        <template v-else>
          <div></div>
          <div class="footer-right">
            <button class="ui-btn ui-btn--ghost" @click="handleCancel">취소</button>
            <button class="ui-btn ui-btn--primary" :disabled="!worker" @click="handleConfirm">저장</button>
          </div>
        </template>
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

/* ── 읽기 전용 값 표시 ── */
.read-value {
  display: block;
  height: 36px;
  line-height: 36px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--t1);
}
.read-value--muted { color: var(--t3); }

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

.zone-chip--static {
  cursor: default;
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