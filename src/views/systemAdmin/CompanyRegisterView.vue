<script setup>
import { computed, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const breadcrumb = [{ label: 'CONK' }, { label: '시스템 관리자' }, { label: '업체 등록' }]

const form = reactive({
  companyName: '',
  ceoName: '',
  businessNumber: '',
  phone: '',
  email: '',
  address1: '',
  address2: '',
  country: '미국',
  companyType: 'K-글로벌 전문',
  warehousePlan: '2개 예정',
  contractManager: '플랫폼 운영 관리자',
  managerName: '',
  managerEmail: '',
  note: '',
})

const errors = reactive({
  companyName: '',
  ceoName: '',
  businessNumber: '',
  phone: '',
  email: '',
  address1: '',
  managerName: '',
  managerEmail: '',
})

const confirmOpen = ref(false)

const previewTenantCode = computed(() => {
  const prefix = form.country === '미국' ? 'US' : form.country === '캐나다' ? 'CA' : 'GL'
  return `${prefix}-3PL-021`
})

function validate() {
  errors.companyName = form.companyName.trim() ? '' : '업체명을 입력해주세요.'
  errors.ceoName = form.ceoName.trim() ? '' : '대표자명을 입력해주세요.'
  errors.businessNumber = form.businessNumber.trim() ? '' : '사업자등록번호를 입력해주세요.'
  errors.phone = form.phone.trim() ? '' : '연락처를 입력해주세요.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ? ''
    : '업체 이메일 형식을 확인해주세요.'
  errors.address1 = form.address1.trim() ? '' : '사업장 주소를 입력해주세요.'
  errors.managerName = form.managerName.trim() ? '' : '최초 총괄 관리자 이름을 입력해주세요.'
  errors.managerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.managerEmail)
    ? ''
    : '총괄 관리자 이메일 형식을 확인해주세요.'

  return !Object.values(errors).some(Boolean)
}

