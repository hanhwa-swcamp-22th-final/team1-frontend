<script setup>
/**
 * FeeSettings — 총괄관리자 3PL 사용료 설정 (Edit)
 *
 * 레이아웃:
 *   2열 그리드
 *   왼쪽: 보관비 편집 카드 + 피킹/패킹 편집 카드
 *   오른쪽: 라스트마일 인라인 input 테이블 + 해상/항공 서차지 2열 카드
 *
 * 저장 성공 시: 상단 green 배너 4초 표시
 */
import { reactive, ref, onMounted } from 'vue'
import { getFeeSettings, saveFeeSettings } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'

const breadcrumb = [{ label: '요금 설정' }, { label: '3PL 사용료 설정' }]
const isLoading = ref(false)
// 저장 완료 시 공통 ToastMessage 를 노출한다.
const showSaveNotice = ref(false)

// ── 폼 상태 ───────────────────────────────────────────────────────────────────
const form = reactive({
  storage: {
    palletRate: '28.50',
    minBillingUnit: '1',
    proRataRule: '입고일 포함 일할 청구',
  },
  pickPack: {
    basePickRate: '2.50',
    additionalSkuRate: '0.75',
    packingMaterialRate: '0.30',
    specialPackagingSurcharge: '1.20',
  },
  lastMile: {
    USPS:  ['4.20', '5.10', '6.40', '7.80', '9.50', '12.30'],
    UPS:   ['5.50', '6.80', '8.20', '10.40', '14.60', '19.90'],
    FedEx: ['5.90', '7.30', '8.80', '11.20', '15.80', '21.50'],
  },
})

const WEIGHT_BANDS = ['0–1 lb', '1–2 lb', '2–3 lb', '3–5 lb', '5–10 lb', '10 lb+']
const CARRIERS = [
  { key: 'USPS',  cls: 'c-usps',  color: '#005EA6' },
  { key: 'UPS',   cls: 'c-ups',   color: '#7A4A0A' },
  { key: 'FedEx', cls: 'c-fedex', color: '#4C1D95' },
]

