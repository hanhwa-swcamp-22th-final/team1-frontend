import instance from './instance.js'

/**
 * 대시보드용 ASN 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getAsnStats() {
  return instance.get('/wms/asn/stats')
}

/**
 * 대시보드용 재고 부족 통계 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getInventoryStats() {
  return instance.get('/wms/inventory/stats')
}

/**
 * 대시보드용 창고 운영 현황 조회
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseStatus() {
  return instance.get('/wms/warehouses/status')
}

/**
 * 창고 목록 페이지 — 상단 요약 카드 5개 데이터 조회
 * (등록 창고 수, 활성 창고 수, 총 재고, 금일 출고, 평균 로케이션 가동률)
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseListSummary() {
  return instance.get('/wms/warehouses/summary')
}

/**
 * 창고 목록 조회 — 카드 그리드 및 관리자 테이블 공용
 * (창고별 stats, locationUtil, manager 정보 포함)
 * @returns {Promise<AxiosResponse>}
 */
export async function getWarehouseList() {
  return instance.get('/wms/warehouses')
}

/**
 * 창고 상세 — 재고 현황 (SKU별 가용/할당/총합)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>}
 */
export function getWarehouseInventory(id) {
  return instance.get(`/wms/warehouses/${id}/inventory`)
}

/**
 * 창고 상세 — 출고 현황 (금일/주간/월간 3탭 데이터 포함)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: { today, week, month } }
 */
export function getWarehouseOutbound(id) {
  return instance.get(`/wms/warehouses/${id}/outbound`)
}

/**
 * 창고 상세 — 주문 처리 상세 (통계 + 목록)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: { stats, list } }
 */
export function getWarehouseOrders(id) {
  return instance.get(`/wms/warehouses/${id}/orders`)
}

/**
 * 창고 상세 — 로케이션 가용률 (Zone별 Bin 현황)
 * @param {number} id — 창고 ID
 * @returns {Promise<AxiosResponse>} { data: Zone[] }
 */
export function getWarehouseLocations(id) {
  return instance.get(`/wms/warehouses/${id}/locations`)
}

/**
 * ASN 목록 조회
 * @param {{ status?:string }} params — 상태 필터 (옵션)
 * @returns {Promise<AxiosResponse>} { success, data: ASN[] }
 */
export function getAsnList(params = {}) {
  return instance.get('/wms/asns', { params })
}

/**
 * 셀러 ASN 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerAsn[] }
 */
export function getSellerAsnList(params = {}) {
  return instance.get('/wms/seller/asns', { params })
}

/**
 * 셀러 ASN 등록
 * @param {object} payload
 * @returns {Promise<AxiosResponse>}
 */
export function createSellerAsn(payload) {
  return instance.post('/wms/seller/asns', payload)
}

export function getSellerAsnOptions() {
  return instance.get('/wms/seller/asns/options')
}

export function cancelSellerAsn(asnId) {
  return instance.post(`/wms/asns/${encodeURIComponent(asnId)}/cancel`)
}

/**
 * 셀러 재고 목록 조회
 * @returns {Promise<AxiosResponse>} { success, data: SellerInventory[] }
 */
export function getSellerInventoryList(params = {}) {
  return instance.get('/wms/seller/inventories', { params })
}

/**
 * ASN 단건 상세 조회
 * @param {string} asnId — ASN 번호 (예: 'ASN-2026-0312-001')
 * @returns {Promise<AxiosResponse>} { success, data: ASN }
 */
export function getAsnDetail(asnId) {
  return instance.get(`/wms/asns/${encodeURIComponent(asnId)}`)
}

export function getAsnBinCandidates(asnId) {
  return instance.get(`/wms/asns/${encodeURIComponent(asnId)}/bin-candidates`)
}

export function saveAsnBinAssignments(asnId, payload) {
  return instance.post(`/wms/asns/${encodeURIComponent(asnId)}/bin-assignments`, payload)
}

/**
 * ASN KPI 집계 — 상태별 건수
 * @returns {Promise<AxiosResponse>} { success, data: { total, submitted, received, cancelled } }
 */
export function getAsnKpi() {
  return instance.get('/wms/asns/kpi')
}

/**
 * 창고 등록
 * @param {{
 *   name: string, sqft: number,
 *   address: string, city: string, state: string,
 *   openTime: string, closeTime: string, timezone: string,
 *   managerName?: string, managerEmail?: string
 * }} payload
 * @returns {Promise<AxiosResponse>} { success, message, data: Warehouse }
 */
