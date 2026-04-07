<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { ROUTE_NAMES } from '@/constants'
import { registerWarehouse } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'

/** 헤더 브레드크럼: 창고 관리 › 창고 등록 */
const breadcrumb = [{ label: '창고 관리' }, { label: '창고 등록' }]

/** 등록 완료 후 창고 목록으로 이동하기 위한 라우터 인스턴스 */
const router = useRouter()

/** 전역 로딩 오버레이 제어 (API 호출 중 스피너 표시) */
const ui = useUiStore()

// ── 폼 초기값 ─────────────────────────────────────────────────────────────────
/** 초기화 버튼 클릭 시 폼을 되돌릴 기준값 (Object.assign의 소스로 사용) */
const INITIAL_FORM = {
  name:         '', // 창고 명칭 (필수)
  sqft:         '', // 창고 규모 — sqft 단위 숫자 문자열 (필수)
  address:      '', // 소재지 전체 주소 (필수)
  city:         '', // 도시명
  state:        '', // 주(State) 코드 — 공항 코드 매핑에 사용됨
  openTime:     '08:00', // 운영 시작 시간 (필수)
  closeTime:    '18:00', // 운영 종료 시간 (필수)
  timezone:     'PST',   // 현지 시간대
  managerName:  '',      // 현장 관리자 성함 (선택)
  managerEmail: '',      // 현장 관리자 이메일 — 입력 시 초대 메일 발송 (선택)
}

/** 실제 폼 바인딩 객체 — v-model 로 각 input/select 에 연결 */
const form = reactive({ ...INITIAL_FORM })

/**
 * 필드별 유효성 에러 메시지 — BaseForm :error 에 바인딩
 * 빈 문자열이면 에러 없음, 문자열이 있으면 해당 메시지를 빨간 글씨로 표시
 */
const errors = reactive({ name: '', sqft: '', address: '', openTime: '' })

/** API 호출 실패 시 폼 하단에 표시할 전체 오류 메시지 */
const submitError = ref('')

// ── 유효성 검사 ───────────────────────────────────────────────────────────────
/**
 * 필수 항목 체크 후 errors 객체를 갱신한다.
 * 모든 필수 항목이 유효하면 true, 하나라도 비어 있으면 false 반환.
 * BaseForm 의 :error 가 errors 를 참조하므로 이 함수 호출만으로 UI 에 에러 표시됨.
 */
function validate() {
  errors.name     = form.name.trim()                    ? '' : '창고 명칭을 입력해주세요.'
  errors.sqft     = form.sqft && Number(form.sqft) > 0  ? '' : '창고 규모(sqft)를 입력해주세요.'
  errors.address  = form.address.trim()                 ? '' : '소재지 주소를 입력해주세요.'
  errors.openTime = form.openTime && form.closeTime     ? '' : '운영 시간을 입력해주세요.'
  return !Object.values(errors).some(Boolean)
}

// ── 초기화 ────────────────────────────────────────────────────────────────────
/**
 * 폼 전체를 INITIAL_FORM 기준값으로 되돌린다.
 * errors / submitError 도 함께 초기화하여 에러 표시를 제거한다.
 */
function resetForm() {
  Object.assign(form, INITIAL_FORM)
  Object.keys(errors).forEach(k => (errors[k] = ''))
  submitError.value = ''
}

// ── 제출 ──────────────────────────────────────────────────────────────────────
/**
 * 창고 등록 완료 버튼 핸들러.
 * 1) validate() 로 필수 항목 검사 → 실패 시 조기 반환
 * 2) 로딩 오버레이 표시 후 registerWarehouse API 호출
 * 3) 성공 → 창고 목록 페이지로 이동
 * 4) 실패 → submitError 에 메시지 설정 (폼 하단 에러 표시)
 */
