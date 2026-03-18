<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const STATUS_MAP = {
  normal:   { label: '정상',       badgeClass: 'badge--green' },
  caution:  { label: '주의',       badgeClass: 'badge--amber' },
  shortage: { label: '재고 부족',  badgeClass: 'badge--red'   },
  damaged:  { label: '불량',       badgeClass: 'badge--red'   },
}

const statusInfo = computed(() => STATUS_MAP[props.item?.status] ?? { label: props.item?.status, badgeClass: '' })
</script>

<template>
  <Teleport to="body">
    <div v-if="item" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-xl">

        <!-- 헤더 -->
        <div class="modal-header">
          <div class="modal-title">재고 상세 정보</div>
          <button class="modal-close" @click="emit('close')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14">
              <path d="M3 3l8 8M11 3l-8 8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 바디 -->
        <div class="modal-body">

          <!-- Hero -->
          <div class="modal-hero">
            <div class="modal-hero-top">
              <div>
                <div class="modal-eyebrow">Inventory Drilldown</div>
                <div class="modal-hero-title">{{ item.sku }} · {{ item.name }}</div>
                <div class="modal-hero-copy">가용/할당 재고와 실제 적재 로케이션, 최근 입출고 이력을 함께 보는 상세 모달입니다.</div>
              </div>
              <span class="badge" :class="statusInfo.badgeClass">{{ statusInfo.label }}</span>
            </div>

            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">가용 재고</span>
                <span class="metric-value">{{ item.availableQty.toLocaleString() }}</span>
                <span class="metric-sub">출고 가능</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">할당 재고</span>
                <span class="metric-value">{{ item.allocatedQty.toLocaleString() }}</span>
                <span class="metric-sub">주문 배정 수량</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">총 재고</span>
                <span class="metric-value">{{ item.totalQty.toLocaleString() }}</span>
                <span class="metric-sub">{{ item.locations.length > 1 ? `${item.locations.length}개 Bin 보관` : '단일 Bin 보관' }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">임계값</span>
                <span class="metric-value" :class="item.availableQty < item.threshold ? 'value--red' : ''">
                  {{ item.threshold.toLocaleString() }}
                </span>
                <span class="metric-sub">{{ item.availableQty < item.threshold ? '보충 필요' : '정상 범위' }}</span>
              </div>
            </div>
          </div>

          <!-- 적재 로케이션 -->
          <div class="modal-section">
            <div class="section-title">적재 로케이션</div>
            <div class="section-copy">현재 보관 위치와 입고 출처를 함께 확인합니다.</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bin</th>
                    <th>수량</th>
                    <th>입고 ASN</th>
                    <th>입고일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loc in item.locations" :key="loc.bin">
                    <td><span class="location-tag">{{ loc.bin }}</span></td>
                    <td>{{ loc.qty.toLocaleString() }}</td>
                    <td class="mono">{{ loc.asnId }}</td>
                    <td>{{ loc.receivedDate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 최근 재고 변동 -->
          <div class="modal-section">
            <div class="section-title">최근 재고 변동</div>
            <div class="section-copy">입고/할당 흐름을 시간순으로 확인합니다.</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>일시</th>
                    <th>유형</th>
                    <th>수량</th>
                    <th>관련 문서</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(h, idx) in item.history" :key="idx">
                    <td>{{ h.date }}</td>
                    <td>{{ h.type }}</td>
                    <td :class="h.qty > 0 ? 'qty-plus' : 'qty-minus'">
                      {{ h.qty > 0 ? `+${h.qty.toLocaleString()}` : h.qty.toLocaleString() }}
                    </td>
                    <td class="mono">{{ h.docId }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <button class="ui-btn ui-btn--primary" @click="emit('close')">확인</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ───────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

/* ── Modal Shell ───────────────────────────────── */
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}
.modal-xl { width: 100%; max-width: 780px; }

/* ── Header ────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--t1);
}
.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--t3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: background var(--ease-fast), color var(--ease-fast);
}
.modal-close:hover { background: var(--surface-2); color: var(--t1); }

/* ── Body ──────────────────────────────────────── */
.modal-body {
  overflow-y: auto;
  flex: 1;
}

/* ── Hero ──────────────────────────────────────── */
.modal-hero {
  padding: var(--space-6);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.modal-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.modal-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-1);
}
.modal-hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: var(--space-2);
}
.modal-hero-copy {
  font-size: var(--font-size-sm);
  color: var(--t3);
  line-height: 1.5;
}

/* ── Metric Grid ───────────────────────────────── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
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
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.1;
}
.metric-sub {
  font-size: var(--font-size-xs);
  color: var(--t3);
}
.value--red { color: var(--red); }

/* ── Section ───────────────────────────────────── */
.modal-section {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border);
}
.modal-section:last-child { border-bottom: none; }

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t1);
  margin-bottom: var(--space-1);
}
.section-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin-bottom: var(--space-4);
}

/* ── Table ─────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
thead th {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
tbody td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border);
  color: var(--t1);
}
tbody tr:last-child td { border-bottom: none; }

.location-tag {
  display: inline-flex;
  padding: 2px 8px;
  background: var(--blue-pale);
  color: var(--blue);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-mono);
}
.mono {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}
.qty-plus { color: var(--green); font-weight: 600; }
.qty-minus { color: var(--red);   font-weight: 600; }

/* ── Badge ─────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--amber { background: var(--amber-pale); color: #b45309; }
.badge--red   { background: var(--red-pale);   color: var(--red);   }

/* ── Footer ────────────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* ── Buttons ───────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background var(--ease-fast), color var(--ease-fast);
}
.ui-btn--primary {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}
.ui-btn--primary:hover { opacity: 0.88; }
</style>