export function registerWarehouse(payload) {
  return instance.post('/wms/warehouses', payload)
}

/**
 * SKU 상세 조회 (상품명·로케이션·변동이력·ASN이력·주문이력)
 * @param {number} warehouseId — 창고 ID
 * @param {string} sku         — SKU 코드 (예: 'KR-MASK-001')
 * @returns {Promise<AxiosResponse>} { data: SkuDetail }
 */
export function getSkuDetail(warehouseId, sku) {
  return instance.get(`/wms/warehouses/${warehouseId}/sku/${sku}`)
}

/**
 * 주문 상세 조회 (1주문 N SKU — SKU별 출고 작업 현황 포함)
 * @param {number} warehouseId — 창고 ID
 * @param {string} orderId     — 주문번호 (예: 'ORD-2026-03810')
 * @returns {Promise<AxiosResponse>} { data: OrderDetail }
 */
export function getOrderDetail(warehouseId, orderId) {
  return instance.get(`/wms/warehouses/${warehouseId}/orders/${orderId}`)
}

/**
 * 요금 설정 조회
 * @returns {Promise<AxiosResponse>} { success, data: FeeSettings }
 */
export function getFeeSettings() {
  return instance.get('/wms/fee-settings')
}

/**
 * 요금 설정 저장
 * @param {object} payload — 요금 설정 전체 객체
 * @returns {Promise<AxiosResponse>}
 */
export function saveFeeSettings(payload) {
  return instance.put('/wms/fee-settings', payload)
}

/**
 * 총괄관리자용 월 정산 결과 조회
 * @param {string} billingMonth - YYYY-MM
 * @returns {Promise<AxiosResponse>} { success, data: Array<{ sellerId, totalFee, storageFee, pickingFee, packingFee, billingMonth }> }
 */
export function getMonthlyBillingResults(billingMonth) {
  return instance.get('/wms/manager/billing/monthly-results', {
    params: { billingMonth },
  })
}

// ── 재고 (Inventory) ──────────────────────────────────────────────────

export function getInventories() {
  return instance.get('/wms/inventories')
}

export function getInventoryDetail(id) {
  return instance.get(`/wms/inventories/${id}`)
}

export function getSellerInventoryDetail(id) {
  return instance.get(`/wms/inventories/${id}`)
}

// ── 상품 (Product) ────────────────────────────────────────────────────

export function createSellerProduct(payload) {
  return instance.post('/wms/products/seller/register', payload)
}

export function getSellerProductDetail(productId) {
  return instance.get(`/wms/products/seller/${productId}`)
}

export function getSellerProductList(params = {}) {
  return instance.get('/wms/products/seller/list', { params })
}

export function updateSellerProduct(productId, payload) {
  return instance.put(`/wms/products/seller/${productId}`, payload)
}

export function updateSellerProductStatus(productId, payload) {
  return instance.patch(`/wms/products/seller/${productId}/status`, payload)
}

export function getSellerProductOptions() {
  return instance.get('/wms/products/seller/options')
}

// ── 창고 관리자 (WH Manager) ──────────────────────────────────────────

/**
 * 창고 관리자 대시보드 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhManagerDashboard }
 */
export function getWhmDashboard() {
  return instance.get('/wms/manager/dashboard')
}

/**
 * 출고 지시 대기 주문 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhPendingOrder[] }
 */
export function getWhmPendingOrders(params) {
  return instance.get('/wms/manager/pending-orders', { params })
}

/**
 * 단건 출고 지시 처리
 * @returns {Promise<AxiosResponse>} { success: true, data: WhPendingOrder }
 */
export function dispatchSingleOrder(id, data) {
  return instance.patch(`/wms/manager/pending-orders/${id}`, data)
}

/**
 * 일괄 출고 지시 처리
 * @returns {Promise<AxiosResponse>} { success: true, data: WhPendingOrder[] }
 */
export function bulkDispatchOrders(data) {
  return instance.post('/wms/manager/pending-orders/bulk', data)
}

/**
 * 작업자 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorker[] }
 */
export function getWhmWorkers() {
  return instance.get('/wms/manager/workers')
}

/**
 * 피킹 리스트 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhPickingList[] }
 */
export function getWhmPickingLists(params) {
  return instance.get('/wms/manager/picking-lists', { params })
}

/**
 * 피킹 리스트 단건 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhPickingList }
 */
