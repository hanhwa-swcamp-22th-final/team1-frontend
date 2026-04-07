<script setup>
/**
 * SellerRegister — 총괄관리자 셀러 등록 페이지
 *
 * 레이아웃: 등록 폼 카드 + 우측 가이드 패널
 * 패턴: WarehouseRegister.vue 구조 동일 적용
 */
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { ROUTE_NAMES } from '@/constants'
import { registerSeller } from '@/api/member'
import { getWarehouseList } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseForm from '@/components/common/BaseForm.vue'

const breadcrumb = [{ label: '셀러 관리' }, { label: '셀러 등록' }]
const router = useRouter()
const ui = useUiStore()

// ── 창고 목록 (소속 창고 선택용) ─────────────────────────────────────────────
const warehouses = ref([])

async function loadWarehouses() {
  try {
    const res = await getWarehouseList()
    warehouses.value = res.data.data ?? []
  } catch {
    // 비필수
  }
}

// ── 폼 ───────────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  brandNameKo:   '',
  brandNameEn:   '',
  contactName:   '',
  contactEmail:  '',
  warehouseIds:  [],
}

const form = reactive({ ...INITIAL_FORM })
const errors = reactive({
  brandNameKo:  '',
  contactName:  '',
  contactEmail: '',
})
const submitError = ref('')

function validate() {
  errors.brandNameKo  = form.brandNameKo.trim()   ? '' : '브랜드명(한국어)을 입력해주세요.'
  errors.contactName  = form.contactName.trim()   ? '' : '대표 담당자 성함을 입력해주세요.'
  errors.contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
    ? '' : '유효한 이메일 주소를 입력해주세요.'
  return !Object.values(errors).some(Boolean)
}

function resetForm() {
  Object.assign(form, INITIAL_FORM)
  Object.keys(errors).forEach(k => (errors[k] = ''))
  submitError.value = ''
}

// ── warehouseIds 체크박스 토글 ─────────────────────────────────────────────
function toggleWarehouse(id) {
  const idx = form.warehouseIds.indexOf(id)
  if (idx === -1) form.warehouseIds.push(id)
  else form.warehouseIds.splice(idx, 1)
}

async function submitForm() {
  submitError.value = ''
  if (!validate()) return

  ui.setLoading(true)
  try {
    await registerSeller({ ...form })
    router.push({ name: ROUTE_NAMES.MASTER_SELLER_COMPANY_LIST })
  } catch (err) {
    submitError.value = '셀러 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    console.error('[SellerRegister] submitForm error:', err)
  } finally {
    ui.setLoading(false)
  }
}

