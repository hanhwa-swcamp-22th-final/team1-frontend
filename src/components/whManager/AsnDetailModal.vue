<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import TimelineStepper from '@/components/common/TimelineStepper.vue'
import {
  getAsnBinMatches,
  getAsnRecommendedBins,
  saveAsnBinAssignments,
  confirmAsnArrival,
} from '@/api/wms'
import { INBOUND_STATUS } from '@/constants/status'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  asnId: { type: String, default: '' },
  asnSummary: { type: Object, default: null },
  canAssign: { type: Boolean, default: false },
})

const emit = defineEmits(['cancel', 'confirm'])

const STATUS_MAP = {
  [INBOUND_STATUS.PENDING]: { label: '입고 대기', badge: 'amber' },
  [INBOUND_STATUS.TRANSIT]: { label: '운송 중', badge: 'blue' },
  [INBOUND_STATUS.MISMATCH]: { label: '수량 불일치', badge: 'red' },
  [INBOUND_STATUS.RECEIVED]: { label: '검수 완료', badge: 'green' },
}
const STATUS_STEP_LABEL = {
  [INBOUND_STATUS.PENDING]: '등록됨',
  [INBOUND_STATUS.TRANSIT]: '입고됨',
  [INBOUND_STATUS.MISMATCH]: '검수&적재중',
  [INBOUND_STATUS.RECEIVED]: '보관중',
}
const ASN_STEPS = [
  { key: INBOUND_STATUS.PENDING, label: '등록됨' },
  { key: INBOUND_STATUS.TRANSIT, label: '입고됨' },
  { key: INBOUND_STATUS.MISMATCH, label: '검수&적재중' },
  { key: INBOUND_STATUS.RECEIVED, label: '보관중' },
]

const loading = ref(false)
const isSaving = ref(false)
const isConfirmingArrival = ref(false)
const loadErrorMessage = ref('')
const binCandidateErrorMessage = ref('')
const saveErrorMessage = ref('')
const binMatches = ref([])
const recommendedBins = ref({})
const tempBins = ref({})
const changingBins = ref({})

function resetModalState() {
  loadErrorMessage.value = ''
  binCandidateErrorMessage.value = ''
  saveErrorMessage.value = ''
  binMatches.value = []
  recommendedBins.value = {}
  tempBins.value = {}
  changingBins.value = {}
}

