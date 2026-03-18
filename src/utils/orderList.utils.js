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

// 주문 상태 라벨과 배지 색상을 반환한다.
export function getSellerOrderStatusMeta(status) {
  return SELLER_ORDER_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

// 주문 채널 라벨과 태그 색상을 반환한다.
export function getSellerOrderChannelMeta(channel) {
  return SELLER_ORDER_CHANNEL_META[channel] ?? { label: channel ?? '-', tone: 'default' }
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
