<script setup>
/**
 * AsnList -- 총괄관리자 ASN(입고 예정 통보서) 목록 페이지
 *
 * 레이아웃:
 *   상태 필터 탭 + 검색 + 창고/셀러사 셀렉트
 *   BaseTable (서버 사이드 필터링 + 페이지네이션)
 *
 * 데이터 흐름:
 *   onMounted -> getAsnList(params) -> items/meta
 *   탭/검색/셀렉트/페이지 변경 -> 서버 재조회 -> BaseTable
 */
 import { ref, computed, onMounted, onUnmounted } from 'vue'
 import { getAsnList } from '@/api/wms'
 import { ASN_STATUS } from '@/constants'
 import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AsnDetailModal from '@/components/masterAdmin/AsnDetailModal.vue'
import MasterListToolbar from '@/components/masterAdmin/MasterListToolbar.vue'
import MasterStatusTabs from '@/components/masterAdmin/MasterStatusTabs.vue'

// -- 브레드크럼 ---------------------------------------------------------------
const breadcrumb = [{ label: '입출고' }, { label: 'ASN 목록' }]

// -- BaseTable 컬럼 정의 ------------------------------------------------------
const COLUMNS = [
  { key: 'id',             label: 'ASN 번호',   width: '185px' },
  { key: 'company',        label: '셀러사',    width: '130px' },
  { key: 'warehouse',      label: '창고',      width: '210px' },
  { key: 'skuCount',       label: 'SKU 수',    width: '80px', align: 'center' },
  { key: 'plannedQty',     label: '예정 수량', width: '100px', align: 'right' },
  { key: 'expectedDate',   label: '예정 입고일', width: '120px' },
  { key: 'registeredDate', label: '등록일',    width: '110px' },
  { key: 'status',         label: '상태',      width: '120px' },
]

// -- 상태 탭 정의 -------------------------------------------------------------
const TABS = [
  { key: 'ALL',                label: '전체', color: null },
  { key: ASN_STATUS.SUBMITTED, label: '제출됨', color: { bg: 'var(--blue-pale)', border: 'var(--blue)', text: 'var(--blue)' } },
  { key: ASN_STATUS.RECEIVED,  label: '입고완료', color: { bg: 'var(--green-pale)', border: 'var(--green)', text: 'var(--green)' } },
  { key: ASN_STATUS.CANCELLED, label: '취소', color: { bg: 'var(--red-pale)', border: 'var(--red)', text: 'var(--red)' } },
 ]
 
 // -- 상태 --------------------------------------------------------------------
 const asnItems = ref([])
 const filteredTotal = ref(0)
 const tabCounts = ref({ ALL: 0, SUBMITTED: 0, RECEIVED: 0, CANCELLED: 0 })
 const warehouseOptions = ref([])
 const companyOptions = ref([])
 const isLoading = ref(false)
 const activeTab = ref('ALL')
 const searchQ = ref('')
 const filterWh = ref('')
 const filterCo = ref('')
 const page = ref(1)
 const PAGE_SIZE = 10
 let searchDebounceTimer = null
 
 // -- 동적 셀렉트 옵션 ---------------------------------------------------------
 const toolbarFilters = computed(() => [
  { key: 'warehouse', value: filterWh.value, placeholder: '전체 창고', options: warehouseOptions.value },
  { key: 'company', value: filterCo.value, placeholder: '셀러사 전체', options: companyOptions.value },
 ])
 
 // -- 탭 카운트 ----------------------------------------------------------------
 const pagination = computed(() => ({
  page: page.value,
  pageSize: PAGE_SIZE,
   total: filteredTotal.value,
 }))
 
 // -- 데이터 로드 ---------------------------------------------------------------
 async function fetchAll() {
  isLoading.value = true
  try {
     const params = {
       page: page.value,
       size: PAGE_SIZE,
     }
 
     if (activeTab.value !== 'ALL') params.status = activeTab.value
     if (filterWh.value) params.warehouseId = filterWh.value
     if (filterCo.value) params.company = filterCo.value
     if (searchQ.value.trim()) params.search = searchQ.value.trim()
 
     const res = await getAsnList(params)
     const payload = res.data?.data ?? {}
 
     asnItems.value = Array.isArray(payload.items) ? payload.items : []
     filteredTotal.value = Number(payload.total ?? 0)
     tabCounts.value = {
       ALL: Number(payload.counts?.ALL ?? 0),
       SUBMITTED: Number(payload.counts?.SUBMITTED ?? 0),
       RECEIVED: Number(payload.counts?.RECEIVED ?? 0),
       CANCELLED: Number(payload.counts?.CANCELLED ?? 0),
     }
     warehouseOptions.value = Array.isArray(payload.warehouseOptions) ? payload.warehouseOptions : []
     companyOptions.value = Array.isArray(payload.companyOptions) ? payload.companyOptions : []
   } catch (error) {
     console.error('[AsnList] fetch error:', error)
     asnItems.value = []
     filteredTotal.value = 0
   } finally {
     isLoading.value = false
   }
 }
 
 onMounted(fetchAll)
 onUnmounted(() => {
   clearTimeout(searchDebounceTimer)
 })

