/**
 * 셀러 주문 목록 화면용 로컬 mock 데이터와 가공 유틸.
 * API 연동 전 단계라 상태/채널 필터와 검색 흐름을 화면에서 먼저 확인할 수 있게 한다.
 */

// 주문 목록 화면에서 사용하는 상태 필터 값.
export const SELLER_ORDER_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'RECEIVED', label: '접수됨' },
  { key: 'ALLOCATED', label: '할당완료' },
  { key: 'DISPATCHED', label: '출고지시됨' },
  { key: 'WAITING', label: '출고 대기중' },
  { key: 'COMPLETED', label: '출고완료' },
]

// 주문 목록 화면에서 사용하는 채널 필터 값.
export const SELLER_ORDER_CHANNEL_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'Amazon', label: 'Amazon' },
  { key: '수동', label: '수동' },
  { key: '엑셀', label: '엑셀' },
]

// 주문 상태별 배지 표현을 화면 범위에서만 관리한다.
export const SELLER_ORDER_STATUS_META = {
  RECEIVED: { label: '접수됨', tone: 'blue' },
  ALLOCATED: { label: '할당완료', tone: 'indigo' },
  DISPATCHED: { label: '출고지시됨', tone: 'amber' },
  WAITING: { label: '출고 대기중', tone: 'gold' },
  COMPLETED: { label: '출고완료', tone: 'green' },
  CANCELLED: { label: '취소됨', tone: 'red' },
}

// 채널 태그 표현도 주문 목록 전용으로 관리한다.
export const SELLER_ORDER_CHANNEL_META = {
  Amazon: { label: 'Amazon', tone: 'amazon' },
  수동: { label: '수동', tone: 'manual' },
  엑셀: { label: '엑셀', tone: 'excel' },
}

// 주문 상세 모달에 표시할 5단계 출고 처리 흐름.
export const SELLER_ORDER_PROGRESS_STEPS = [
  { key: 'RECEIVED', label: '접수' },
  { key: 'ALLOCATED', label: '할당' },
  { key: 'WAITING', label: '출고 대기' },
  { key: 'DISPATCHED', label: '출고 지시' },
  { key: 'COMPLETED', label: '출고 완료' },
]

// 주문 목록 테이블 mock 원본 데이터.
export const SELLER_ORDER_LIST_ROWS = [
  {
    id: 'seller-order-1',
    orderNo: 'ORD-2026-0311-001',
    channel: 'Amazon',
    recipient: 'Sarah Johnson',
    address: 'California, Los Angeles',
    itemsSummary: 'LB-AMP-30 × 2, LB-MSK-5P × 1',
    orderedAt: '2026-03-11 09:12',
    status: 'COMPLETED',
    trackingNo: '1Z999AA10123456784',
    canCancel: false,
  },
  {
    id: 'seller-order-2',
    orderNo: 'ORD-2026-0311-002',
    channel: '수동',
    recipient: 'Michael Kim',
    address: 'New York, Manhattan',
    itemsSummary: 'LB-SRM-50 × 3',
    orderedAt: '2026-03-11 10:30',
    status: 'WAITING',
    trackingNo: '',
    canCancel: false,
  },
  {
    id: 'seller-order-3',
    orderNo: 'ORD-2026-0311-003',
    channel: '엑셀',
    recipient: 'Emma Davis',
    address: 'Texas, Houston',
    itemsSummary: 'LB-CRM-100 × 1, LB-AMP-30 × 1',
    orderedAt: '2026-03-11 11:05',
    status: 'ALLOCATED',
    trackingNo: '',
    canCancel: true,
  },
  {
    id: 'seller-order-4',
    orderNo: 'ORD-2026-0311-004',
    channel: 'Amazon',
    recipient: 'James Park',
    address: 'Florida, Miami',
    itemsSummary: 'LB-MSK-5P × 5',
    orderedAt: '2026-03-11 11:47',
    status: 'DISPATCHED',
    trackingNo: '',
    canCancel: false,
  },
  {
    id: 'seller-order-5',
    orderNo: 'ORD-2026-0311-005',
    channel: '수동',
    recipient: 'Olivia Brown',
    address: 'Washington, Seattle',
    itemsSummary: 'LB-SRM-50 × 2, LB-CRM-100 × 2',
    orderedAt: '2026-03-11 12:20',
    status: 'RECEIVED',
    trackingNo: '',
    canCancel: true,
  },
  {
    id: 'seller-order-6',
    orderNo: 'ORD-2026-0311-006',
    channel: '엑셀',
    recipient: 'Noah Wilson',
    address: 'Illinois, Chicago',
    itemsSummary: 'LB-AMP-30 × 1',
    orderedAt: '2026-03-11 13:00',
    status: 'CANCELLED',
    trackingNo: '',
    canCancel: false,
  },
  {
    id: 'seller-order-7',
    orderNo: 'ORD-2026-0310-047',
    channel: 'Amazon',
    recipient: 'Sophia Lee',
    address: 'California, San Jose',
    itemsSummary: 'LB-MSK-5P × 10',
    orderedAt: '2026-03-10 16:30',
    status: 'COMPLETED',
    trackingNo: '1Z999AA10123456785',
    canCancel: false,
  },
  {
    id: 'seller-order-8',
    orderNo: 'ORD-2026-0310-046',
    channel: '수동',
    recipient: 'Liam Martinez',
    address: 'New York, Brooklyn',
    itemsSummary: 'LB-AMP-30 × 2',
    orderedAt: '2026-03-10 15:12',
    status: 'WAITING',
    trackingNo: '',
    canCancel: false,
  },
  {
    id: 'seller-order-9',
    orderNo: 'ORD-2026-0310-045',
    channel: 'Amazon',
    recipient: 'Ava Thompson',
    address: 'Oregon, Portland',
    itemsSummary: 'LB-SRM-50 × 1, LB-CRM-100 × 1',
    orderedAt: '2026-03-10 13:55',
    status: 'COMPLETED',
    trackingNo: '1Z999AA10123456786',
    canCancel: false,
  },
  {
    id: 'seller-order-10',
    orderNo: 'ORD-2026-0310-044',
    channel: '엑셀',
    recipient: 'William Chen',
    address: 'Nevada, Las Vegas',
    itemsSummary: 'LB-MSK-5P × 3',
    orderedAt: '2026-03-10 12:10',
    status: 'RECEIVED',
    trackingNo: '',
    canCancel: true,
  },
]

