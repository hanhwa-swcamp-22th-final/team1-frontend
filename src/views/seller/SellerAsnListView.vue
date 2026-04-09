<script setup>
/**
 * 셀러 ASN 목록 화면.
 * mock-server seller ASN 목록 API를 기준으로 KPI, 상태 필터, 검색, 테이블 UI를 구성한다.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { cancelSellerAsn, getAsnDetail, getAsnKpi, getSellerAsnList } from '@/api/wms.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SellerConfirmDialog from '@/components/seller/SellerConfirmDialog.vue'
import SellerAsnDetailModal from '@/components/seller/SellerAsnDetailModal.vue'
import { downloadExcel } from '@/utils/excel.js'
import { ASN_STATUS, ROUTE_NAMES } from '@/constants'
import {
  buildSellerAsnExportRows,
  normalizeSellerAsnDetail,
  SELLER_ASN_LIST_COLUMNS,
} from '@/utils/seller/asnList.utils.js'

/** Header 브레드크럼 표시용 */
const breadcrumb = [{ label: 'Seller' }, { label: 'ASN 목록' }]

// 목록 화면은 상태 탭과 검색어만으로 먼저 필터링한다.
const activeStatus = ref('all')
const searchKeyword = ref('')
const toolbarMessage = ref('')
const loadErrorMessage = ref('')
const isLoading = ref(false)
const asnRows = ref([])
const selectedAsnId = ref('')
const pendingCancelAsnId = ref('')
const isDetailModalOpen = ref(false)
const isCancelDialogOpen = ref(false)
const isCsvDialogOpen = ref(false)

const currentPage = ref(1)
const PAGE_SIZE = 6
const totalItems = ref(0)
const kpi = ref({ total: 0, submitted: 0, received: 0, cancelled: 0 })
const selectedAsnDetail = ref(null)

watch([activeStatus, searchKeyword], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  void fetchSellerAsns()
})

// 상태 탭은 KPI 수치를 함께 보여준다.
const statusTabs = computed(() => [
  { key: 'all', label: '전체', count: kpi.value.total ?? 0 },
  { key: ASN_STATUS.SUBMITTED, label: '제출됨', count: kpi.value.submitted ?? 0 },
  { key: ASN_STATUS.RECEIVED, label: '입고완료', count: kpi.value.received ?? 0 },
  { key: ASN_STATUS.CANCELLED, label: '취소', count: kpi.value.cancelled ?? 0 },
])

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: PAGE_SIZE,
  total: totalItems.value,
}))

function handlePageChange(page) {
  currentPage.value = page
}

function extractListPayload(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: currentPage.value,
    }
  }

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: Number(payload?.total ?? payload?.totalCount ?? 0),
    page: Number(payload?.page ?? currentPage.value),
  }
}

async function fetchSellerAsns() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const [listRes, kpiRes] = await Promise.all([
      getSellerAsnList({
        page: currentPage.value - 1,
        size: PAGE_SIZE,
        status: activeStatus.value === 'all' ? undefined : activeStatus.value,
        search: searchKeyword.value || undefined,
      }),
      getAsnKpi(),
    ])

    const listPayload = extractListPayload(listRes.data?.data)
    asnRows.value = listPayload.items.map((row) => ({ ...row }))
    totalItems.value = listPayload.total || listPayload.items.length

    const nextKpi = kpiRes.data?.data
    kpi.value = nextKpi && typeof nextKpi === 'object'
      ? {
          total: Number(nextKpi.total ?? 0),
          submitted: Number(nextKpi.submitted ?? 0),
          received: Number(nextKpi.received ?? 0),
          cancelled: Number(nextKpi.cancelled ?? 0),
        }
      : { total: 0, submitted: 0, received: 0, cancelled: 0 }
  } catch (error) {
    console.error('[SellerAsnListView] fetch error:', error)
    loadErrorMessage.value = 'ASN 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    asnRows.value = []
    totalItems.value = 0
    kpi.value = { total: 0, submitted: 0, received: 0, cancelled: 0 }
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSellerAsns)

watch(currentPage, () => {
  void fetchSellerAsns()
})

const selectedAsn = computed(() => {
  return asnRows.value.find((row) => row.id === selectedAsnId.value) ?? null
})

const pendingCancelAsn = computed(() => {
  return asnRows.value.find((row) => row.id === pendingCancelAsnId.value) ?? null
})

