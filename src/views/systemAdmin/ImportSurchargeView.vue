<script setup>
/**
 * ImportSurchargeView — System Admin 수입 부가비용 설정
 *
 * 해상 수입 부가비용(MPF, HMF, ISF, 드레이지)과
 * 항공 수입 부가비용(보안수수료, 공항내륙운송, 서류처리, 위험물, 온도관리)을
 * 플랫폼 전체 기준으로 System Admin이 설정한다.
 *
 * 저장 패턴: GET → merge → PUT (기존 storage/pickPack/lastMile 필드 보존)
 */
import { reactive, ref, onMounted } from 'vue'
import { getFeeSettings, saveFeeSettings } from '@/api/wms'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'

const breadcrumb = [{ label: '단가 관리' }, { label: '수입 부가비용 설정' }]
const isLoading = ref(false)
const showSaveNotice = ref(false)

const form = reactive({
  seaSurcharge: {
    mpfRate: '0.3464',
    mpfMin: '32.71',
    mpfMax: '634.62',
    hmfRate: '0.125',
    isfFee: '35.00',
    drayage: '320.00',
  },
  airSurcharge: {
    securityFee: '0.18',
    airportTransport: '180.00',
    documentFee: '45.00',
    hazmatSurcharge: '60.00',
    temperatureSurcharge: '120.00',
  },
})

async function fetchSettings() {
  isLoading.value = true
  try {
    const res = await getFeeSettings()
    const data = res.data?.data
    if (data?.seaSurcharge) Object.assign(form.seaSurcharge, data.seaSurcharge)
    if (data?.airSurcharge) Object.assign(form.airSurcharge, data.airSurcharge)
  } catch {
    // 기본값 유지
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isLoading.value = true
  try {
    // 기존 전체 설정을 먼저 fetch하여 storage/pickPack/lastMile 보존
    const res = await getFeeSettings()
    const existing = res.data?.data ?? {}
    await saveFeeSettings({
      ...existing,
      seaSurcharge: { ...form.seaSurcharge },
      airSurcharge: { ...form.airSurcharge },
    })
    showSaveNotice.value = true
  } catch (e) {
    console.error('[ImportSurchargeView] save error:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="수입 부가비용 설정" :loading="isLoading">
    <ToastMessage
      v-model:visible="showSaveNotice"
      message="수입 부가비용 설정이 저장되었습니다. 변경된 단가는 신규 청구서에 반영됩니다."
      type="success"
    />
    <template #header-action>
      <button class="ui-btn ui-btn--gold btn-save" @click="saveSettings">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1.5 7l3.5 3.5L12.5 3"/>
        </svg>
        설정 저장하기
      </button>
    </template>

    <div class="surcharge-grid">

      <!-- 해상 수입 부가비용 -->
      <div class="rate-card">
        <div class="rate-card-header">
          <div class="rate-icon rate-icon--blue">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M2 9c3-1.5 5 1.5 8 0s4-1.5 6 0M2 13c3-1.5 5 1.5 8 0s4-1.5 6 0M4 9V3h10v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="rate-card-title">해상 수입 부가비용</span>
        </div>
        <div class="rate-card-body">
          <div class="sc-row">
            <div class="sc-label">MPF 요율</div>
            <div class="sc-input-wrap"><input v-model="form.seaSurcharge.mpfRate" type="text" class="sc-input" /><span class="sc-unit">%</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">MPF Min / Max</div>
            <div class="sc-input-wrap">
              <input v-model="form.seaSurcharge.mpfMin" type="text" class="sc-input sc-input--sm" />
              <span class="sc-sep">~</span>
              <input v-model="form.seaSurcharge.mpfMax" type="text" class="sc-input sc-input--sm" />
              <span class="sc-unit">$</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="sc-row">
            <div class="sc-label">HMF 요율</div>
            <div class="sc-input-wrap"><input v-model="form.seaSurcharge.hmfRate" type="text" class="sc-input" /><span class="sc-unit">%</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">ISF 수수료</div>
            <div class="sc-input-wrap"><input v-model="form.seaSurcharge.isfFee" type="text" class="sc-input" /><span class="sc-unit">$ / 선적</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">드레이지</div>
            <div class="sc-input-wrap"><input v-model="form.seaSurcharge.drayage" type="text" class="sc-input" /><span class="sc-unit">$ / 컨테이너</span></div>
          </div>
        </div>
      </div>

      <!-- 항공 수입 부가비용 -->
      <div class="rate-card">
        <div class="rate-card-header">
          <div class="rate-icon rate-icon--purple">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M14 11.5l1.5-1.5c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0L9 6.5M3.5 13.5L8 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M7 14L2.5 15.5 4 11l4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="rate-card-title">항공 수입 부가비용</span>
        </div>
        <div class="rate-card-body">
          <div class="sc-row">
            <div class="sc-label">보안 수수료</div>
            <div class="sc-input-wrap"><input v-model="form.airSurcharge.securityFee" type="text" class="sc-input" /><span class="sc-unit">$ / kg</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">공항 내륙 운송비</div>
            <div class="sc-input-wrap"><input v-model="form.airSurcharge.airportTransport" type="text" class="sc-input" /><span class="sc-unit">$ / 편</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">서류 처리비 (DO)</div>
            <div class="sc-input-wrap"><input v-model="form.airSurcharge.documentFee" type="text" class="sc-input" /><span class="sc-unit">$ / 건</span></div>
          </div>
          <div class="divider"></div>
          <div class="sc-row">
            <div class="sc-label">위험물 취급 할증</div>
            <div class="sc-input-wrap"><input v-model="form.airSurcharge.hazmatSurcharge" type="text" class="sc-input" /><span class="sc-unit">$ / 건</span></div>
          </div>
          <div class="sc-row">
            <div class="sc-label">온도 관리 할증</div>
            <div class="sc-input-wrap"><input v-model="form.airSurcharge.temperatureSurcharge" type="text" class="sc-input" /><span class="sc-unit">$ / 편</span></div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
.btn-save {
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

.surcharge-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

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

.rate-icon--blue   { background: var(--blue-pale);   color: var(--blue); }
.rate-icon--purple { background: var(--purple-pale); color: var(--purple); }

.rate-card-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.5px;
  color: var(--t1);
}

.rate-card-body { padding: 24px; }

.divider { height: 1px; background: var(--border); margin: 14px 0; }

.sc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.sc-row:last-child { margin-bottom: 0; }

.sc-label {
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: var(--t2);
  width: 120px;
  flex-shrink: 0;
}

.sc-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.sc-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--t1);
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  outline: none;
  transition: all 0.2s;
}
.sc-input--sm { flex: 1 1 50px; min-width: 40px; }
.sc-input:focus { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-pale); }

.sc-sep { font-size: 13px; color: var(--t4); }

.sc-unit {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: var(--t3);
  flex-shrink: 0;
  word-break: keep-all;
}
</style>
