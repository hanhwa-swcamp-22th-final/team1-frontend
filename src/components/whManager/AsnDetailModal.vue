<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import { INBOUND_STATUS } from '@/constants/status'

const props = defineProps({
  isOpen:    { type: Boolean, required: true },
  asn:       { type: Object,  default: null  },
  canAssign: { type: Boolean, default: false }, // false = 읽기 전용, true = Bin 배정 편집 모드
})

const emit = defineEmits(['cancel', 'confirm'])

// ── 상태 매핑
const STATUS_MAP = {
  [INBOUND_STATUS.PENDING]:  { label: '입고 대기',   badge: 'amber' },
  [INBOUND_STATUS.TRANSIT]:  { label: '운송 중',     badge: 'blue'  },
  [INBOUND_STATUS.MISMATCH]: { label: '수량 불일치', badge: 'red'   },
  [INBOUND_STATUS.RECEIVED]: { label: '검수 완료',   badge: 'green' },
}
const STATUS_STEP_LABEL = {
  [INBOUND_STATUS.PENDING]:  '등록됨',
  [INBOUND_STATUS.TRANSIT]:  '입고됨',
  [INBOUND_STATUS.MISMATCH]: '검수&적재중',
  [INBOUND_STATUS.RECEIVED]: '보관중',
}

// ── SKU-Bin 레지스트리 (세션 내 유지 — 실제 환경에서는 API 저장)
// 등록된 SKU → 이전에 배정된 Bin (기존 상품)
// 등록 안 된 SKU → 신규 상품, 수동 배정 필요
const skuBinRegistry = reactive({
  'SKU-GB-001': 'A-3-2',
  'SKU-KS-001': 'C-1-4',
  'SKU-KS-002': 'C-1-5',
  'SKU-EP-001': 'B-2-1',
  'SKU-KF-001': 'D-1-2',
  'SKU-BL-001': 'A-2-1',
  // SKU-GB-002, SKU-GB-003, SKU-BL-002 → 신규 (레지스트리에 없음)
})

// 배정 가능한 빈 Bin 목록 (mock)
const AVAILABLE_BINS = [
  'A-1-1', 'A-1-2', 'A-2-2', 'A-2-3',
  'A-3-3', 'A-3-4', 'B-1-1', 'B-1-3',
  'B-3-1', 'C-2-2', 'D-1-3', 'D-2-2',
]

// ── ASN별 SKU 원본 데이터 (bin 정보 없음 — 레지스트리에서 동적으로 결정)
const SKU_MAP_RAW = {
  'ASN-2024-0312-001': [
    { code: 'SKU-GB-001', name: '앰플 세럼 30ml',  qty: 600, avail: 720 },
    { code: 'SKU-GB-002', name: '마스크팩 10매입', qty: 400, avail: 500 }, // 신규
  ],
  'ASN-2024-0311-005': [
    { code: 'SKU-KS-001', name: '티셔츠 L',  qty: 300, avail: 400 },
    { code: 'SKU-KS-002', name: '청바지 M',  qty: 200, avail: 280 },
  ],
  'ASN-2024-0310-003': [
    { code: 'SKU-EP-001', name: '텀블러 350ml', qty: 200, avail: 240 },
  ],
  'ASN-2024-0309-002': [
    { code: 'SKU-GB-003', name: '마스크팩 10매입 (신상)', qty: 800, avail: 800 }, // 신규
  ],
  'ASN-2024-0308-001': [
    { code: 'SKU-KF-001', name: '특산 진액 30팩', qty: 300, avail: 320 },
  ],
  'ASN-2024-0307-004': [
    { code: 'SKU-BL-001', name: 'BB크림',           qty: 250, avail: 300 },
    { code: 'SKU-BL-002', name: '파운데이션 SPF50', qty: 150, avail: 200 }, // 신규
  ],
}

// ── 모달 세션 내 임시 상태
const tempBins     = ref({})  // { [skuCode]: 사용자가 선택한 Bin }
const changingBins = ref({})  // { [skuCode]: true } — 기존 SKU "변경" 클릭 시

// 모달 열릴 때마다 초기화
watch(() => props.isOpen, (open) => {
  if (open) {
    tempBins.value     = {}
    changingBins.value = {}
  }
})

// ── SKU 목록 (신규/기존 여부와 현재 배정 Bin 포함)
const skuList = computed(() => {
  const raw = SKU_MAP_RAW[props.asn?.id] ?? []
  return raw.map(sku => {
    const registryBin = skuBinRegistry[sku.code] ?? null
    const isNewSku    = !registryBin
    const tempBin     = tempBins.value[sku.code] ?? null
    return {
      ...sku,
      isNewSku,
      registryBin,
      currentBin: tempBin ?? registryBin,
      isChanging: !!changingBins.value[sku.code],
    }
  })
})

// 이미 레지스트리에 쓰인 Bin 목록 (다른 SKU와 중복 배정 방지)
const usedBins = computed(() => new Set(Object.values(skuBinRegistry)))