// 주문 목록 테이블 렌더링에 사용하는 컬럼 정의.
export const SELLER_ORDER_LIST_COLUMNS = [
  { key: 'orderNo', label: '주문번호', width: '170px' },
  { key: 'channel', label: '채널', width: '100px' },
  { key: 'recipient', label: '수령자', width: '120px' },
  { key: 'address', label: '배송지', width: '190px' },
  { key: 'itemsSummary', label: '주문 상품', width: '220px' },
  { key: 'orderedAt', label: '주문일', width: '140px' },
  { key: 'status', label: '상태', width: '120px' },
  { key: 'trackingNo', label: '송장번호', width: '160px' },
  { key: 'actions', label: '관리', width: '90px', align: 'center' },
]

// 주문 목록의 현재 필터 결과를 CSV/Excel 다운로드용 행으로 정규화한다.
export function buildSellerOrderExportRows(rows = []) {
  return rows.map((row) => ({
    주문번호: row.orderNo ?? '',
    채널: getSellerOrderChannelMeta(row.channel).label,
    수령자: row.recipient ?? '',
    배송지: row.address ?? '',
    주문상품: row.itemsSummary ?? '',
    주문일시: row.orderedAt ?? '',
    상태: getSellerOrderStatusMeta(row.status).label,
    송장번호: row.trackingNo ?? '',
  }))
}

