<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { ROUTE_NAMES } from '@/constants'

const route = useRoute()
const router = useRouter()
const breadcrumb = [{ label: '플랫폼 관리' }, { label: '업체 관리' }, { label: '업체 상세' }]

const companies = ref([
  {
    id: 1,
    name: 'FASTSHIP LOGISTICS', tenantCode: 'US-3PL-001', status: '활성', businessNumber: '91-4820318', representative: 'Sarah Park', phone: '+1-213-555-1821', email: 'ops@fastshiplogistics.com', address: '1850 Alameda St, Los Angeles, CA 90058', companyType: 'K-글로벌 전문',
    warehouses: [{ id: 1, code: 'LAX-A', name: 'LA Main Hub', status: '운영중', manager: 'Mike Choi' }],
    sellers: [{ id: 1, name: 'Nordic House', country: '미국', joinedAt: '2025-12-01' }],
    admins: [
      { id: 1, name: 'Sarah Park', email: 'sarah.park@fastship.us', status: '활성', lastLogin: '2026-03-13 09:18' },
      { id: 2, name: 'Daniel Kim', email: 'daniel@fastship.us', status: '초대대기', lastLogin: '-' },
    ],
    logs: [
      { id: 1, at: '2026-03-12 10:12', actor: 'sysadmin@conk.io', action: '업체 등록' },
      { id: 2, at: '2026-03-13 09:21', actor: 'sysadmin@conk.io', action: '대표 연락처 수정' },
    ],
  },
  {
    id: 2,
    name: 'NOVA FULFILL KOREA', tenantCode: 'KR-3PL-007', status: '설정중', businessNumber: '220-88-10345', representative: 'Kim Minsoo', phone: '+82-2-555-0912', email: 'contact@novafullfill.kr', address: '321 Teheran-ro, Gangnam-gu, Seoul', companyType: '범용',
    warehouses: [{ id: 2, code: 'ICN-A', name: 'Incheon Main WH', status: '설정중', manager: '정민호' }],
    sellers: [{ id: 2, name: 'Wave For', country: '한국', joinedAt: '2026-02-03' }],
    admins: [{ id: 3, name: 'Ops Team', email: 'ops@novafullfill.kr', status: '초대대기', lastLogin: '-' }],
    logs: [{ id: 3, at: '2026-02-03 16:30', actor: 'sysadmin@conk.io', action: '업체 등록' }],
  },
])

const company = computed(() => companies.value.find((item) => String(item.id) === String(route.params.id)) ?? companies.value[0])
const editMode = ref(false)
const saveModal = ref(false)
const inviteModal = ref(false)
const inviteForm = reactive({ name: '', email: '' })
const form = reactive({ businessNumber: '', representative: '', phone: '', email: '', address: '', companyType: '' })

function syncForm() {
  form.businessNumber = company.value.businessNumber
  form.representative = company.value.representative
  form.phone = company.value.phone
  form.email = company.value.email
  form.address = company.value.address
  form.companyType = company.value.companyType
}
syncForm()

function openSave() { saveModal.value = true }
function confirmSave() {
  company.value.businessNumber = form.businessNumber
  company.value.representative = form.representative
  company.value.phone = form.phone
  company.value.email = form.email
  company.value.address = form.address
  company.value.companyType = form.companyType
  company.value.logs.unshift({ id: Date.now(), at: '2026-03-19 11:20', actor: 'sysadmin@conk.io', action: '업체 기본 정보 수정' })
  saveModal.value = false
  editMode.value = false
}
function issueAdmin() {
  company.value.admins.push({ id: Date.now(), name: inviteForm.name, email: inviteForm.email, status: '초대대기', lastLogin: '-' })
  company.value.logs.unshift({ id: Date.now(), at: '2026-03-19 11:42', actor: 'sysadmin@conk.io', action: `총괄 관리자 추가 발급 (${inviteForm.email})` })
  inviteForm.name = ''
  inviteForm.email = ''
  inviteModal.value = false
}