// 특정 SKU에서 선택 가능한 Bin 목록
// (AVAILABLE_BINS에서 이미 다른 SKU가 쓰는 Bin 제외, 단 자기 자신의 기존 Bin은 포함)
function availableBinsFor(sku) {
  return AVAILABLE_BINS.filter(b => !usedBins.value.has(b) || b === sku.registryBin)
}

// 입고 확인 버튼 활성화 조건: 모든 신규 SKU에 Bin이 배정되어야 함
const newSkus    = computed(() => skuList.value.filter(s => s.isNewSku))
const canConfirm = computed(() => newSkus.value.every(s => s.currentBin))

function selectBin(skuCode, bin) {
  tempBins.value = { ...tempBins.value, [skuCode]: bin || null }
}

function startChanging(skuCode) {
  changingBins.value = { ...changingBins.value, [skuCode]: true }
}

function cancelChanging(skuCode) {
  const next = { ...changingBins.value }
  delete next[skuCode]
  changingBins.value = next
  const nextTemp = { ...tempBins.value }
  delete nextTemp[skuCode]
  tempBins.value = nextTemp
}

// 입고 확인: 신규 SKU의 Bin 배정을 레지스트리에 저장
function handleConfirm() {
  skuList.value.forEach(sku => {
    if (sku.currentBin) {
      skuBinRegistry[sku.code] = sku.currentBin
    }
  })
  emit('confirm', { asnId: props.asn?.id })
}

// ── 타임라인
const asnStatus  = computed(() => props.asn?.status ?? '')
const statusInfo = computed(() => STATUS_MAP[asnStatus.value] ?? { label: '-', badge: 'gray' })

const ASN_STEPS = [
  { key: INBOUND_STATUS.PENDING,  label: '등록됨' },
  { key: INBOUND_STATUS.TRANSIT,  label: '입고됨' },
  { key: INBOUND_STATUS.MISMATCH, label: '검수&적재중' },
  { key: INBOUND_STATUS.RECEIVED, label: '보관중' },
]
</script>

