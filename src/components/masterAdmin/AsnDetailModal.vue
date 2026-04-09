<script setup>
import { computed, ref, watch } from 'vue'
import { getAsnDetail } from '@/api/wms'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  asnId:  { type: String,  default: '' },
  isOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const loading = ref(false)
const asn     = ref(null)

const skuItems = computed(() => (Array.isArray(asn.value?.items) ? asn.value.items : []))
const skuSummary = computed(() => {
  if (String(asn.value?.sku ?? '').trim()) return asn.value.sku
  if (!skuItems.value.length) return '-'

  return skuItems.value
    .map((item) => String(item.sku ?? item.code ?? '').trim())
    .filter(Boolean)
    .join(', ')
})
const plannedQuantity = computed(() => {
  if (asn.value?.plannedQty != null) return Number(asn.value.plannedQty ?? 0)
  return skuItems.value.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 0), 0)
})
const skuCount = computed(() => {
  if (asn.value?.skuCount != null) return Number(asn.value.skuCount ?? 0)
  return skuItems.value.length
})

async function fetchData() {
  if (!props.asnId) return
  loading.value = true
  asn.value     = null
  try {
    const res = await getAsnDetail(props.asnId)
    asn.value = res.data.data
  } catch (e) {
    console.error('[AsnDetailModal] fetch error:', e)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, open  => { if (open && props.asnId)  fetchData() })
watch(() => props.asnId,  newId => { if (newId && props.isOpen) fetchData() })

/** 예정 입고일 강조 여부 */
function isUpcoming(date) { return date >= '2026-03-17' }
</script>

<template>
  <BaseModal
    title="ASN 상세 정보"
    :is-open="isOpen"
    width="640px"
    @cancel="emit('close')"
  >
    <!-- 로딩 -->
    <div v-if="loading" class="modal-loading">
      <svg class="spin-icon" width="24" height="24" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      데이터를 불러오는 중…
    </div>

    <!-- 상세 내용 -->
    <template v-else-if="asn">
      <!-- 헤더 -->
      <div class="detail-header">
        <span class="detail-asn-id">{{ asn.id }}</span>
        <StatusBadge :status="asn.status" type="asn" />
      </div>

      <!-- 기본 정보 그리드 -->
        <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">셀러사</span>
          <span class="detail-value">{{ asn.company ?? asn.sellerCompany ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">담당자</span>
          <span class="detail-value">{{ asn.seller ?? asn.contactName ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">입고 창고</span>
          <span class="detail-value">{{ asn.warehouse ?? asn.warehouseName ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">SKU 수</span>
          <span class="detail-value">{{ skuCount }} SKU</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">예정 수량</span>
          <span class="detail-value">{{ plannedQuantity.toLocaleString() }} EA</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">실수령 수량</span>
          <span class="detail-value" :class="{ 'detail-null': asn.actualQty == null }">
            {{ asn.actualQty != null ? asn.actualQty.toLocaleString() + ' EA' : '미입고' }}
          </span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">SKU 내용</span>
          <span class="detail-value">{{ skuSummary }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">예정 입고일</span>
          <span class="detail-value" :class="{ 'detail-upcoming': isUpcoming(asn.expectedDate) }">
            {{ asn.expectedDate }}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">등록일</span>
          <span class="detail-value">{{ asn.registeredDate }}</span>
        </div>
      </div>
    </template>

    <!-- 데이터 없음 -->
    <div v-else-if="!loading" class="modal-empty">
      ASN 정보를 찾을 수 없습니다.
    </div>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="emit('close')">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── 로딩 ───────────────────────────────────────────────────────── */
.modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--t3);
  font-family: 'Barlow', sans-serif;
  font-size: 14px;
}
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--t4);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  font-style: italic;
}

/* ── 헤더 ───────────────────────────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.detail-asn-id {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 600;
  font-size: 15px;
  color: var(--blue);
}

/* ── 정보 그리드 ─────────────────────────────────────────────────── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-item--full {
  grid-column: 1 / -1;
}
.detail-label {
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
}
.detail-null     { color: var(--t4); font-style: italic; }
.detail-upcoming { color: var(--gold); font-weight: 600; }
</style>
