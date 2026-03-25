import { describe, expect, it } from 'vitest'

import {
  buildSellerInventoryExportRows,
  filterSellerInventoryRows,
  getSellerInventoryDetailById,
  getSellerInventoryStatusMeta,
  normalizeSellerInventoryDetail,
  SELLER_INVENTORY_LIST_ROWS,
} from '@/utils/seller/inventoryList.utils.js'

describe('inventoryList utils', () => {
  it('재고 상태 메타를 반환한다', () => {
    expect(getSellerInventoryStatusMeta('LOW')).toEqual({
      label: '재고부족',
      tone: 'amber',
    })
  })

  it('상태 필터를 적용한다', () => {
    const result = filterSellerInventoryRows(SELLER_INVENTORY_LIST_ROWS, {
      status: 'OUT',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-TNR-150')
  })

  it('현재 재고 목록을 CSV 다운로드용 행으로 정규화한다', () => {
    expect(buildSellerInventoryExportRows([SELLER_INVENTORY_LIST_ROWS[0]])).toEqual([
      {
        SKU: 'LB-AMP-30',
        상품명: '루미에르 앰플 30ml',
        창고: 'ICN-A',
        가용재고: 248,
        할당재고: 32,
        총재고: 280,
        입고예정: 50,
        최근입고일: '2026-03-08',
        경고임계치: 10,
        상태: '정상',
      },
    ])
  })

  it('창고와 검색어를 함께 적용한다', () => {
    const result = filterSellerInventoryRows(SELLER_INVENTORY_LIST_ROWS, {
      warehouse: 'PUS-B',
      search: '선크림',
    })

    expect(result).toHaveLength(1)
    expect(result[0].sku).toBe('LB-SUN-50')
  })

  it('재고 상세 mock 데이터를 반환한다', () => {
    expect(getSellerInventoryDetailById('seller-inventory-2', SELLER_INVENTORY_LIST_ROWS[1])).toEqual(
      expect.objectContaining({
        locationCode: 'ICN-A / B-01-04',
        availableRate: 40,
        allocatedRate: 60,
        nextInboundAsnNo: 'ASN-20260318-001',
      }),
    )
  })

  it('API 상세 응답을 가용/할당 비율이 포함된 구조로 정규화한다', () => {
    expect(
      normalizeSellerInventoryDetail(
        {
          locationCode: 'ICN-A / A-03-02',
        },
        {
          warehouseName: 'ICN-A',
          totalStock: 200,
          availableStock: 50,
          allocatedStock: 150,
        },
      ),
    ).toEqual(
      expect.objectContaining({
        locationCode: 'ICN-A / A-03-02',
        availableRate: 25,
        allocatedRate: 75,
      }),
    )
  })

  it('상세 mock이 없는 재고는 fallback 정보를 반환한다', () => {
    expect(getSellerInventoryDetailById('seller-inventory-3', SELLER_INVENTORY_LIST_ROWS[2])).toEqual(
      expect.objectContaining({
        locationCode: 'PUS-B / 미지정',
        availableRate: 89.4,
        salesChannel: 'Seller',
      }),
    )
  })
})