const warehouseColumns = [
  { key: 'code', label: '창고 코드', width: '20%' },
  { key: 'name', label: '창고명', width: '35%' },
  { key: 'status', label: '상태', width: '20%' },
  { key: 'manager', label: '담당자', width: '25%' },
]
const sellerColumns = [
  { key: 'name', label: '셀러 회사', width: '40%' },
  { key: 'country', label: '국가', width: '25%' },
  { key: 'joinedAt', label: '등록일', width: '35%' },
]
const adminColumns = [
  { key: 'name', label: '이름', width: '20%' },
  { key: 'email', label: '이메일', width: '35%' },
  { key: 'status', label: '상태', width: '15%' },
  { key: 'lastLogin', label: '마지막 로그인', width: '30%' },
]
const logColumns = [
  { key: 'at', label: '일시', width: '22%' },
  { key: 'actor', label: '수정자', width: '28%' },
  { key: 'action', label: '작업 내용', width: '50%' },
]
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="업체 상세">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="router.push({ name: ROUTE_NAMES.SYS_COMPANY_LIST })">목록</button>
      <button v-if="!editMode" class="ui-btn ui-btn--primary" @click="editMode = true">정보 수정</button>
      <button v-else class="ui-btn ui-btn--primary" @click="openSave">수정 저장</button>
    </template>

    <div class="page-stack">
      <section class="detail-card">
        <div class="section-head"><h3>{{ company.name }}</h3><span class="status-chip">{{ company.status }}</span></div>
        <div class="info-grid two">
          <BaseForm label="테넌트 코드"><input :value="company.tenantCode" disabled /></BaseForm>
          <BaseForm label="사업자등록번호"><input v-model="form.businessNumber" :disabled="!editMode" /></BaseForm>
          <BaseForm label="대표자명"><input v-model="form.representative" :disabled="!editMode" /></BaseForm>
          <BaseForm label="업체 유형">
            <select v-model="form.companyType" :disabled="!editMode"><option>K-글로벌 전문</option><option>범용</option></select>
          </BaseForm>
          <BaseForm label="연락처"><input v-model="form.phone" :disabled="!editMode" /></BaseForm>
          <BaseForm label="이메일"><input v-model="form.email" :disabled="!editMode" /></BaseForm>
        </div>
        <div class="info-grid one">
          <BaseForm label="사업장 주소"><textarea v-model="form.address" rows="3" :disabled="!editMode" /></BaseForm>
        </div>
      </section>

      <section class="detail-card">
        <div class="section-head"><h4>총괄 관리자 계정</h4><button class="ui-btn ui-btn--ghost" @click="inviteModal = true">총괄 관리자 추가 발급</button></div>
        <BaseTable :columns="adminColumns" :rows="company.admins" />
      </section>

      <section class="split-grid">
        <article class="detail-card"><div class="section-head"><h4>소속 창고 목록</h4></div><BaseTable :columns="warehouseColumns" :rows="company.warehouses" /></article>
        <article class="detail-card"><div class="section-head"><h4>등록 셀러 회사 목록</h4></div><BaseTable :columns="sellerColumns" :rows="company.sellers" /></article>
      </section>

      <section class="detail-card">
        <div class="section-head"><h4>수정 이력 로그</h4><span>테넌트 코드는 수정 불가</span></div>
        <BaseTable :columns="logColumns" :rows="company.logs" />
      </section>
    </div>

    <BaseModal :open="saveModal" title="업체 정보 수정 저장" @close="saveModal = false">
      <p class="modal-copy">기본 정보 변경 내역이 로그에 기록됩니다. 테넌트 코드는 수정되지 않습니다.</p>
      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="saveModal = false">취소</button>
        <button class="ui-btn ui-btn--primary" @click="confirmSave">저장</button>
      </template>
    </BaseModal>

    <BaseModal :open="inviteModal" title="총괄 관리자 추가 발급" @close="inviteModal = false">
      <div class="modal-fields">
        <BaseForm label="이름" required><input v-model="inviteForm.name" /></BaseForm>
        <BaseForm label="이메일" required><input v-model="inviteForm.email" type="email" /></BaseForm>
        <p class="modal-copy">발급 즉시 초대 메일이 발송되며, 최초 비밀번호 설정 후 계정이 활성화됩니다.</p>
      </div>
      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="inviteModal = false">취소</button>
        <button class="ui-btn ui-btn--primary" :disabled="!inviteForm.name || !inviteForm.email" @click="issueAdmin">발급</button>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-stack { display:flex; flex-direction:column; gap:20px; }
.detail-card { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-xl); padding:20px; box-shadow: var(--shadow-sm); }
.section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
.info-grid { display:grid; gap:16px; }
.info-grid.two { grid-template-columns: repeat(2, 1fr); }
.info-grid.one, .split-grid { grid-template-columns: 1fr; }
.split-grid { display:grid; grid-template-columns: 1fr 1fr; gap:20px; }
.status-chip { display:inline-flex; padding:4px 10px; border-radius:999px; background: var(--blue-pale); color: var(--blue); font-size:12px; font-weight:700; }
.modal-copy { margin:0; color: var(--t2); line-height:1.6; }
.modal-fields { display:grid; gap:14px; }
@media (max-width: 960px) { .info-grid.two, .split-grid { grid-template-columns: 1fr; } }
</style>