export function getWhmPickingListDetail(id) {
  return instance.get(`/wms/manager/picking-lists/${id}`)
}

/**
 * 송장 발행 대상 주문 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInvoiceOrder[] }
 */
export function getWhmInvoiceOrders(params) {
  return instance.get('/wms/manager/invoice-orders', { params })
}

/**
 * 단건 송장 발행 상태 저장
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInvoiceOrder }
 */
export function issueLabel(id, data) {
  return instance.patch(`/wms/manager/invoice-orders/${id}`, data)
}

/**
 * 일괄 라벨 발행 처리
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInvoiceOrder[] }
 */
export function bulkIssueLabels(data) {
  return instance.post('/wms/manager/invoice-orders/bulk-label', data)
}

/**
 * 출고 확정 대상 주문 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhOutboundConfirmOrder[] }
 */
export function getWhmOutboundConfirmOrders(params) {
  return instance.get('/wms/manager/outbound-confirm-orders', { params })
}

/**
 * 단건 출고 확정 처리
 * @returns {Promise<AxiosResponse>} { success: true, data: WhOutboundConfirmOrder }
 */
export function confirmSingleOutbound(id, data) {
  return instance.patch(`/wms/manager/outbound-confirm-orders/${id}`, data)
}

/**
 * 일괄 출고 확정 처리
 * @returns {Promise<AxiosResponse>} { success: true, data: WhOutboundConfirmOrder[] }
 */
export function bulkConfirmOutbound(data) {
  return instance.post('/wms/manager/outbound-confirm-orders/bulk-confirm', data)
}

/**
 * 작업자 계정 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorkerAccount[] }
 */
export function getWhmWorkerAccounts(params) {
  return instance.get('/wms/manager/worker-accounts', { params })
}

/**
 * 작업자 계정 생성
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorkerAccount }
 */
export function createWhmWorkerAccount(data) {
  return instance.post('/wms/manager/worker-accounts', data)
}

/**
 * 작업자 계정 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorkerAccount }
 */
export function updateWhmWorkerAccount(id, data) {
  return instance.patch(`/wms/manager/worker-accounts/${id}`, data)
}

/**
 * 작업 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhTask[] }
 */
export function getWhmTasks(params) {
  return instance.get('/wms/manager/tasks', { params })
}

/**
 * 작업 배정/상태 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: WhTask }
 */
export function assignTask(id, data) {
  return instance.patch(`/wms/manager/tasks/${id}`, data)
}

/**
 * 입고 ASN 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInboundAsn[] }
 */
export function getWhmInboundAsns(params) {
  return instance.get('/wms/manager/inbound-asns', { params })
}

/**
 * Bin 고정 배정 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhBinFixedAssignment[] }
 */
export function getWhmBinFixedAssignments() {
  return instance.get('/wms/manager/bin-fixed-assignments')
}

/**
 * Bin 고정 배정 생성
 * @returns {Promise<AxiosResponse>} { success: true, data: WhBinFixedAssignment }
 */
export function createBinFixedAssignment(data) {
  return instance.post('/wms/manager/bin-fixed-assignments', data)
}

/**
 * Bin 고정 배정 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: WhBinFixedAssignment }
 */
export function updateBinFixedAssignment(bin, data) {
  return instance.patch(`/wms/manager/bin-fixed-assignments/${bin}`, data)
}

export function updateWorkerZones(id, zones) {
  return instance.patch(`/wms/manager/worker-accounts/${id}`, { zones })
}

export function getWhmLocations() {
  return instance.get('/wms/manager/locations')
}

/**
 * 창고 관리자 재고 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInventory[] }
 */
export function getWhmInventories() {
  return instance.get('/wms/manager/inventories')
}

/**
 * 창고 관리자 재고 단건 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhInventory }
 */
export function getWhmInventoryDetail(id) {
  return instance.get(`/wms/manager/inventories/${id}`)
}

// ── 창고 작업자 (WH Worker) ───────────────────────────────────────────

/**
 * 작업자 작업 목록 조회
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorkerTask[] }
 */
export async function getWhWorkerTasks(params = {}) {
  return instance.get('/wms/worker/tasks', { params })
}

/**
 * 작업자 작업 상태 수정
 * @returns {Promise<AxiosResponse>} { success: true, data: WhWorkerTask }
 */
export async function updateWhWorkerTask(id, payload) {
  return instance.patch(`/wms/worker/tasks/${id}`, payload)
}
