<script setup>
/**
 * ComponentDemoView — 공통 컴포넌트 확인용 임시 페이지
 * 접근: /dev/components (meta.public, 로그인 불필요)
 * 삭제 시점: 팀원 개발 완료 후 이 파일 + router/index.js의 해당 라우트 함께 제거
 */
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import { ACCOUNT_STATUS, ASN_STATUS, ORDER_STATUS } from '@/constants'

const uiStore = useUiStore()

const breadcrumb = [{ label: '개발 도구' }, { label: '컴포넌트 데모' }]

// ── Global Loading ─────────────────────────────────────────
function testGlobalLoading() {
  uiStore.setLoading(true)
  setTimeout(() => {
    uiStore.setLoading(false)
  }, 2000)
}

// ── Modal / Dialog ─────────────────────────────────────
const showModal = ref(false)
const showConfirm = ref(false)

// ── Toast ───────────────────────────────────────────────
const toast = ref({ visible: false, message: '', type: 'info' })
function showToast(type) {
  const messages = {
    success: '저장되었습니다.',
    error: '오류가 발생했습니다.',
    info: '처리 중입니다.',
    warning: '주의가 필요합니다.',
  }
  toast.value = { visible: true, message: messages[type], type }
}

// ── Table ───────────────────────────────────────────────
const tableColumns = [
  { key: 'id', label: 'ID', width: '60px', align: 'center' },
  { key: 'name', label: '상품명', sortable: true },
  { key: 'quantity', label: '수량', width: '80px', align: 'right' },
  { key: 'status', label: '상태', width: '100px', align: 'center' },
  { key: 'amount', label: '금액', width: '120px', align: 'right' },
]
const tableRows = [
  { id: 1, name: 'CONK 프리미엄 박스 (L)', quantity: 24, status: 'PENDING', amount: '$1,200.00' },
  { id: 2, name: 'ECO 완충재 세트', quantity: 150, status: 'CONFIRMED', amount: '$450.00' },
  { id: 3, name: '방습 포장지 (100매)', quantity: 10, status: 'PICKING', amount: '$89.00' },
  { id: 4, name: '테이프 디스펜서 Pro', quantity: 5, status: 'SHIPPED', amount: '$199.00' },
  { id: 5, name: '라벨 프린터 용지 A4', quantity: 3, status: 'CANCELLED', amount: '$34.00' },
]
const pagination = ref({ page: 1, pageSize: 5, total: 5 })

// ── Stepper ─────────────────────────────────────────────
const ORDER_STEPS = [
  { key: ORDER_STATUS.PENDING, label: '접수' },
  { key: ORDER_STATUS.CONFIRMED, label: '확인' },
  { key: ORDER_STATUS.PICKING, label: '피킹' },
  { key: ORDER_STATUS.PACKING, label: '패킹' },
  { key: ORDER_STATUS.SHIPPED, label: '출고완료' },
]
const currentStep = ref(ORDER_STATUS.PICKING)

// ── Form ────────────────────────────────────────────────
const formValues = ref({ name: '', email: '', memo: '' })
const formError = ref('')