onMounted(loadWarehouses)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="셀러 등록" :loading="ui.isLoading">
    <template #header-action>
      <button
        class="ui-btn ui-btn--ghost"
        @click="router.push({ name: ROUTE_NAMES.MASTER_SELLER_COMPANY_LIST })"
      >
        목록으로 취소
      </button>
    </template>

    <div class="sr-page">

      <!-- ── 등록 폼 카드 ── -->
      <div class="form-card">
        <div class="form-card-header">
          <span class="form-card-title">신규 셀러 등록</span>
          <span class="form-card-step">등록 완료 시 CUST 코드 자동 발급</span>
        </div>

        <div class="form-body">

          <!-- 섹션 1: 셀러 기본 정보 -->
          <div class="form-section">
            <div class="form-section-title">셀러 기본 정보</div>

            <div class="form-row">
              <BaseForm label="브랜드명 (한국어)" :error="errors.brandNameKo" required>
                <input
                  v-model="form.brandNameKo"
                  type="text"
                  placeholder="예: K뷰티샵"
                />
              </BaseForm>

              <BaseForm label="브랜드명 (영문)">
                <input
                  v-model="form.brandNameEn"
                  type="text"
                  placeholder="예: K-Beauty Shop"
                />
              </BaseForm>
            </div>
          </div>

          <!-- 섹션 2: 대표 담당자 정보 -->
          <div class="form-section">
            <div class="form-section-title">대표 담당자 정보</div>

            <div class="form-row">
              <BaseForm label="담당자 성함" :error="errors.contactName" required>
                <input
                  v-model="form.contactName"
                  type="text"
                  placeholder="예: 이주원"
                />
              </BaseForm>

              <BaseForm
                label="담당자 이메일"
                :error="errors.contactEmail"
                hint="등록 후 초대 메일이 발송됩니다."
                required
              >
                <input
                  v-model="form.contactEmail"
                  type="email"
                  placeholder="jw.lee@company.com"
                />
              </BaseForm>
            </div>
          </div>

          <!-- 섹션 3: 연계 창고 선택 (선택) -->
          <div class="form-section">
            <div class="form-section-title">
              연계 창고 선택
              <span class="section-title-optional">(선택)</span>
            </div>

            <div class="warehouse-checkbox-group">
              <label
                v-for="wh in warehouses"
                :key="wh.id"
                class="wh-checkbox-item"
                :class="{ checked: form.warehouseIds.includes(wh.id) }"
              >
                <input
                  type="checkbox"
                  :checked="form.warehouseIds.includes(wh.id)"
                  @change="toggleWarehouse(wh.id)"
                />
                <span class="wh-checkbox-label">{{ wh.name }}</span>
              </label>

              <span v-if="warehouses.length === 0" class="wh-empty">
                등록된 창고가 없습니다.
              </span>
            </div>
          </div>

        </div><!-- /form-body -->

        <!-- 폼 푸터 -->
        <div class="form-footer">
          <div class="footer-note">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="var(--t3)" stroke-width="1.5"/>
              <path d="M9 8v4" stroke="var(--t3)" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="9" cy="5.5" r="1" fill="var(--t3)"/>
            </svg>
            <p class="note-text">
              셀러 등록 시 <strong>CUST 코드</strong>가 자동 발급됩니다.
              담당자 이메일로 플랫폼 접속 초대 메일이 즉시 발송됩니다.
            </p>
          </div>

          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <div class="footer-actions">
            <button class="ui-btn ui-btn--ghost" type="button" @click="resetForm">초기화</button>
            <button class="ui-btn ui-btn--gold"  type="button" @click="submitForm">셀러 등록 완료</button>
          </div>
        </div>
      </div><!-- /form-card -->

      <!-- ── 가이드 패널 ── -->
      <div class="guide-panel">

        <div class="guide-card">
          <div class="guide-card-header">
            <div class="guide-icon guide-icon--gold">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="guide-card-title">셀러 코드 체계 안내</span>
          </div>
          <div class="guide-card-body">
            <p class="guide-rule">CUST-GL-[SEQ]</p>
            <p class="guide-desc">
              모든 셀러는 <strong>CUST-GL-</strong> 접두어와 순번으로 구성된 고유 코드를 부여받습니다.
            </p>
            <p class="guide-desc" style="margin-top: 6px;">
              예: <code>CUST-GL-001</code>, <code>CUST-GL-002</code>
            </p>
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-header">
            <div class="guide-icon guide-icon--blue">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 2 1.3 3.7 3 4.3V12h2v-1.7C10.7 9.7 12 8 12 6c0-2.2-1.8-4-4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M6 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="guide-card-title">초대 프로세스 안내</span>
          </div>
          <div class="guide-card-body">
            <p class="guide-desc">
              셀러 등록 후 담당자 이메일로 임시 비밀번호와 로그인 링크가 발송됩니다.
              최초 로그인 시 비밀번호 변경이 필요하며, 변경 완료 후 정상 계정으로 활성화됩니다.
            </p>
          </div>
        </div>

      </div><!-- /guide-panel -->
    </div>
  </AppLayout>
</template>

<style scoped>
.sr-page {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* ── 폼 카드 ── */
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

.form-card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--t1); }
.form-card-step  { font-size: var(--font-size-sm); color: var(--t3); }

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

.form-row > :only-child { grid-column: 1 / -1; }

/* ── 창고 체크박스 ── */
.warehouse-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wh-checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  transition: all var(--ease-fast);
}

.wh-checkbox-item.checked {
  border-color: var(--gold);
  background: var(--gold-pale);
}

.wh-checkbox-item input[type="checkbox"] { display: none; }

.wh-checkbox-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--t2);
}

.wh-checkbox-item.checked .wh-checkbox-label { color: var(--t1); font-weight: 600; }

.wh-empty {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t4);
}

/* ── 폼 푸터 ── */
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

.note-text { font-size: var(--font-size-xs); color: var(--t3); line-height: 1.6; }
.note-text strong { color: var(--t1); font-weight: 600; }

.submit-error { width: 100%; font-size: var(--font-size-xs); color: var(--red); text-align: right; }

.footer-actions { display: flex; gap: 10px; flex-shrink: 0; }

.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}

/* ── 가이드 패널 ── */
.guide-panel {
  width: 320px;
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

.guide-icon--gold { background: var(--gold-pale); color: #92400e; }
.guide-icon--blue { background: var(--blue-pale); color: var(--blue); }

.guide-card-title { font-size: var(--font-size-md); font-weight: 700; color: var(--t1); }

.guide-card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-rule { font-size: var(--font-size-md); font-weight: 700; color: var(--t1); }

.guide-desc { font-size: var(--font-size-sm); color: var(--t2); line-height: 1.6; }
.guide-desc strong { color: var(--t1); font-weight: 600; }
.guide-desc code {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  color: var(--t2);
}
</style>
