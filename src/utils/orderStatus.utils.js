import { ORDER_STATUS } from '@/constants'

const RAW_TO_DISPLAY_ORDER_STATUS = Object.freeze({
  RECEIVED: ORDER_STATUS.PENDING,
  ALLOCATED: ORDER_STATUS.CONFIRMED,
  OUTBOUND_INSTRUCTED: ORDER_STATUS.PREPARING_ITEM,
  PICKING: ORDER_STATUS.PREPARING_ITEM,
  PACKING: ORDER_STATUS.PREPARING_ITEM,
  OUTBOUND_PENDING: ORDER_STATUS.PREPARING_ITEM,
  OUTBOUND_COMPLETED: ORDER_STATUS.SHIPPED,
  CANCELED: ORDER_STATUS.CANCELLED,
})

export function toDisplayOrderStatus(status) {
  const normalizedStatus = String(status ?? '').trim()

  if (!normalizedStatus) return ''

  return RAW_TO_DISPLAY_ORDER_STATUS[normalizedStatus] ?? normalizedStatus
}

export function normalizeOrderStatusRow(row = {}) {
  const rawStatus = String(row.rawStatus ?? row.status ?? '').trim()

  return {
    ...row,
    rawStatus,
    status: toDisplayOrderStatus(rawStatus),
  }
}

export function normalizeOrderStatusRows(rows = []) {
  return Array.isArray(rows) ? rows.map((row) => normalizeOrderStatusRow(row)) : []
}