// ── FileUpload ──────────────────────────────────────────
const uploadedFile = ref(null)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="컴포넌트 데모">
    <!-- 헤더 우측 DEV ONLY 배지 -->
    <template #header-action>
      <span class="dev-badge">DEV ONLY</span>
    </template>

    <div class="demo-body">
      <!-- ── 폰트 시스템 검증 ────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">폰트 시스템 검증</h2>
        <div class="font-grid">
          <!-- Barlow Condensed -->
          <div class="font-card font-card--condensed">
            <div class="font-card-header">
              <span class="font-tag tag-condensed">--font-condensed</span>
              <span class="font-meta">Barlow Condensed 700</span>
            </div>
            <p class="font-sample font-condensed">페이지 타이틀 · Page Title</p>
            <p class="font-sample font-condensed font-sample--sm">섹션 제목 · Section Heading</p>
            <div class="font-usage-list">
              <span class="font-usage-chip">Header .page-title</span>
              <span class="font-usage-chip">Footer .footer-brand</span>
              <span class="font-usage-chip">Sidebar .logo-brand</span>
            </div>
          </div>

          <!-- Barlow -->
          <div class="font-card font-card--barlow">
            <div class="font-card-header">
              <span class="font-tag tag-barlow">--font-barlow</span>
              <span class="font-meta">Barlow 500</span>
            </div>
            <p class="font-sample font-barlow">UI 라벨 · Navigation Label</p>
            <p class="font-sample font-barlow font-sample--sm">테이블 헤더 · Table Header</p>
            <div class="font-usage-list">
              <span class="font-usage-chip">Sidebar .nav-item</span>
              <span class="font-usage-chip">Sidebar .nav-group-label</span>
              <span class="font-usage-chip">Header .breadcrumb</span>
            </div>
          </div>

          <!-- IBM Plex Sans -->
          <div class="font-card font-card--mono">
            <div class="font-card-header">
              <span class="font-tag tag-mono">--font-mono</span>
              <span class="font-meta">IBM Plex Sans 400</span>
            </div>
            <p class="font-sample font-mono">ASN-20240315-001</p>
            <p class="font-sample font-mono font-sample--sm">SKU-KR-PROD-0042</p>
            <div class="font-usage-list">
              <span class="font-usage-chip">ASN 번호</span>
              <span class="font-usage-chip">코드형 식별자</span>
            </div>
          </div>

          <!-- Inter (기본) -->
          <div class="font-card font-card--base">
            <div class="font-card-header">
              <span class="font-tag tag-base">--font-base</span>
              <span class="font-meta">Inter 400/500</span>
            </div>
            <p class="font-sample font-base">본문 텍스트 · Body Text</p>
            <p class="font-sample font-base font-sample--sm">상태 배지 · Status Badge</p>
            <div class="font-usage-list">
              <span class="font-usage-chip">본문 기본</span>
              <span class="font-usage-chip">StatusBadge</span>
              <span class="font-usage-chip">보조 수치</span>
            </div>
          </div>
        </div>

        <!-- 실제 헤더 타이틀 비교 -->
        <div class="font-compare-card">
          <p class="compare-label">실제 렌더링 비교 — 헤더 타이틀 (Barlow Condensed vs Inter)</p>
          <div class="compare-row">
            <div class="compare-item">
              <span class="compare-sub">Barlow Condensed 700 (현재 적용)</span>
              <span class="compare-title font-condensed">컴포넌트 데모</span>
            </div>
            <div class="compare-divider" />
            <div class="compare-item">
              <span class="compare-sub">Inter 700 (이전)</span>
              <span class="compare-title font-base" style="font-weight: 700">컴포넌트 데모</span>
            </div>
          </div>
          <p class="font-check-note">
            ↑ 상단 헤더의 "컴포넌트 데모" 타이틀이 Barlow Condensed로 렌더링되어야 합니다.
          </p>
        </div>
      </section>

      <!-- ── 레이아웃 컴포넌트 ─────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">레이아웃 컴포넌트</h2>
        <div class="layout-grid">
          <!-- Sidebar 설명 -->
          <div class="layout-card">
            <div class="layout-card-header">
              <span class="layout-tag sidebar-tag">Sidebar.vue</span>
              <span class="layout-dim">250px × 100vh</span>
            </div>
            <div class="profile-diagram">
              <!-- ① 로고 영역 -->
              <div class="pd-logo-area">
                <div class="pd-logo-icon">CK</div>
                <div class="pd-logo-text">
                  <span class="pd-logo-brand">CONK</span>
                  <span class="pd-logo-sub">Fulfillment Platform</span>
                </div>
              </div>
              <!-- ② 프로필 영역 -->
              <div class="pd-top">
                <div class="pd-avatar">SA</div>
                <div class="pd-info">
                  <span class="pd-name">홍길동</span>
                  <span class="pd-role">System Admin</span>
                  <span class="pd-org">CONK 본사</span>
                </div>
              </div>
              <div class="pd-divider" />
              <div class="pd-bottom">
                <span class="pd-email">admin@conk.com</span>
                <div class="pd-actions">
                  <span class="pd-icon-btn" title="설정">⚙</span>
                  <span class="pd-icon-btn" title="로그아웃">↪</span>
                </div>
              </div>
              <!-- ③ 네비게이션 영역 -->
              <div class="pd-nav">
                <div class="pd-nav-group">
                  <span class="pd-nav-label">주문 관리</span>
                  <div class="pd-nav-item active"><span class="pd-nav-icon">📦</span>주문 목록</div>
                  <div class="pd-nav-item"><span class="pd-nav-icon">➕</span>주문 등록</div>
                </div>
                <div class="pd-nav-group">
                  <span class="pd-nav-label">시스템</span>
                  <div class="pd-nav-item"><span class="pd-nav-icon">⚙️</span>설정</div>
                </div>
              </div>
            </div>
            <p class="layout-tip" style="margin-top: 12px">
              ← 왼쪽 사이드바가 실제 컴포넌트입니다.
            </p>
          </div>

          <!-- Header 설명 -->
          <div class="layout-card">
            <div class="layout-card-header">
              <span class="layout-tag header-tag">Header.vue</span>
              <span class="layout-dim">100% × 108px</span>
            </div>
            <ul class="layout-parts">
              <li>
                <span class="part-label">좌측</span
                ><span class="part-dim">페이지 제목 (Barlow Condensed) + 브레드크럼 (Barlow)</span>
              </li>
              <li>
                <span class="part-label">우측</span
                ><span class="part-dim">#action 슬롯 + 알림 벨 + 로그아웃</span>
              </li>
            </ul>
            <p class="layout-tip">
              ↑ 상단 헤더가 실제 컴포넌트입니다. 벨 아이콘 클릭 시 알림 패널 열림.
            </p>
          </div>

          <!-- AppLayout 설명 -->
          <div class="layout-card layout-card--full">
            <div class="layout-card-header">
              <span class="layout-tag app-tag">AppLayout.vue</span>
              <span class="layout-dim">Sidebar + Header + Footer + 콘텐츠 래퍼</span>
            </div>
            <div class="layout-code">
              <pre>
