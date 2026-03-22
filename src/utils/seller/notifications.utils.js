/**
 * 셀러 알림 화면용 로컬 mock 데이터와 가공 유틸.
 * 안읽음 필터, 유형 필터, 전체 읽음 처리 흐름을 API 없이 먼저 검증한다.
 */

// 알림 유형별 라벨, 색상, 아이콘 메타 정보.
export const SELLER_NOTIFICATION_TYPE_META = {
  ASN_RECEIVED: { label: '입고 완료', tone: 'blue', icon: '↓' },
  LOW_STOCK: { label: '재고 부족', tone: 'amber', icon: '!' },
  ORDER_SHIPPED: { label: '출고 완료', tone: 'green', icon: '↑' },
  QTY_MISMATCH: { label: '수량 불일치', tone: 'red', icon: '≠' },
  INVOICE_ISSUED: { label: '송장 발행', tone: 'purple', icon: '#' },
}

// 알림 목록 상단 필터 값.
export const SELLER_NOTIFICATION_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '안읽음' },
  { key: 'ASN_RECEIVED', label: '입고 완료' },
  { key: 'LOW_STOCK', label: '재고 부족' },
  { key: 'ORDER_SHIPPED', label: '출고 완료' },
  { key: 'QTY_MISMATCH', label: '수량 불일치' },
  { key: 'INVOICE_ISSUED', label: '송장 발행' },
]

// 알림 목록 화면 mock 원본 데이터.
export const SELLER_NOTIFICATION_ROWS = [
  {
    id: 'seller-notification-1',
    type: 'ASN_RECEIVED',
    title: 'ASN-20260319-0003 입고가 완료되었습니다.',
    body: 'ICN-A 창고에서 루미에르 앰플 외 18 SKU 검수가 완료되었습니다.',
    timeLabel: '방금',
    read: false,
  },
  {
    id: 'seller-notification-2',
    type: 'LOW_STOCK',
    title: '재고 부족 상품이 감지되었습니다.',
    body: 'LB-SUN-50 SKU의 가용재고가 경고 임계치 10개 아래로 내려갔습니다.',
    timeLabel: '5분 전',
    read: false,
  },
  {
    id: 'seller-notification-3',
    type: 'ORDER_SHIPPED',
    title: 'AMZ-4583197 주문이 출고 완료되었습니다.',
    body: '택배사 인계가 끝나 송장 조회가 가능합니다.',
    timeLabel: '32분 전',
    read: false,
  },
  {
    id: 'seller-notification-4',
    type: 'QTY_MISMATCH',
    title: '입고 수량 불일치가 확인되었습니다.',
    body: 'ASN-20260318-0011에서 신고 수량과 실제 검수 수량에 차이가 있습니다.',
    timeLabel: '1시간 전',
    read: true,
  },
  {
    id: 'seller-notification-5',
    type: 'INVOICE_ISSUED',
    title: '송장이 발행되었습니다.',
    body: 'ORD-20260318-021 주문에 UPS 송장번호 1Z-28403이 연결되었습니다.',
    timeLabel: '어제',
    read: true,
  },
  {
    id: 'seller-notification-6',
    type: 'LOW_STOCK',
    title: '마스크팩 재고가 부족합니다.',
    body: 'LB-MSK-5P SKU가 오늘 예상 판매량 대비 부족 상태입니다.',
    timeLabel: '2일 전',
    read: true,
  },
]

export function getSellerNotificationTypeMeta(type) {
  return SELLER_NOTIFICATION_TYPE_META[type] ?? { label: type ?? '-', tone: 'default', icon: '•' }
}

export function countUnreadNotifications(rows = []) {
  return rows.filter((row) => !row.read).length
}

export function countNotificationsByFilter(rows = [], filter = 'all') {
  return filterSellerNotifications(rows, { filter }).length
}

// 선택한 필터 기준으로 알림 목록을 추린다.
export function filterSellerNotifications(rows = [], { filter = 'all' } = {}) {
  return rows.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !row.read
    return row.type === filter
  })
}

// 전체 읽음 처리는 원본 배열을 바꾸지 않고 읽음 상태만 갱신한 새 배열을 만든다.
export function markAllNotificationsRead(rows = []) {
  return rows.map((row) => ({ ...row, read: true }))
}
