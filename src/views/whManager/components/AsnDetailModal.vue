<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  asn:    { type: Object,  default: null  },
})

defineEmits(['cancel'])

const STATUS_MAP = {
  pending:  { label: '입고 대기',   badge: 'amber' },
  transit:  { label: '운송 중',     badge: 'blue'  },
  mismatch: { label: '수량 불일치', badge: 'red'   },
  received: { label: '검수 완료',   badge: 'green' },
}

const STATUS_STEP_LABEL = {
  pending:  '등록됨',
  transit:  '입고됨',
  mismatch: '검수&적재중',
  received: '보관중',
}

// ASN ID별 SKU 구성 (mock)
const SKU_MAP = {
  'ASN-2024-0312-001': [
    { code: 'SKU-GB-001', name: '앰플 세럼 30ml',  qty: 600, bin: 'A-3-2', avail: 720 },
    { code: 'SKU-GB-002', name: '마스크팩 10매입', qty: 400, bin: 'A-3-3', avail: 500 },
  ],
  'ASN-2024-0311-005': [
    { code: 'SKU-KS-001', name: '티셔츠 L',  qty: 300, bin: 'C-1-4', avail: 400 },
    { code: 'SKU-KS-002', name: '청바지 M',  qty: 200, bin: 'C-1-5', avail: 280 },
  ],
  'ASN-2024-0310-003': [
    { code: 'SKU-EP-001', name: '텀블러 350ml', qty: 200, bin: 'B-2-1', avail: 240 },
  ],
  'ASN-2024-0309-002': [
    { code: 'SKU-GB-003', name: '마스크팩 10매입', qty: 800, bin: 'A-3-3', avail: 800 },
  ],
  'ASN-2024-0308-001': [
    { code: 'SKU-KF-001', name: '특산 진액 30팩', qty: 300, bin: 'D-1-2', avail: 320 },
  ],
  'ASN-2024-0307-004': [
    { code: 'SKU-BL-001', name: 'BB크림',           qty: 250, bin: 'A-2-1', avail: 300 },
    { code: 'SKU-BL-002', name: '파운데이션 SPF50', qty: 150, bin: 'A-2-2', avail: 200 },
  ],
}

const skuList = computed(() => SKU_MAP[props.asn?.id] ?? [])

const statusInfo = computed(() => STATUS_MAP[props.asn?.status] ?? { label: '-', badge: 'gray' })

// 타임라인: ASN 상태에 따라 완료 여부 결정
const timeline = computed(() => {
  if (!props.asn) return []
  const s = props.asn.status
  return [
    {
      title: '등록됨',
      sub: `${props.asn.registeredDate} · 셀러 등록 완료`,
      done: true,
    },
    {
      title: '입고 확인',
      sub: s !== 'pending' ? `${props.asn.expectedDate} · 입고 확인됨` : '관리자 확인 대기',
      done: s !== 'pending',
    },
    {
      title: '검수&적재중',
      sub: ['received', 'mismatch'].includes(s) ? '작업자 검수 진행됨' : '검수 작업 대기',
      done: s === 'received',
    },
    {
      title: '보관중',
      sub: s === 'received' ? '적재 완료 · 재고 반영됨' : '완료 후 재고 반영',
      done: s === 'received',
    },
  ]
})
</script>