&lt;AppLayout title="주문 목록" :breadcrumb="[{ label: '홈', to: '/' }, { label: '주문' }]"&gt;
  &lt;template #header-action&gt;
    &lt;button class="btn-gold"&gt;주문 등록&lt;/button&gt;
  &lt;/template&gt;

  &lt;!-- 페이지 본문 --&gt;
  &lt;BaseTable :columns="cols" :rows="rows" /&gt;
&lt;/AppLayout&gt;</pre
              >
            </div>
          </div>
        </div>
      </section>

      <!-- ① StatusBadge ────────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">StatusBadge</h2>
        <div class="demo-card">
          <p class="demo-label">주문 상태 (type="order")</p>
          <div class="badge-row">
            <StatusBadge :status="ORDER_STATUS.PENDING" type="order" />
            <StatusBadge :status="ORDER_STATUS.CONFIRMED" type="order" />
            <StatusBadge :status="ORDER_STATUS.PICKING" type="order" />
            <StatusBadge :status="ORDER_STATUS.PACKING" type="order" />
            <StatusBadge :status="ORDER_STATUS.SHIPPED" type="order" />
            <StatusBadge :status="ORDER_STATUS.CANCELLED" type="order" />
          </div>
          <p class="demo-label mt">ASN 상태 (type="asn")</p>
          <div class="badge-row">
            <StatusBadge :status="ASN_STATUS.DRAFT" type="asn" />
            <StatusBadge :status="ASN_STATUS.SUBMITTED" type="asn" />
            <StatusBadge :status="ASN_STATUS.RECEIVED" type="asn" />
            <StatusBadge :status="ASN_STATUS.CANCELLED" type="asn" />
          </div>
          <p class="demo-label mt">계정 상태 (type="account")</p>
          <div class="badge-row">
            <StatusBadge :status="ACCOUNT_STATUS.ACTIVE" type="account" />
            <StatusBadge :status="ACCOUNT_STATUS.TEMP_PASSWORD" type="account" />
            <StatusBadge :status="ACCOUNT_STATUS.INACTIVE" type="account" />
            <StatusBadge status="UNKNOWN_STATUS" type="order" />
          </div>
        </div>
      </section>

      <!-- ② TimelineStepper ───────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">TimelineStepper</h2>
        <div class="demo-card">
          <TimelineStepper :currentStep="currentStep" :steps="ORDER_STEPS" />
          <div class="step-btns">
            <button
              v-for="s in ORDER_STEPS"
              :key="s.key"
              :class="{ active: currentStep === s.key }"
              class="step-pick-btn"
              @click="currentStep = s.key"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- ③ BaseTable ─────────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">BaseTable</h2>
        <div class="demo-card">
          <p class="demo-label">
            Props: <code>columns</code> (배열), <code>rows</code> (배열),
            <code>pagination</code> (객체)
          </p>
          <div class="layout-code" style="margin-bottom: 20px">
            <pre>