function normalizeText(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeInboundStatus(status) {
  if (!status) return INBOUND_STATUS.PENDING

  return ({
    REGISTERED: INBOUND_STATUS.PENDING,
    ARRIVED: INBOUND_STATUS.TRANSIT,
    INSPECTING_PUTAWAY: INBOUND_STATUS.MISMATCH,
    STORED: INBOUND_STATUS.RECEIVED,
    RECEIVED: INBOUND_STATUS.RECEIVED,
    PENDING: INBOUND_STATUS.PENDING,
    TRANSIT: INBOUND_STATUS.TRANSIT,
    MISMATCH: INBOUND_STATUS.MISMATCH,
  })[status] ?? status
}

function normalizeRecommendedBin(bin = {}) {
  return {
    locationId: normalizeText(bin.locationId),
    bin: normalizeText(bin.bin ?? bin.binCode),
    availableCapacity: normalizeNumber(bin.availableCapacity),
  }
}

function normalizeRecommendedBinMap(payload = {}) {
  const data = payload?.data ?? payload
  const items = Array.isArray(data?.items) ? data.items : []

  return items.reduce((map, item) => {
    const skuId = normalizeText(item.skuId)
    if (!skuId) return map

    map[skuId] = Array.isArray(item.recommendedBins)
      ? item.recommendedBins.map(normalizeRecommendedBin).filter((candidate) => candidate.bin)
      : []
    return map
  }, {})
}

function normalizeBinMatchList(payload = {}) {
  const data = payload?.data ?? payload
  const items = Array.isArray(data?.items) ? data.items : []

  return items
    .map((item) => ({
      skuId: normalizeText(item.skuId),
      productName: normalizeText(item.productName, '-'),
      plannedQuantity: normalizeNumber(item.plannedQuantity),
      matchedLocationId: normalizeText(item.matchedLocationId),
      matchedBin: normalizeText(item.matchedBin),
      matchType: normalizeText(item.matchType),
      requiresManualAssign: Boolean(item.requiresManualAssign),
    }))
    .filter((item) => item.skuId)
}

const newSkuCodeSet = computed(() => new Set(
  Array.isArray(props.asnSummary?.newSkus)
    ? props.asnSummary.newSkus.map((sku) => normalizeText(sku.code)).filter(Boolean)
    : [],
))

const asnStatus = computed(() => normalizeInboundStatus(props.asnSummary?.status))
const statusInfo = computed(() => STATUS_MAP[asnStatus.value] ?? { label: '-', badge: 'gray' })
const plannedQuantity = computed(() => {
  if (props.asnSummary?.plannedQty != null) return normalizeNumber(props.asnSummary.plannedQty)
  return binMatches.value.reduce((sum, item) => sum + item.plannedQuantity, 0)
})

const skuList = computed(() => {
  return binMatches.value.map((item) => {
    const currentTempBin = normalizeText(tempBins.value[item.skuId])
    const candidateList = recommendedBins.value[item.skuId] ?? []
    const currentBin = currentTempBin || item.matchedBin || null
    const selectedCandidate = candidateList.find((candidate) => candidate.bin === currentBin)
    const maxCapacity = candidateList.reduce((max, candidate) => Math.max(max, candidate.availableCapacity), 0)
    const isNewSku = item.requiresManualAssign || newSkuCodeSet.value.has(item.skuId)

    return {
      code: item.skuId,
      name: item.productName,
      qty: item.plannedQuantity,
      avail: selectedCandidate?.availableCapacity ?? maxCapacity,
      isNewSku,
      registryBin: item.matchedBin || null,
      currentBin,
      isChanging: Boolean(changingBins.value[item.skuId]),
    }
  })
})

const usedBins = computed(() => new Set(
  skuList.value
    .map((sku) => sku.currentBin)
    .filter(Boolean),
))

const newSkus = computed(() => skuList.value.filter((sku) => sku.isNewSku))
const canEditBins = computed(() =>
  props.canAssign && asnStatus.value !== INBOUND_STATUS.PENDING
)
const canConfirmArrival = computed(() =>
  asnStatus.value === INBOUND_STATUS.PENDING && !isConfirmingArrival.value && !isSaving.value
)

const canSaveBinAssignments = computed(() => {
  if (!canEditBins.value || isSaving.value) return false
  if (!skuList.value.length) return false

  const changingSkuCodes = Object.keys(changingBins.value)
  const hasNewSkuAssignments = newSkus.value.length > 0
  const hasExistingReassignments = changingSkuCodes.length > 0

  if (!hasNewSkuAssignments && !hasExistingReassignments) return false

  const targetSkus = skuList.value.filter(
    (sku) => sku.isNewSku || changingBins.value[sku.code],
  )

  return targetSkus.length > 0 && targetSkus.every((sku) => sku.currentBin)
})

const binSectionCopy = computed(() => {
  if (asnStatus.value === INBOUND_STATUS.PENDING) {
    return '등록됨 상태에서는 Bin 배정을 잠그고, 입고 확인이 끝난 뒤부터 Bin을 배정할 수 있습니다.'
  }

  return '신규 SKU는 직접 Bin을 배정해야 합니다. 배정된 Bin은 이후 같은 SKU 입고 시 자동으로 매핑됩니다.'
})

function availableBinsFor(sku) {
  const candidateList = recommendedBins.value[sku.code] ?? []
  const ownBin = sku.currentBin

  return candidateList.filter((candidate) => !usedBins.value.has(candidate.bin) || candidate.bin === ownBin)
}

function selectBin(skuCode, bin) {
  tempBins.value = {
    ...tempBins.value,
    [skuCode]: normalizeText(bin) || null,
  }
}

function startChanging(skuCode) {
  changingBins.value = {
    ...changingBins.value,
    [skuCode]: true,
  }
}

function cancelChanging(skuCode) {
  const nextChanging = { ...changingBins.value }
  delete nextChanging[skuCode]
  changingBins.value = nextChanging

  const nextTempBins = { ...tempBins.value }
  delete nextTempBins[skuCode]
  tempBins.value = nextTempBins
}

function buildBinAssignmentPayload() {
  return {
    assignments: skuList.value
      .filter((sku) => sku.currentBin)
      .map((sku) => ({
        sku: sku.code,
        bin: sku.currentBin,
        isNewSku: sku.isNewSku,
      })),
  }
}

async function fetchAsnData() {
  if (!props.asnId) return

  loading.value = true
  loadErrorMessage.value = ''
  binCandidateErrorMessage.value = ''
  saveErrorMessage.value = ''

  try {
    const [matchResponse, recommendedResponse] = await Promise.all([
      getAsnBinMatches(props.asnId),
      getAsnRecommendedBins(props.asnId).catch((error) => {
        binCandidateErrorMessage.value = error.response?.data?.message ?? 'Bin 후보 목록을 불러오지 못했습니다.'
        return { data: { data: { items: [] } } }
      }),
    ])

    binMatches.value = normalizeBinMatchList(matchResponse.data)
    recommendedBins.value = normalizeRecommendedBinMap(recommendedResponse.data)
  } catch (error) {
    binMatches.value = []
    loadErrorMessage.value = error.response?.data?.message ?? 'ASN 상세 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function handleConfirmArrival() {
  if (!canConfirmArrival.value) return

  saveErrorMessage.value = ''

  try {
    isConfirmingArrival.value = true
    const arrivedAt = new Date().toISOString().slice(0, 19)
    await confirmAsnArrival(props.asnId, arrivedAt)
    emit('confirm', { asnId: props.asnId, action: 'arrival' })
  } catch (error) {
    saveErrorMessage.value = error.response?.data?.message ?? '입고 확인에 실패했습니다.'
  } finally {
    isConfirmingArrival.value = false
  }
}

async function handleSaveBinAssignments() {
  if (!canSaveBinAssignments.value) return

  saveErrorMessage.value = ''

  try {
    isSaving.value = true
    await saveAsnBinAssignments(props.asnId, buildBinAssignmentPayload())
    emit('confirm', { asnId: props.asnId, action: 'bin-assignment' })
  } catch (error) {
    saveErrorMessage.value = error.response?.data?.message ?? 'Bin 배정 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [props.isOpen, props.asnId],
  ([isOpen, asnId]) => {
    if (!isOpen) {
      resetModalState()
      return
    }

    if (asnId) {
      tempBins.value = {}
      changingBins.value = {}
      void fetchAsnData()
    }
  },
)
</script>

<template>
  <BaseModal
    title="ASN 상세 정보"
    :is-open="isOpen"
    width="760px"
    @cancel="$emit('cancel')"
  >
    <div v-if="loading" class="modal-loading">
      데이터를 불러오는 중입니다.
    </div>

    <div v-else-if="loadErrorMessage" class="feedback feedback--error">
      {{ loadErrorMessage }}
    </div>

    <div v-else-if="props.asnSummary || skuList.length">
      <div class="modal-hero">
        <div class="modal-hero-top">
          <div>
            <div class="modal-eyebrow">Inbound ASN</div>
            <div class="modal-hero-title">{{ props.asnSummary?.id ?? props.asnId }}</div>
            <div class="modal-hero-copy">
              셀러가 등록한 입고 예정 데이터를 확인합니다.
              신규 SKU는 Bin을 직접 배정하고, 기존 SKU는 API가 내려준 기존 Bin 상태를 기준으로 표시합니다.
            </div>
          </div>
          <span class="badge" :class="`badge--${statusInfo.badge}`">{{ statusInfo.label }}</span>
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <span class="metric-label">셀러사</span>
            <span class="metric-value">{{ (props.asnSummary?.company ?? props.asnSummary?.seller ?? '-').split(' ')[0] }}</span>
            <span class="metric-sub">{{ props.asnSummary?.company ?? props.asnSummary?.seller ?? '-' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 수량</span>
            <span class="metric-value">{{ plannedQuantity.toLocaleString() }}</span>
            <span class="metric-sub">{{ skuList.length }}개 SKU</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">예정 도착일</span>
            <span class="metric-value">{{ (props.asnSummary?.expectedDate ?? '-').slice(0, 10) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">현재 상태</span>
            <span class="metric-value">{{ STATUS_STEP_LABEL[asnStatus] ?? '-' }}</span>
            <span class="metric-sub">{{ statusInfo.label }}</span>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-head">
          <div class="modal-section-title">SKU 구성 및 Bin 배정</div>
          <div class="modal-section-copy">
            {{ binSectionCopy }}
          </div>
        </div>

        <div v-if="binCandidateErrorMessage" class="feedback feedback--error">
          {{ binCandidateErrorMessage }}
        </div>
        <div v-if="saveErrorMessage" class="feedback feedback--error">
          {{ saveErrorMessage }}
        </div>

        <div v-if="canConfirmArrival" class="new-sku-notice">
          <span>
            현재는 <strong>등록됨</strong> 상태입니다.
            먼저 입고 확인을 완료하면 Bin 배정 저장 UI가 활성화됩니다.
          </span>
        </div>

        <div v-else-if="canEditBins && newSkus.length" class="new-sku-notice">
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
              <tr v-if="!skuList.length">
                <td colspan="5" class="empty-row">SKU 정보를 불러오지 못했습니다.</td>
              </tr>
              <tr
                v-for="sku in skuList"
                :key="sku.code"
                :class="{ 'row--new': sku.isNewSku && !sku.currentBin }"
              >
                <td><span class="code-cell">{{ sku.code }}</span></td>
                <td>
                  <span class="sku-name">{{ sku.name }}</span>
                  <span v-if="sku.isNewSku" class="badge badge--amber sku-new-badge">신규</span>
                </td>
                <td style="text-align:right">{{ sku.qty.toLocaleString() }}</td>
                <td>
                  <template v-if="!canEditBins">
                    <div class="bin-cell">
                      <template v-if="sku.currentBin">
                        <span class="location-tag" :class="{ 'location-tag--new': sku.isNewSku }">
                          {{ sku.currentBin }}
                        </span>
                        <span v-if="sku.isNewSku" class="badge badge--green">배정 완료</span>
                        <span v-else class="badge badge--blue">기존</span>
                      </template>
                      <span v-else class="badge badge--amber">미배정</span>
                    </div>
                  </template>

                  <template v-else>
                    <template v-if="sku.isNewSku && !sku.currentBin">
                      <div class="bin-cell">
                        <span class="badge badge--amber">미배정</span>
                        <select
                          class="bin-select"
                          value=""
                          @change="(event) => selectBin(sku.code, event.target.value)"
                        >
                          <option value="">Bin 선택</option>
                          <option
                            v-for="candidate in availableBinsFor(sku)"
                            :key="candidate.locationId || candidate.bin"
                            :value="candidate.bin"
                          >
                            {{ candidate.bin }} (잔여 {{ candidate.availableCapacity }})
                          </option>
                        </select>
                      </div>
                    </template>

                    <template v-else-if="sku.isNewSku && sku.currentBin">
                      <div class="bin-cell">
                        <span class="location-tag location-tag--new">{{ sku.currentBin }}</span>
                        <span class="badge badge--green">배정 완료</span>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="selectBin(sku.code, null)">변경</button>
                      </div>
                    </template>

                    <template v-else-if="!sku.isChanging">
                      <div class="bin-cell">
                        <span class="location-tag">{{ sku.currentBin }}</span>
                        <span class="badge badge--blue">기존</span>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="startChanging(sku.code)">변경</button>
                      </div>
                    </template>

                    <template v-else>
                      <div class="bin-cell">
                        <select
                          class="bin-select"
                          :value="sku.currentBin ?? ''"
                          @change="(event) => selectBin(sku.code, event.target.value)"
                        >
                          <option value="">Bin 선택</option>
                          <option
                            v-for="candidate in availableBinsFor(sku)"
                            :key="candidate.locationId || candidate.bin"
                            :value="candidate.bin"
                          >
                            {{ candidate.bin }} (잔여 {{ candidate.availableCapacity }})
                          </option>
                        </select>
                        <button class="ui-btn ui-btn--ghost ui-btn--xs" @click="cancelChanging(sku.code)">취소</button>
                      </div>
                    </template>
                  </template>
                </td>
                <td style="text-align:right">{{ sku.avail.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-head">
          <div class="modal-section-title">진행 타임라인</div>
          <div class="modal-section-copy">입고 확인 이후 검수&적재 작업 배정으로 이어집니다.</div>
        </div>
        <TimelineStepper :steps="ASN_STEPS" :currentStep="asnStatus" />
      </div>
    </div>

    <div v-else class="modal-empty">
      ASN 정보를 찾을 수 없습니다.
    </div>

    <template #footer>
      <button class="ui-btn ui-btn--ghost" @click="$emit('cancel')">닫기</button>

      <button
        v-if="canConfirmArrival"
        class="ui-btn ui-btn--primary"
        @click="handleConfirmArrival"
      >
        {{ isConfirmingArrival ? '처리 중...' : '입고 확인' }}
      </button>

      <button
        v-else-if="canEditBins"
        class="ui-btn ui-btn--primary"
        :disabled="!canSaveBinAssignments"
        :title="canSaveBinAssignments ? '' : '변경할 SKU의 Bin을 모두 선택하세요'"
        @click="handleSaveBinAssignments"
      >
        {{ isSaving ? '저장 중...' : 'Bin 배정 저장' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.modal-loading,
.modal-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.feedback {
  margin-bottom: var(--space-3);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.feedback--error {
  border: 1px solid rgba(209, 67, 67, 0.24);
  background: rgba(209, 67, 67, 0.08);
  color: #a12e2e;
}

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

.metric-label {
  font-size: 11px;
  color: var(--t3);
  font-weight: 500;
}

.metric-value {
  font-family: var(--font-condensed);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--t1);
  line-height: 1.2;
}

.metric-sub {
  font-size: 11px;
  color: var(--t3);
}

.modal-section {
  margin-bottom: var(--space-5);
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-head {
  margin-bottom: var(--space-3);
}

.modal-section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
}

.modal-section-copy {
  font-size: var(--font-size-xs);
  color: var(--t3);
  margin-top: 3px;
}

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

.table-wrap {
  overflow-x: auto;
}

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

.table-wrap tr:last-child td {
  border-bottom: none;
}

.empty-row {
  text-align: center;
  color: var(--t3);
  font-style: italic;
}

.row--new td {
  background: rgba(245, 166, 35, 0.04);
}

.code-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--t3);
}

.sku-name {
  margin-right: var(--space-2);
}

.sku-new-badge {
  font-size: 10px;
  padding: 1px 6px;
  vertical-align: middle;
}

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

.location-tag--new {
  border-color: var(--green);
  background: var(--green-pale);
  color: var(--green);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.badge--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.badge--red {
  background: var(--red-pale);
  color: var(--red);
}

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

.ui-btn--ghost:hover {
  background: var(--surface-2);
  color: var(--t1);
}

.ui-btn--primary {
  background: var(--blue);
  color: #fff;
  padding: 0 var(--space-4);
  height: 36px;
  font-size: var(--font-size-sm);
}

.ui-btn--primary:not(:disabled):hover {
  opacity: 0.9;
}

.ui-btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-btn--xs {
  height: 26px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
}
</style>