const csvDialogMessage = computed(() => {
  const count = asnRows.value.length
  return `${count}건 ASN 목록을 CSV로 내보내시겠습니까?`
})

async function handleOpenAsnDetail(row) {
  try {
    const response = await getAsnDetail(row.asnNo ?? row.id)
    selectedAsnDetail.value = normalizeSellerAsnDetail(response.data?.data ?? {}, row)
    selectedAsnId.value = row.id
    isDetailModalOpen.value = true
  } catch (error) {
    toolbarMessage.value = error.response?.data?.message ?? 'ASN 상세를 불러오지 못했습니다.'
  }
}

function handleCloseAsnDetail() {
  isDetailModalOpen.value = false
  selectedAsnId.value = ''
  selectedAsnDetail.value = null
}

function handleOpenCancelDialog(row) {
  pendingCancelAsnId.value = row.id
  isCancelDialogOpen.value = true
}

function handleCloseCancelDialog() {
  isCancelDialogOpen.value = false
  pendingCancelAsnId.value = ''
}

async function handleConfirmCancel() {
  if (!pendingCancelAsn.value) return

  try {
    await cancelSellerAsn(pendingCancelAsn.value.asnNo ?? pendingCancelAsn.value.id)
    toolbarMessage.value = `${pendingCancelAsn.value.asnNo} ASN을 취소 처리했습니다.`
    handleCloseCancelDialog()
    await fetchSellerAsns()
  } catch (error) {
    toolbarMessage.value = error.response?.data?.message ?? 'ASN 취소 처리에 실패했습니다.'
  }
}

function handleOpenCsvDialog() {
  isCsvDialogOpen.value = true
}

function handleCloseCsvDialog() {
  isCsvDialogOpen.value = false
}

function handleConfirmCsv() {
  downloadExcel(
    buildSellerAsnExportRows(asnRows.value),
    `seller-asn-list-${new Date().toISOString().slice(0, 10)}`,
  )
  toolbarMessage.value = `${asnRows.value.length}건 ASN 목록을 내보냈습니다.`
  handleCloseCsvDialog()
}
</script>