<template>
  <BaseModal
    title="ASN 상세 정보"
    :is-open="isOpen"
    width="760px"
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
              셀러가 등록한 입고 예정 데이터를 확인합니다.
              신규 SKU는 Bin을 직접 배정하고, 기존 SKU는 이전 배정 이력으로 자동 매핑됩니다.
            </div>
          </div>
          <span class="badge" :class="`badge--${statusInfo.badge}`">{{ statusInfo.label }}</span>
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <span class="metric-label">셀러사</span>
            <span class="metric-value">{{ (asn.sellerCompany ?? asn.company ?? '-').split(' ')[0] }}</span>
            <span class="metric-sub">{{ asn.sellerCompany ?? asn.company ?? '-' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 수량</span>
            <span class="metric-value">{{ (asn.plannedQty ?? asn.actualQty ?? 0).toLocaleString() }}</span>
            <span class="metric-sub">{{ skuList.length }}개 SKU</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 도착일</span>
            <span class="metric-value">{{ (asn.eta ?? asn.expectedDate ?? '-').slice(0, 10) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">현재 상태</span>
            <span class="metric-value">{{ STATUS_STEP_LABEL[asnStatus] ?? '-' }}</span>
            <span class="metric-sub">{{ statusInfo.label }}</span>
          </div>
        </div>
      </div>

      <!-- ── SKU 구성 및 Bin 배정 ───────────────── -->
      <div class="modal-section">
        <div class="modal-section-head">
          <div class="modal-section-title">SKU 구성 및 Bin 배정</div>
          <div class="modal-section-copy">
            신규 SKU는 직접 Bin을 배정해야 합니다.
            배정된 Bin은 이후 같은 SKU 입고 시 자동으로 매핑됩니다.
          </div>
        </div>

        <!-- 신규 SKU 안내 배너 (배정 모드 + 신규 SKU가 있을 때만 표시) -->
        <div v-if="canAssign && newSkus.length" class="new-sku-notice">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="flex-shrink:0">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="M7 5v4M7 3.5v.5" stroke-linecap="round"/>
          </svg>
          <span>
            <strong>{{ newSkus.length }}개의 신규 SKU</strong>가 있습니다.
            아직 Bin이 등록되지 않은 상품입니다. Bin을 배정하면 다음 입고부터 자동으로 매핑됩니다.
          </span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>상품명</th>
                <th style="text-align:right">예정 수량</th>
                <th>배정 Bin</th>
                <th style="text-align:right">수용 가능</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sku in skuList"
                :key="sku.code"
                :class="{ 'row--new': sku.isNewSku && !sku.currentBin }"
              >
                <!-- SKU 코드 -->
                <td><span class="code-cell">{{ sku.code }}</span></td>

                <!-- 상품명 + 신규 배지 -->
                <td>
                  <span class="sku-name">{{ sku.name }}</span>
                  <span v-if="sku.isNewSku" class="badge badge--amber sku-new-badge">신규</span>
                </td>

                <!-- 예정 수량 -->
                <td style="text-align:right">{{ sku.qty.toLocaleString() }}</td>

                <!-- 배정 Bin 셀 -->
                <td>
                  <!-- ── 읽기 전용 모드 (ASN 목록 탭 상세) ── -->
                  <template v-if="!canAssign">
                    <div class="bin-cell">
                      <template v-if="sku.currentBin">
                        <span class="location-tag" :class="{ 'location-tag--new': sku.isNewSku }">
                          {{ sku.currentBin }}
                        </span>
                        <span v-if="sku.isNewSku" class="badge badge--amber">미확정</span>
                        <span v-else class="badge badge--blue">자동</span>
                      </template>
                      <span v-else class="badge badge--amber">미배정</span>
                    </div>
                  </template>

                  <!-- ── 배정 편집 모드 (Bin 미배정 ASN 탭 배정하기) ── -->
                  <template v-else>
                    <!-- 신규 SKU: Bin 미배정 상태 -->
                    <template v-if="sku.isNewSku && !sku.currentBin">
                      <div class="bin-cell">
                        <span class="badge badge--amber">⚠ 미배정</span>
                        <select
                          class="bin-select"
                          value=""
                          @change="e => selectBin(sku.code, e.target.value)"
                        >
                          <option value="">— Bin 선택 —</option>
                          <option v-for="b in availableBinsFor(sku)" :key="b" :value="b">{{ b }}</option>
                        </select>
                      </div>
                    </template>

                    <!-- 신규 SKU: Bin 배정 완료 -->
                    <template v-else-if="sku.isNewSku && sku.currentBin">
                      <div class="bin-cell">
                        <span class="location-tag location-tag--new">{{ sku.currentBin }}</span>
                        <span class="badge badge--green">배정 완료</span>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="selectBin(sku.code, null)">변경</button>
                      </div>
                    </template>

                    <!-- 기존 SKU: 자동 배정, 변경 중 아님 -->
                    <template v-else-if="!sku.isChanging">
                      <div class="bin-cell">
                        <span class="location-tag">{{ sku.currentBin }}</span>
                        <span class="badge badge--blue">자동</span>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="startChanging(sku.code)">변경</button>
                      </div>
                    </template>

                    <!-- 기존 SKU: 변경 중 -->
                    <template v-else>
                      <div class="bin-cell">
                        <select
                          class="bin-select"
                          :value="sku.currentBin ?? ''"
                          @change="e => selectBin(sku.code, e.target.value)"
                        >
                          <option value="">— Bin 선택 —</option>
                          <option v-for="b in availableBinsFor(sku)" :key="b" :value="b">{{ b }}</option>
                        </select>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="cancelChanging(sku.code)">취소</button>
                      </div>
                    </template>
                  </template>
                </td>

                <!-- 수용 가능 수량 -->
                <td style="text-align:right">{{ sku.avail.toLocaleString() }}</td>
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
        <TimelineStepper :steps="ASN_STEPS" :currentStep="asnStatus" />
      </div>

    </div>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>
      <button
        v-if="canAssign"
        class="ui-btn ui-btn--primary"
        :disabled="!canConfirm"
        :title="canConfirm ? '' : '모든 신규 SKU에 Bin을 배정하세요'"
        @click="handleConfirm"
      >
        입고 확인
      </button>
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

/* ── 신규 SKU 안내 배너 ─────────────────────── */
.new-sku-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: var(--amber-pale);
  border: 1px solid #d97706;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #92400e;
  margin-bottom: var(--space-3);
  line-height: 1.5;
}
.new-sku-notice strong { font-weight: 700; }

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
  vertical-align: middle;
}
.table-wrap tr:last-child td { border-bottom: none; }

/* 신규 SKU 행: 미배정 상태 강조 */
.row--new td { background: rgba(245, 166, 35, 0.04); }

.code-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--t3);
}

.sku-name { margin-right: var(--space-2); }
.sku-new-badge { font-size: 10px; padding: 1px 6px; vertical-align: middle; }

/* ── Bin 셀 레이아웃 ─────────────────────────── */
.bin-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: nowrap;
}

.bin-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--amber);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-xs);
  cursor: pointer;
  min-width: 110px;
}

.location-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--t2);
  white-space: nowrap;
}
/* 신규 SKU에 새로 배정된 Bin */
.location-tag--new {
  border-color: var(--green);
  background: var(--green-pale);
  color: var(--green);
}

/* ── 배지 ─────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge--amber { background: var(--amber-pale); color: #b45309; }
.badge--blue  { background: var(--blue-pale);  color: var(--blue); }
.badge--green { background: var(--green-pale); color: var(--green); }
.badge--red   { background: var(--red-pale);   color: var(--red); }

/* ── 버튼 ─────────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background var(--ease-fast), opacity var(--ease-fast);
}
.ui-btn--ghost {
  border-color: var(--border);
  background: transparent;
  color: var(--t2);
  padding: 0 var(--space-4);
  height: 36px;
  font-size: var(--font-size-sm);
}
.ui-btn--ghost:hover { background: var(--surface-2); color: var(--t1); }
.ui-btn--primary {
  background: var(--blue);
  color: #fff;
  padding: 0 var(--space-4);
  height: 36px;
  font-size: var(--font-size-sm);
}
.ui-btn--primary:not(:disabled):hover { opacity: 0.9; }
.ui-btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-btn--xs {
  height: 26px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
}
</style>