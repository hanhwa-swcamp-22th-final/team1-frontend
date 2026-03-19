<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { PICKING_LIST_STATUS } from '@/constants'

const props = defineProps({
  isOpen:      { type: Boolean, required: true },
  pickingList: { type: Object,  default: null },
})

defineEmits(['cancel'])

const ITEM_STATUS_MAP = {
  [PICKING_LIST_STATUS.COMPLETED]:   { label: '완료',    color: 'green'  },
  [PICKING_LIST_STATUS.IN_PROGRESS]: { label: '진행중',  color: 'amber'  },
  [PICKING_LIST_STATUS.WAITING]:     { label: '대기',    color: 'gray'   },
}

const progressPct = computed(() => {
  if (!props.pickingList) return 0
  const { completedBins, totalBins } = props.pickingList
  return totalBins > 0 ? Math.round((completedBins / totalBins) * 100) : 0
})
</script>

<template>
  <BaseModal
    title="피킹 리스트 상세"
    :isOpen="isOpen"
    width="720px"
    @cancel="$emit('cancel')"
  >
    <template v-if="pickingList">
      <!-- 히어로 -->
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">Picking Route</div>
            <div class="hero-title">{{ pickingList.id }}</div>
            <div class="hero-copy">동선 순서, Bin 위치, SKU, 피킹 상태를 확인합니다.</div>
          </div>
          <span class="badge badge--amber">{{ progressPct }}% 진행</span>
        </div>

        <!-- 메트릭 카드 4개 -->
        <div class="metric-grid">
          <div class="metric-card">
            <span class="metric-label">담당 작업자</span>
            <span class="metric-value">{{ pickingList.assignedWorker }}</span>
            <span class="metric-sub">배정 작업자</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">총 Bin</span>
            <span class="metric-value">{{ pickingList.totalBins }}</span>
            <span class="metric-sub">동선 기준 정렬</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">완료 Bin</span>
            <span class="metric-value">{{ pickingList.completedBins }}</span>
            <span class="metric-sub">나머지 {{ pickingList.totalBins - pickingList.completedBins }}개 진행</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">총 수량</span>
            <span class="metric-value">{{ pickingList.itemCount }}</span>
            <span class="metric-sub">피킹 대상 EA</span>
          </div>
        </div>
      </div>

      <!-- 아이템 테이블 -->
      <div class="table-wrap">
        <table class="pick-table">
          <thead>
            <tr>
              <th class="col-seq">동선</th>
              <th class="col-bin">Bin</th>
              <th class="col-sku">SKU</th>
              <th>상품명</th>
              <th class="col-qty">수량</th>
              <th class="col-status">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pickingList.items" :key="item.sequence">
              <td class="text-muted text-center">{{ item.sequence }}</td>
              <td><span class="location-tag">{{ item.bin }}</span></td>
              <td><span class="mono">{{ item.sku }}</span></td>
              <td>{{ item.productName }}</td>
              <td class="text-right fw-600">{{ item.qty }}</td>
              <td class="text-center">
                <span
                  class="badge"
                  :class="`badge--${ITEM_STATUS_MAP[item.status]?.color ?? 'gray'}`"
                >
                  {{ ITEM_STATUS_MAP[item.status]?.label ?? item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 커스텀 footer -->
    <template #footer>
      <div class="footer-end">
        <button class="ui-btn ui-btn--primary" @click="$emit('cancel')">확인</button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── 히어로 ─────────────────────────────────────── */
.hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}

.hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-1);
}

.hero-copy {
  font-size: var(--font-size-sm);
  color: var(--t3);
}

/* ── 메트릭 카드 ─────────────────────────────────── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

.metric-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

.metric-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}

/* ── 테이블 ────────────────────────────────────── */
.table-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.pick-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.pick-table th {
  padding: 10px 12px;
  background: var(--surface-2);
  color: var(--t3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.pick-table td {
  padding: 10px 12px;
  color: var(--t1);
  border-bottom: 1px solid var(--border);
}

.pick-table tr:last-child td { border-bottom: none; }
.pick-table tr:hover td { background: var(--surface-2); }

.col-seq    { width: 48px; }
.col-bin    { width: 80px; }
.col-sku    { width: 120px; }
.col-qty    { width: 60px; }
.col-status { width: 80px; }

/* ── 셀 헬퍼 ───────────────────────────────────── */
.mono       { font-family: var(--font-mono); font-size: var(--font-size-xs); }
.text-muted { color: var(--t3); }
.text-center { text-align: center; }
.text-right  { text-align: right; }
.fw-600      { font-weight: 600; }

.location-tag {
  display: inline-flex;
  padding: 2px 7px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-mono);
}

/* ── 배지 ──────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--amber { background: var(--amber-pale); color: #b45309; }
.badge--gray  { background: var(--surface-2);  color: var(--t3); }

/* ── Footer ────────────────────────────────────── */
.footer-end {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.ui-btn {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.ui-btn--primary {
  background: var(--blue);
  color: #fff;
}
.ui-btn--primary:hover { opacity: 0.9; }
</style>