<template>
  <AppLayout title="ASN 목록" :breadcrumb="breadcrumb">
    <template #header-action>
      <RouterLink :to="{ name: ROUTE_NAMES.SELLER_ASN_CREATE }" class="ui-btn ui-btn--primary">
        ASN 등록
      </RouterLink>
    </template>

    <section class="seller-asn-list-page">
      <!-- 상단 KPI 카드로 현재 ASN 운영 상태를 먼저 보여준다. -->
      <div class="kpi-grid">
        <article class="kpi-card">
          <span class="kpi-label">전체 ASN</span>
          <strong class="kpi-value">{{ kpi.total }}</strong>
          <span class="kpi-sub">등록된 전체 통보서</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">제출됨</span>
          <strong class="kpi-value">{{ kpi.submitted }}</strong>
          <span class="kpi-sub">입고 예정 반영 대기</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">입고완료</span>
          <strong class="kpi-value">{{ kpi.received }}</strong>
          <span class="kpi-sub">검수 완료 기준</span>
        </article>

        <article class="kpi-card">
          <span class="kpi-label">취소</span>
          <strong class="kpi-value">{{ kpi.cancelled }}</strong>
          <span class="kpi-sub">운영 메모 확인 필요</span>
        </article>
      </div>

      <section class="list-card">
        <div class="list-head">
          <div>
            <p class="section-eyebrow">Seller ASN Monitor</p>
            <h2 class="section-title">등록한 ASN을 상태별로 확인합니다.</h2>
          </div>

          <div class="list-tools">
            <label class="search-field">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="ASN 번호, 창고, 참조 번호, 메모"
              />
            </label>

            <button
              class="ui-btn ui-btn--ghost toolbar-btn"
              type="button"
              @click="handleOpenCsvDialog"
            >
              CSV 내보내기
            </button>
          </div>
        </div>

        <!-- 상태 탭으로 제출됨/입고완료/취소 상태를 빠르게 전환한다. -->
        <div class="status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="status-tab"
            :class="{ 'status-tab--active': activeStatus === tab.key }"
            @click="activeStatus = tab.key"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>

        <p v-if="loadErrorMessage" class="toolbar-message toolbar-message--error">{{ loadErrorMessage }}</p>
        <p v-else-if="toolbarMessage" class="toolbar-message">{{ toolbarMessage }}</p>

        <BaseTable
          :columns="SELLER_ASN_LIST_COLUMNS"
          :loading="isLoading"
          :rows="asnRows"
          :pagination="pagination"
          row-key="id"
          @page-change="handlePageChange"
        >
          <template #cell-asnNo="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenAsnDetail(row)">
              <span class="asn-code">{{ value }}</span>
            </button>
          </template>

          <template #cell-warehouseName="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenAsnDetail(row)">
              {{ value }}
            </button>
          </template>

          <template #cell-skuCount="{ value }">
            {{ value }}종
          </template>

          <template #cell-totalQuantity="{ value }">
            {{ value.toLocaleString() }}
          </template>

          <template #cell-referenceNo="{ row, value }">
            <button class="cell-trigger cell-trigger--text" type="button" @click="handleOpenAsnDetail(row)">
              {{ value }}
            </button>
          </template>

          <template #cell-status="{ row, value }">
            <button class="cell-trigger" type="button" @click="handleOpenAsnDetail(row)">
              <StatusBadge :status="value" type="asn" />
            </button>
          </template>

          <template #cell-actions="{ row }">
            <div class="action-group">
              <button
                v-if="row.status === ASN_STATUS.SUBMITTED"
                class="action-btn action-btn--danger"
                type="button"
                @click="handleOpenCancelDialog(row)"
              >
                취소
              </button>
              <span v-else class="action-empty">—</span>
            </div>
          </template>
        </BaseTable>
      </section>
    </section>

    <SellerAsnDetailModal
      :asn="selectedAsn"
      :detail="selectedAsnDetail"
      :isOpen="isDetailModalOpen"
      @cancel="handleCloseAsnDetail"
    />

    <SellerConfirmDialog
      :isOpen="isCancelDialogOpen"
      :message="pendingCancelAsn ? `${pendingCancelAsn.asnNo} ASN을 취소하시겠습니까?` : 'ASN을 취소하시겠습니까?'"
      confirmLabel="취소 확정"
      title="ASN 취소"
      :danger="true"
      @cancel="handleCloseCancelDialog"
      @confirm="handleConfirmCancel"
    />

    <SellerConfirmDialog
      :isOpen="isCsvDialogOpen"
      :message="csvDialogMessage"
      confirmLabel="내보내기"
      title="CSV 내보내기"
      @cancel="handleCloseCsvDialog"
      @confirm="handleConfirmCsv"
    />
  </AppLayout>
</template>

<style scoped>
.seller-asn-list-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.kpi-card,
.list-card {
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.kpi-label {
  color: var(--t3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.kpi-value {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-2xl);
}

.kpi-sub {
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.list-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-end;
  margin-bottom: var(--space-5);
}

.section-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--blue);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  color: var(--t1);
  font-size: var(--font-size-xl);
}

.list-tools {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.search-field {
  display: flex;
  align-items: center;
  flex-direction: row;
  min-width: 0;
  flex: 0 1 420px;
}

.search-field input {
  width: min(100%, 320px);
  min-width: 240px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--t1);
  font-size: var(--font-size-md);
  outline: none;
  transition:
    border-color var(--ease-fast),
    box-shadow var(--ease-fast);
}

.search-field input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-pale);
}

.toolbar-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.status-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--t2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color var(--ease-fast),
    background var(--ease-fast),
    color var(--ease-fast);
}

.status-tab--active {
  border-color: var(--blue);
  background: var(--blue-pale);
  color: var(--blue);
}

.toolbar-message {
  margin: 0 0 var(--space-4);
  color: var(--t3);
  font-size: var(--font-size-sm);
}

.toolbar-message--error {
  color: var(--red);
}

.cell-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.cell-trigger--text:hover {
  color: var(--blue);
}

.asn-code {
  color: var(--t1);
  font-family: var(--font-condensed);
  font-size: var(--font-size-md);
  font-weight: 700;
}

.action-group {
  display: flex;
  justify-content: center;
}

.action-btn {
  min-height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
}

.action-btn--danger {
  border: 1px solid var(--red);
  background: var(--surface);
  color: var(--red);
}

.action-btn--danger:hover {
  background: var(--red-pale);
}

.action-empty {
  color: var(--t4);
  font-size: var(--font-size-sm);
}

@media (max-width: 1080px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-head {
    flex-direction: column;
    align-items: stretch;
  }

  .list-tools {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card,
  .list-card {
    padding: var(--space-5);
  }
}
</style>
