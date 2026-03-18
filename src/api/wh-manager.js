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