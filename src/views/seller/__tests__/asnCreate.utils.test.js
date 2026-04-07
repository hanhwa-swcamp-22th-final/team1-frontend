import { describe, expect, it } from 'vitest'

import {
  buildAsnDraftPendingMessage,
  buildSellerAsnPayload,
  buildMockAsnNumber,
  calculateAsnSummary,
  createInitialAsnLine,
  getAsnProductBySku,
  validateAsnForm,
} from '@/utils/seller/asnCreate.utils.js'

describe('asnCreate utils', () => {
  it('ASN 번호를 날짜와 순번 형식으로 생성한다', () => {
    expect(buildMockAsnNumber(7, '2026-03-18')).toBe('ASN-20260318-007')
  })

  it('선택한 SKU 기준으로 상품 정보를 찾는다', () => {
    const product = getAsnProductBySku('KR-MASK-001')

    expect(product).toMatchObject({
      sku: 'KR-MASK-001',
      productName: '리페어 마스크팩 10입',
      unit: 'EA',
      availableStock: 348,
    })
  })

  it('임시저장 준비중 안내 문구를 ASN 번호와 함께 만든다', () => {
    expect(buildAsnDraftPendingMessage('ASN-20260322-001')).toBe(
      'ASN-20260322-001 임시저장 기능은 준비 중입니다.',
    )
  })

  it('품목 라인으로 ASN 요약 수치를 계산한다', () => {
    const summary = calculateAsnSummary([
      { sku: 'KR-MASK-001', quantity: 12, cartonCount: 3 },
      { sku: 'KR-SNCK-012', quantity: 8, cartonCount: 2 },
      { sku: '', quantity: '', cartonCount: '' },
    ])

    expect(summary).toEqual({
      skuCount: 2,
      totalQuantity: 20,
      totalCartons: 5,
    })
  })

  it('필수값이 비어 있으면 ASN 검증 에러를 반환한다', () => {
    const result = validateAsnForm(
      {
        warehouseId: '',
        expectedDate: '',
        shippingMethod: '',
        originCountry: '',
        senderAddress: '',
        senderPhone: '',
      },
      [createInitialAsnLine(1)],
    )

    expect(result.fieldErrors.warehouseId).toBe('입고 창고를 선택하세요.')
    expect(result.fieldErrors.expectedDate).toBe('예정 입고일을 선택하세요.')
    expect(result.fieldErrors.shippingMethod).toBe('운송 방법을 입력하세요.')
    expect(result.fieldErrors.originCountry).toBe('발송 국가를 입력하세요.')
    expect(result.fieldErrors.senderAddress).toBe('주소를 입력하세요.')
    expect(result.fieldErrors.senderPhone).toBe('연락처를 입력하세요.')
    expect(result.fieldErrors.lineItems).toBe('SKU와 수량이 포함된 품목을 1개 이상 입력하세요.')
    expect(result.lineErrors[0].sku).toBe('SKU를 선택하세요.')
    expect(result.lineErrors[0].quantity).toBe('수량은 1 이상이어야 합니다.')
    expect(result.lineErrors[0].cartonCount).toBe('박스 수는 1 이상이어야 합니다.')
  })

  it('정상 입력이면 ASN 검증 에러가 없다', () => {
    const result = validateAsnForm(
      {
        warehouseId: '1',
        expectedDate: '2026-03-20',
        shippingMethod: '해상 입고',
        originCountry: '대한민국',
        senderAddress: '서울시 강남구 테헤란로 1',
        senderPhone: '010-1234-5678',
      },
      [
        {
          id: 'asn-line-1',
          sku: 'KR-MASK-001',
          productName: '리페어 마스크팩 10입',
          availableStock: 348,
          quantity: 12,
          cartonCount: 3,
        },
      ],
    )

    expect(Object.values(result.fieldErrors).every((value) => value === '')).toBe(true)
    expect(result.lineErrors).toEqual([{ sku: '', quantity: '', cartonCount: '' }])
  })

  it('ASN 등록 payload를 목록/상세 저장 형태로 정규화한다', () => {
    const result = buildSellerAsnPayload(
      {
        asnNo: 'ASN-20260322-001',
        warehouseId: '1',
        expectedDate: '2026-03-25',
        shippingMethod: '해상 입고',
        senderName: 'LUMIERE BEAUTY',
        originCountry: '대한민국',
        senderAddress: 'Busan Port',
        senderPhone: '010-1234-5678',
        note: '온도 민감 상품',
      },
      [
        {
          id: 'asn-line-1',
          sku: 'KR-MASK-001',
          productName: '리페어 마스크팩 10입',
          availableStock: 348,
          quantity: 12,
          cartonCount: 3,
        },
      ],
      { attachmentName: 'packing-list.pdf' },
    )

    expect(result).toEqual({
      asnNo: 'ASN-20260322-001',
      warehouseId: '1',
      warehouseName: 'NJ Warehouse',
      expectedDate: '2026-03-25',
      shippingMethod: '해상 입고',
      senderName: 'LUMIERE BEAUTY',
      originCountry: '대한민국',
      senderAddress: 'Busan Port',
      senderPhone: '010-1234-5678',
      note: '온도 민감 상품',
      referenceNo: 'REF-22-001',
      skuCount: 1,
      totalQuantity: 12,
      status: 'SUBMITTED',
      detail: {
        supplierName: 'LUMIERE BEAUTY',
        originCountry: '대한민국',
        originPort: 'Busan Port',
        transportMode: '해상 입고',
        incoterms: 'EXW',
        bookingNo: 'BK-22-001',
        carrier: '배차 정보 준비중',
        arrivalWindow: '2026-03-25',
        documents: ['Packing List', 'packing-list.pdf'],
        items: [
          { sku: 'KR-MASK-001', productName: '리페어 마스크팩 10입', quantity: 12, cartons: 3 },
        ],
      },
    })
  })
})
