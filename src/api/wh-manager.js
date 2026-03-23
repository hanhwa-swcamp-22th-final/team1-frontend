/**
 * wh-manager.js — 창고 관리자 API 모듈
 */
import instance from './instance'

export function getWhmDashboard() {
  return instance.get('/whm_dashboard')
}

/** 출고 지시 대기 주문 목록 조회 */
export function getWhmPendingOrders(params) {
  return instance.get('/wh_pending_orders', { params })
}

/** 개별 출고 지시 */
export function dispatchSingleOrder(id, data) {
  return instance.patch(`/wh_pending_orders/${id}`, data)
}

/** 일괄 출고 지시 발행 */
export function bulkDispatchOrders(data) {
  return instance.post('/wh_pending_orders/bulk', data)
}

/** 작업자 목록 조회 */
export function getWhmWorkers() {
  return instance.get('/wh_workers')
}

/** 피킹 리스트 목록 조회 */
export function getWhmPickingLists(params) {
  return instance.get('/wh_picking_lists', { params })
}

/** 피킹 리스트 단건 상세 조회 */
export function getWhmPickingListDetail(id) {
  return instance.get(`/wh_picking_lists/${id}`)
}

/** 송장 발행 대기 주문 목록 조회 */
export function getWhmInvoiceOrders(params) {
  return instance.get('/wh_invoice_orders', { params })
}

/** 개별 라벨 발행 */
export function issueLabel(id, data) {
  return instance.patch(`/wh_invoice_orders/${id}`, data)
}

/** 일괄 라벨 출력 */
export function bulkIssueLabels(data) {
  return instance.post('/wh_invoice_orders/bulk_label', data)
}

/** 출고 확정 대기 주문 목록 조회 */
export function getWhmOutboundConfirmOrders(params) {
  return instance.get('/wh_outbound_confirm_orders', { params })
}

/** 개별 출고 확정 */
export function confirmSingleOutbound(id, data) {
  return instance.patch(`/wh_outbound_confirm_orders/${id}`, data)
}

/** 일괄 출고 확정 */
export function bulkConfirmOutbound(data) {
  return instance.post('/wh_outbound_confirm_orders/bulk_confirm', data)
}

/** 작업자 계정 목록 조회 */
export function getWhmWorkerAccounts(params) {
  return instance.get('/wh_worker_accounts', { params })
}

/** 작업자 계정 생성 */
export function createWhmWorkerAccount(data) {
  return instance.post('/wh_worker_accounts', data)
}

/** 작업자 계정 수정 (비활성화·비밀번호 초기화 포함) */
export function updateWhmWorkerAccount(id, data) {
  return instance.patch(`/wh_worker_accounts/${id}`, data)
}

/** 작업 목록 조회 */
export function getWhmTasks(params) {
  return instance.get('/wh_tasks', { params })
}

/** 작업 배정 (생성 또는 수정) */
export function assignTask(id, data) {
  return instance.patch(`/wh_tasks/${id}`, data)
}

/** 인바운드 ASN 목록 조회 (inboundStatus 파라미터로 탭 필터링) */
export function getWhmInboundAsns(params) {
  return instance.get('/wh_inbound_asns', { params })
}

/** Bin 고정 배정 목록 조회 */
export function getWhmBinFixedAssignments() {
  return instance.get('/wh_bin_fixed_assignments')
}

/** Bin 고정 배정 신규 생성 */
export function createBinFixedAssignment(data) {
  return instance.post('/wh_bin_fixed_assignments', data)
}

/** Bin 고정 배정 수정 */
export function updateBinFixedAssignment(bin, data) {
  return instance.patch(`/wh_bin_fixed_assignments/${bin}`, data)
}

/** Worker-Zone 배정 저장 (worker_accounts의 zones 필드 업데이트) */
export function updateWorkerZones(id, zones) {
  return instance.patch(`/wh_worker_accounts/${id}`, { zones })
}

/** 창고 로케이션 전체 조회 (Zone/Rack/Bin 구조) */
export function getWhmLocations() {
  return instance.get('/wh_locations')
}

/** 재고 현황 목록 조회 */
export function getWhmInventories() {
  return instance.get('/wh_inventories')
}

/** 재고 단건 상세 조회 */
export function getWhmInventoryDetail(id) {
  return instance.get(`/wh_inventories/${id}`)
}