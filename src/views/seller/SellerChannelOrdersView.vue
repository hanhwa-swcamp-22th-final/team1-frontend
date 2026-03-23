<script setup>
/**
 * 셀러 주문 연동 및 조회 화면.
 * mock-server seller 채널 연결 카드와 통합 주문 목록 API를 기준으로 화면을 구성한다.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getSellerChannelCards, getSellerChannelOrders } from '@/api/integration.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SellerChannelConnectModal from '@/components/seller/SellerChannelConnectModal.vue'
import { downloadExcel } from '@/utils/excel.js'
import {
  buildSellerConnectedChannelCard,
  buildSellerImportedChannelCard,
  buildSellerImportedChannelOrder,
  buildSellerChannelOrderExportRows,
  buildSellerSyncedChannelCard,
  filterSellerChannelOrderRows,
  getSellerChannelMeta,
  getSellerChannelOrderStatusMeta,
  getSellerChannelSyncStatusMeta,
  SELLER_CHANNEL_FILTER_OPTIONS,
  SELLER_CHANNEL_ORDER_COLUMNS,
} from '@/utils/seller/channelOrders.utils.js'

const breadcrumb = [{ label: 'Seller' }, { label: '주문 연동 및 조회' }]

// 채널 필터, 검색어, 툴바 안내 메시지를 페이지 로컬 상태로 관리한다.
const activeChannel = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')
const loadErrorMessage = ref('')
const isLoading = ref(false)
const channelCards = ref([])
const channelOrderRows = ref([])
const selectedChannelKey = ref('')
const isConnectModalOpen = ref(false)
const connectForm = reactive({
  storeAlias: '',
  contactEmail: '',
  syncMode: 'AUTO',
})

// 페이지네이션은 로컬 mock 기준으로 단순 처리한다.
const currentPage = ref(1)
const PAGE_SIZE = 6

watch([activeChannel, searchKeyword], () => {
  currentPage.value = 1
})

// 선택한 채널과 검색어를 기준으로 통합 주문 목록을 필터링한다.
const filteredRows = computed(() => {
  return filterSellerChannelOrderRows(channelOrderRows.value, {
    channel: activeChannel.value,
    search: searchKeyword.value,
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredRows.value.slice(start, start + PAGE_SIZE)
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: PAGE_SIZE,
  total: filteredRows.value.length,
}))

function handlePageChange(page) {
  currentPage.value = page
}

async function fetchSellerChannelData() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const [cardsRes, ordersRes] = await Promise.all([
      getSellerChannelCards(),
      getSellerChannelOrders(),
    ])

    channelCards.value = Array.isArray(cardsRes.data?.data)
      ? cardsRes.data.data.map((card) => ({
          ...card,
          actions: Array.isArray(card.actions) ? card.actions.map((action) => ({ ...action })) : [],
        }))
      : []

    channelOrderRows.value = Array.isArray(ordersRes.data?.data)
      ? ordersRes.data.data.map((row) => ({ ...row }))
      : []
  } catch (error) {
    console.error('[SellerChannelOrdersView] fetch error:', error)
    loadErrorMessage.value = '주문 연동 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    channelCards.value = []
    channelOrderRows.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSellerChannelData)

const selectedChannelCard = computed(() => {
  return channelCards.value.find((card) => card.key === selectedChannelKey.value) ?? null
})

function resetConnectForm() {
  connectForm.storeAlias = ''
  connectForm.contactEmail = ''
  connectForm.syncMode = 'AUTO'
}

function handleOpenConnectModal(card) {
  selectedChannelKey.value = card.key
  connectForm.storeAlias = `${card.label} KR Store`
  connectForm.contactEmail = ''
  connectForm.syncMode = 'AUTO'
  isConnectModalOpen.value = true
}

function handleCloseConnectModal() {
  isConnectModalOpen.value = false
  selectedChannelKey.value = ''
  resetConnectForm()
}

function handleConfirmChannelConnect() {
  if (!selectedChannelCard.value) return

  channelCards.value = channelCards.value.map((card) => {
    if (card.key !== selectedChannelCard.value.key) return card

    return buildSellerConnectedChannelCard(card, {
      storeAlias: connectForm.storeAlias,
      connectedAt: '2026-03-19 17:30',
    })
  })

  toolbarMessage.value = `${selectedChannelCard.value.label} 채널 연결을 완료했습니다.`
  handleCloseConnectModal()
}

function showToolbarMessage(message) {
  toolbarMessage.value = message
}

function buildTimestampLabel(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function handleSyncChannel(card) {
  const syncedAt = buildTimestampLabel()

  channelCards.value = channelCards.value.map((currentCard) => {
    if (currentCard.key !== card.key) return currentCard

    return buildSellerSyncedChannelCard(currentCard, { syncedAt })
  })

  showToolbarMessage(`${card.label} 채널 동기화를 완료했습니다.`)
}

function handleImportChannelOrders(card) {
  const importedAt = buildTimestampLabel()
  const nextSequence = channelOrderRows.value.filter((row) => row.channel === card.key).length + 1
  const nextOrder = buildSellerImportedChannelOrder(card, {
    sequence: nextSequence,
    importedAt,
  })

  channelOrderRows.value = [nextOrder, ...channelOrderRows.value]
  channelCards.value = channelCards.value.map((currentCard) => {
    if (currentCard.key !== card.key) return currentCard

    return buildSellerImportedChannelCard(currentCard, {
      importedAt,
      importedCount: 1,
    })
  })
  currentPage.value = 1
  showToolbarMessage(`${card.label} 주문 1건을 가져왔습니다.`)
}

function handleExportChannelOrders() {
  downloadExcel(
    buildSellerChannelOrderExportRows(filteredRows.value),
    `seller-channel-orders-${buildTimestampLabel().slice(0, 10)}`,
  )

  showToolbarMessage(`통합 주문 ${filteredRows.value.length}건을 내보냈습니다.`)
}

function handleCardAction(card, action) {
  if (action.key === 'connect') {
    handleOpenConnectModal(card)
    return
  }

  if (action.key === 'sync') {
    handleSyncChannel(card)
    return
  }

  if (action.key === 'import') {
    handleImportChannelOrders(card)
    return
  }
}
</script>

<template>
  <AppLayout title="주문 연동 및 조회" :breadcrumb="breadcrumb">
    <section class="seller-channel-orders-page">
      <div class="channel-grid">
        <article
          v-for="card in channelCards"
          :key="card.key"
          class="channel-card"
        >
          <div class="channel-card-head">
            <div>
              <p class="channel-label">{{ card.label }}</p>
              <strong class="channel-title">채널 연결 현황</strong>
            </div>

            <span
              class="sync-badge"
              :class="`sync-badge--${getSellerChannelSyncStatusMeta(card.syncStatus).tone}`"
            >
              {{ getSellerChannelSyncStatusMeta(card.syncStatus).label }}
            </span>
          </div>

          <p class="channel-description">{{ card.description }}</p>

          <div class="channel-kpi-grid">
            <div class="channel-kpi">
              <span class="channel-kpi-label">미처리 주문</span>
              <strong class="channel-kpi-value">{{ card.pendingOrders }}</strong>
            </div>

            <div class="channel-kpi">
              <span class="channel-kpi-label">오늘 신규</span>
              <strong class="channel-kpi-value">{{ card.todayImported }}</strong>
            </div>
          </div>

          <p class="channel-sync-text">마지막 동기화 {{ card.lastSyncedAt }}</p>

          <div class="channel-actions">
            <button
              v-for="action in card.actions"
              :key="action.key"
              type="button"
              class="channel-action-btn"
              :class="{
                'channel-action-btn--ghost': action.variant === 'ghost',
                'channel-action-btn--primary': action.variant === 'primary',
              }"
              :disabled="action.disabled"
              @click="handleCardAction(card, action)"
            >
              {{ action.label }}
            </button>
          </div>
        </article>
      </div>

      <section class="list-card">
        <div class="list-head">
          <div>
            <p class="section-eyebrow">Channel Order Monitor</p>
            <h2 class="section-title">채널 통합 주문 조회</h2>
          </div>

          <div class="toolbar-right">
            <label class="search-box">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="주문번호 / 수령자 검색"
              />
            </label>

            <button
              class="ui-btn ui-btn--ghost toolbar-btn"
              type="button"
              @click="handleExportChannelOrders"
            >
              내보내기
            </button>
          </div>
        </div>

        <div class="filter-row">
          <button
            v-for="option in SELLER_CHANNEL_FILTER_OPTIONS"
            :key="option.key"
            type="button"
            class="filter-badge"
            :class="{ 'filter-badge--active': activeChannel === option.key }"
            @click="activeChannel = option.key"
          >
            {{ option.label }}
          </button>
        </div>

        <p v-if="toolbarMessage" class="toolbar-message">{{ toolbarMessage }}</p>
        <p v-if="loadErrorMessage" class="toolbar-message toolbar-message--error">{{ loadErrorMessage }}</p>

        <BaseTable
          :columns="SELLER_CHANNEL_ORDER_COLUMNS"
          :rows="pagedRows"
          :pagination="pagination"
          :loading="isLoading"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-channel="{ value }">
            <span
              class="channel-badge"
              :class="`channel-badge--${getSellerChannelMeta(value).tone}`"
            >
              {{ getSellerChannelMeta(value).label }}
            </span>
          </template>

          <template #cell-channelOrderNo="{ value }">
            <span class="order-code">{{ value }}</span>
          </template>

          <template #cell-conkOrderNo="{ value }">
            <span class="order-code">{{ value }}</span>
          </template>

          <template #cell-orderAmount="{ value }">
            ${{ value.toFixed(2) }}
          </template>

          <template #cell-status="{ value }">
            <span
              class="order-status-badge"
              :class="`order-status-badge--${getSellerChannelOrderStatusMeta(value).tone}`"
            >
              {{ getSellerChannelOrderStatusMeta(value).label }}
            </span>
          </template>
        </BaseTable>
      </section>
    </section>

    <SellerChannelConnectModal
      :channelCard="selectedChannelCard"
      :form="connectForm"
      :isOpen="isConnectModalOpen"
      @cancel="handleCloseConnectModal"
      @confirm="handleConfirmChannelConnect"
    />
  </AppLayout>
</template>

<style scoped>
.seller-channel-orders-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.channel-card,
.list-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.channel-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.channel-card-head,
.list-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
}

.channel-label,
.section-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.channel-title,
.section-title {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.sync-badge,
.channel-badge,
.order-status-badge,
.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.sync-badge--gold,
.channel-badge--gold {
  background: var(--gold-pale);
  color: #b45309;
}

.sync-badge--green,
.order-status-badge--green {
  background: var(--green-pale);
  color: var(--green);
}

.sync-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

.channel-badge--blue,
.order-status-badge--blue {
  background: var(--blue-pale);
  color: var(--blue);
}

.channel-badge--red {
  background: var(--red-pale);
  color: var(--red);
}

.channel-badge--default {
  background: var(--surface-2);
  color: var(--t3);
}

.order-status-badge--amber {
  background: var(--amber-pale);
  color: #b45309;
}

.order-status-badge--purple {
  background: var(--purple-pale);
  color: var(--purple);
}

.channel-description,
.channel-sync-text {
  margin: 0;
  color: var(--t2);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.channel-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.channel-kpi {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.channel-kpi-label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.channel-kpi-value {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
}

.channel-actions,
.toolbar-right,
.filter-row {
  display: flex;
  gap: var(--space-2);
}

.channel-actions,
.filter-row {
  flex-wrap: wrap;
}

.toolbar-right {
  flex-wrap: nowrap;
  align-items: center;
  flex-shrink: 0;
}

.channel-action-btn {
  min-width: 108px;
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
}

.channel-action-btn--ghost {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--t2);
}

.channel-action-btn--primary {
  border: 1px solid var(--gold);
  background: var(--gold);
  color: var(--t1);
}

.list-head {
  margin-bottom: var(--space-4);
}

.search-box {
  display: flex;
  align-items: center;
  flex: 0 0 260px;
  width: 260px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--t1);
  font-size: var(--font-size-sm);
}

.toolbar-btn {
  flex-shrink: 0;
  min-width: 92px;
}

.filter-row {
  margin-bottom: var(--space-4);
}

.filter-badge {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--t3);
  cursor: pointer;
}

.filter-badge--active {
  border-color: var(--gold);
  background: var(--gold-pale);
  color: var(--t1);
}

.toolbar-message {
  margin: 0 0 var(--space-4);
  color: var(--blue);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.toolbar-message--error {
  color: var(--danger);
}

.order-code {
  color: var(--t1);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

@media (max-width: 1180px) {
  .channel-grid {
    grid-template-columns: 1fr;
  }

  .list-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
