import { describe, expect, it } from 'vitest'

import {
  buildSellerAsnExportRows,
  filterSellerAsnRows,
  getSellerAsnDetailById,
  getSellerAsnKpi,
  normalizeSellerAsnDetail,
  SELLER_ASN_LIST_ROWS,
} from '@/utils/seller/asnList.utils.js'
import { ASN_STATUS } from '@/constants'

describe('asnList utils', () => {
  it('ASN 목록 KPI를 상태별로 계산한다', () => {
    expect(getSellerAsnKpi(SELLER_ASN_LIST_ROWS)).toEqual({
      total: 5,
      submitted: 2,
      received: 2,
      cancelled: 1,
    })
  })

  it('상태 필터를 적용해 ASN 목록을 반환한다', () => {
    const result = filterSellerAsnRows(SELLER_ASN_LIST_ROWS, {
      status: ASN_STATUS.RECEIVED,
    })

    expect(result).toHaveLength(2)
    expect(result.every((row) => row.status === ASN_STATUS.RECEIVED)).toBe(true)
  })

  it('검색어로 ASN 번호와 메모를 조회할 수 있다', () => {
    const result = filterSellerAsnRows(SELLER_ASN_LIST_ROWS, {
      status: 'all',
      search: '급행',
    })

    expect(result).toEqual([
      expect.objectContaining({
        asnNo: 'ASN-20260317-003',
      }),
    ])
  })

  it('ASN 상세 mock 데이터를 반환한다', () => {
    expect(getSellerAsnDetailById('seller-asn-2')).toEqual(
      expect.objectContaining({
        supplierName: 'Lumiere Beauty Air Hub',
        totalCartons: 18,
        items: [
          expect.objectContaining({
            sku: 'LB-SUN-50',
            cartons: 8,
          }),
          expect.objectContaining({
            sku: 'LB-MSK-5P',
            cartons: 10,
          }),
        ],
      }),
    )
  })

  it('API 상세 응답을 totalCartons가 포함된 구조로 정규화한다', () => {
    expect(
      normalizeSellerAsnDetail({
        items: [
          { sku: 'LB-AMP-30', cartons: 5 },
          { sku: 'LB-MSK-5P', cartons: 7 },
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        totalCartons: 12,
      }),
    )
  })

  it('상세 mock이 없는 ASN은 fallback 정보를 반환한다', () => {
    expect(getSellerAsnDetailById('seller-asn-5', SELLER_ASN_LIST_ROWS[4])).toEqual(
      expect.objectContaining({
        bookingNo: 'BL-240313-04',
        totalCartons: 5,
        items: [
          expect.objectContaining({
            quantity: 720,
          }),
        ],
      }),
    )
  })

  it('ASN 목록을 CSV 다운로드용 row로 변환한다', () => {
    expect(buildSellerAsnExportRows([SELLER_ASN_LIST_ROWS[0]])).toEqual([
      {
        ASN번호: 'ASN-20260318-001',
        목적창고: 'NJ Warehouse',
        입고예정일: '2026-03-21',
        SKU수: 3,
        총입고수량: 420,
        참조번호: 'BL-240318-01',
        등록일: '2026-03-18',
        상태: ASN_STATUS.SUBMITTED,
        메모: '온도 민감 상품 포함',
      },
    ])
  })
})