&lt;BaseTable :columns="cols" :rows="rows" :pagination="pagination"&gt;
  &lt;!-- 특정 컬럼 커스텀 렌더링 (예: key가 'status'인 경우) --&gt;
  &lt;template #cell-status="{ row, value }"&gt;
    &lt;StatusBadge :status="value" type="order" /&gt;
  &lt;/template&gt;
&lt;/BaseTable&gt;</pre
            >
          </div>
          <BaseTable
            :columns="tableColumns"
            :pagination="pagination"
            :rows="tableRows"
            @sort="(key) => console.log('sort:', key)"
            @page-change="(p) => (pagination.page = p)"
          >
            <template #cell-status="{ row }">
              <StatusBadge :status="row.status" type="order" />
            </template>
            <template #cell-amount="{ value }">
              <strong>{{ value }}</strong>
            </template>
          </BaseTable>
          <p class="demo-note">↑ status 셀에 StatusBadge 슬롯 적용, amount 셀 bold 처리</p>
        </div>
      </section>

      <!-- ④ BaseForm ──────────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">BaseForm</h2>
        <div class="demo-card form-grid">
          <BaseForm :error="formError" label="이름" required>
            <input
              v-model="formValues.name"
              placeholder="홍길동"
              type="text"
              @input="formError = formValues.name.length < 2 ? '2자 이상 입력해주세요' : ''"
            />
          </BaseForm>
          <BaseForm hint="example@domain.com" label="이메일">
            <input v-model="formValues.email" placeholder="user@example.com" type="email" />
          </BaseForm>
          <BaseForm label="메모 (선택)">
            <textarea v-model="formValues.memo" placeholder="내용을 입력하세요" rows="3" />
          </BaseForm>
          <BaseForm label="창고 선택">
            <select>
              <option value="">창고를 선택하세요</option>
              <option>인천 1창고</option>
              <option>인천 2창고</option>
              <option>부산 창고</option>
            </select>
          </BaseForm>
        </div>
      </section>

      <!-- ⑤ EmptyState ────────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">EmptyState</h2>
        <div class="demo-card empty-grid">
          <div class="empty-box"><EmptyState /></div>
          <div class="empty-box">
            <EmptyState
              description="아직 등록된 주문이 없습니다."
              icon="📦"
              title="주문이 없습니다"
            />
          </div>
          <div class="empty-box">
            <EmptyState description="해당 SKU의 재고가 없습니다." title="재고 없음">
              <template #action>
                <button class="btn-demo">ASN 등록하기</button>
              </template>
            </EmptyState>
          </div>
        </div>
      </section>

      <!-- ⑥ LoadingSpinner ────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">LoadingSpinner</h2>
        <div class="demo-card">
          <div style="margin-bottom: 20px">
            <button class="btn-demo btn-blue" @click="testGlobalLoading">
              전역 로딩 테스트 (2초)
            </button>
            <p class="demo-note" style="margin-top: 8px">
              <code>ui.setLoading(true)</code> 호출 시 전체 화면 로딩 오버레이가 나타납니다.
            </p>
          </div>
          <div class="spinner-row">
            <div class="spinner-item">
              <LoadingSpinner size="sm" />
              <span class="spinner-label">sm (16px)</span>
            </div>
            <div class="spinner-item">
              <LoadingSpinner size="md" />
              <span class="spinner-label">md (28px)</span>
            </div>
            <div class="spinner-item">
              <LoadingSpinner size="lg" />
              <span class="spinner-label">lg (44px)</span>
            </div>
            <div class="spinner-item spinner-item--dark">
              <LoadingSpinner color="#F5A623" size="md" />
              <span class="spinner-label">gold color</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ⑦ FileUpload ────────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">FileUpload</h2>
        <div class="demo-card">
          <FileUpload
            @file-selected="
              (f) => {
                uploadedFile = f
              }
            "
          />
          <p v-if="uploadedFile" class="demo-note">
            선택된 파일: <strong>{{ uploadedFile.name }}</strong> ({{
              (uploadedFile.size / 1024).toFixed(1)
            }}
            KB)
          </p>
          <p v-else class="demo-note">파일을 드래그하거나 클릭하여 업로드</p>
        </div>
      </section>

      <!-- ⑧⑨ Modal + ConfirmDialog ───────────────────── -->
      <section class="demo-section two-col">
        <div>
          <h2 class="section-title">BaseModal</h2>
          <div class="demo-card">
            <p class="demo-label">
              Props: <code>isOpen</code>, <code>title</code><br />Emits: <code>@confirm</code>,
              <code>@cancel</code>
            </p>
            <div class="layout-code" style="margin-bottom: 20px">
              <pre>