// -- ASN 상세 모달 -------------------------------------------------------------
const showAsnDetail = ref(false)
const selectedAsnId = ref('')

function openAsnDetail(row) {
  selectedAsnId.value = row.id
  showAsnDetail.value = true
}

function closeAsnDetail() {
  showAsnDetail.value = false
}

 function handleToolbarFilter({ key, value }) {
   if (key === 'warehouse') filterWh.value = value
   if (key === 'company') filterCo.value = value
   page.value = 1
   fetchAll()
 }
 
 function handleTabChange(nextTab) {
   activeTab.value = nextTab
   page.value = 1
   fetchAll()
 }
 
 function handleSearchChange(value) {
   searchQ.value = value
   page.value = 1
   clearTimeout(searchDebounceTimer)
   searchDebounceTimer = setTimeout(() => {
     fetchAll()
   }, 300)
 }
 
 function handlePageChange(nextPage) {
   page.value = nextPage
   fetchAll()
 }

// -- 유틸 ---------------------------------------------------------------------
/** 예정 입고일이 오늘(2026-03-18) 이후면 true -> 골드 강조 */
function isUpcoming(date) {
  return date >= '2026-03-18'
}
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb" title="ASN 목록" :loading="isLoading">
    <template #header-action>
      <button class="ui-btn ui-btn--ghost btn-refresh" @click="fetchAll">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M12.5 2.5A6 6 0 1 1 9 1.2" />
          <path d="M9 1v3h3" />
        </svg>
        새로고침
      </button>
    </template>

    <!-- -- 툴바 ------------------------------------------------------------- -->
    <div class="toolbar">
      <!-- 공통 상태 탭: ASN 탭 정의와 카운트만 주입한다. -->
       <MasterStatusTabs
         :tabs="TABS"
         :active-key="activeTab"
         :counts="tabCounts"
         @change="handleTabChange"
       />

      <!-- 공통 검색/셀렉트 툴바: 검색어와 필터 상태만 부모가 관리한다. -->
       <MasterListToolbar
         :search-value="searchQ"
         search-placeholder="ASN번호, 셀러사 검색"
         search-width="260px"
         :filters="toolbarFilters"
         @update:search-value="handleSearchChange"
         @update:filter="handleToolbarFilter"
       />
    </div>

    <!-- -- 데이터 테이블 ------------------------------------------------------ -->
     <BaseTable
       :columns="COLUMNS"
       :rows="asnItems"
       :loading="isLoading"
       :pagination="pagination"
       row-key="id"
       clickable
       @page-change="handlePageChange"
       @row-click="openAsnDetail"
     >
      <template #cell-id="{ value }">
        <span class="asn-num">{{ value }}</span>
      </template>

      <template #cell-skuCount="{ value }">
        <span class="cell-bold">{{ value }} SKU</span>
      </template>

      <template #cell-plannedQty="{ value }">
        <span class="cell-bold">{{ value.toLocaleString() }} EA</span>
      </template>

      <template #cell-expectedDate="{ value }">
        <span :class="isUpcoming(value) ? 'date-upcoming' : 'date-normal'">{{ value }}</span>
      </template>

      <template #cell-registeredDate="{ value }">
        <span class="date-normal">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :status="value" type="asn" />
      </template>
    </BaseTable>

    <AsnDetailModal
      :asn-id="selectedAsnId"
      :is-open="showAsnDetail"
      @close="closeAsnDetail"
    />
  </AppLayout>
</template>

<style scoped>
/* -- 툴바 ------------------------------------------------------------------- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

/* -- 헤더 액션 버튼 ---------------------------------------------------------- */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* -- 셀 커스텀 스타일 -------------------------------------------------------- */
.asn-num {
  font-family: 'IBM Plex Sans', monospace;
  font-weight: 500;
  font-size: 13px;
  color: var(--blue);
  white-space: nowrap;
}

.cell-bold {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  white-space: nowrap;
}

.date-upcoming {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--gold);
  font-weight: 600;
  white-space: nowrap;
}

.date-normal {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--t3);
  white-space: nowrap;
}

/* ASN 상세 모달 스타일은 AsnDetailModal.vue 컴포넌트로 이관했다. */
</style>
