<script setup>
/**
 * OrderDetailModal — 주문 상세 모달 (재사용 컴포넌트)
 *
 * props:
 *   warehouseId (Number) — 창고 ID
 *   orderId     (String) — 주문번호 (예: 'ORD-2026-03810')
 *   isOpen      (Boolean) — 모달 표시 여부
 *
 * emits:
 *   close — 닫기 버튼 / 오버레이 클릭 시
 *
 * 데이터:
 *   isOpen 이 true 가 되면 GET /wms/warehouses/:warehouseId/orders/:orderId 조회
 *   응답: { orderId, status, channel, orderedAt, dest, seller, sellerCode, skuItems[] }
 *     skuItems[]: { sku, productName, qty, location, worker, workStatus }
 */
import { ref, watch } from 'vue'
import { getOrderDetail } from '@/api/wms'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  warehouseId: { type: Number,  default: 0 },
  orderId:     { type: String,  default: '' },
  isOpen:      { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const loading     = ref(false)
const orderDetail = ref(null)

async function fetchData() {
  if (!props.warehouseId || !props.orderId) return
  loading.value     = true
  orderDetail.value = null
  try {
    const res = await getOrderDetail(props.warehouseId, props.orderId)
    orderDetail.value = res.data.data
  } catch (e) {
    console.error('[OrderDetailModal] fetch error:', e)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen,  open => { if (open) fetchData() })
watch(() => props.orderId, ()   => { if (props.isOpen) fetchData() })

/** workStatus → 한글 레이블 */
function workStatusLabel(ws) {
  return { WAITING: '대기', PICKING: '피킹 중', PICKED: '피킹 완료', PACKING: '패킹 중', PACKED: '패킹 완료', SHIPPED: '출고 완료' }[ws] ?? ws
}
/** workStatus → CSS 클래스 */
function workStatusClass(ws) {
  return { WAITING: 'ws-waiting', PICKING: 'ws-picking', PICKED: 'ws-picked', PACKING: 'ws-packing', PACKED: 'ws-packed', SHIPPED: 'ws-shipped' }[ws] ?? ''
}
</script>

<template>
  <BaseModal
    :title="orderDetail ? orderDetail.orderId : '주문 상세'"
    :is-open="isOpen"
    width="740px"
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

    <!-- 주문 상세 내용 -->
    <div v-else-if="orderDetail" class="order-detail">

      <!-- ── 주문 헤더 카드 ── -->
      <div class="info-card">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">주문 상태</span>
            <StatusBadge :status="orderDetail.status" type="order" />
          </div>
          <div class="info-item">
            <span class="info-label">채널</span>
            <span class="channel-tag">{{ orderDetail.channel }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">주문일</span>
            <span class="date-cell">{{ orderDetail.orderedAt }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">배송지</span>
            <span class="dest-cell">{{ orderDetail.dest }}</span>
          </div>
        </div>

        <!-- 셀러 정보 -->
        <div class="seller-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="seller-name">{{ orderDetail.seller }}</span>
          <span class="seller-code">{{ orderDetail.sellerCode }}</span>
        </div>

        <!-- SKU 수량 요약 -->
        <div class="stock-row">
          <div class="stock-chip stock-avail">
            <span class="chip-label">총 SKU</span>
            <strong>{{ orderDetail.skuItems.length }}</strong>
          </div>
          <div class="stock-chip stock-total">
            <span class="chip-label">총 수량</span>
            <strong>{{ orderDetail.skuItems.reduce((s, i) => s + i.qty, 0) }}</strong>
          </div>
        </div>
      </div>

      <!-- ── SKU별 출고 작업 내역 ── -->
      <div class="section">
        <div class="section-title">SKU별 출고 작업 현황</div>
        <table class="dtbl">
          <thead>
            <tr>
              <th>상품명</th>
              <th>SKU 코드</th>
              <th class="col-num">수량</th>
              <th>로케이션</th>
              <th>담당 작업자</th>
              <th>작업 상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderDetail.skuItems" :key="item.sku">
              <td>
                <span class="product-name">{{ item.productName }}</span>
              </td>
              <td><span class="sku-code">{{ item.sku }}</span></td>
              <td class="col-num num-total">{{ item.qty }}</td>
              <td>
                <span v-if="item.location" class="location-tag">
                  {{ item.location }}
                </span>
                <span v-else class="no-location">-</span>
              </td>
              <td>{{ item.worker }}</td>
              <td>
                <span :class="['work-badge', workStatusClass(item.workStatus)]">
                  {{ workStatusLabel(item.workStatus) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div><!-- /.order-detail -->

    <!-- 데이터 없음 -->
    <div v-else-if="!loading" class="modal-empty">
      주문 정보를 찾을 수 없습니다.
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
.order-detail { display: flex; flex-direction: column; gap: 20px; }

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
.info-label {
  font-family: 'Barlow', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.channel-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(76, 116, 255, .1);
  color: var(--blue);
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  font-weight: 600;
}
.date-cell { color: var(--t3); white-space: nowrap; font-size: 12px; }
.dest-cell { white-space: nowrap; font-size: 12px; color: var(--t2); }

/* 셀러 정보 행 */
.seller-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 0 4px;
  border-top: 1px solid var(--border);
  color: var(--t2);
}
.seller-name {
  font-family: 'Barlow', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--t1);
}
.seller-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--t4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}

/* 재고 칩 */
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

.col-num   { text-align: right; }
.num-total { font-weight: 700; }

.product-name {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--t1);
}
.sku-code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--t3);
}
.location-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(46, 204, 135, .1);
  border: 1px solid rgba(46, 204, 135, .25);
  color: var(--green);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
}
.no-location {
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: var(--t4);
  font-style: italic;
}

/* ── workStatus 뱃지 ─────────────────────────────────────────────── */
.work-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.ws-waiting { background: rgba(156, 163, 175, .15); color: var(--t3); }
.ws-picking { background: rgba(59, 130, 246, .12);  color: #3B82F6; }
.ws-picked  { background: rgba(99, 102, 241, .12);  color: #6366F1; }
.ws-packing { background: rgba(245, 166, 35, .15);  color: #B45309; }
.ws-packed  { background: rgba(245, 166, 35, .2);   color: #92400E; }
.ws-shipped { background: rgba(46, 204, 135, .12);  color: var(--green); }
</style>