&lt;BaseModal
  title="모달 제목"
  :isOpen="showModal"
  @confirm="handleSave"
  @cancel="showModal = false"&gt;
  &lt;!-- 모달 내용 --&gt;
&lt;/BaseModal&gt;</pre
              >
            </div>
            <button class="btn-demo btn-blue" @click="showModal = true">모달 열기</button>
            <BaseModal
              :isOpen="showModal"
              title="재고 수정"
              @cancel="showModal = false"
              @confirm="showModal = false"
            >
              <BaseForm hint="영문+숫자 4~32자" label="SKU">
                <input placeholder="SKU-001" type="text" />
              </BaseForm>
              <BaseForm class="mt" label="수량">
                <input placeholder="0" type="number" />
              </BaseForm>
            </BaseModal>
          </div>
        </div>
        <div>
          <h2 class="section-title">ConfirmDialog</h2>
          <div class="demo-card">
            <p class="demo-label">
              Props: <code>isOpen</code>, <code>title</code>, <code>message</code>,
              <code>danger</code>(bool)<br />Emits: <code>@confirm</code>, <code>@cancel</code>
            </p>
            <div class="layout-code" style="margin-bottom: 20px">
              <pre>
&lt;ConfirmDialog
  :isOpen="showConfirm"
  title="삭제 확인"
  message="정말 삭제하시겠습니까?"
  confirmLabel="삭제"
  :danger="true"
  @confirm="handleDelete"
  @cancel="showConfirm = false" /&gt;</pre
              >
            </div>
            <button class="btn-demo btn-red" @click="showConfirm = true">삭제 확인</button>
            <ConfirmDialog
              :danger="true"
              :isOpen="showConfirm"
              confirmLabel="삭제"
              message="삭제하면 복구할 수 없습니다. 정말 삭제하겠습니까?"
              title="ASN 삭제"
              @cancel="showConfirm = false"
              @confirm="
                showConfirm = false
                showToast('success')
              "
            />
          </div>
        </div>
      </section>

      <!-- ⑩ ToastMessage ──────────────────────────────── -->
      <section class="demo-section">
        <h2 class="section-title">ToastMessage</h2>
        <div class="demo-card">
          <div class="toast-btns">
            <button class="btn-demo btn-green" @click="showToast('success')">Success</button>
            <button class="btn-demo btn-red" @click="showToast('error')">Error</button>
            <button class="btn-demo btn-blue" @click="showToast('info')">Info</button>
            <button class="btn-demo btn-amber" @click="showToast('warning')">Warning</button>
          </div>
          <ToastMessage
            v-model:visible="toast.visible"
            :message="toast.message"
            :type="toast.type"
          />
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
/* ── DEV 배지 (헤더 action 슬롯) ───────────────── */
.dev-badge {
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.12);
  color: var(--red);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* ── 본문 컨테이너 ──────────────────────────────── */
