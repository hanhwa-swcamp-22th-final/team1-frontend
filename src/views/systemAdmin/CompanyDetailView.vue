<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/format'
import { createCompanyLog, createUser, getCompanies, getCompanyLogs, getUsers, updateCompany } from '@/api/member'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()
const companyId = Number(route.params.id)
const company = ref(null)
const users = ref([])
const logs = ref([])
const editForm = reactive({ representative: '', businessNumber: '', phone: '', email: '', address: '' })
const inviteModal = reactive({ open: false, name: '', email: '', error: '' })

const breadcrumb = computed(() => [{ label: '플랫폼 관리' }, { label: '업체 관리' }, { label: company.value?.name || '업체 상세' }])

const adminColumns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'status', label: '상태', align: 'center' },
  { key: 'lastLoginAt', label: '마지막 로그인', align: 'center' },
]
const warehouseColumns = [
  { key: 'code', label: '코드' },
  { key: 'name', label: '창고명' },
  { key: 'status', label: '상태', align: 'center' },
]
const logColumns = [
  { key: 'at', label: '일시', width: '25%' },
  { key: 'actor', label: '작업자', width: '25%' },
  { key: 'action', label: '변경 내용', width: '50%' },
]

async function fetchData() {
  ui.setLoading(true)
  try {
    const [companyRes, userRes, logRes] = await Promise.all([
      getCompanies({ id: companyId }),
      getUsers({ companyId }),
      getCompanyLogs(),
    ])
    company.value = companyRes.data.data[0] || null
    users.value = userRes.data.data
    logs.value = logRes.data.data.sort((a, b) => new Date(b.at) - new Date(a.at))
    if (company.value) {
      editForm.representative = company.value.representative || ''
      editForm.businessNumber = company.value.businessNumber || ''
      editForm.phone = company.value.phone || ''
      editForm.email = company.value.email || ''
      editForm.address = company.value.address || ''
    }
  } finally {
    ui.setLoading(false)
  }
}

onMounted(fetchData)

const masterAdmins = computed(() => users.value.filter((item) => item.role === 'MASTER_ADMIN'))

function statusText(status) {
  return { ACTIVE: '활성', SETTING: '설정중', INACTIVE: '비활성', INVITE_PENDING: '초대대기', LOCKED: '잠금' }[status] ?? status
}

function statusClass(status) {
  return {
    ACTIVE: 'chip chip--green',
    SETTING: 'chip chip--amber',
    INACTIVE: 'chip chip--red',
    INVITE_PENDING: 'chip chip--blue',
    LOCKED: 'chip chip--purple',
  }[status] ?? 'chip'
}

async function saveBasicInfo() {
  if (!company.value) return
  ui.setLoading(true)
  try {
    await updateCompany(company.value.id, {
      representative: editForm.representative,
      businessNumber: editForm.businessNumber,
      phone: editForm.phone,
      email: editForm.email,
      address: editForm.address,
    })
    await createCompanyLog({
      companyId: company.value.id,
      action:    '업체 기본 정보 수정',
    })
    await fetchData()
  } finally {
    ui.setLoading(false)
  }
}

