<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/format'
import { getFeeProfiles, updateFeeProfile } from '@/api/member'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const breadcrumb = [{ label: '단가 관리' }, { label: '채널 수수료' }, { label: '판매 채널 수수료율 등록' }]
const profiles = ref([])
const activeChannel = ref('AMAZON_FBM')
const saveModal = ref(false)
const editModal = reactive({ open: false, profile: null, baseRate: 0, fixedFee: 0 })

const columns = [
  { key: 'name', label: '프로필명', width: '26%' },
  { key: 'baseRate', label: '기본 수수료율', align: 'center', width: '16%' },
  { key: 'fixedFee', label: '고정 수수료', align: 'center', width: '16%' },
  { key: 'updatedAt', label: '최근 개정일', align: 'center', width: '22%' },
  { key: 'actions', label: '관리', align: 'center', width: '20%' },
]

async function fetchProfiles() {
  ui.setLoading(true)
  try {
    const response = await getFeeProfiles()
    profiles.value = response.data
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchProfiles)

const channelRows = computed(() => profiles.value.filter((profile) => profile.channel === activeChannel.value))
const summaryMap = computed(() => ({
  AMAZON_FBM: 'Amazon FBM 기본 15% 요율을 기준으로 판매 수수료를 관리합니다.',
  SHOPIFY: 'Shopify 기본 2.9% + $0.30 결제 수수료를 관리합니다.',
  ETC: '기타 채널은 직접 입력한 기준 요율을 사용합니다.',
}))

function openEdit(profile) {
  editModal.profile = profile
  editModal.baseRate = profile.baseRate
  editModal.fixedFee = profile.fixedFee
  editModal.open = true
}

async function saveProfile() {
  ui.setLoading(true)
  try {
    await updateFeeProfile(editModal.profile.id, {
      baseRate: Number(editModal.baseRate),
      fixedFee: Number(editModal.fixedFee),
      updatedAt: new Date().toISOString(),
    })
    editModal.open = false
    saveModal.value = true
    await fetchProfiles()
  } finally {
    ui.setLoading(false)
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="판매 채널 수수료율 등록">
    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div class="page-grid">
      <section class="summary-grid">
        <button :class="['summary-card', 'summary-card--blue', { active: activeChannel === 'AMAZON_FBM' }]" type="button" @click="activeChannel = 'AMAZON_FBM'">
          <p class="summary-card__label">Amazon FBM</p>
          <strong class="summary-card__value">15%</strong>
          <span class="summary-card__desc">기본 판매 수수료 기준</span>
        </button>
        <button :class="['summary-card', 'summary-card--purple', { active: activeChannel === 'SHOPIFY' }]" type="button" @click="activeChannel = 'SHOPIFY'">
          <p class="summary-card__label">Shopify</p>
          <strong class="summary-card__value">2.9%</strong>
          <span class="summary-card__desc">결제 수수료 + $0.30</span>
        </button>
        <button :class="['summary-card', 'summary-card--gold', { active: activeChannel === 'ETC' }]" type="button" @click="activeChannel = 'ETC'">
          <p class="summary-card__label">기타 채널</p>
          <strong class="summary-card__value">직접 입력</strong>
          <span class="summary-card__desc">채널별 개별 요율 운영</span>
        </button>
      </section>

      <section class="section-card layout-two-col">
        <div>
          <header class="section-head">
            <div>
              <h3 class="section-title">채널별 수수료 프로필</h3>
              <p class="section-sub">채널별 판매 수수료와 고정 수수료를 관리합니다.</p>
            </div>
          </header>

          <BaseTable :columns="columns" :rows="channelRows">
            <template #cell-baseRate="{ value }">{{ value }}%</template>
            <template #cell-fixedFee="{ value, row }">{{ row.currency }} {{ Number(value).toFixed(2) }}</template>
            <template #cell-updatedAt="{ value }">{{ formatDate(value, 'datetime') }}</template>
            <template #cell-actions="{ row }"><button class="ui-btn ui-btn--ghost btn-sm" type="button" @click="openEdit(row)">개정안 생성</button></template>
          </BaseTable>
        </div>
        <aside class="guide-box">
          <h3>운영 가이드</h3>
          <p>{{ summaryMap[activeChannel] }}</p>
          <ul>
            <li>셀러가 채널을 선택하면 저장된 요율이 마진 시뮬레이터에 자동 반영됩니다.</li>
            <li>요율은 수시로 개정할 수 있고 최근 개정일을 함께 표시합니다.</li>
          </ul>
        </aside>
      </section>
    </div>

    <BaseModal :is-open="editModal.open" title="수수료 개정안 생성" width="520px" @cancel="editModal.open = false" @confirm="saveProfile">
      <div class="form-grid">
        <BaseForm label="프로필명"><input :value="editModal.profile?.name || ''" disabled type="text" /></BaseForm>
        <BaseForm label="기본 수수료율(%)"><input v-model="editModal.baseRate" type="number" min="0" step="0.1" /></BaseForm>
        <BaseForm label="고정 수수료"><input v-model="editModal.fixedFee" type="number" min="0" step="0.01" /></BaseForm>
      </div>
    </BaseModal>

    <BaseModal :is-open="saveModal" title="채널 수수료율 저장 확인" width="420px" @cancel="saveModal = false" @confirm="saveModal = false">
      <p>채널 수수료율이 저장되었습니다.</p>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: var(--space-5);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.summary-card,
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.summary-card {
  padding: var(--space-5) var(--space-6);
  display: grid;
  gap: var(--space-2);
  text-align: left;
  border-top: 4px solid transparent;
  transition: transform var(--ease-fast), box-shadow var(--ease-fast), border-color var(--ease-fast);
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card.active {
  border-color: var(--gold);
  box-shadow: var(--shadow-md);
}

.summary-card__label {
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.summary-card__value {
  font-family: var(--font-condensed);
  font-size: clamp(24px, 1.8vw, 34px);
  line-height: 1;
  color: var(--t1);
}

.summary-card__desc {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.summary-card--blue { border-top-color: var(--blue); }
.summary-card--purple { border-top-color: var(--purple); }
.summary-card--gold { border-top-color: var(--gold); }

.section-card {
  padding: var(--space-6);
}

.layout-two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-5);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-title {
  color: var(--t1);
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.section-sub {
  margin-top: 4px;
  color: var(--t3);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.guide-box {
  padding: 18px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  color: var(--t2);
  align-self: start;
}

.guide-box h3 {
  margin-bottom: 10px;
  color: var(--t1);
}

.guide-box ul {
  margin: 12px 0 0 18px;
  display: grid;
  gap: 8px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.btn-sm {
  padding: 7px 10px;
  font-size: var(--font-size-xs);
}

@media (max-width: 1080px) {
  .summary-grid,
  .layout-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
