import { describe, expect, it } from 'vitest'

import {
  buildBulkOrderPayload,
  buildManualOrderPayload,
  buildOrderUploadResultSummary,
  ORDER_UPLOAD_REQUIRED_COLUMNS,
  getMissingOrderUploadColumns,
  mapOrderUploadRows,
  validateOrderForm,
} from '@/utils/orderRegister.utils.js'

describe('orderRegister utils', () => {
  it('업로드 헤더가 모두 있으면 누락 컬럼이 없다', () => {
    const result = getMissingOrderUploadColumns([
      ' 주문번호 ',
      '주문일자',
      '수령인',
      '연락처',
      '배송지',
      'SKU',
      '수량',
      '요청사항',
    ])

    expect(result).toEqual([])
  })

  it('필수 업로드 헤더가 빠지면 누락 컬럼을 순서대로 반환한다', () => {
    const result = getMissingOrderUploadColumns(['주문번호', '수령인', '배송지', 'SKU'])

    expect(result).toEqual([
      ORDER_UPLOAD_REQUIRED_COLUMNS[1],
      ORDER_UPLOAD_REQUIRED_COLUMNS[3],
      ORDER_UPLOAD_REQUIRED_COLUMNS[6],
    ])
  })

  it('업로드 행 데이터를 미리보기 테이블 형식으로 변환한다', () => {
    const result = mapOrderUploadRows([
      {
        주문번호: ' ORD-20260317-009 ',
        주문일자: '2026-03-17',
        수령인: '홍길동',
        연락처: '010-1111-2222',
        배송지: '서울시 강남구 테헤란로 1',
        SKU: ' SKU-AMPLE-009 ',
        수량: 3,
        요청사항: '문 앞 보관',
      },
    ])

    expect(result).toEqual([
      {
        id: 'upload-order-1',
        orderNo: 'ORD-20260317-009',
        orderDate: '2026-03-17',
        recipient: '홍길동',
        contact: '010-1111-2222',
        address: '서울시 강남구 테헤란로 1',
        sku: 'SKU-AMPLE-009',
        quantity: '3',
        requestNote: '문 앞 보관',
      },
    ])
  })

  it('수동 등록 폼 값을 API 요청 형식으로 정리한다', () => {
    const result = buildManualOrderPayload({
      orderNo: ' ORD-20260317-001 ',
      orderDate: '2026-03-17',
      salesChannel: ' 자사몰 ',
      recipient: ' 홍길동 ',
      contact: '010-1234-5678',
      postalCode: ' 06234 ',
      address1: ' 서울특별시 강남구 ',
      address2: ' 101동 202호 ',
      sku: ' SKU-AMPLE-001 ',
      quantity: '2',
      memo: ' 문 앞 보관 ',
    })

    expect(result).toEqual({
      orderNo: 'ORD-20260317-001',
      orderDate: '2026-03-17',
      salesChannel: '자사몰',
      recipient: '홍길동',
      contact: '010-1234-5678',
      postalCode: '06234',
      address1: '서울특별시 강남구',
      address2: '101동 202호',
      sku: 'SKU-AMPLE-001',
      quantity: 2,
      memo: '문 앞 보관',
    })
  })

  it('업로드 미리보기 행을 일괄 등록 요청 형식으로 변환한다', () => {
    const result = buildBulkOrderPayload([
      {
        orderNo: ' ORD-20260317-009 ',
        orderDate: '2026-03-17',
        recipient: '홍길동',
        contact: '010-1111-2222',
        address: '서울시 강남구 테헤란로 1',
        sku: ' SKU-AMPLE-009 ',
        quantity: '3',
        requestNote: ' 문 앞 보관 ',
      },
    ])

    expect(result).toEqual([
      {
        orderNo: 'ORD-20260317-009',
        orderDate: '2026-03-17',
        recipient: '홍길동',
        contact: '010-1111-2222',
        address: '서울시 강남구 테헤란로 1',
        sku: 'SKU-AMPLE-009',
        quantity: 3,
        requestNote: '문 앞 보관',
      },
    ])
  })

  it('업로드 결과 모달용 요약 정보를 계산한다', () => {
    const result = buildOrderUploadResultSummary(
      [
        {
          orderNo: 'ORD-20260317-009',
          recipient: '홍길동',
          sku: 'SKU-AMPLE-009',
          quantity: '3',
        },
        {
          orderNo: 'ORD-20260317-010',
          recipient: '김영희',
          sku: 'SKU-MASK-001',
          quantity: '2',
        },
      ],
      'orders.xlsx',
    )

    expect(result).toEqual({
      fileName: 'orders.xlsx',
      rowCount: 2,
      totalQuantity: 5,
      uniqueSkuCount: 2,
      uniqueRecipientCount: 2,
      firstOrderNo: 'ORD-20260317-009',
    })
  })

  it('필수값이 비어 있으면 주문 등록 검증 에러를 반환한다', () => {
    const result = validateOrderForm({
      orderNo: '',
      orderDate: '',
      recipient: '',
      contact: '',
      address1: '',
      sku: '',
      quantity: 0,
    })

    expect(result.orderNo).toBe('주문번호를 입력하세요.')
    expect(result.orderDate).toBe('주문일자를 선택하세요.')
    expect(result.recipient).toBe('수령인을 입력하세요.')
    expect(result.contact).toBe('연락처를 입력하세요.')
    expect(result.address1).toBe('기본 배송지를 입력하세요.')
    expect(result.sku).toBe('SKU를 입력하세요.')
    expect(result.quantity).toBe('수량은 1 이상이어야 합니다.')
  })

  it('SKU 형식이 잘못되면 SKU 에러를 반환한다', () => {
    const result = validateOrderForm({
      orderNo: 'ORD-20260317-001',
      orderDate: '2026-03-17',
      recipient: '홍길동',
      contact: '010-1234-5678',
      address1: '서울특별시 강남구',
      sku: 'SKU 001',
      quantity: 1,
    })

    expect(result.sku).toBe('SKU 형식이 올바르지 않습니다.')
  })

  it('정상 입력이면 주문 등록 검증 에러가 없다', () => {
    const result = validateOrderForm({
      orderNo: 'ORD-20260317-001',
      orderDate: '2026-03-17',
      recipient: '홍길동',
      contact: '010-1234-5678',
      address1: '서울특별시 강남구',
      sku: 'SKU-AMPLE-001',
      quantity: 2,
    })

    expect(Object.values(result).every((value) => value === '')).toBe(true)
  })
})
