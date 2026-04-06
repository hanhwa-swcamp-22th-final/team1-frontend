<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { ROUTE_NAMES } from '@/constants'
import { createCompany, createCompanyLog, createUser, getCompanies, getUsers } from '@/api/member'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()
const breadcrumb = [{ label: '플랫폼 관리' }, { label: '업체 관리' }, { label: '3PL 업체 등록' }]

const form = reactive({
  name: '', representative: '', businessNumber: '', phone: '', email: '', address: '', companyType: 'K-글로벌 전문',
  adminName: '', adminEmail: '',
})
const errors = reactive({})
const confirmOpen = ref(false)
const resultOpen = ref(false)
const createdTenantCode = ref('')

function validate() {
  errors.name = form.name.trim() ? '' : '업체명을 입력해주세요.'
  errors.representative = form.representative.trim() ? '' : '대표자명을 입력해주세요.'
  errors.businessNumber = form.businessNumber.trim() ? '' : '사업자등록번호를 입력해주세요.'
  errors.phone = form.phone.trim() ? '' : '연락처를 입력해주세요.'
  errors.email = form.email.trim() ? '' : '이메일을 입력해주세요.'
  errors.address = form.address.trim() ? '' : '사업장 주소를 입력해주세요.'
  errors.adminName = form.adminName.trim() ? '' : '최초 총괄 관리자 이름을 입력해주세요.'
  errors.adminEmail = form.adminEmail.trim() ? '' : '최초 총괄 관리자 이메일을 입력해주세요.'
  return !Object.values(errors).some(Boolean)
}

function openConfirm() {
  if (!validate()) return
  confirmOpen.value = true
}

function slug(text) {
  return text.replace(/[^a-zA-Z0-9가-힣 ]/g, '').trim().split(/\s+/).slice(0, 2).join('').toUpperCase().slice(0, 8)
}

const flowSummary = computed(() => [
  '업체와 최초 총괄 관리자 계정이 동시에 생성됩니다.',
  '고유 테넌트 코드가 자동 부여되고 업체 상태는 설정중으로 저장됩니다.',
  '최초 총괄 관리자에게 비밀번호 최초 설정 링크가 발송되며 설정 완료 후 활성 상태로 전환됩니다.',
  '최초 설정 링크는 설정 완료 후 다시 사용할 수 없습니다.',
])

async function submitRegistration() {
  confirmOpen.value = false
  ui.setLoading(true)
  try {
    const [companiesRes, usersRes] = await Promise.all([getCompanies(), getUsers()])
    const companies = companiesRes.data.data
    const users = usersRes.data.data
    const nextCompanyId = Math.max(0, ...companies.map((item) => Number(item.id) || 0)) + 1
    const nextUserId = Math.max(0, ...users.map((item) => Number(item.id) || 0)) + 1
    createdTenantCode.value = `TEN-${slug(form.name)}-${String(nextCompanyId).padStart(3, '0')}`

    await createCompany({
      id: nextCompanyId,
      name: form.name.trim(),
      representative: form.representative.trim(),
      businessNumber: form.businessNumber.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      companyType: form.companyType,
      tenantCode: createdTenantCode.value,
      status: 'SETTING',
      createdAt: new Date().toISOString(),
      warehouseCount: 0,
      sellerCount: 0,
      userCount: 1,
      lockedAccountCount: 1,
      warehouseList: [],
      sellerCompanyList: [],
      activationLinkStatus: 'PENDING',
    })

    await createUser({
      id: nextUserId,
      companyId: nextCompanyId,
      name: form.adminName.trim(),
      email: form.adminEmail.trim(),
      role: 'MASTER_ADMIN',
      organization: form.name.trim(),
      warehouse: '-',
      status: 'INVITE_PENDING',
      registeredAt: new Date().toISOString(),
      lastLoginAt: null,
      wasActiveBeforeCompanyInactivation: false,
    })

    await createCompanyLog({
      id: Date.now(),
      companyId: nextCompanyId,
      at: new Date().toISOString(),
      actor: 'sys.admin@conk.com',
      action: '업체 등록',
    })

    resultOpen.value = true
  } finally {
    ui.setLoading(false)
  }
}

