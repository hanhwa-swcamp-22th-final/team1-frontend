import { describe, expect, it } from 'vitest'

import { ORDER_STATUS } from '@/constants'
import {
  normalizeOrderStatusRow,
  normalizeOrderStatusRows,
  toDisplayOrderStatus,
} from '@/utils/orderStatus.utils.js'

describe('orderStatus utils', () => {
  it('백엔드 raw 주문 상태를 프론트 표시 상태로 변환한다', () => {
    expect(toDisplayOrderStatus('RECEIVED')).toBe(ORDER_STATUS.PENDING)
    expect(toDisplayOrderStatus('ALLOCATED')).toBe(ORDER_STATUS.CONFIRMED)
    expect(toDisplayOrderStatus('PACKING')).toBe(ORDER_STATUS.PREPARING_ITEM)
    expect(toDisplayOrderStatus('OUTBOUND_COMPLETED')).toBe(ORDER_STATUS.SHIPPED)
    expect(toDisplayOrderStatus('CANCELED')).toBe(ORDER_STATUS.CANCELLED)
  })

  it('이미 프론트 표시 상태인 값은 그대로 유지한다', () => {
    expect(toDisplayOrderStatus(ORDER_STATUS.PENDING)).toBe(ORDER_STATUS.PENDING)
    expect(toDisplayOrderStatus(ORDER_STATUS.SHIPPED)).toBe(ORDER_STATUS.SHIPPED)
  })

  it('주문 행 상태를 정규화하면서 rawStatus를 보존한다', () => {
    expect(normalizeOrderStatusRow({
      id: 'ORD-2026-00001',
      status: 'OUTBOUND_PENDING',
    })).toEqual({
      id: 'ORD-2026-00001',
      rawStatus: 'OUTBOUND_PENDING',
      status: ORDER_STATUS.PREPARING_ITEM,
    })
  })

  it('주문 행 배열을 일괄 정규화한다', () => {
    expect(normalizeOrderStatusRows([
      { id: 'ORD-1', status: 'RECEIVED' },
      { id: 'ORD-2', status: 'OUTBOUND_COMPLETED' },
    ])).toEqual([
      { id: 'ORD-1', rawStatus: 'RECEIVED', status: ORDER_STATUS.PENDING },
      { id: 'ORD-2', rawStatus: 'OUTBOUND_COMPLETED', status: ORDER_STATUS.SHIPPED },
    ])
  })
})
