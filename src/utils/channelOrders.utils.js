/**
 * 셀러 주문 연동 및 조회 화면용 로컬 mock 데이터와 가공 유틸.
 * 채널 연결 상태와 통합 주문 목록, 채널 필터 흐름을 API 없이 먼저 검증한다.
 */

// 채널 연결 카드에서 사용하는 연결 상태 메타 정보.
export const SELLER_CHANNEL_SYNC_STATUS_META = {
  CONNECTED: { label: '연결됨', tone: 'green' },
  PLANNED: { label: 'Phase 2 예정', tone: 'gold' },
  DISCONNECTED: { label: '미연결', tone: 'red' },
}

// 통합 주문 목록에서 사용하는 채널 배지 메타 정보.
export const SELLER_CHANNEL_META = {
  AMAZON: { label: 'Amazon', tone: 'gold' },
  SHOPIFY: { label: 'Shopify', tone: 'blue' },
  MANUAL: { label: '수동', tone: 'default' },
  QOO10: { label: 'Qoo10', tone: 'red' },
}

// 통합 주문 목록에서 사용하는 주문 처리 상태 메타 정보.
export const SELLER_CHANNEL_ORDER_STATUS_META = {
  NEW: { label: '신규', tone: 'blue' },
  READY: { label: '출고준비', tone: 'amber' },
  SHIPPED: { label: '출고완료', tone: 'green' },
  DELIVERED: { label: '배송완료', tone: 'purple' },
}

// 채널 연결 현황 카드 mock 데이터.
export const SELLER_CHANNEL_SYNC_CARDS = [
  {
    key: 'AMAZON',
    label: 'Amazon',
    syncStatus: 'PLANNED',
    pendingOrders: 14,
    todayImported: 3,
    lastSyncedAt: '2026-03-19 09:10',
    description: 'Amazon 주문을 CONK 주문번호로 매핑해 출고 상태를 추적합니다.',
    actions: [
      { key: 'sync', label: '동기화', variant: 'ghost', disabled: false },
      { key: 'import', label: '주문 가져오기', variant: 'primary', disabled: false },
    ],
  },
  {
    key: 'SHOPIFY',
    label: 'Shopify',
    syncStatus: 'CONNECTED',
    pendingOrders: 5,
    todayImported: 2,
    lastSyncedAt: '2026-03-19 08:42',
    description: 'Shopify 주문을 자동 수집해 WMS 처리 상태와 함께 조회합니다.',
    actions: [
      { key: 'sync', label: '동기화', variant: 'ghost', disabled: false },
      { key: 'import', label: '주문 가져오기', variant: 'primary', disabled: false },
    ],
  },
  {
    key: 'QOO10',
    label: 'Qoo10',
    syncStatus: 'DISCONNECTED',
    pendingOrders: 0,
    todayImported: 0,
    lastSyncedAt: '연결 전',
    description: '향후 연결 예정 채널입니다. 연결 전에는 주문을 직접 업로드해야 합니다.',
    actions: [
      { key: 'connect', label: '+ 채널 연결', variant: 'primary', disabled: false },
    ],
  },
]

// 채널 통합 주문 조회 상단 필터 값.
export const SELLER_CHANNEL_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'AMAZON', label: 'Amazon' },
  { key: 'SHOPIFY', label: 'Shopify 예정' },
  { key: 'MANUAL', label: '수동' },
]