function moveToList() {
  resultOpen.value = false
  router.push({ name: ROUTE_NAMES.SYS_COMPANY_LIST })
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="3PL 업체 등록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" type="button" @click="router.push({ name: ROUTE_NAMES.SYS_COMPANY_LIST })">목록으로</button>
    </template>

    <LoadingSpinner v-if="ui.isLoading" fullscreen />

    <div class="page-grid">
      <div class="content-grid">
        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">업체 정보</h3>
              <p class="section-sub">업체 기본 정보와 운영에 필요한 항목을 입력합니다.</p>
            </div>
          </header>

          <div class="form-grid">
            <BaseForm label="업체명" required :error="errors.name"><input v-model="form.name" type="text" placeholder="업체명 입력" /></BaseForm>
            <BaseForm label="대표자명" required :error="errors.representative"><input v-model="form.representative" type="text" placeholder="대표자명 입력" /></BaseForm>
            <BaseForm label="사업자등록번호" required :error="errors.businessNumber"><input v-model="form.businessNumber" type="text" placeholder="사업자등록번호 입력" /></BaseForm>
            <BaseForm label="연락처" required :error="errors.phone"><input v-model="form.phone" type="text" placeholder="전화번호 입력" /></BaseForm>
            <BaseForm label="이메일" required :error="errors.email"><input v-model="form.email" type="email" placeholder="업체 이메일 입력" /></BaseForm>
            <BaseForm label="업체 유형" required><select v-model="form.companyType"><option>K-글로벌 전문</option><option>범용</option></select></BaseForm>
            <BaseForm class="full" label="사업장 주소(미국 내)" required :error="errors.address"><input v-model="form.address" type="text" placeholder="미국 내 사업장 주소 입력" /></BaseForm>
          </div>
        </section>

        <section class="section-card">
          <header class="section-head">
            <div>
              <h3 class="section-title">최초 총괄 관리자</h3>
              <p class="section-sub">초대 메일 발송 대상입니다. 비밀번호 설정 전까지 업체 상태는 설정중으로 유지됩니다.</p>
            </div>
          </header>

          <div class="form-grid compact-grid">
            <BaseForm label="이름" required :error="errors.adminName"><input v-model="form.adminName" type="text" placeholder="이름 입력" /></BaseForm>
            <BaseForm label="이메일" required :error="errors.adminEmail"><input v-model="form.adminEmail" type="email" placeholder="이메일 입력" /></BaseForm>
          </div>
        </section>
      </div>

      <aside class="section-card guide-panel">
        <header class="section-head">
          <div>
            <h3 class="section-title">등록 후 처리 흐름</h3>
            <p class="section-sub">초기 계정 활성화까지의 단계를 안내합니다.</p>
          </div>
        </header>
        <ol class="guide-list">
          <li v-for="item in flowSummary" :key="item">{{ item }}</li>
        </ol>
      </aside>

      <div class="footer-actions">
        <button class="ui-btn ui-btn--ghost" type="button" @click="router.push({ name: ROUTE_NAMES.SYS_COMPANY_LIST })">취소</button>
        <button class="ui-btn ui-btn--gold" type="button" @click="openConfirm">등록</button>
      </div>
    </div>

    <BaseModal :is-open="confirmOpen" title="업체 등록 확인" width="520px" @cancel="confirmOpen = false" @confirm="submitRegistration">
      <div class="modal-grid">
        <p><strong>{{ form.name }}</strong> 업체와 최초 총괄 관리자 <strong>{{ form.adminName }}</strong> 계정을 동시에 생성합니다.</p>
        <p>등록 직후 업체 상태는 <strong>설정중</strong>으로 생성되고 비밀번호 최초 설정 링크가 이메일로 발송됩니다.</p>
      </div>
    </BaseModal>

    <BaseModal :hide-footer="true" :is-open="resultOpen" title="등록 완료" width="560px" @cancel="moveToList">
      <div class="modal-grid">
        <p>업체 등록이 완료되었습니다.</p>
        <div class="result-box">
          <p>자동 발급 테넌트 코드: <strong>{{ createdTenantCode }}</strong></p>
          <p>업체 상태: <strong>설정중</strong></p>
          <p>최초 총괄 관리자에게 비밀번호 최초 설정 링크가 발송된 것으로 처리됩니다.</p>
        </div>
        <div class="modal-actions"><button class="ui-btn ui-btn--gold" type="button" @click="moveToList">업체 목록으로 이동</button></div>
      </div>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: var(--space-5);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--space-5);
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
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

.compact-grid {
  grid-template-columns: 1fr;
}

.form-grid .full {
  grid-column: 1 / -1;
}

.guide-panel {
  border-top: 4px solid var(--gold);
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  color: var(--t2);
  display: grid;
  gap: 12px;
  line-height: 1.7;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-grid {
  display: grid;
  gap: 14px;
}

.result-box {
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  color: var(--t2);
  display: grid;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