function openConfirm() {
  if (!validate()) return
  confirmOpen.value = true
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="업체 등록">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost">취소</button>
      <button class="ui-btn ui-btn--ghost">임시 저장</button>
      <button class="ui-btn btn-gold" @click="openConfirm">+ 업체 등록</button>
    </template>

    <div class="page-grid">
      <section class="main-column">
        <article class="form-card highlight-card">
          <div class="card-head card-head--between">
            <div>
              <h2>신규 3PL 업체 등록</h2>
              <p>업체 정보와 최초 총괄 관리자 정보를 한 번에 입력합니다.</p>
            </div>
            <div class="stat-pills">
              <span class="stat-pill">
                <strong>7</strong>
                검토 필드
              </span>
              <span class="stat-pill">
                <strong>2</strong>
                필수 이메일
              </span>
            </div>
          </div>
        </article>

        <article class="form-card">
          <div class="card-head">
            <h3>업체 기본 정보</h3>
            <span>필수</span>
          </div>
          <div class="form-grid form-grid--2">
            <BaseForm :error="errors.companyName" label="업체명" required>
              <input v-model="form.companyName" placeholder="NEXT WAVE FULFILLMENT" type="text" />
            </BaseForm>
            <BaseForm :error="errors.ceoName" label="대표자명" required>
              <input v-model="form.ceoName" placeholder="Daniel Kim" type="text" />
            </BaseForm>
            <BaseForm :error="errors.businessNumber" label="사업자등록번호" required>
              <input v-model="form.businessNumber" placeholder="123-45-67890" type="text" />
            </BaseForm>
            <BaseForm :error="errors.phone" label="연락처" required>
              <input v-model="form.phone" placeholder="+1 213-555-0199" type="text" />
            </BaseForm>
            <BaseForm :error="errors.email" label="대표 이메일" required>
              <input v-model="form.email" placeholder="contact@nextwave3pl.com" type="email" />
            </BaseForm>
            <BaseForm label="업체 유형" required>
              <select v-model="form.companyType">
                <option>K-글로벌 전문</option>
                <option>범용</option>
              </select>
            </BaseForm>
            <BaseForm :error="errors.address1" class="full-span" label="사업장 주소 (미국 내)" required>
              <input v-model="form.address1" placeholder="625 Harbor Blvd, Los Angeles, CA" type="text" />
            </BaseForm>
            <BaseForm class="full-span" label="상세 주소">
              <input v-model="form.address2" placeholder="Suite 201" type="text" />
            </BaseForm>
          </div>
        </article>

        <article class="form-card">
          <div class="card-head">
            <h3>운영 및 계약 정보</h3>
            <span>선택</span>
          </div>
          <div class="form-grid form-grid--2">
            <BaseForm label="본사 국가">
              <select v-model="form.country">
                <option>미국</option>
                <option>캐나다</option>
                <option>기타</option>
              </select>
            </BaseForm>
            <BaseForm label="예상 창고 수">
              <select v-model="form.warehousePlan">
                <option>1개 예정</option>
                <option>2개 예정</option>
                <option>3개 이상 예정</option>
              </select>
            </BaseForm>
            <BaseForm label="계약 담당자">
              <input v-model="form.contractManager" type="text" />
            </BaseForm>
            <BaseForm label="자동 발급 예정 테넌트 코드">
              <input :value="previewTenantCode" disabled type="text" />
            </BaseForm>
          </div>
        </article>

        <article class="form-card">
          <div class="card-head">
            <h3>최초 총괄 관리자</h3>
            <span>필수</span>
          </div>
          <div class="form-grid form-grid--2">
            <BaseForm :error="errors.managerName" label="이름" required>
              <input v-model="form.managerName" placeholder="Daniel Kim" type="text" />
            </BaseForm>
            <BaseForm :error="errors.managerEmail" label="이메일" required>
              <input v-model="form.managerEmail" placeholder="daniel.kim@nextwave3pl.com" type="email" />
            </BaseForm>
            <BaseForm class="full-span" hint="등록 완료 후 최초 비밀번호 설정 링크가 발송됩니다." label="비고">
              <textarea v-model="form.note" placeholder="계약 상태 또는 내부 참고사항" rows="4" />
            </BaseForm>
          </div>
        </article>
      </section>

      <aside class="side-column">
        <article class="side-card">
          <h3>등록 체크리스트</h3>
          <ul>
            <li>업체 정보와 관리자 정보는 하나의 트랜잭션으로 저장됩니다.</li>
            <li>등록 직후 업체 상태는 <strong>설정중</strong>으로 생성됩니다.</li>
            <li>최초 비밀번호 설정이 완료되면 업체 상태가 자동으로 <strong>활성</strong>으로 전환됩니다.</li>
          </ul>
        </article>

        <article class="side-card">
          <h3>입력 데이터 미리보기</h3>
          <dl class="preview-list">
            <div>
              <dt>업체명</dt>
              <dd>{{ form.companyName || '-' }}</dd>
            </div>
            <div>
              <dt>테넌트 코드</dt>
              <dd>{{ previewTenantCode }}</dd>
            </div>
            <div>
              <dt>초기 상태</dt>
              <dd>설정중</dd>
            </div>
            <div>
              <dt>최초 총괄 관리자</dt>
              <dd>{{ form.managerName || '-' }}</dd>
            </div>
          </dl>
        </article>

        <article class="side-card guide-card">
          <h3>운영 가이드</h3>
          <p>
            tenant_code는 최상위 데이터 분리 기준입니다. 동일 업체의 모든 창고, 셀러, 계정 데이터는
            이 코드를 기준으로 격리됩니다.
          </p>
        </article>
      </aside>
    </div>

    <BaseModal
      :is-open="confirmOpen"
      title="업체 등록 확인"
      width="540px"
      @cancel="confirmOpen = false"
      @confirm="confirmOpen = false"
    >
      <div class="confirm-box">
        <p class="confirm-guide">
          등록 확정 후에는 업체 등록 취소가 불가능하며, 최초 총괄 관리자에게 초대 메일이 발송됩니다.
        </p>
        <dl class="confirm-list">
          <div>
            <dt>업체명</dt>
            <dd>{{ form.companyName }}</dd>
          </div>
          <div>
            <dt>테넌트 코드</dt>
            <dd>{{ previewTenantCode }}</dd>
          </div>
          <div>
            <dt>최초 총괄 관리자</dt>
            <dd>{{ form.managerName }}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{{ form.managerEmail }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <button class="ui-btn ui-btn--ghost" @click="confirmOpen = false">취소</button>
        <button class="ui-btn btn-gold" @click="confirmOpen = false">등록 확정</button>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card,
.side-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.form-card {
  padding: 20px;
}

.highlight-card {
  background: linear-gradient(180deg, #fffef8 0%, #ffffff 100%);
}

.card-head,
.card-head--between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.card-head h2,
.card-head h3 {
  margin: 0;
  color: var(--t1);
}

.card-head p {
  margin: 6px 0 0;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.card-head span {
  color: #b45309;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.stat-pills {
  display: flex;
  gap: 10px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  min-width: 88px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: #f7f7fb;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.stat-pill strong {
  color: var(--t1);
  font-size: 22px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full-span {
  grid-column: 1 / -1;
}

.side-card {
  padding: 18px;
}

.side-card h3 {
  margin: 0 0 12px;
}

.side-card ul {
  margin: 0;
  padding-left: 18px;
  color: var(--t2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.5;
}

.preview-list,
.confirm-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
}

.preview-list div,
.confirm-list div {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.preview-list dt,
.confirm-list dt {
  margin-bottom: 6px;
  color: var(--t3);
  font-size: var(--font-size-xs);
}

.preview-list dd,
.confirm-list dd {
  margin: 0;
  color: var(--t1);
  font-weight: 700;
}

.guide-card p,
.confirm-guide {
  margin: 0;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #f3f5ff;
  color: #4654c6;
  line-height: 1.5;
  font-size: var(--font-size-sm);
}

.confirm-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1100px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