// 채널 통합 주문 조회 테이블 mock 원본 데이터.
export const SELLER_CHANNEL_ORDER_ROWS = [
  {
    id: 'channel-order-1',
    channel: 'AMAZON',
    channelOrderNo: 'AMZ-4583201',
    conkOrderNo: 'ORD-20260319-001',
    recipient: 'Emily Harris',
    itemsSummary: '루미에르 앰플 30ml 외 1건',
    orderAmount: 64.5,
    orderedAt: '2026-03-19 09:12',
    status: 'NEW',
  },
  {
    id: 'channel-order-2',
    channel: 'MANUAL',
    channelOrderNo: 'MANUAL-240319-01',
    conkOrderNo: 'ORD-20260319-004',
    recipient: '김도윤',
    itemsSummary: '콜라겐 마스크 5매입',
    orderAmount: 18,
    orderedAt: '2026-03-19 08:20',
    status: 'READY',
  },
  {
    id: 'channel-order-3',
    channel: 'SHOPIFY',
    channelOrderNo: 'SHOP-890231',
    conkOrderNo: 'ORD-20260318-021',
    recipient: 'Olivia Carter',
    itemsSummary: '리파이닝 토너 150ml',
    orderAmount: 22,
    orderedAt: '2026-03-18 16:44',
    status: 'SHIPPED',
  },
  {
    id: 'channel-order-4',
    channel: 'AMAZON',
    channelOrderNo: 'AMZ-4583208',
    conkOrderNo: 'ORD-20260318-019',
    recipient: '박서준',
    itemsSummary: 'UV 선크림 SPF50 50ml',
    orderAmount: 28,
    orderedAt: '2026-03-18 15:05',
    status: 'READY',
  },
  {
    id: 'channel-order-5',
    channel: 'MANUAL',
    channelOrderNo: 'EXCEL-20260318-07',
    conkOrderNo: 'ORD-20260318-017',
    recipient: '정유진',
    itemsSummary: '미스트 토닝 100ml 외 2건',
    orderAmount: 75,
    orderedAt: '2026-03-18 13:22',
    status: 'DELIVERED',
  },
  {
    id: 'channel-order-6',
    channel: 'AMAZON',
    channelOrderNo: 'AMZ-4583197',
    conkOrderNo: 'ORD-20260318-010',
    recipient: 'Sophia Kim',
    itemsSummary: '히알루론 세럼 50ml',
    orderAmount: 25,
    orderedAt: '2026-03-18 09:18',
    status: 'SHIPPED',
  },
]

// 통합 주문 조회 테이블 렌더링에 사용하는 컬럼 정의.
export const SELLER_CHANNEL_ORDER_COLUMNS = [
  { key: 'channel', label: '채널', width: '110px' },
  { key: 'channelOrderNo', label: '채널 주문번호', width: '150px' },
  { key: 'conkOrderNo', label: 'CONK 주문번호', width: '150px' },
  { key: 'recipient', label: '수령자', width: '130px' },
  { key: 'itemsSummary', label: '주문 상품' },
  { key: 'orderAmount', label: '주문 금액', width: '120px', align: 'right' },
  { key: 'orderedAt', label: '주문일', width: '140px' },
  { key: 'status', label: '처리 상태', width: '120px', align: 'center' },
]

// 채널 연결 카드 배지 표현을 반환한다.
export function getSellerChannelSyncStatusMeta(status) {
  return SELLER_CHANNEL_SYNC_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

// 통합 주문 목록의 채널 배지 표현을 반환한다.
export function getSellerChannelMeta(channel) {
  return SELLER_CHANNEL_META[channel] ?? { label: channel ?? '-', tone: 'default' }
}

// 통합 주문 목록의 주문 상태 배지 표현을 반환한다.
export function getSellerChannelOrderStatusMeta(status) {
  return SELLER_CHANNEL_ORDER_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

/**
 * 채널 필터와 검색어를 함께 적용해 통합 주문 조회 목록을 만든다.
 * 검색은 채널 주문번호, CONK 주문번호, 수령자, 상품명, 채널명을 함께 조회한다.
 */
export function filterSellerChannelOrderRows(
  rows = [],
  { channel = 'all', search = '' } = {},
) {
  const normalizedSearch = String(search).trim().toLowerCase()

  return rows.filter((row) => {
    const matchesChannel = channel === 'all' || row.channel === channel

    if (!normalizedSearch) return matchesChannel

    const haystack = [
      row.channelOrderNo,
      row.conkOrderNo,
      row.recipient,
      row.itemsSummary,
      getSellerChannelMeta(row.channel).label,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesChannel && haystack.includes(normalizedSearch)
  })
}