.demo-body {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ── 섹션 ──────────────────────────────────────── */
.demo-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.demo-section.two-col {
  flex-direction: row;
  gap: 24px;
}
.demo-section.two-col > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--border);
}

/* ── 카드 ──────────────────────────────────────── */
.demo-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

/* ── 폰트 시스템 섹션 ──────────────────────────── */
.font-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.font-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.font-card--condensed {
  border-top: 3px solid var(--gold);
}
.font-card--barlow {
  border-top: 3px solid var(--blue);
}
.font-card--mono {
  border-top: 3px solid var(--green);
}
.font-card--base {
  border-top: 3px solid var(--t4);
}

.font-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.font-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  width: fit-content;
}
.tag-condensed {
  background: rgba(245, 166, 35, 0.15);
  color: var(--gold);
}
.tag-barlow {
  background: rgba(76, 116, 255, 0.12);
  color: var(--blue);
}
.tag-mono {
  background: rgba(46, 204, 135, 0.15);
  color: var(--green);
}
.tag-base {
  background: var(--surface-2);
  color: var(--t3);
}

.font-meta {
  font-size: 11px;
  color: var(--t4);
}

.font-sample {
  font-size: 22px;
  color: var(--t1);
  line-height: 1.2;
  margin: 0;
}
.font-sample--sm {
  font-size: 15px;
  color: var(--t2);
}

.font-condensed {
  font-family: var(--font-condensed);
  font-weight: 700;
}
.font-barlow {
  font-family: var(--font-barlow);
  font-weight: 500;
}
.font-mono {
  font-family: var(--font-mono);
  font-weight: 400;
}
.font-base {
  font-family: var(--font-base);
  font-weight: 400;
}

.font-usage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.font-usage-chip {
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 10px;
  color: var(--t3);
  font-family: monospace;
}

/* 실제 렌더링 비교 카드 */
.font-compare-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compare-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--t3);
}

.compare-row {
  display: flex;
  align-items: center;
  gap: 32px;
}

.compare-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.compare-sub {
  font-size: 11px;
  color: var(--t4);
}

.compare-title {
  font-size: 28px;
  color: var(--t1);
  line-height: 1;
}

.compare-divider {
  width: 1px;
  height: 48px;
  background: var(--border);
  flex-shrink: 0;
}

.font-check-note {
  font-size: 12px;
  color: var(--blue);
  background: rgba(76, 116, 255, 0.06);
  border-left: 3px solid var(--blue);
  padding: 8px 12px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Sidebar 프로필 다이어그램 */
.profile-diagram {
  background: var(--sidebar);
  border-radius: var(--radius-md);
  overflow: hidden;
  font-size: 12px;
}

.pd-logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px;
  background: #0d0d0d;
  border-bottom: 1px solid var(--gold);
}

.pd-logo-icon {
  width: 28px;
  height: 28px;
  background: var(--gold);
  color: #0d0d0d;
  font-family: var(--font-condensed);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.pd-logo-text {
  display: flex;
  flex-direction: column;
}

.pd-logo-brand {
  font-family: var(--font-condensed);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1;
}

.pd-logo-sub {
  font-family: var(--font-barlow);
  color: #fff;
  font-size: 8px;
  letter-spacing: 1px;
}

.pd-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 14px 8px;
  background: var(--sidebar-lt);
}

.pd-avatar {
  width: 32px;
  height: 28px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--gold);
  color: var(--gold);
  font-family: var(--font-condensed);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pd-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pd-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.pd-role {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(245, 166, 35, 0.2);
  color: var(--gold);
  border-radius: 99px;
  font-size: 9px;
  font-weight: 600;
  width: fit-content;
}

.pd-org {
  font-size: 10px;
  color: var(--t4);
}

.pd-divider {
  height: 1px;
  background: var(--sidebar-bd);
  margin: 0 14px;
}