async function submitForm() {
  submitError.value = ''
  if (!validate()) return

  ui.setLoading(true)
  try {
    await registerWarehouse({ ...form })
    router.push({ name: ROUTE_NAMES.MASTER_WAREHOUSE_LIST })
  } catch (err) {
    submitError.value = '창고 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[WarehouseRegister] submitForm error:', err)
  } finally {
    ui.setLoading(false)
  }
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="창고 등록" :loading="ui.isLoading">

    <!-- 헤더 액션 버튼 -->
    <template #header-action>
      <button class="ui-btn ui-btn--ghost" @click="router.push({ name: ROUTE_NAMES.MASTER_WAREHOUSE_LIST })">
        목록으로 취소
      </button>
    </template>

    <div class="wr-page">

      <!-- ── 등록 폼 카드 ── -->
      <div class="form-card">
        <div class="form-card-header">
          <span class="form-card-title">신규 풀필먼트 창고 등록</span>
          <span class="form-card-step">등록 완료 시 WH 고유 코드 자동 발급</span>
        </div>

        <div class="form-body">

          <!-- 섹션 1: 창고 기본 정보 -->
          <div class="form-section">
            <div class="form-section-title">창고 기본 정보</div>

            <div class="form-row">
              <BaseForm label="창고 명칭" :error="errors.name" required>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="예: LA West Coast Hub"
                />
              </BaseForm>

              <BaseForm label="창고 규모 (sqft)" :error="errors.sqft" required>
                <input
                  v-model="form.sqft"
                  type="number"
                  min="1"
                  placeholder="숫자만 입력 (예: 45000)"
                />
              </BaseForm>
            </div>

            <div class="form-row">
              <BaseForm label="소재지 주소 (Full Address)" :error="errors.address" required>
                <input
                  v-model="form.address"
                  type="text"
                  placeholder="미국 현지 주소 입력"
                />
              </BaseForm>
            </div>

            <div class="form-row">
              <BaseForm label="도시 (City)" class="form-group--half">
                <input
                  v-model="form.city"
                  type="text"
                  placeholder="Los Angeles"
                />
              </BaseForm>

              <BaseForm label="주 (State / Code)" class="form-group--half">
                <select v-model="form.state">
                  <option value="">선택</option>
                  <option value="CA">California (CA)</option>
                  <option value="TX">Texas (TX)</option>
                  <option value="NY">New York (NY)</option>
                  <option value="GA">Georgia (GA)</option>
                </select>
              </BaseForm>
            </div>
          </div>

          <!-- 섹션 2: 운영 및 업무 설정 -->
          <div class="form-section">
            <div class="form-section-title">운영 및 업무 설정</div>

            <div class="form-row">
              <BaseForm label="표준 운영 시간" :error="errors.openTime" required>
                <div class="time-range">
                  <input v-model="form.openTime"  type="time" />
                  <span class="time-sep">~</span>
                  <input v-model="form.closeTime" type="time" />
                </div>
              </BaseForm>

              <BaseForm label="현지 기준 시간대 (Timezone)">
                <select v-model="form.timezone">
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="EST">Eastern Time (EST)</option>
                </select>
              </BaseForm>
            </div>
          </div>

          <!-- 섹션 3: 현장 책임 관리자 할당 (선택) -->
          <div class="form-section">
            <div class="form-section-title">
              현장 책임 관리자 할당
              <span class="section-title-optional">(선택)</span>
            </div>

            <div class="form-row">
              <BaseForm label="관리자 성함">
                <input
                  v-model="form.managerName"
                  type="text"
                  placeholder="Michael Jung"
                />
              </BaseForm>

              <BaseForm
                label="관리자 이메일"
                hint="입력 시, 창고 관리자(WH_MANAGER) 권한 초대 메일이 발송됩니다."
              >
                <input
                  v-model="form.managerEmail"
                  type="email"
                  placeholder="m.jung@glsm.com"
                />
              </BaseForm>
            </div>
          </div>

        </div><!-- /form-body -->

        <!-- 폼 푸터 -->
        <div class="form-footer">
          <div class="footer-note">
            <svg class="note-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="var(--t3)" stroke-width="1.5"/>
              <path d="M9 8v4" stroke="var(--t3)" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="9" cy="5.5" r="1" fill="var(--t3)"/>
            </svg>
            <p class="note-text">
              새로운 창고 등록 시 <strong>WH 코드</strong>가 지역 기반으로 자동 생성됩니다.
              예: LA 지역 등록 시 <code>WH-LAX-001</code> 과 같은 형식을 갖게 됩니다.
            </p>
          </div>

          <!-- 제출 에러 -->
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <div class="footer-actions">
            <button class="ui-btn ui-btn--ghost" type="button" @click="resetForm">초기화</button>
            <button class="ui-btn ui-btn--gold"  type="button" @click="submitForm">창고 등록 완료</button>
          </div>
        </div>
      </div><!-- /form-card -->

      <!-- ── 우측 가이드 패널 ── -->
      <div class="guide-panel">

        <!-- 창고 코드 체계 안내 -->
        <div class="guide-card">
          <div class="guide-card-header">
            <div class="guide-icon guide-icon--gold">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M3 7h10M8 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="guide-card-title">창고 코드 체계 안내</span>
          </div>
          <div class="guide-card-body">
            <p class="guide-rule">WH - [AIRPORT CODE] - [SEQ]</p>
            <p class="guide-desc">인접한 주요 국제공항 코드를 기준으로 분류됩니다.</p>
            <ul class="guide-airport-list">
              <li>Los Angeles → <code>LAX</code></li>
              <li>New York &nbsp;&nbsp;&nbsp;→ <code>JFK</code></li>
              <li>Dallas &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ <code>DAL</code></li>
              <li>Atlanta &nbsp;&nbsp;&nbsp;&nbsp;→ <code>ATL</code></li>
            </ul>
          </div>
        </div>

        <!-- 창고별 데이터 격리 안내 -->
        <div class="guide-card">
          <div class="guide-card-header">
            <div class="guide-icon guide-icon--blue">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5 6.5h6M5 9.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="guide-card-title">창고별 데이터 격리</span>
          </div>
          <div class="guide-card-body">
            <p class="guide-desc">
              각 창고는 고유한 <strong>warehouse_id</strong>를 가지며,
              재고(Bin/Stock) 및 주문 처리 데이터는 창고 단위로 완전히 분리되어 관리됩니다.
            </p>
            <p class="guide-desc" style="margin-top: 10px;">
              창고 관리자(WH_MANAGER)는 할당된 창고의 데이터에만 접근할 수 있습니다.
            </p>
          </div>
        </div>

      </div><!-- /guide-panel -->

    </div><!-- /wr-page -->
  </AppLayout>