<template>
  <BaseModal
    title="ASN 상세 정보"
    :is-open="isOpen"
    width="720px"
    @cancel="$emit('cancel')"
  >
    <div v-if="asn">

      <!-- ── Hero ─────────────────────────────────── -->
      <div class="modal-hero">
        <div class="modal-hero-top">
          <div>
            <div class="modal-eyebrow">Inbound ASN</div>
            <div class="modal-hero-title">{{ asn.id }}</div>
            <div class="modal-hero-copy">
              셀러가 등록한 입고 예정 데이터를 검수·적재 플로우 기준으로 확인합니다.
              SKU별 추천 Bin과 수용 가능 수량을 함께 보여줍니다.
            </div>
          </div>
          <span class="badge" :class="`badge--${statusInfo.badge}`">{{ statusInfo.label }}</span>
        </div>

        <!-- 메트릭 카드 4개 -->
        <div class="metric-grid">
          <div class="metric-card">
            <span class="metric-label">셀러사</span>
            <span class="metric-value">{{ asn.company.split(' ')[0] }}</span>
            <span class="metric-sub">{{ asn.company }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 수량</span>
            <span class="metric-value">{{ asn.plannedQty?.toLocaleString() }}</span>
            <span class="metric-sub">{{ skuList.length }} SKU</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 도착일</span>
            <span class="metric-value">{{ asn.expectedDate?.slice(5).replace('-', '/') }}</span>
            <span class="metric-sub">{{ asn.expectedDate }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">현재 상태</span>
            <span class="metric-value">{{ STATUS_STEP_LABEL[asn.status] }}</span>
            <span class="metric-sub">{{ statusInfo.label }}</span>
          </div>
        </div>
      </div>

      <!-- ── SKU 구성 및 추천 Bin ──────────────────── -->
      <div class="modal-section">
        <div class="modal-section-head">
          <div class="modal-section-title">SKU 구성 및 추천 Bin</div>
          <div class="modal-section-copy">동일 SKU 적재 Bin 우선 규칙과 수용 가능 수량 기준으로 추천합니다.</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>상품명</th>
                <th>예정 수량</th>
                <th>추천 Bin</th>
                <th>수용 가능</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sku in skuList" :key="sku.code">
                <td><span class="code-cell">{{ sku.code }}</span></td>
                <td>{{ sku.name }}</td>
                <td>{{ sku.qty.toLocaleString() }}</td>
                <td><span class="location-tag">{{ sku.bin }}</span></td>
                <td>{{ sku.avail.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── 진행 타임라인 ─────────────────────────── -->
      <div class="modal-section">
        <div class="modal-section-head">
          <div class="modal-section-title">진행 타임라인</div>
          <div class="modal-section-copy">입고 확인 이후 검수&amp;적재 작업 배정으로 이어집니다.</div>
        </div>
        <div class="timeline-list">
          <div v-for="step in timeline" :key="step.title" class="timeline-item">
            <div class="timeline-dot" :class="step.done ? 'timeline-dot--done' : 'timeline-dot--pending'" />
            <div class="timeline-copy">
              <div class="timeline-title">{{ step.title }}</div>
              <div class="timeline-sub">{{ step.sub }}</div>
            </div>
            <span v-if="step.done" class="badge badge--green">완료</span>
            <span v-else class="badge badge--amber">대기</span>
          </div>
        </div>
      </div>

    </div>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
      <button class="ui-btn ui-btn--primary">입고 확인</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* ── Hero ─────────────────────────────────────── */
.modal-hero {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.modal-hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.modal-eyebrow {
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.modal-hero-title {
  font-family: var(--font-condensed);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
  margin-bottom: 6px;
}
.modal-hero-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  line-height: 1.55;
  max-width: 480px;
}

/* ── Metric Grid ──────────────────────────────── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.metric-label { font-size: 11px; color: var(--t3); font-weight: 500; }
.metric-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.2;
}
.metric-sub { font-size: 11px; color: var(--t3); }

/* ── Section ──────────────────────────────────── */
.modal-section { margin-bottom: var(--space-5); }
.modal-section:last-child { margin-bottom: 0; }
.modal-section-head { margin-bottom: var(--space-3); }
.modal-section-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--t1); }
.modal-section-copy  { font-size: var(--font-size-xs); color: var(--t3); margin-top: 3px; }

/* ── Table ────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.table-wrap th {
  padding: 8px 12px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t3);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.table-wrap td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--t1);
  font-size: var(--font-size-sm);
}
.table-wrap tr:last-child td { border-bottom: none; }

.code-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--t3);
}
.location-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--t2);
}

/* ── Timeline List ────────────────────────────── */
.timeline-list { display: flex; flex-direction: column; }
.timeline-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}
.timeline-item:last-child { border-bottom: none; }
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.timeline-dot--done    { background: var(--green); }
.timeline-dot--pending { background: var(--border); }
.timeline-copy { flex: 1; }
.timeline-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--t1); }
.timeline-sub   { font-size: var(--font-size-xs); color: var(--t3); margin-top: 2px; }

/* ── Badges ───────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--amber { background: var(--amber-pale); color: #b45309; }
.badge--blue  { background: var(--blue-pale);  color: var(--blue); }
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--red   { background: var(--red-pale);   color: var(--red); }
</style>