const SELLER_ORDER_DETAIL_MAP = {
  'seller-order-1': {
    receiverPhone: '+1-213-555-0101',
    state: 'California',
    city: 'Los Angeles',
    zipCode: '90001',
    addressLine: '742 Spring St Apt 12',
    shippingMethod: 'UPS Ground',
    carrier: 'UPS',
    memo: '문 앞 수령 요청',
    items: [
      { sku: 'LB-AMP-30', productName: '루미에르 앰플 30ml', quantity: 2, unitPrice: 34 },
      { sku: 'LB-MSK-5P', productName: '콜라겐 마스크 5매입', quantity: 1, unitPrice: 18 },
    ],
  },
  'seller-order-3': {
    receiverPhone: '+1-713-555-0188',
    state: 'Texas',
    city: 'Houston',
    zipCode: '77002',
    addressLine: '180 Main St Suite 6',
    shippingMethod: 'FedEx Home Delivery',
    carrier: 'FedEx',
    memo: '엑셀 업로드 주문, 오전 출고 우선',
    items: [
      { sku: 'LB-CRM-100', productName: '리페어 크림 100ml', quantity: 1, unitPrice: 29 },
      { sku: 'LB-AMP-30', productName: '루미에르 앰플 30ml', quantity: 1, unitPrice: 34 },
    ],
  },
  'seller-order-5': {
    receiverPhone: '+1-206-555-0173',
    state: 'Washington',
    city: 'Seattle',
    zipCode: '98101',
    addressLine: '55 Pine St Floor 3',
    shippingMethod: 'UPS Ground',
    carrier: 'UPS',
    memo: '접수 후 재고 할당 대기',
    items: [
      { sku: 'LB-SRM-50', productName: '히알루론 세럼 50ml', quantity: 2, unitPrice: 26 },
      { sku: 'LB-CRM-100', productName: '리페어 크림 100ml', quantity: 2, unitPrice: 29 },
    ],
  },
  'seller-order-10': {
    receiverPhone: '+1-702-555-0110',
    state: 'Nevada',
    city: 'Las Vegas',
    zipCode: '89101',
    addressLine: '240 Fremont St Unit 8',
    shippingMethod: 'FedEx Home Delivery',
    carrier: 'FedEx',
    memo: '재고 확보 후 일괄 출고 예정',
    items: [
      { sku: 'LB-MSK-5P', productName: '콜라겐 마스크 5매입', quantity: 3, unitPrice: 18 },
    ],
  },
}

// 주문 상태 라벨과 배지 색상을 반환한다.
export function getSellerOrderStatusMeta(status) {
  return SELLER_ORDER_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

// 주문 채널 라벨과 태그 색상을 반환한다.
export function getSellerOrderChannelMeta(channel) {
  return SELLER_ORDER_CHANNEL_META[channel] ?? { label: channel ?? '-', tone: 'default' }
}

// 주문 상태를 5단계 스텝퍼 기준 key 로 변환한다.
export function getSellerOrderProgressStep(status) {
  const matchedStep = SELLER_ORDER_PROGRESS_STEPS.find((step) => step.key === status)
  if (matchedStep) return matchedStep.key
  return 'RECEIVED'
}

// 주문 상세 응답을 화면에서 바로 사용할 수 있게 정규화한다.
export function normalizeSellerOrderDetail(detail = null, order = {}) {
  if (detail) {
    return {
      ...detail,
      items: Array.isArray(detail.items)
        ? detail.items.map((item) => ({
            ...item,
            amount: item.quantity * item.unitPrice,
          }))
        : [],
    }
  }

  const [state = '-', city = '-'] = String(order.address ?? '')
    .split(',')
    .map((value) => value.trim())

  return {
    receiverPhone: '+1-000-000-0000',
    state,
    city,
    zipCode: '00000',
    addressLine: order.address ?? '-',
    shippingMethod: '택배',
    carrier: order.trackingNo ? '운송장 발급 완료' : '출고 준비중',
    memo: '상세 mock 데이터 준비 전 기본 정보만 표시합니다.',
    items: [
      {
        sku: order.itemsSummary?.split(' × ')[0] ?? '-',
        productName: order.itemsSummary ?? '상품 정보 준비중',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ],
  }
}

// 주문 상세 모달에 필요한 로컬 mock 정보를 반환한다.
export function getSellerOrderDetailById(orderId, order = {}) {
  return normalizeSellerOrderDetail(SELLER_ORDER_DETAIL_MAP[orderId] ?? null, order)
}

/**
 * 상태, 채널, 검색어를 함께 적용해 주문 목록을 만든다.
 * 검색은 주문번호, 수령자, 배송지, 주문 상품, 송장번호를 함께 조회한다.
 */
export function filterSellerOrderRows(
  rows = [],
  { status = 'all', channel = 'all', search = '' } = {},
) {
  const normalizedSearch = String(search).trim().toLowerCase()

  return rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status
    const matchesChannel = channel === 'all' || row.channel === channel

    if (!normalizedSearch) return matchesStatus && matchesChannel

    const haystack = [
      row.orderNo,
      row.recipient,
      row.address,
      row.itemsSummary,
      row.trackingNo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesStatus && matchesChannel && haystack.includes(normalizedSearch)
  })
}
