<script setup>
/**
 * SkuDetailModal — SKU(상품) 상세 정보 모달 (재사용 컴포넌트)
 *
 * props:
 *   warehouseId (Number) — 창고 ID
 *   sku         (String) — SKU 코드 (예: 'KR-MASK-001')
 *   isOpen      (Boolean) — 모달 표시 여부
 *
 * emits:
 *   close — 닫기 버튼 / 오버레이 클릭 시
 *
 * 데이터:
 *   isOpen 이 true 가 되면 GET /wms/warehouses/:warehouseId/sku/:sku 조회
 *   응답: { sku, productName, category, locations[], stock, changeHistory[], asnHistory[], orderHistory[] }
 */
import { ref, watch } from 'vue'
import { getSkuDetail } from '@/api/wms'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  warehouseId: { type: Number,  default: 0 },
  sku:         { type: String,  default: '' },
  isOpen:      { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const loading   = ref(false)
const skuDetail = ref(null)

async function fetchData() {
  if (!props.warehouseId || !props.sku) return
  loading.value   = true
  skuDetail.value = null
  try {
    const res = await getSkuDetail(props.warehouseId, props.sku)
    skuDetail.value = res.data.data
  } catch (e) {
    console.error('[SkuDetailModal] fetch error:', e)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, open => { if (open) fetchData() })
watch(() => props.sku,    ()   => { if (props.isOpen) fetchData() })
</script>

<template>
  <BaseModal
    :title="skuDetail ? skuDetail.productName : 'SKU 상세'"
    :is-open="isOpen"
    width="700px"
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
    <div v-else-if="skuDetail" class="sku-detail">

      <!-- ── 기본 정보 카드 ── -->
      <div class="info-card">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">SKU 코드</span>
            <span class="sku-code">{{ skuDetail.sku }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">카테고리</span>
            <span class="category-tag">{{ skuDetail.category }}</span>
          </div>
          <div class="info-item info-item--locations">
            <span class="info-label">저장 위치</span>
            <template v-if="skuDetail.locations && skuDetail.locations.length">
              <span
                v-for="loc in skuDetail.locations"
                :key="loc.bin"
                class="location-tag"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ loc.bin }}
                <span class="location-qty">({{ loc.qty }}개)</span>
              </span>
            </template>
            <span v-else class="no-location">위치 미지정</span>
          </div>
        </div>

        <!-- 재고 칩 -->
        <div class="stock-row" v-if="skuDetail.stock">
          <div class="stock-chip stock-avail">
            <span class="chip-label">가용</span>
            <strong>{{ skuDetail.stock.available }}</strong>
          </div>
          <div class="stock-chip stock-alloc">
            <span class="chip-label">할당</span>
            <strong>{{ skuDetail.stock.allocated }}</strong>
          </div>
          <div class="stock-chip stock-total">
            <span class="chip-label">합계</span>
            <strong>{{ skuDetail.stock.total }}</strong>
          </div>
        </div>
      </div>

      <!-- ── 재고 변동 이력 ── -->
      <div class="section">
        <div class="section-title">재고 변동 이력</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>일자</th>
              <th>구분</th>
              <th class="col-num">수량</th>
              <th>사유</th>
              <th>담당자</th>
              <th class="col-num">잔여</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in skuDetail.changeHistory" :key="h.date + h.reason">
              <td class="date-cell">{{ h.date }}</td>
              <td>
                <span :class="['hist-type', 'hist-' + h.type.toLowerCase()]">
                  {{ h.type === 'IN' ? '입고' : h.type === 'OUT' ? '출고' : '조정' }}
                </span>
              </td>
              <td class="col-num" :class="h.qty > 0 ? 'qty-in' : 'qty-out'">
                {{ h.qty > 0 ? '+' + h.qty : h.qty }}
              </td>
              <td>{{ h.reason }}</td>
              <td>{{ h.worker }}</td>
              <td class="col-num num-total">{{ h.balanceAfter }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── ASN 입고 이력 ── -->
      <div class="section">
        <div class="section-title">입고 이력 (ASN)</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>ASN ID</th>
              <th>입고일</th>
              <th class="col-num">예정 수량</th>
              <th class="col-num">실입고</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in skuDetail.asnHistory" :key="a.asnId">
              <td class="order-id">{{ a.asnId }}</td>
              <td class="date-cell">{{ a.date }}</td>
              <td class="col-num">{{ a.plannedQty }}</td>
              <td class="col-num" :class="a.actualQty < a.plannedQty ? 'qty-out' : 'num-ok'">
                {{ a.actualQty }}
              </td>
              <td><StatusBadge :status="a.status" type="asn" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── 주문 출고 이력 ── -->
      <div class="section">
        <div class="section-title">주문 출고 이력</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>주문번호</th>
              <th class="col-num">수량</th>
              <th>배송지</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in skuDetail.orderHistory" :key="o.orderId">
              <td class="order-id">{{ o.orderId }}</td>
              <td class="col-num">{{ o.qty }}</td>
              <td class="dest-cell">{{ o.dest }}</td>
              <td><StatusBadge :status="o.status" type="order" /></td>
            </tr>
            <tr v-if="!skuDetail.orderHistory.length">
              <td colspan="4" class="empty-cell">주문 이력 없음</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div><!-- /.sku-detail -->

    <!-- 데이터 없음 -->
    <div v-else-if="!loading" class="modal-empty">
      SKU 정보를 찾을 수 없습니다.
    </div>

    <template #footer>
      <button class="ui-btn ui-btn--secondary" @click="emit('close')">닫기</button>
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

/* ── 컨텐츠 레이아웃 ─────────────────────────────────────────────── */
.sku-detail { display: flex; flex-direction: column; gap: 20px; }

/* ── 기본 정보 카드 ──────────────────────────────────────────────── */
.info-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row { display: flex; gap: 24px; flex-wrap: wrap; }
.info-item { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.info-item--locations {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.info-label {
  font-family: 'Barlow', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.sku-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--t1);
  font-weight: 600;
}
.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(76, 116, 255, .1);
  color: var(--blue);
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  font-weight: 600;
}
.location-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: rgba(46, 204, 135, .1);
  border: 1px solid rgba(46, 204, 135, .25);
  color: var(--green);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
}
.location-qty {
  font-size: 11px;
  font-weight: 400;
  color: var(--green);
  opacity: .75;
}
.no-location {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t4);
  font-style: italic;
}