async function fetchFee() {
  isLoading.value = true
  try {
    const res = await getFeeSettings()
    if (res.data?.data) Object.assign(form, res.data.data)
  } catch {
    // 기본값 유지
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isLoading.value = true
  try {
    await saveFeeSettings({ ...form })
    // 토스트 표시 상태를 갱신한다.
    showSaveNotice.value = true
  } catch (e) {
    console.error('[FeeSettings] save error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchFee)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="3PL 사용료 설정" :loading="isLoading">
    <!-- 저장 성공 알림은 공통 토스트 컴포넌트로 통일 -->
    <ToastMessage
      v-model:visible="showSaveNotice"
      message="새로운 요금 설정이 시스템에 저장되었습니다.변경된 단가는 익일부터 신규 청구서에 반영됩니다."
      type="success"
    />
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-export">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 1v8M3.5 6.5L7 10l3.5-3.5"/>
          <path d="M1.5 11v1.5h11V11"/>
        </svg>
        단가표 내보내기
      </button>
      <button class="ui-btn ui-btn--gold btn-save" @click="saveSettings">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1.5 7l3.5 3.5L12.5 3"/>
        </svg>
        설정 저장하기
      </button>
    </template>

    <div class="rate-grid">
      <!-- ── 왼쪽 컬럼 ── -->
      <div class="left-col">

        <!-- 보관비 -->
        <div class="rate-card">
          <div class="rate-card-header">
            <div class="rate-icon rate-icon--gold">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 9h14M6 9v7M12 9v7" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <span class="rate-card-title">기본 보관비 (Storage Fee)</span>
          </div>
          <div class="rate-card-body">
            <div class="field-row">
              <div class="field-label">팔레트 보관 단가 <span class="req">*</span></div>
              <div class="field-input-wrap">
                <input v-model="form.storage.palletRate" type="text" class="field-input" />
                <span class="field-unit">$ / pallet / 월</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">팔레트 규격 (GMA)</div>
              <div class="field-input-wrap">
                <input type="text" class="field-input field-input--full field-input--readonly" value="48 × 40 inch (고정)" readonly />
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">최소 청구 단위</div>
              <div class="field-input-wrap">
                <input v-model="form.storage.minBillingUnit" type="text" class="field-input" />
                <span class="field-unit">pallet (월 기준)</span>
              </div>
            </div>
            <div class="divider"></div>
            <div class="field-row">
              <div class="field-label">일할 계산 기준</div>
              <div class="field-input-wrap">
                <select v-model="form.storage.proRataRule" class="field-input field-input--full field-input--select">
                  <option>입고일 포함 일할 청구</option>
                  <option>월초 기준 고정 청구</option>
                </select>
              </div>
            </div>
            <div class="field-note">
              <strong>과금 규칙:</strong> 매월 1일 기준 보관 중인 팔레트 수량으로 월 청구됩니다. 월 중 입고된 추가 팔레트는 입고일 기준으로 일할 계산되어 합산 청구됩니다.
            </div>
          </div>
        </div>

        <!-- 피킹/패킹 -->
        <div class="rate-card">
          <div class="rate-card-header">
            <div class="rate-icon rate-icon--gold">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M9 2l7 4v6l-7 4-7-4V6l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M2 6l7 4 7-4M9 10v6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="rate-card-title">피킹 및 패킹 단가 (Pick &amp; Pack)</span>
          </div>
          <div class="rate-card-body">
            <div class="field-row">
              <div class="field-label">기본 피킹 단가 <span class="req">*</span></div>
              <div class="field-input-wrap">
                <input v-model="form.pickPack.basePickRate" type="text" class="field-input" />
                <span class="field-unit">$ / 주문 1건 (1 SKU 포함)</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">추가 SKU 단가 <span class="req">*</span></div>
              <div class="field-input-wrap">
                <input v-model="form.pickPack.additionalSkuRate" type="text" class="field-input" />
                <span class="field-unit">$ / 추가 SKU 단위당</span>
              </div>
            </div>
            <div class="divider"></div>
            <div class="field-row">
              <div class="field-label">패킹 기본 자재비</div>
              <div class="field-input-wrap">
                <input v-model="form.pickPack.packingMaterialRate" type="text" class="field-input" />
                <span class="field-unit">$ / 박스 (기본 소형 박스)</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field-label">특수 포장 할증</div>
              <div class="field-input-wrap">
                <input v-model="form.pickPack.specialPackagingSurcharge" type="text" class="field-input" />
                <span class="field-unit">$ / 건 (Fragile, 완충재 과다)</span>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /left-col -->

      <!-- ── 오른쪽 컬럼 ── -->
      <div class="right-col">

        <!-- 라스트마일 -->
        <div class="rate-card">
          <div class="rate-card-header">
            <div class="rate-icon rate-icon--blue">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 7h2.5a1.5 1.5 0 011.5 1.5v4.5h-4M5 13v2M13 13v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="rate-card-title">라스트마일 배송 요율 (Last-Mile Rate)</span>
            <span class="rate-card-sub">단위: $ / lb</span>
          </div>
          <div class="rate-card-body rate-card-body--compact">
            <div class="rate-table-wrap">
              <table class="rate-table">
                <thead>
                  <tr>
                    <th>배송사</th>
                    <th v-for="band in WEIGHT_BANDS" :key="band">{{ band }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="carrier in CARRIERS" :key="carrier.key">
                    <td>
                      <div class="carrier-badge">
                        <span class="carrier-dot" :style="{ background: carrier.color }"></span>
                        {{ carrier.key }}
                      </div>
                    </td>
                    <td v-for="(_, i) in WEIGHT_BANDS" :key="i">
                      <input
                        v-model="form.lastMile[carrier.key][i]"
                        type="text"
                        class="rt-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="field-note field-note--blue">
              <strong>적용 기준:</strong> 실중량과 부피중량(L×W×H÷139) 중 더 큰 값을 적용합니다.
            </div>
          </div>
        </div>


      </div><!-- /right-col -->
    </div>
  </AppLayout>
</template>

<style scoped>
/* ── 헤더 버튼 ── */
.btn-export, .btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.ui-btn--gold {
  background: var(--gold);
  border: none;
  color: var(--t1);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(245,166,35,0.3);
}


/* ── 그리드 ── */
.rate-grid {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 24px;
  align-items: start;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0; /* grid 자식이 콘텐츠 너비 아래로 축소될 수 있도록 */
}

/* ── 카드 ── */
.rate-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.rate-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.rate-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rate-icon--gold   { background: var(--gold-pale);   color: #92400E; }
.rate-icon--blue   { background: var(--blue-pale);   color: var(--blue); }

.rate-card-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.5px;
  color: var(--t1);
}

.rate-card-sub {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t3);
  margin-left: auto;
}

.rate-card-body { padding: 24px; }
.rate-card-body--compact { padding: 20px; }

/* ── 필드 행 ── */
.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.field-row:last-child { margin-bottom: 0; }

.field-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--t2);
  width: 140px;
  flex-shrink: 0;
}

.req { color: var(--red); }

.field-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0; /* flex 자식이 input + unit 텍스트를 카드 밖으로 밀지 않도록 */
}

.field-input {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--t1);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 12px;
  outline: none;
  text-align: right;
  width: 120px;
  min-width: 0; /* input 기본 min-width:auto가 flex 레이아웃을 깨는 것 방지 */
  transition: border-color 0.2s;
}

.field-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-pale); }
.field-input--full { width: 100%; text-align: left; }
.field-input--readonly { background: var(--surface-2); color: var(--t3); cursor: not-allowed; }
.field-input--select { cursor: pointer; text-align: left; }

.field-unit {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}

.divider { height: 1px; background: var(--border); margin: 16px 0; }

.field-note {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t3);
  padding: 10px 14px;
  background: var(--surface-2);
  border-radius: 4px;
  line-height: 1.5;
  margin-top: 16px;
  border-left: 3px solid var(--border);
}
.field-note strong { color: var(--t2); font-weight: 600; }
.field-note--blue { border-left-color: var(--blue); background: var(--blue-pale); }

/* ── 라스트마일 테이블 ── */
.rate-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--border);
  border-radius: 6px;
  max-width: 100%; /* 부모 카드 너비를 초과하지 않도록 */
}

.rate-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
}

.rate-table th {
  padding: 10px 8px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  border-left: 1px solid var(--border);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 11px;
  color: var(--t3);
  text-align: center;
  white-space: nowrap;
}
.rate-table th:first-child { border-left: none; text-align: left; }

.rate-table td {
  padding: 8px;
  border-bottom: 1px solid var(--border);
  border-left: 1px solid var(--border);
}
.rate-table td:first-child { border-left: none; text-align: left; }
.rate-table tr:last-child td { border-bottom: none; }

.carrier-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 13px;
  padding: 0 4px;
}

.carrier-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.rt-input {
  width: 68px;
  padding: 6px 8px;
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--t1);
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--bg, #F4F6FA);
  outline: none;
  transition: all 0.2s;
}
.rt-input:hover { border-color: var(--border); }
.rt-input:focus { border-color: var(--gold); background: var(--surface); box-shadow: 0 0 0 2px var(--gold-pale); }

</style>