.pd-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 14px;
  background: var(--sidebar-lt);
  border-bottom: 1px solid var(--sidebar-bd);
}

.pd-email {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.pd-actions {
  display: flex;
  gap: 4px;
}

.pd-icon-btn {
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--sidebar-bd);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.pd-nav {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pd-nav-group {
  display: flex;
  flex-direction: column;
}

.pd-nav-label {
  padding: 8px 16px 4px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.pd-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 2px 10px;
  color: rgba(225, 224, 224, 0.9);
  border-radius: 4px;
}

.pd-nav-item.active {
  background: rgba(245, 166, 35, 0.12);
  color: #fff;
  border-left: 3px solid var(--gold);
  font-weight: 600;
}

.pd-nav-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
}

/* ── 레이아웃 컴포넌트 섹션 ────────────────────── */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.layout-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-card--full {
  grid-column: 1 / -1;
}

.layout-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout-tag {
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
}
.sidebar-tag {
  background: rgba(245, 166, 35, 0.15);
  color: var(--gold);
}
.header-tag {
  background: rgba(74, 122, 233, 0.15);
  color: var(--blue);
}
.app-tag {
  background: rgba(51, 195, 122, 0.15);
  color: var(--green);
}

.layout-dim {
  font-size: 12px;
  color: var(--t4);
}

.layout-parts {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layout-parts li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.part-label {
  font-weight: 600;
  color: var(--t2);
}
.part-dim {
  font-size: 11px;
  color: var(--t4);
  font-family: monospace;
}

.layout-tip {
  font-size: 12px;
  color: var(--blue);
  background: rgba(74, 122, 233, 0.06);
  border-left: 3px solid var(--blue);
  padding: 8px 12px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.layout-code pre {
  margin: 0;
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--t2);
  font-family: monospace;
  line-height: 1.6;
  overflow-x: auto;
  border: 1px solid var(--border);
}

/* ── 공통 유틸 ─────────────────────────────────── */
.demo-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--t3);
  margin-bottom: 10px;
}
.demo-label.mt {
  margin-top: 16px;
}
.demo-note {
  font-size: 12px;
  color: var(--t4);
  margin-top: 12px;
}

/* ── StatusBadge ───────────────────────────────── */
.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── TimelineStepper ───────────────────────────── */
.step-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.step-pick-btn {
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface-2);
  color: var(--t3);
  font-size: 12px;
  transition: all var(--ease-fast);
}
.step-pick-btn.active {
  border-color: var(--blue);
  background: var(--blue);
  color: #fff;
}
.step-pick-btn:hover:not(.active) {
  border-color: var(--blue);
  color: var(--blue);
}

/* ── BaseForm ──────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.mt {
  margin-top: 20px;
}

/* ── EmptyState ────────────────────────────────── */
.empty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.empty-box {
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

/* ── LoadingSpinner ────────────────────────────── */
.spinner-row {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}
.spinner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.spinner-item--dark {
  background: var(--sidebar);
  padding: 12px 20px;
  border-radius: var(--radius-md);
}
.spinner-label {
  font-size: 11px;
  color: var(--t4);
}

/* ── Toast 버튼 ────────────────────────────────── */
.toast-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── 공통 버튼 ─────────────────────────────────── */
.btn-demo {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  background: var(--surface-2);
  color: var(--t2);
  border: 1px solid var(--border);
  transition: all var(--ease-fast);
}
.btn-demo:hover {
  background: var(--surface);
  border-color: var(--blue);
  color: var(--blue);
}
.btn-blue {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}
.btn-blue:hover {
  background: #3a5fe0;
  color: #fff;
}
.btn-red {
  background: var(--red);
  color: #fff;
  border-color: var(--red);
}
.btn-red:hover {
  background: #d63030;
  color: #fff;
}
.btn-green {
  background: var(--green);
  color: #fff;
  border-color: var(--green);
}
.btn-green:hover {
  background: #27b576;
  color: #fff;
}
.btn-amber {
  background: var(--amber);
  color: var(--t1);
  border-color: var(--amber);
}
.btn-amber:hover {
  background: #e0b400;
}
</style>