/* ── 재고 칩 ─────────────────────────────────────────────────────── */
.stock-row { display: flex; gap: 10px; }
.stock-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}
.stock-chip .chip-label { font-size: 11px; color: var(--t3); font-weight: 500; }
.stock-chip strong {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 18px;
}
.stock-avail strong { color: var(--green); }
.stock-alloc strong { color: var(--amber); }
.stock-total strong { color: var(--t1); }

/* ── 섹션 ───────────────────────────────────────────────────────── */
.section { display: flex; flex-direction: column; gap: 8px; }
.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .3px;
  color: var(--t2);
  text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

/* ── 상세 테이블 ─────────────────────────────────────────────────── */
.dtbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.dtbl th {
  padding: 6px 10px;
  background: var(--surface-2);
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: var(--t3);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.dtbl td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  color: var(--t1);
  vertical-align: middle;
}
.dtbl tr:last-child td { border-bottom: none; }
.dtbl tr:hover td      { background: var(--surface-2); }

.hist-type {
  display: inline-block;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  font-family: 'Barlow', sans-serif;
  font-size: 10px;
  font-weight: 700;
}
.hist-in     { background: rgba(46, 204, 135, .12); color: var(--green); }
.hist-out    { background: rgba(239,  68,  68, .1);  color: var(--red); }
.hist-adjust { background: rgba(245, 166,  35, .12); color: #B45309; }

.col-num  { text-align: right; }
.qty-in   { color: var(--green); font-weight: 600; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; }
.qty-out  { color: var(--red);   font-weight: 600; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; }
.num-ok   { color: var(--green); }
.num-total { font-weight: 700; }
.date-cell { color: var(--t3); white-space: nowrap; font-size: 12px; }
.dest-cell { white-space: nowrap; font-size: 12px; color: var(--t2); }
.order-id  { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--t2); }
.empty-cell { text-align: center; color: var(--t4); padding: 24px; font-size: 13px; }
</style>