</template>

<style scoped>
/* ── 페이지 레이아웃 ─────────────────────────────────────────────────────────── */
.wr-page {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* ── 폼 카드 ─────────────────────────────────────────────────────────────────── */
.form-card {
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.form-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.form-card-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
}

.form-card-step {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

/* ── 폼 본문 ─────────────────────────────────────────────────────────────────── */
.form-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.section-title-optional {
  font-weight: 500;
  color: var(--t4);
  text-transform: none;
  letter-spacing: 0;
  margin-left: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 단일 전체 너비 필드 (sojaezi address 등) */
.form-row > :only-child {
  grid-column: 1 / -1;
}

/* w-half: 명시적 절반 너비 */
:deep(.form-group--half) {
  /* BaseForm 자체를 half로 제한할 필요 없음 — grid가 처리 */
}

/* 운영 시간 — 두 input을 가로 배치 */
.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-md);
  outline: none;
  transition: border-color var(--ease-fast), box-shadow var(--ease-fast);
}

.time-range input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.time-sep {
  color: var(--t4);
  flex-shrink: 0;
}

/* ── 폼 푸터 ─────────────────────────────────────────────────────────────────── */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
  flex-wrap: wrap;
}

.footer-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.note-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.note-text {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.6;
}

.note-text strong {
  color: var(--t1);
  font-weight: 600;
}

.note-text code {
  font-size: 11px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
  color: var(--t2);
}

.submit-error {
  width: 100%;
  font-size: var(--font-size-xs);
  color: var(--red);
  text-align: right;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ── 버튼 ─────────────────────────────────────────────────────────────────────
   ui-btn, ui-btn--ghost 는 프로젝트 글로벌 스타일에 정의되어 있음.
   ui-btn--gold 만 여기서 보완.
── */
.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245, 166, 35, 0.3);
}

.ui-btn--gold:hover {
  background: var(--gold-lt, color-mix(in srgb, var(--gold) 85%, white));
}

/* ── 가이드 패널 ──────────────────────────────────────────────────────────────── */
.guide-panel {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.guide-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.guide-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guide-icon--gold {
  background: var(--gold-pale);
  color: #92400e;
}

.guide-icon--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.guide-card-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
}

.guide-card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-rule {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--t1);
}

.guide-desc {
  font-size: var(--font-size-sm);
  color: var(--t2);
  line-height: 1.6;
}

.guide-desc strong {
  color: var(--t1);
  font-weight: 600;
}

.guide-airport-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-airport-list li {
  font-size: 12px;
  color: var(--t3);
}

.guide-airport-list code {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  color: var(--t2);
}
</style>
