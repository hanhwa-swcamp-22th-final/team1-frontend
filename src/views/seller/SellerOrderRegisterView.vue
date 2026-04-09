<script setup>
/**
 * 셀러 주문 등록 화면.
 * 단건 주문 등록과 일괄 주문 등록 흐름을 탭으로 나눠 관리한다.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  getSellerChannelCards,
  getSellerChannelDetail,
  getSellerChannelImportPreview,
} from '@/api/integration'
import { createSellerBulkOrders, createSellerOrder, getSellerOrderOptions } from '@/api/order'
import BaseForm from '@/components/common/BaseForm.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastMessage from '@/components/common/ToastMessage.vue'
import SellerExcelUploadResultModal from '@/components/seller/SellerExcelUploadResultModal.vue'
import { parseExcel } from '@/utils/excel'
import {
  buildChannelImportPreviewMessage,
  buildManualOrderPayload,
  buildOrderProductLineSummary,
  buildOrderTemplateCsv,
  buildOrderUploadResultSummary,
  createOrderProductLine,
  generateSellerOrderNumber,
  getMissingOrderUploadColumns,
  mapOrderUploadRows,
  normalizeBulkOrderRegisterTab,
  normalizeOrderRegisterTab,
  ORDER_PREVIEW_COLUMNS,
  ORDER_UPLOAD_REQUIRED_COLUMNS,
  SELLER_BULK_ORDER_REGISTER_TABS,
  SELLER_ORDER_REGISTER_TABS,
  validateOrderForm,
} from '@/utils/seller/orderRegister.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '주문 등록' }]

const PRIMARY_CHANNEL_KEY = 'SHOPIFY'
const PRIMARY_CHANNEL_LABEL = 'Shopify'
const CHANNEL_SYNC_WINDOW_OPTIONS = ['최근 1일', '최근 3일', '최근 7일', '최근 14일']

const activeRegisterMode = ref('manual')
const activeBulkTab = ref('')
const isBulkMenuOpen = ref(false)
const selectedFileName = ref('')
const submitErrorMessage = ref('')
const isSubmittingManual = ref(false)
const uploadErrorMessage = ref('')
const bulkSubmitErrorMessage = ref('')
const isSubmittingBulk = ref(false)
const isUploadResultModalOpen = ref(false)
const uploadResultSummary = ref(null)
const previewRows = ref([])
const isPreviewSample = ref(true)
const channelFeedbackMessage = ref('')
const channelFeedbackTone = ref('idle')
const isLiveSummaryVisible = ref(true)
const isChecklistVisible = ref(true)
const isUploadGuideVisible = ref(true)
const isChannelNotesVisible = ref(true)
const manualCombinedCardRef = ref(null)
const recipientCardMinHeight = ref('')
const toast = ref({ visible: false, message: '', type: 'success' })
const productOptions = ref([])
const salesChannelOptions = ref([])
const selectedBulkFile = ref(null)
const optionsErrorMessage = ref('')
const isCheckingChannel = ref(false)
const isImportPreviewLoading = ref(false)

const channelSettings = reactive({
  storeAlias: '',
  marketplace: '',
  contactEmail: '',
  syncWindow: '',
  autoImport: true,
})

const channelConnection = reactive({
  connected: false,
  lastSyncedAt: '-',
  pendingOrders: 0,
})

let productLineSequence = 2
let manualCombinedCardObserver = null

function createInitialForm() {
  productLineSequence = 2

  return {
    autoGenerateOrderNo: false,
    orderNo: '',
    orderDate: '',
    salesChannel: salesChannelOptions.value[0]?.value ?? '수동',
    recipient: '',
    contact: '',
    state: '',
    city: '',
    zipCode: '',
    address1: '',
    address2: '',
    memo: '',
    items: [createOrderProductLine('order-item-1')],
  }
}

const manualForm = ref(createInitialForm())
const formErrors = reactive({
  orderNo: '',
  orderDate: '',
  recipient: '',
  contact: '',
  state: '',
  city: '',
  zipCode: '',
  address1: '',
  sku: '',
  quantity: '',
  items: '',
})

const currentOrderNoPreview = computed(() => (
  manualForm.value.autoGenerateOrderNo
    ? generateSellerOrderNumber(manualForm.value.orderDate || new Date())
    : String(manualForm.value.orderNo ?? '').trim() || '직접 입력'
))

const manualProductRows = computed(() => (
  manualForm.value.items.map((line, index) => {
    const quantity = Math.max(1, Number(line.quantity ?? 1) || 1)
    const summary = buildOrderProductLineSummary({ ...line, quantity }, productOptions.value)

    return {
      ...line,
      lineNumber: index + 1,
      quantity,
      ...summary,
      isOverAllocated: summary.availableStock > 0 && quantity > summary.availableStock,
    }
  })
))

const manualProductTotals = computed(() => (
  manualProductRows.value.reduce((acc, line) => ({
    totalSku: acc.totalSku + (line.sku ? 1 : 0),
    totalQuantity: acc.totalQuantity + (line.sku ? line.quantity : 0),
    totalAmount: acc.totalAmount + line.subtotal,
    lowStockCount: acc.lowStockCount + (line.isLowStock ? 1 : 0),
  }), {
    totalSku: 0,
    totalQuantity: 0,
    totalAmount: 0,
    lowStockCount: 0,
  })
))

const uploadSummaryCards = computed(() => {
  if (!uploadResultSummary.value) return []

  return [
    { label: '업로드 건수', value: `${uploadResultSummary.value.rowCount}건` },
    { label: '총 수량', value: `${uploadResultSummary.value.totalQuantity}개` },
    { label: 'SKU 수', value: `${uploadResultSummary.value.uniqueSkuCount}개` },
    { label: '수령인 수', value: `${uploadResultSummary.value.uniqueRecipientCount}명` },
  ]
})

const channelStatusLabel = computed(() => (channelConnection.connected ? '연결됨' : '미연동'))
const channelStatusClassName = computed(() => (
  channelConnection.connected ? 'status-pill status-pill--success' : 'status-pill status-pill--muted'
))
const channelFeedbackClassName = computed(() => (
  channelFeedbackTone.value === 'error' ? 'feedback feedback--error' : 'feedback feedback--success'
))
const recipientCardStyle = computed(() => (
  recipientCardMinHeight.value ? { minHeight: recipientCardMinHeight.value } : {}
))

function syncRecipientCardMinHeight() {
  if (!manualCombinedCardRef.value) return
  if (manualForm.value.items.length > 1 && recipientCardMinHeight.value) return

  recipientCardMinHeight.value = `${Math.ceil(manualCombinedCardRef.value.getBoundingClientRect().height)}px`
}

function bindManualCombinedCardObserver() {
  if (!manualCombinedCardRef.value || typeof ResizeObserver === 'undefined') return

  manualCombinedCardObserver?.disconnect()
  manualCombinedCardObserver = new ResizeObserver(() => {
    if (manualForm.value.items.length === 1) {
      syncRecipientCardMinHeight()
    }
  })
  manualCombinedCardObserver.observe(manualCombinedCardRef.value)
}

function clearFormErrors() {
  Object.keys(formErrors).forEach((key) => {
    formErrors[key] = ''
  })
}

function showToast(message, type = 'success') {
  toast.value = {
    visible: true,
    message,
    type,
  }
}

function resetManualForm() {
  manualForm.value = createInitialForm()
  clearFormErrors()
}

function handleReset() {
  resetManualForm()
  submitErrorMessage.value = ''
  nextTick(() => {
    syncRecipientCardMinHeight()
  })
}

function resetUploadState() {
  selectedBulkFile.value = null
  selectedFileName.value = ''
  uploadErrorMessage.value = ''
  bulkSubmitErrorMessage.value = ''
  isUploadResultModalOpen.value = false
  uploadResultSummary.value = null
  previewRows.value = []
  isPreviewSample.value = true
}

function handleRegisterModeChange(tabKey) {
  const normalizedTab = normalizeOrderRegisterTab(tabKey)

  if (normalizedTab === 'bulk') {
    isBulkMenuOpen.value = !isBulkMenuOpen.value
    return
  }

  activeRegisterMode.value = normalizedTab
  activeBulkTab.value = ''
  isBulkMenuOpen.value = false
}

function handleBulkTabChange(tabKey) {
  activeRegisterMode.value = 'bulk'
  activeBulkTab.value = normalizeBulkOrderRegisterTab(tabKey)
  isBulkMenuOpen.value = false
}

function handleDismissInfoCard(cardKey) {
  if (cardKey === 'summary') isLiveSummaryVisible.value = false
  if (cardKey === 'checklist') isChecklistVisible.value = false
}

function handleAddProductLine() {
  manualForm.value.items.push(createOrderProductLine(`order-item-${productLineSequence}`))
  productLineSequence += 1
  formErrors.items = ''
}

function handleRemoveProductLine(lineId) {
  if (manualForm.value.items.length <= 1) {
    manualForm.value.items = [createOrderProductLine(lineId)]
  } else {
    manualForm.value.items = manualForm.value.items.filter((line) => line.id !== lineId)
  }

  formErrors.items = ''
}

function handleProductSkuChange() {
  formErrors.items = ''
  formErrors.sku = ''
}

function handleProductQuantityBlur(line) {
  line.quantity = Math.max(1, Number(line.quantity ?? 1) || 1)
  formErrors.items = ''
  formErrors.quantity = ''
}

function getProductLineSummary(line) {
  const quantity = Math.max(1, Number(line.quantity ?? 1) || 1)
  return buildOrderProductLineSummary({ ...line, quantity }, productOptions.value)
}

function isQuantityOverflow(line) {
  const summary = getProductLineSummary(line)
  return summary.availableStock > 0 && Number(line.quantity ?? 0) > summary.availableStock
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function handleCloseUploadResultModal() {
  isUploadResultModalOpen.value = false
}

function handleDownloadTemplate() {
  const csvContent = `\uFEFF${buildOrderTemplateCsv()}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = href
  anchor.download = 'seller-order-template.csv'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(href)

  uploadErrorMessage.value = ''
  showToast('주문 등록 템플릿을 다운로드했습니다.')
}

async function handleFileSelected(file) {
  const targetFile = Array.isArray(file) ? file[0] : file

  uploadErrorMessage.value = ''
  bulkSubmitErrorMessage.value = ''
  isUploadResultModalOpen.value = false
  uploadResultSummary.value = null

  if (!targetFile) {
    resetUploadState()
    return
  }

  selectedBulkFile.value = targetFile
  selectedFileName.value = targetFile.name

  try {
    const rows = await parseExcel(targetFile)

    if (!rows.length) {
      previewRows.value = []
      isPreviewSample.value = true
      uploadErrorMessage.value = '업로드한 파일에 주문 데이터가 없습니다.'
      return
    }

    const missingColumns = getMissingOrderUploadColumns(Object.keys(rows[0] ?? {}))
    if (missingColumns.length) {
      previewRows.value = []
      isPreviewSample.value = true
      uploadErrorMessage.value = `필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`
      return
    }

    previewRows.value = mapOrderUploadRows(rows)
    isPreviewSample.value = false
    showToast(`${targetFile.name} 파일에서 ${previewRows.value.length}건을 불러왔습니다.`)
    uploadResultSummary.value = buildOrderUploadResultSummary(previewRows.value, targetFile.name)
    isUploadResultModalOpen.value = true
  } catch (error) {
    previewRows.value = []
    isPreviewSample.value = true
    uploadErrorMessage.value = '엑셀 파일을 읽지 못했습니다. 파일 형식을 확인하세요.'
  }
}

async function handleManualSubmit() {
  submitErrorMessage.value = ''
  clearFormErrors()

  const errors = validateOrderForm(manualForm.value, productOptions.value)
  Object.entries(errors).forEach(([key, value]) => {
    formErrors[key] = value
  })

  if (Object.values(errors).some(Boolean)) return

  try {
    isSubmittingManual.value = true
    const payload = buildManualOrderPayload(manualForm.value, { productOptions: productOptions.value })
    const response = await createSellerOrder(payload)

    resetManualForm()
    showToast(response.data?.message ?? '주문이 등록되었습니다.')
  } catch (error) {
    submitErrorMessage.value = error.response?.data?.message ?? '주문 등록 중 오류가 발생했습니다.'
  } finally {
    isSubmittingManual.value = false
  }
}

async function handleBulkSubmit() {
  bulkSubmitErrorMessage.value = ''

  if (isPreviewSample.value || !previewRows.value.length || !selectedBulkFile.value) {
    bulkSubmitErrorMessage.value = '저장할 업로드 주문이 없습니다.'
    return
  }

  try {
    isSubmittingBulk.value = true
    const response = await createSellerBulkOrders(selectedBulkFile.value)
    const savedCount = response.data?.data?.savedCount ?? previewRows.value.length

    resetUploadState()
    showToast(`${response.data?.message ?? '업로드 주문이 등록되었습니다.'} (${savedCount}건)`)
  } catch (error) {
    bulkSubmitErrorMessage.value = error.response?.data?.message ?? '업로드 주문 저장 중 오류가 발생했습니다.'
  } finally {
    isSubmittingBulk.value = false
  }
}

function normalizeSelectOptions(items = [], { fallbackValue = '', fallbackLabel = '' } = {}) {
  const normalized = (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === 'string') {
      return { value: item, label: item }
    }

    const value = String(item?.value ?? item?.key ?? item?.channelKey ?? item?.channel ?? item?.name ?? '').trim()
    const label = String(item?.label ?? item?.name ?? item?.channelName ?? item?.value ?? value).trim()
    return { value, label }
  }).filter((item) => item.value)

  if (!normalized.length && fallbackValue) {
    return [{ value: fallbackValue, label: fallbackLabel || fallbackValue }]
  }

  return normalized
}

function resetPrimaryChannelState() {
  channelConnection.connected = false
  channelConnection.pendingOrders = 0
  channelConnection.lastSyncedAt = '-'
  channelSettings.storeAlias = ''
  channelSettings.marketplace = ''
  channelSettings.contactEmail = ''
  channelSettings.syncWindow = ''
  channelSettings.autoImport = true
}

function findPrimaryChannelCard(cards = []) {
  return cards.find((card) => {
    const channelKey = String(card.channelKey ?? card.channel ?? card.name ?? '').toUpperCase()
    return channelKey === PRIMARY_CHANNEL_KEY
  }) ?? null
}

function applyChannelPayload(payload = {}) {
  channelConnection.connected = Boolean(payload.connected ?? ['CONNECTED', 'ACTIVE'].includes(payload.status))
  channelConnection.pendingOrders = Number(payload.pendingOrders ?? payload.importableOrders ?? 0)
  channelConnection.lastSyncedAt = payload.lastSyncedAt ?? '-'
  channelSettings.storeAlias = String(payload.storeAlias ?? payload.storeName ?? channelSettings.storeAlias ?? '').trim()
  channelSettings.marketplace = String(payload.marketplace ?? payload.label ?? payload.channelName ?? channelSettings.marketplace ?? '').trim()
  channelSettings.contactEmail = String(payload.contactEmail ?? payload.email ?? channelSettings.contactEmail ?? '').trim()
  channelSettings.syncWindow = String(payload.syncWindow ?? channelSettings.syncWindow ?? '').trim()
  channelSettings.autoImport = Boolean(payload.autoImport ?? channelSettings.autoImport)
}

async function fetchOrderOptions() {
  optionsErrorMessage.value = ''

  try {
    const [optionsResponse, channelCardsResponse] = await Promise.all([
      getSellerOrderOptions(),
      getSellerChannelCards(),
    ])

    const optionsPayload = optionsResponse.data?.data ?? {}
    const channelCards = Array.isArray(channelCardsResponse.data?.data) ? channelCardsResponse.data.data : []
    productOptions.value = Array.isArray(optionsPayload.products) ? optionsPayload.products : []
    salesChannelOptions.value = normalizeSelectOptions(
      optionsPayload.channels ?? channelCards.map((card) => ({
        value: card.channelKey ?? card.channel ?? card.name,
        label: card.label ?? card.name ?? card.channelKey,
      })),
      { fallbackValue: '수동', fallbackLabel: '수동' },
    )

    if (!manualForm.value.salesChannel) {
      manualForm.value.salesChannel = salesChannelOptions.value[0]?.value ?? '수동'
    }

    resetPrimaryChannelState()

    const primaryChannelCard = findPrimaryChannelCard(channelCards)
    if (primaryChannelCard) {
      applyChannelPayload(primaryChannelCard)
    }

    try {
      const detailResponse = await getSellerChannelDetail(PRIMARY_CHANNEL_KEY)
      const channelDetail = detailResponse.data?.data ?? {}
      applyChannelPayload(channelDetail)
    } catch {
      // 카드 응답만으로도 1차 렌더가 가능하므로 상세 조회 실패는 여기서 무시한다.
    }
  } catch (error) {
    productOptions.value = []
    salesChannelOptions.value = normalizeSelectOptions([], { fallbackValue: '수동', fallbackLabel: '수동' })
    if (!manualForm.value.salesChannel) {
      manualForm.value.salesChannel = '수동'
    }
    resetPrimaryChannelState()
    optionsErrorMessage.value = error.response?.data?.message ?? '주문 등록 옵션을 불러오지 못했습니다.'
  }
}

async function handleChannelConnectionCheck() {
  channelFeedbackMessage.value = ''
  channelFeedbackTone.value = 'idle'

  try {
    isCheckingChannel.value = true
    const [cardsResponse, detailResponse] = await Promise.all([
      getSellerChannelCards(),
      getSellerChannelDetail(PRIMARY_CHANNEL_KEY),
    ])
    const cards = Array.isArray(cardsResponse.data?.data) ? cardsResponse.data.data : []
    const primaryChannelCard = findPrimaryChannelCard(cards)

    if (!primaryChannelCard) {
      resetPrimaryChannelState()
      channelFeedbackTone.value = 'error'
      channelFeedbackMessage.value = `${PRIMARY_CHANNEL_LABEL} 채널 연결 정보를 찾지 못했습니다.`
      return
    }

    applyChannelPayload(primaryChannelCard)
    applyChannelPayload(detailResponse.data?.data ?? {})
    channelFeedbackTone.value = channelConnection.connected ? 'success' : 'error'
    channelFeedbackMessage.value = channelConnection.connected
      ? `${PRIMARY_CHANNEL_LABEL} 채널 연결 상태를 확인했습니다.`
      : `${PRIMARY_CHANNEL_LABEL} 채널이 아직 연결되지 않았습니다.`
  } catch (error) {
    channelFeedbackTone.value = 'error'
    channelFeedbackMessage.value = error.response?.data?.message ?? `${PRIMARY_CHANNEL_LABEL} 연결 상태를 확인하지 못했습니다.`
  } finally {
    isCheckingChannel.value = false
  }
}

async function handleChannelImportPreview() {
  if (!channelConnection.connected) {
    channelFeedbackTone.value = 'error'
    channelFeedbackMessage.value = `먼저 ${PRIMARY_CHANNEL_LABEL} 연결 확인을 진행하세요.`
    return
  }

  try {
    isImportPreviewLoading.value = true
    const response = await getSellerChannelImportPreview(PRIMARY_CHANNEL_KEY, {
      storeAlias: channelSettings.storeAlias,
      contactEmail: channelSettings.contactEmail,
      syncWindow: channelSettings.syncWindow,
      autoImport: channelSettings.autoImport,
    })
    const payload = response.data?.data ?? {}
    channelConnection.pendingOrders = Number(payload.pendingOrders ?? channelConnection.pendingOrders ?? 0)
    channelConnection.lastSyncedAt = payload.lastSyncedAt ?? channelConnection.lastSyncedAt
    channelFeedbackTone.value = 'success'
    channelFeedbackMessage.value = response.data?.message
      ?? buildChannelImportPreviewMessage(PRIMARY_CHANNEL_LABEL, channelSettings.syncWindow, channelConnection.pendingOrders)
  } catch (error) {
    channelFeedbackTone.value = 'error'
    channelFeedbackMessage.value = error.response?.data?.message ?? `${PRIMARY_CHANNEL_LABEL} 주문 가져오기 미리보기를 불러오지 못했습니다.`
  } finally {
    isImportPreviewLoading.value = false
  }
}

watch(activeRegisterMode, async (mode) => {
  if (mode !== 'manual') return

  await nextTick()
  bindManualCombinedCardObserver()
  syncRecipientCardMinHeight()
})

onMounted(async () => {
  await fetchOrderOptions()
  await nextTick()
  bindManualCombinedCardObserver()
  syncRecipientCardMinHeight()
})

onBeforeUnmount(() => {
  manualCombinedCardObserver?.disconnect()
  manualCombinedCardObserver = null
})
</script>

<template>
  <AppLayout title="주문 등록" :breadcrumb="breadcrumb">
    <ToastMessage
      v-model:visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
    />

    <section class="order-register-page">
      <div class="register-toolbar">
        <div class="register-tabs">
          <div
            v-for="tab in SELLER_ORDER_REGISTER_TABS"
            :key="tab.key"
            class="register-tab-stack"
            :class="{ 'register-tab-stack--bulk': tab.key === 'bulk' }"
          >
            <button
              type="button"
              class="register-tab"
              :class="{
                'register-tab--active': activeRegisterMode === tab.key,
                'register-tab--open': tab.key === 'bulk' && isBulkMenuOpen && activeRegisterMode !== 'bulk',
              }"
              @click="handleRegisterModeChange(tab.key)"
            >
              {{ tab.label }}
            </button>

            <transition name="bulk-slide">
              <div
                v-if="tab.key === 'bulk' && isBulkMenuOpen"
                class="bulk-register-menu"
              >
                <button
                  v-for="bulkTab in SELLER_BULK_ORDER_REGISTER_TABS"
                  :key="bulkTab.key"
                  type="button"
                  class="bulk-register-menu__button"
                  :class="{ 'bulk-register-menu__button--active': activeBulkTab === bulkTab.key }"
                  @click="handleBulkTabChange(bulkTab.key)"
                >
                  {{ bulkTab.label }}
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div v-if="activeRegisterMode === 'manual'" class="toolbar-actions">
          <button class="ui-btn ui-btn--ghost" type="button" @click="handleReset">초기화</button>
          <button class="ui-btn ui-btn--primary" type="button" :disabled="isSubmittingManual" @click="handleManualSubmit">
            {{ isSubmittingManual ? '등록 중...' : '주문 등록' }}
          </button>
        </div>
        <div v-else-if="activeRegisterMode === 'bulk' && activeBulkTab === 'excel'" class="toolbar-actions">
          <button class="ui-btn ui-btn--ghost" type="button" @click="handleDownloadTemplate">
            템플릿 다운로드
          </button>
          <button class="ui-btn ui-btn--ghost" type="button" @click="resetUploadState">
            업로드 초기화
          </button>
          <button class="ui-btn ui-btn--primary" type="button" :disabled="isSubmittingBulk" @click="handleBulkSubmit">
            {{ isSubmittingBulk ? '저장 중...' : '업로드 주문 저장' }}
          </button>
        </div>
        <div v-else-if="activeRegisterMode === 'bulk' && activeBulkTab === 'shopify'" class="toolbar-actions">
          <button class="ui-btn ui-btn--ghost" type="button" :disabled="isCheckingChannel" @click="handleChannelConnectionCheck">
            {{ isCheckingChannel ? '확인 중...' : '연결 확인' }}
          </button>
          <button class="ui-btn ui-btn--primary" type="button" :disabled="isImportPreviewLoading" @click="handleChannelImportPreview">
            {{ isImportPreviewLoading ? '조회 중...' : '주문 가져오기 준비' }}
          </button>
        </div>
      </div>

      <p v-if="optionsErrorMessage" class="feedback feedback--error">{{ optionsErrorMessage }}</p>

      <section v-if="activeRegisterMode === 'manual'" class="manual-register-layout">
        <div
          v-if="isLiveSummaryVisible || isChecklistVisible"
          class="manual-info-grid"
          :class="{ 'manual-info-grid--single': !(isLiveSummaryVisible && isChecklistVisible) }"
        >
          <article v-if="isLiveSummaryVisible" class="surface-card info-card">
            <div class="info-card-head">
              <div>
                <p class="section-eyebrow">Live Summary</p>
                <h3 class="section-title">등록 요약</h3>
              </div>
              <button
                type="button"
                class="panel-close"
                aria-label="등록 요약 닫기"
                @click="handleDismissInfoCard('summary')"
              >
                x
              </button>
            </div>

            <dl class="summary-list">
              <div class="summary-row">
                <dt>주문번호</dt>
                <dd>{{ currentOrderNoPreview }}</dd>
              </div>
              <div class="summary-row">
                <dt>판매 채널</dt>
                <dd>{{ manualForm.salesChannel }}</dd>
              </div>
              <div class="summary-row">
                <dt>수령인</dt>
                <dd>{{ manualForm.recipient || '-' }}</dd>
              </div>
              <div class="summary-row">
                <dt>총 SKU</dt>
                <dd>{{ manualProductTotals.totalSku }}개</dd>
              </div>
              <div class="summary-row">
                <dt>총 수량</dt>
                <dd>{{ manualProductTotals.totalQuantity }}개</dd>
              </div>
            </dl>
          </article>

          <article v-if="isChecklistVisible" class="surface-card info-card">
            <div class="info-card-head">
              <div>
                <p class="section-eyebrow">Checklist</p>
                <h3 class="section-title">입력 체크포인트</h3>
              </div>
              <button
                type="button"
                class="panel-close"
                aria-label="입력 체크포인트 닫기"
                @click="handleDismissInfoCard('checklist')"
              >
                x
              </button>
            </div>

            <ul class="check-list">
              <li>주문번호 자동생성 사용 시 주문일자를 먼저 선택합니다.</li>
              <li>배송지는 State / City / Zip Code 를 각각 나눠 입력합니다.</li>
              <li>SKU는 셀러 공통 재고 코드 기준으로 선택합니다.</li>
              <li>가용재고를 초과한 수량은 저장 전 다시 확인합니다.</li>
            </ul>
          </article>
        </div>

        <div class="manual-main-grid">
          <div class="manual-left-stack">
            <article ref="manualCombinedCardRef" class="surface-card manual-combined-card">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Manual Entry</p>
                  <h3 class="section-title">주문 정보</h3>
                </div>
                <span class="section-caption">기본 주문 메타</span>
              </div>

              <div class="form-grid">
                <BaseForm
                  class="form-span-2"
                  label="주문번호"
                  :error="formErrors.orderNo"
                  hint="직접 입력하거나 자동생성을 선택할 수 있습니다."
                >
                  <div class="order-no-stack">
                    <input
                      v-model="manualForm.orderNo"
                      type="text"
                      placeholder="ORD-20260321-001"
                      :disabled="manualForm.autoGenerateOrderNo"
                    />
                    <label class="toggle-check">
                      <input v-model="manualForm.autoGenerateOrderNo" type="checkbox" />
                      <span>주문번호 자동생성</span>
                      <strong>{{ currentOrderNoPreview }}</strong>
                    </label>
                  </div>
                </BaseForm>

                <BaseForm label="주문일자" required :error="formErrors.orderDate">
                  <input v-model="manualForm.orderDate" type="date" />
                </BaseForm>

                <BaseForm label="판매 채널" required>
                  <select v-model="manualForm.salesChannel">
                    <option v-for="channel in salesChannelOptions" :key="channel.value" :value="channel.value">
                      {{ channel.label }}
                    </option>
                  </select>
                </BaseForm>
              </div>

              <div class="manual-section-divider" />

              <div class="section-head section-head--subsection">
                <div>
                  <p class="section-eyebrow">Order Items</p>
                  <h3 class="section-title">주문 상품</h3>
                </div>
                <button class="ui-btn ui-btn--ghost" type="button" @click="handleAddProductLine">
                  상품 추가
                </button>
              </div>

              <p class="product-description">
                SKU 선택 시 상품명, 가용재고, 단가가 자동으로 채워지고 수량에 따라 소계가 계산됩니다.
              </p>

              <p v-if="formErrors.items" class="form-inline-error">{{ formErrors.items }}</p>

              <div class="product-table-wrap">
                <table class="product-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>SKU 선택</th>
                      <th>가용재고</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>소계</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, index) in manualForm.items" :key="line.id">
                      <td>{{ index + 1 }}</td>
                      <td>
                        <select v-model="line.sku" @change="handleProductSkuChange">
                          <option value="">SKU 선택</option>
                          <option
                            v-for="product in productOptions"
                            :key="product.sku"
                            :value="product.sku"
                          >
                            {{ product.sku }}
                          </option>
                        </select>
                        <p class="cell-caption">
                          {{ getProductLineSummary(line).productName || '상품 선택 후 자동 표시' }}
                        </p>
                      </td>
                      <td>
                        <span
                          class="stock-chip"
                          :class="{
                            'stock-chip--warning': getProductLineSummary(line).isLowStock,
                          }"
                        >
                          {{ getProductLineSummary(line).availableStock }}개
                        </span>
                      </td>
                      <td>
                        <input
                          v-model="line.quantity"
                          type="number"
                          min="1"
                          step="1"
                          @blur="handleProductQuantityBlur(line)"
                        />
                        <p v-if="isQuantityOverflow(line)" class="cell-warning">
                          가용재고보다 큰 수량입니다.
                        </p>
                      </td>
                      <td>{{ formatCurrency(getProductLineSummary(line).unitPrice) }}</td>
                      <td>{{ formatCurrency(getProductLineSummary(line).subtotal) }}</td>
                      <td>
                        <button class="text-button" type="button" @click="handleRemoveProductLine(line.id)">
                          삭제
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="product-errors">
                <p v-if="formErrors.sku" class="form-inline-error">{{ formErrors.sku }}</p>
                <p v-if="formErrors.quantity" class="form-inline-error">{{ formErrors.quantity }}</p>
              </div>

              <div class="summary-metrics">
                <div class="metric-card">
                  <span class="metric-label">SKU 수</span>
                  <strong class="metric-value">{{ manualProductTotals.totalSku }}개</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">총 수량</span>
                  <strong class="metric-value">{{ manualProductTotals.totalQuantity }}개</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">예상 금액</span>
                  <strong class="metric-value">{{ formatCurrency(manualProductTotals.totalAmount) }}</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">재고주의 SKU</span>
                  <strong class="metric-value">{{ manualProductTotals.lowStockCount }}개</strong>
                </div>
              </div>
            </article>

            <p v-if="submitErrorMessage" class="feedback feedback--error">{{ submitErrorMessage }}</p>
          </div>

          <aside class="manual-right-stack">
            <article class="surface-card recipient-card" :style="recipientCardStyle">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Recipient</p>
                  <h3 class="section-title">수령자 정보</h3>
                </div>
                <span class="section-caption">배송지 분리 입력</span>
              </div>

              <div class="form-grid">
                <BaseForm label="수령인" required :error="formErrors.recipient">
                  <input v-model="manualForm.recipient" type="text" placeholder="수령인 이름" />
                </BaseForm>

                <BaseForm label="연락처" required :error="formErrors.contact">
                  <input v-model="manualForm.contact" type="text" placeholder="010-0000-0000" />
                </BaseForm>

                <BaseForm label="State" required :error="formErrors.state">
                  <input v-model="manualForm.state" type="text" placeholder="California" />
                </BaseForm>

                <BaseForm label="City" required :error="formErrors.city">
                  <input v-model="manualForm.city" type="text" placeholder="Los Angeles" />
                </BaseForm>

                <BaseForm label="Zip Code" required :error="formErrors.zipCode">
                  <input v-model="manualForm.zipCode" type="text" placeholder="90001" />
                </BaseForm>

                <div class="form-grid-spacer" />

                <BaseForm class="form-span-2" label="기본 배송지" required :error="formErrors.address1">
                  <input v-model="manualForm.address1" type="text" placeholder="도로명 주소를 입력하세요" />
                </BaseForm>

                <BaseForm class="form-span-2" label="상세 배송지">
                  <input v-model="manualForm.address2" type="text" placeholder="상세 주소를 입력하세요" />
                </BaseForm>

                <BaseForm class="form-span-2" label="배송 요청사항">
                  <textarea
                    v-model="manualForm.memo"
                    rows="4"
                    placeholder="공동현관 비밀번호, 부재 시 요청사항 등을 입력하세요"
                  />
                </BaseForm>
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section v-else class="bulk-register-layout">
        <article v-if="!activeBulkTab" class="surface-card bulk-register-placeholder">
          <div>
            <p class="section-eyebrow">Bulk Order Register</p>
            <h3 class="section-title">일괄 주문 등록 방식을 선택하세요</h3>
          </div>
          <p class="preview-description">
                  상단 `일괄 주문 등록` 버튼 오른쪽에서 `엑셀 업로드` 또는 `Shopify 연동`을 선택하면 해당 화면으로 이동합니다.
          </p>
        </article>

        <div v-else-if="activeBulkTab === 'excel'" class="content-stack">
          <article v-if="isUploadGuideVisible" class="surface-card">
            <div class="section-head">
              <div>
                <p class="section-eyebrow">Bulk Upload</p>
                <h3 class="section-title">엑셀 업로드 가이드</h3>
              </div>
              <button
                type="button"
                class="panel-close"
                aria-label="엑셀 업로드 가이드 닫기"
                @click="isUploadGuideVisible = false"
              >
                x
              </button>
            </div>

            <div class="guide-grid">
              <div class="guide-panel">
                <p class="guide-title">필수 컬럼</p>
                <p class="guide-copy">{{ ORDER_UPLOAD_REQUIRED_COLUMNS.join(', ') }}</p>
              </div>
              <div class="guide-panel">
                <p class="guide-title">업로드 순서</p>
                <ol class="guide-steps">
                  <li>템플릿 다운로드 후 주문 데이터를 입력합니다.</li>
                  <li>드래그 업로드 또는 파일 선택으로 미리보기를 확인합니다.</li>
                  <li>미리보기와 요약 모달 검토 후 일괄 저장합니다.</li>
                </ol>
              </div>
            </div>
          </article>

          <article class="surface-card excel-upload-shell">
            <div class="excel-upload-grid">
              <section class="excel-upload-panel">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Upload Zone</p>
                  <h3 class="section-title">엑셀 파일 업로드</h3>
                </div>
                <span class="section-caption">`.xlsx`, `.xls`</span>
              </div>

              <FileUpload @file-selected="handleFileSelected" />

              <div class="selected-file">
                <span class="selected-file__label">선택 파일</span>
                <strong class="selected-file__value">
                  {{ selectedFileName || '아직 선택된 파일이 없습니다.' }}
                </strong>
              </div>

              <p v-if="uploadErrorMessage" class="feedback feedback--error">{{ uploadErrorMessage }}</p>

              <p v-if="bulkSubmitErrorMessage" class="feedback feedback--error">{{ bulkSubmitErrorMessage }}</p>
              </section>

              <section class="excel-upload-panel excel-upload-panel--summary">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Upload Summary</p>
                  <h3 class="section-title">등록 요약</h3>
                </div>
                <span class="section-caption">{{ isPreviewSample ? '대기 중' : '업로드 반영됨' }}</span>
              </div>

              <div v-if="uploadSummaryCards.length" class="summary-metrics summary-metrics--compact">
                <div v-for="card in uploadSummaryCards" :key="card.label" class="metric-card">
                  <span class="metric-label">{{ card.label }}</span>
                  <strong class="metric-value">{{ card.value }}</strong>
                </div>
              </div>
              <div v-else class="summary-metrics summary-metrics--compact">
                <div class="metric-card">
                  <span class="metric-label">업로드 건수</span>
                  <strong class="metric-value">0건</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">총 수량</span>
                  <strong class="metric-value">0개</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">SKU 수</span>
                  <strong class="metric-value">0개</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-label">수령인 수</span>
                  <strong class="metric-value">0명</strong>
                </div>
              </div>

              <dl class="summary-list summary-list--upload">
                <div class="summary-row">
                  <dt>선택 파일</dt>
                  <dd>{{ selectedFileName || '-' }}</dd>
                </div>
                <div class="summary-row">
                  <dt>첫 주문번호</dt>
                  <dd>{{ uploadResultSummary?.firstOrderNo ?? '-' }}</dd>
                </div>
                <div class="summary-row">
                  <dt>미리보기 상태</dt>
                  <dd>{{ isPreviewSample ? '업로드 대기' : '실데이터 미리보기' }}</dd>
                </div>
              </dl>
              </section>
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <p class="section-eyebrow">Preview Format</p>
                <h3 class="section-title">업로드 미리보기</h3>
              </div>
              <span class="section-caption">{{ isPreviewSample ? '업로드 대기' : `업로드 ${previewRows.length}건` }}</span>
            </div>

            <p class="preview-description">
              {{ isPreviewSample
                ? '업로드 전에는 테이블이 비어 있으며, 파일 선택 후 실데이터만 미리보기합니다.'
                : '현재 표에는 업로드한 파일 데이터를 그대로 표시하고 있습니다.' }}
            </p>

            <BaseTable :columns="ORDER_PREVIEW_COLUMNS" :rows="previewRows" row-key="id" />
          </article>
        </div>
        <div v-else class="content-stack">
          <article v-if="isChannelNotesVisible" class="surface-card side-card">
            <div class="section-head section-head--compact">
              <div>
                <p class="section-eyebrow">Shopify Notes</p>
                <h3 class="section-title">다음 연결 단계</h3>
              </div>
              <button
                type="button"
                class="panel-close"
                aria-label="다음 연결 단계 닫기"
                @click="isChannelNotesVisible = false"
              >
                x
              </button>
            </div>

            <ul class="check-list">
              <li>스토어 별칭과 운영 이메일을 먼저 정리합니다.</li>
              <li>조회 기간을 고른 뒤 미등록 주문만 가져오도록 확인합니다.</li>
              <li>연결 확인 후 API 미리보기 결과를 검토하고 주문 가져오기를 진행합니다.</li>
            </ul>
          </article>

          <div class="channel-main-grid">
            <article class="surface-card">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Shopify Sync</p>
                  <h3 class="section-title">Shopify 연동 상태</h3>
                </div>
                <span :class="channelStatusClassName">{{ channelStatusLabel }}</span>
              </div>

              <div class="channel-status-grid">
                <div class="metric-card metric-card--dense">
                  <span class="metric-label">마켓플레이스</span>
                  <strong class="metric-value">{{ channelSettings.marketplace || PRIMARY_CHANNEL_LABEL }}</strong>
                </div>
                <div class="metric-card metric-card--dense">
                  <span class="metric-label">최근 동기화</span>
                  <strong class="metric-value">{{ channelConnection.lastSyncedAt }}</strong>
                </div>
                <div class="metric-card metric-card--dense">
                  <span class="metric-label">가져올 미등록 주문</span>
                  <strong class="metric-value">{{ channelConnection.pendingOrders }}건</strong>
                </div>
              </div>

              <p v-if="channelFeedbackMessage" :class="channelFeedbackClassName">{{ channelFeedbackMessage }}</p>
            </article>

            <article class="surface-card">
              <div class="section-head">
                <div>
                  <p class="section-eyebrow">Shopify Settings</p>
                  <h3 class="section-title">연동 설정</h3>
                </div>
                <span class="section-caption">API 연동</span>
              </div>

              <div class="form-grid">
                <BaseForm label="스토어 별칭" required>
                  <input v-model="channelSettings.storeAlias" type="text" placeholder="스토어 별칭" />
                </BaseForm>

                <BaseForm label="운영 이메일" required>
                  <input v-model="channelSettings.contactEmail" type="email" placeholder="seller-ops@example.com" />
                </BaseForm>

                <BaseForm label="마켓플레이스" required>
                  <input v-model="channelSettings.marketplace" type="text" placeholder="Shopify" />
                </BaseForm>

                <BaseForm label="조회 기간" required>
                  <select v-model="channelSettings.syncWindow">
                    <option value="">조회 기간 선택</option>
                    <option v-for="window in CHANNEL_SYNC_WINDOW_OPTIONS" :key="window" :value="window">
                      {{ window }}
                    </option>
                  </select>
                </BaseForm>

                <BaseForm label="가져오기 대상">
                  <input type="text" value="주문 등록 안 한 주문만" readonly />
                </BaseForm>

                <BaseForm class="form-span-2" label="자동 주문 가져오기">
                  <label class="toggle-check toggle-check--block">
                    <input v-model="channelSettings.autoImport" type="checkbox" />
                    <span>연결 확인 후 미등록 주문만 자동으로 가져옵니다.</span>
                  </label>
                </BaseForm>
              </div>
            </article>
          </div>
        </div>
      </section>
    </section>

    <SellerExcelUploadResultModal
      :isOpen="isUploadResultModalOpen"
      :summary="uploadResultSummary"
      @cancel="handleCloseUploadResultModal"
    />
  </AppLayout>
</template>

<style scoped>
.order-register-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.surface-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.section-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue);
}

.product-description,
.preview-description {
  margin-top: var(--space-3);
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--t3);
}

.register-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.register-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.register-tab-stack {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.register-tab-stack--bulk {
  position: relative;
  flex-wrap: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-left: auto;
}

.register-tab {
  min-width: 124px;
  padding: 11px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t3);
  transition:
    border-color var(--ease-fast),
    background-color var(--ease-fast),
    color var(--ease-fast);
}

.register-tab:hover {
  border-color: rgba(76, 116, 255, 0.3);
  color: var(--t1);
}

.register-tab--active {
  border-color: rgba(76, 116, 255, 0.24);
  background: var(--blue-pale);
  color: var(--blue);
}

.register-tab--open {
  border-color: rgba(76, 116, 255, 0.18);
  background: rgba(76, 116, 255, 0.08);
  color: var(--t1);
}

.bulk-register-menu {
  display: inline-flex;
  position: absolute;
  top: 50%;
  left: calc(100% + var(--space-2));
  transform: translate(0, -50%);
  align-items: center;
  gap: var(--space-2);
  max-width: 360px;
  padding: 0;
  white-space: nowrap;
  z-index: 20;
}

.bulk-register-menu__button {
  min-width: 124px;
  padding: 11px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t3);
  text-align: center;
  transition:
    border-color var(--ease-fast),
    background-color var(--ease-fast),
    color var(--ease-fast);
}

.bulk-register-menu__button:hover {
  border-color: rgba(76, 116, 255, 0.3);
  color: var(--t1);
}

.bulk-register-menu__button--active {
  border-color: rgba(76, 116, 255, 0.24);
  background: var(--blue-pale);
  color: var(--blue);
}

.bulk-slide-enter-active,
.bulk-slide-leave-active {
  transition:
    opacity var(--ease-fast),
    transform var(--ease-fast),
    max-width var(--ease-fast),
    margin-left var(--ease-fast),
    padding var(--ease-fast);
}

.bulk-slide-enter-from,
.bulk-slide-leave-to {
  opacity: 0;
  transform: translate(-10px, -50%);
  max-width: 0;
  padding-left: 0;
  padding-right: 0;
}

.bulk-slide-enter-to,
.bulk-slide-leave-from {
  opacity: 1;
  transform: translate(0, -50%);
}

.register-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.8fr);
  gap: var(--space-5);
}

.register-layout--single {
  grid-template-columns: minmax(0, 1fr);
}

.bulk-register-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.bulk-register-placeholder {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.manual-register-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.manual-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: var(--space-5);
  align-items: start;
}

.manual-left-stack,
.manual-right-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.manual-combined-card {
  display: flex;
  flex-direction: column;
}

.manual-right-stack {
  min-height: 0;
  align-self: start;
}

.manual-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.manual-info-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.channel-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: var(--space-5);
  align-items: stretch;
}

.content-stack,
.side-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.info-card {
  min-height: 100%;
}

.recipient-card {
  display: flex;
  flex-direction: column;
  height: auto;
}

.info-card-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.panel-close {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface-2);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t3);
  line-height: 1;
}

.panel-close:hover {
  border-color: rgba(76, 116, 255, 0.22);
  color: var(--blue);
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-head--compact {
  margin-bottom: var(--space-4);
}

.section-head--subsection {
  margin-top: var(--space-1);
}

.section-title {
  margin-top: 4px;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--t1);
}

.section-caption {
  font-size: var(--font-size-sm);
  color: var(--t3);
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.form-grid textarea {
  resize: none;
}

.form-span-2 {
  grid-column: span 2;
}

.form-grid-spacer {
  display: none;
}

.order-no-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toggle-check {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-sm);
  color: var(--t2);
}

.toggle-check input {
  width: 16px;
  height: 16px;
}

.toggle-check strong {
  color: var(--blue);
}

.toggle-check--block {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.manual-section-divider {
  margin: var(--space-6) 0;
  border-top: 1px solid var(--border);
}

.excel-upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.product-table-wrap {
  overflow-x: auto;
  margin-top: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.product-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.product-table thead tr {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.product-table th,
.product-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.product-table th {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--t3);
}

.product-table tbody tr:last-child td {
  border-bottom: none;
}

.product-table td select,
.product-table td input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.cell-caption,
.cell-warning {
  margin-top: 8px;
  font-size: var(--font-size-xs);
}

.cell-caption {
  color: var(--t4);
}

.cell-warning {
  color: var(--red);
}

.stock-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  background: rgba(76, 116, 255, 0.08);
  color: var(--blue);
  font-weight: 700;
}

.stock-chip--warning {
  background: rgba(245, 166, 35, 0.16);
  color: #9a5600;
}

.text-button {
  padding: 0;
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--t3);
}

.text-button:hover {
  color: var(--red);
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(244, 246, 250, 0.7), rgba(255, 255, 255, 0.95));
}

.metric-card--dense {
  min-height: 120px;
}

.metric-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--t4);
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--t1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.form-actions--start {
  justify-content: flex-start;
}

.feedback {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.feedback--success {
  border: 1px solid rgba(46, 204, 135, 0.24);
  background: rgba(46, 204, 135, 0.08);
  color: #0f6b4b;
}

.feedback--error {
  border: 1px solid rgba(209, 67, 67, 0.24);
  background: rgba(209, 67, 67, 0.08);
  color: #a12e2e;
}

.form-inline-error {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--red);
}

.product-errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: var(--font-size-sm);
}

.summary-row dt {
  color: var(--t4);
}

.summary-row dd {
  font-weight: 600;
  color: var(--t1);
  text-align: right;
}

.summary-list--upload {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 18px;
  color: var(--t2);
  line-height: 1.6;
}

.guide-grid,
.channel-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.excel-upload-shell {
  padding: var(--space-6);
}

.excel-upload-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: var(--space-5);
}

.excel-upload-panel {
  min-width: 0;
}

.excel-upload-panel--summary {
  order: -1;
  padding-right: var(--space-5);
  border-right: 1px solid var(--border);
}

.guide-panel {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.guide-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--t1);
}

.guide-copy,
.guide-steps {
  margin-top: var(--space-3);
  color: var(--t2);
  line-height: 1.6;
}

.guide-steps {
  padding-left: 18px;
}

.selected-file {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.selected-file__label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--t4);
}

.selected-file__value {
  color: var(--t2);
  word-break: break-all;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status-pill--success {
  background: rgba(46, 204, 135, 0.16);
  color: #0f6b4b;
}

.status-pill--muted {
  background: rgba(132, 145, 166, 0.16);
  color: var(--t3);
}

@media (max-width: 1280px) {
  .register-layout {
    grid-template-columns: 1fr;
  }

  .manual-main-grid,
  .channel-main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .guide-grid,
  .channel-status-grid,
  .manual-info-grid,
  .summary-metrics,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .excel-upload-grid {
    grid-template-columns: 1fr;
  }

  .excel-upload-panel--summary {
    padding-top: var(--space-5);
    padding-right: 0;
    border-top: 1px solid var(--border);
    border-right: none;
  }

  .register-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: flex-start;
    margin-left: 0;
  }

  .register-tab-stack--bulk {
    width: auto;
  }

  .bulk-register-menu {
    top: calc(100% + var(--space-2));
    left: 0;
    width: max-content;
    max-width: none;
    transform: translate(0, 0);
  }

  .bulk-register-menu__button {
    flex: 1 1 0;
    min-width: 0;
  }

  .bulk-slide-enter-from,
  .bulk-slide-leave-to {
    transform: translateY(-8px);
  }

  .bulk-slide-enter-to,
  .bulk-slide-leave-from {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .form-span-2 {
    grid-column: span 1;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
