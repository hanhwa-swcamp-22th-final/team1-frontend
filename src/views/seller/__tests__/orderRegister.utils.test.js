import { describe, expect, it } from 'vitest'

import {
  buildChannelImportPreviewMessage,
  buildBulkOrderPayload,
  buildManualOrderPayload,
  buildOrderProductLineSummary,
  buildOrderTemplateCsv,
  buildOrderUploadResultSummary,
  createOrderProductLine,
  generateSellerOrderNumber,
  getMissingOrderUploadColumns,
  mapOrderUploadRows,
  normalizeBulkOrderRegisterTab,
  normalizeOrderRegisterTab,
  ORDER_UPLOAD_REQUIRED_COLUMNS,
  validateOrderForm,
} from '@/utils/seller/orderRegister.utils.js'

describe('orderRegister utils', () => {
  it('상위 탭 키가 올바르지 않으면 단건 주문 등록 탭으로 fallback 한다', () => {
    expect(normalizeOrderRegisterTab('bulk')).toBe('bulk')
    expect(normalizeOrderRegisterTab('unknown')).toBe('manual')
  })

  it('일괄 등록 하위 탭 키가 올바르지 않으면 엑셀 업로드 탭으로 fallback 한다', () => {
    expect(normalizeBulkOrderRegisterTab('shopify')).toBe('shopify')
    expect(normalizeBulkOrderRegisterTab('unknown')).toBe('excel')
  })

  it('신규 주문 상품 라인은 빈 SKU와 수량 1로 생성한다', () => {
    expect(createOrderProductLine('order-item-9')).toEqual({
      id: 'order-item-9',
      sku: '',
      quantity: 1,
    })
  })

  it('상품 라인 요약은 단가, 소계, 재고주의 여부를 계산한다', () => {
    const result = buildOrderProductLineSummary({
      sku: 'LB-CRM-100',
      quantity: 2,
    })

    expect(result).toEqual({
      productName: '비타민C 크림 100ml',
      availableStock: 12,
      unitPrice: 35,
      subtotal: 70,
      isLowStock: true,
    })
  })

  it('주문번호 자동생성은 기준일과 순번을 붙여 반환한다', () => {
    expect(generateSellerOrderNumber('2026-03-21', 7)).toBe('ORD-20260321-007')
  })

  it('업로드 헤더가 모두 있으면 누락 컬럼이 없다', () => {
    const result = getMissingOrderUploadColumns([
      ' 주문번호 ',
      '주문일자',
      '수령인',
      '연락처',
      'State',
      'City',
      'Zip Code',
      '배송지',
      'SKU',
      '수량',
      '요청사항',
    ])

    expect(result).toEqual([])
  })

  it('필수 업로드 헤더가 빠지면 누락 컬럼을 순서대로 반환한다', () => {
    const result = getMissingOrderUploadColumns(['주문번호', '주문일자', '수령인', '배송지', 'SKU'])

    expect(result).toEqual([
      ORDER_UPLOAD_REQUIRED_COLUMNS[3],
      ORDER_UPLOAD_REQUIRED_COLUMNS[4],
      ORDER_UPLOAD_REQUIRED_COLUMNS[5],
      ORDER_UPLOAD_REQUIRED_COLUMNS[6],
      ORDER_UPLOAD_REQUIRED_COLUMNS[9],
    ])
  })

  it('업로드 행 데이터를 미리보기 테이블 형식으로 변환한다', () => {
    const result = mapOrderUploadRows([
      {
        주문번호: ' ORD-20260321-009 ',
        주문일자: '2026-03-21',
        수령인: '홍길동',
        연락처: '010-1111-2222',
        State: ' California ',
        City: ' Los Angeles ',
        'Zip Code': ' 90001 ',
        배송지: '서울시 강남구 테헤란로 1',
        SKU: ' LB-AMP-30 ',
        수량: 3,
        요청사항: '문 앞 보관',
      },
    ])

    expect(result).toEqual([
      {
        id: 'upload-order-1',
        orderNo: 'ORD-20260321-009',
        orderDate: '2026-03-21',
        recipient: '홍길동',
        contact: '010-1111-2222',
        state: 'California',
        city: 'Los Angeles',
        zipCode: '90001',
        address: '서울시 강남구 테헤란로 1',
        sku: 'LB-AMP-30',
        quantity: '3',
        requestNote: '문 앞 보관',
      },
    ])
  })

  it('수동 등록 폼 값을 주문 상품 테이블 기준 payload 로 정리한다', () => {
    const result = buildManualOrderPayload({
      orderNo: ' ORD-20260321-001 ',
      orderDate: '2026-03-21',
      salesChannel: ' Amazon ',
      autoGenerateOrderNo: false,
      recipient: ' 홍길동 ',
      contact: '010-1234-5678',
      state: ' California ',
      city: ' Los Angeles ',
      zipCode: ' 90001 ',
      address1: ' 123 Flower Ave ',
      address2: ' Suite 9 ',
      items: [
        { id: 'line-1', sku: 'LB-AMP-30', quantity: 2 },
        { id: 'line-2', sku: 'LB-MSK-5P', quantity: 1 },
      ],
      memo: ' 문 앞 보관 ',
    })

    expect(result).toEqual({
      orderNo: 'ORD-20260321-001',
      orderDate: '2026-03-21',
      salesChannel: 'Amazon',
      autoGenerateOrderNo: false,
      recipient: '홍길동',
      contact: '010-1234-5678',
      state: 'California',
      city: 'Los Angeles',
      zipCode: '90001',
      postalCode: '90001',
      address1: '123 Flower Ave',
      address2: 'Suite 9',
      sku: 'LB-AMP-30',
      quantity: 2,
      items: [
        {
          sku: 'LB-AMP-30',
          productName: '루미에르 앰플 30ml',
          quantity: 2,
          unitPrice: 30,
          subtotal: 60,
        },
        {
          sku: 'LB-MSK-5P',
          productName: '콜라겐 마스크 5매입',
          quantity: 1,
          unitPrice: 18,
          subtotal: 18,
        },
      ],
      memo: '문 앞 보관',
    })
  })

  it('자동생성 옵션이면 주문번호 없이도 payload 에 생성된 주문번호를 넣는다', () => {
    const result = buildManualOrderPayload({
      orderDate: '2026-03-21',
      autoGenerateOrderNo: true,
      salesChannel: '자사몰',
      recipient: '홍길동',
      contact: '010-1234-5678',
      state: 'California',
      city: 'Los Angeles',
      zipCode: '90001',
      address1: '123 Flower Ave',
      items: [{ id: 'line-1', sku: 'LB-AMP-30', quantity: 2 }],
    })

    expect(result.orderNo).toBe('ORD-20260321-001')
    expect(result.autoGenerateOrderNo).toBe(true)
  })

  it('업로드 미리보기 행을 일괄 등록 요청 형식으로 변환한다', () => {
    const result = buildBulkOrderPayload([
      {
        orderNo: ' ORD-20260321-009 ',
        orderDate: '2026-03-21',
        recipient: '홍길동',
        contact: '010-1111-2222',
        state: ' California ',
        city: ' Los Angeles ',
        zipCode: ' 90001 ',
        address: '서울시 강남구 테헤란로 1',
        sku: ' LB-AMP-30 ',
        quantity: '3',
        requestNote: ' 문 앞 보관 ',
      },
    ])

    expect(result).toEqual([
      {
        orderNo: 'ORD-20260321-009',
        orderDate: '2026-03-21',
        recipient: '홍길동',
        contact: '010-1111-2222',
        state: 'California',
        city: 'Los Angeles',
        zipCode: '90001',
        address: '서울시 강남구 테헤란로 1',
        sku: 'LB-AMP-30',
        quantity: 3,
        requestNote: '문 앞 보관',
      },
    ])
  })

  it('템플릿 CSV 는 State, City, Zip Code 컬럼을 포함한다', () => {
    const result = buildOrderTemplateCsv()

    expect(result).toContain('"State","City","Zip Code"')
    expect(result).toContain('"California","Los Angeles","90001"')
  })

  it('업로드 결과 모달용 요약 정보를 계산한다', () => {
    const result = buildOrderUploadResultSummary(
      [
        {
          orderNo: 'ORD-20260321-009',
          recipient: '홍길동',
          sku: 'LB-AMP-30',
          quantity: '3',
        },
        {
          orderNo: 'ORD-20260321-010',
          recipient: '김영희',
          sku: 'LB-MSK-5P',
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
      firstOrderNo: 'ORD-20260321-009',
    })
  })

  it('채널 가져오기 안내 문구는 미등록 주문 기준으로 생성한다', () => {
    expect(buildChannelImportPreviewMessage('Shopify', '최근 3일', 12))
      .toBe('최근 3일 기준 미등록 Shopify 주문 12건을 가져올 준비가 완료되었습니다.')
  })

  it('필수값이 비어 있으면 주문 등록 검증 에러를 반환한다', () => {
    const result = validateOrderForm({
      orderNo: '',
      orderDate: '',
      recipient: '',
      contact: '',
      state: '',
      city: '',
      zipCode: '',
      address1: '',
      items: [],
    })

    expect(result.orderNo).toBe('주문번호를 입력하세요.')
    expect(result.orderDate).toBe('주문일자를 선택하세요.')
    expect(result.recipient).toBe('수령인을 입력하세요.')
    expect(result.contact).toBe('연락처를 입력하세요.')
    expect(result.state).toBe('State를 선택하세요.')
    expect(result.city).toBe('City를 입력하세요.')
    expect(result.zipCode).toBe('Zip Code를 입력하세요.')
    expect(result.address1).toBe('기본 배송지를 입력하세요.')
    expect(result.items).toBe('주문 상품을 1개 이상 추가하세요.')
    expect(result.sku).toBe('SKU를 선택하세요.')
  })

  it('상품 행 중 하나라도 수량이 1 미만이면 quantity 에러를 반환한다', () => {
    const result = validateOrderForm({
      autoGenerateOrderNo: true,
      orderDate: '2026-03-21',
      recipient: '홍길동',
      contact: '010-1234-5678',
      state: 'California',
      city: 'Los Angeles',
      zipCode: '90001',
      address1: '123 Flower Ave',
      items: [
        { sku: 'LB-AMP-30', quantity: 2 },
        { sku: 'LB-MSK-5P', quantity: 0 },
      ],
    })

    expect(result.orderNo).toBe('')
    expect(result.quantity).toBe('수량은 1 이상이어야 합니다.')
  })

  it('자동생성 + 정상 입력이면 주문 등록 검증 에러가 없다', () => {
    const result = validateOrderForm({
      autoGenerateOrderNo: true,
      orderDate: '2026-03-21',
      recipient: '홍길동',
      contact: '010-1234-5678',
      state: 'California',
      city: 'Los Angeles',
      zipCode: '90001',
      address1: '123 Flower Ave',
      items: [{ sku: 'LB-AMP-30', quantity: 2 }],
    })

    expect(Object.values(result).every((value) => value === '')).toBe(true)
  })
})