async function issueAdmin() {
  if (!inviteModal.name.trim() || !inviteModal.email.trim()) {
    inviteModal.error = '이름과 이메일을 모두 입력해주세요.'
    return
  }
  const nextId = Math.max(0, ...users.value.map((item) => Number(item.id) || 0)) + 1
  ui.setLoading(true)
  try {
    await createUser({
      id: nextId,
      companyId,
      name: inviteModal.name.trim(),
      email: inviteModal.email.trim(),
      role: 'MASTER_ADMIN',
      organization: company.value.name,
      warehouse: '-',
      status: 'INVITE_PENDING',
      registeredAt: new Date().toISOString(),
      lastLoginAt: null,
      wasActiveBeforeCompanyInactivation: false,
    })
    await updateCompany(companyId, { userCount: Number(company.value.userCount || 0) + 1 })
    await createCompanyLog({
      companyId: companyId,
      action:    '총괄 관리자 추가 발급',
    })
    inviteModal.open = false
    inviteModal.name = ''
    inviteModal.email = ''
    await fetchData()
  } finally {
    ui.setLoading(false)
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" :title="company?.name || '업체 상세'">
    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div v-if="company" class="page-grid">
      <section class="overview-card">
        <div class="overview-main">
          <p class="overview-label">테넌트 코드</p>
          <strong class="overview-code">{{ company.tenantCode }}</strong>
          <p class="overview-sub">테넌트 코드는 수정할 수 없습니다.</p>
        </div>
        <div class="overview-side">
          <span :class="statusClass(company.status)">{{ statusText(company.status) }}</span>
          <span class="overview-date">등록일 {{ formatDate(company.createdAt) }}</span>
        </div>
      </section>

      <div class="content-grid">
        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">업체 기본 정보</h3>
              <p class="section-sub">사업자번호, 주소, 연락처 등의 기본 정보를 수정할 수 있습니다.</p>
            </div>
            <button class="ui-btn ui-btn--gold" type="button" @click="saveBasicInfo">수정 저장</button>
          </header>

          <div class="form-grid">
            <BaseForm label="대표자명"><input v-model="editForm.representative" type="text" /></BaseForm>
            <BaseForm label="사업자등록번호"><input v-model="editForm.businessNumber" type="text" /></BaseForm>
            <BaseForm label="연락처"><input v-model="editForm.phone" type="text" /></BaseForm>
            <BaseForm label="이메일"><input v-model="editForm.email" type="email" /></BaseForm>
            <BaseForm class="full" label="주소"><input v-model="editForm.address" type="text" /></BaseForm>
          </div>
        </section>

        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">총괄 관리자 계정</h3>
              <p class="section-sub">총괄 관리자 상태와 최근 로그인 현황을 확인합니다.</p>
            </div>
            <button class="ui-btn ui-btn--ghost" type="button" @click="inviteModal.open = true">추가 발급</button>
          </header>
          <BaseTable :columns="adminColumns" :rows="masterAdmins">
            <template #cell-status="{ value }"><span :class="statusClass(value)">{{ statusText(value) }}</span></template>
            <template #cell-lastLoginAt="{ value }">{{ formatDate(value, 'datetime') }}</template>
          </BaseTable>
        </section>
      </div>

      <div class="content-grid">
        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">소속 창고 목록</h3>
              <p class="section-sub">현재 업체에 연결된 창고 정보를 조회합니다.</p>
            </div>
          </header>
          <BaseTable :columns="warehouseColumns" :rows="company.warehouseList || []" />
        </section>

        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">등록 셀러 회사</h3>
              <p class="section-sub">연결된 셀러 회사 목록입니다.</p>
            </div>
          </header>
          <ul class="seller-list">
            <li v-for="seller in company.sellerCompanyList || []" :key="seller">{{ seller }}</li>
          </ul>
        </section>
      </div>

      <section class="section-card full-row">
        <header class="section-head">
          <div>
            <h3 class="section-title">수정 이력 로그</h3>
            <p class="section-sub">업체 정보와 관리자 발급 이력을 시간 순으로 보여줍니다.</p>
          </div>
        </header>
        <BaseTable :columns="logColumns" :rows="logs">
          <template #cell-at="{ value }">{{ formatDate(value, 'datetime') }}</template>
        </BaseTable>
      </section>
    </div>

    <BaseModal :is-open="inviteModal.open" title="총괄 관리자 추가 발급" width="520px" @cancel="inviteModal.open = false" @confirm="issueAdmin">
      <div class="modal-grid">
        <BaseForm label="이름" required><input v-model="inviteModal.name" type="text" /></BaseForm>
        <BaseForm label="이메일" required :error="inviteModal.error"><input v-model="inviteModal.email" type="email" /></BaseForm>
      </div>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: var(--space-5);
}

.overview-card,
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  border-top: 4px solid var(--gold);
}

.overview-label,
.overview-sub,
.overview-date {
  color: var(--t3);
}

.overview-code {
  display: block;
  margin-top: 8px;
  font-family: var(--font-condensed);
  font-size: clamp(28px, 2vw, 40px);
  line-height: 1;
  color: var(--t1);
}

.overview-sub {
  margin-top: 8px;
  font-size: var(--font-size-sm);
}

.overview-side {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.section-card {
  padding: var(--space-6);
}

.full-row {
  grid-column: 1 / -1;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.form-grid .full {
  grid-column: 1 / -1;
}

.seller-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--t2);
}

.modal-grid {
  display: grid;
  gap: 14px;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.chip--green { background: var(--green-pale); color: var(--green); }
.chip--amber { background: var(--amber-pale); color: #b45309; }
.chip--red { background: var(--red-pale); color: var(--red); }
.chip--blue { background: var(--blue-pale); color: var(--blue); }
.chip--purple { background: var(--purple-pale); color: var(--purple); }

@media (max-width: 1080px) {
  .content-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .overview-card,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .overview-side {
    justify-items: start;
  }
}
</style>
