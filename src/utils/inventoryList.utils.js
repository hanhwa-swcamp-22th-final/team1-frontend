/**
 * 셀러 재고 목록 화면용 로컬 mock 데이터와 가공 유틸.
 * API 연동 전 단계라 상태/창고 필터와 검색 흐름을 화면에서 먼저 확인할 수 있게 한다.
 */

// 재고 목록 화면에서 사용하는 상태 필터 값.
export const SELLER_INVENTORY_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'NORMAL', label: '정상' },
  { key: 'LOW', label: '부족' },
  { key: 'OUT', label: '품절' },
]

// 재고 목록 화면에서 사용하는 창고 필터 값.
export const SELLER_INVENTORY_WAREHOUSE_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'ICN-A', label: 'ICN-A' },
  { key: 'PUS-B', label: 'PUS-B' },
]

// 재고 상태별 배지 표현을 화면 범위에서만 관리한다.
export const SELLER_INVENTORY_STATUS_META = {
  NORMAL: { label: '정상', tone: 'green' },
  LOW: { label: '재고부족', tone: 'amber' },
  OUT: { label: '품절', tone: 'red' },
}

// 재고 목록 테이블 mock 원본 데이터.
export const SELLER_INVENTORY_LIST_ROWS = [
  {
    id: 'seller-inventory-1',
    sku: 'LB-AMP-30',
    productName: '루미에르 앰플 30ml',
    warehouseName: 'ICN-A',
    availableStock: 248,
    allocatedStock: 32,
    totalStock: 280,
    inboundExpected: 50,
    lastInboundDate: '2026-03-08',
    warningThreshold: 10,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-2',
    sku: 'LB-SRM-50',
    productName: '히알루론 세럼 50ml',
    warehouseName: 'ICN-A',
    availableStock: 8,
    allocatedStock: 12,
    totalStock: 20,
    inboundExpected: 100,
    lastInboundDate: '2026-02-28',
    warningThreshold: 20,
    status: 'LOW',
  },
  {
    id: 'seller-inventory-3',
    sku: 'LB-CRM-100',
    productName: '비타민C 크림 100ml',
    warehouseName: 'PUS-B',
    availableStock: 152,
    allocatedStock: 18,
    totalStock: 170,
    inboundExpected: 0,
    lastInboundDate: '2026-03-05',
    warningThreshold: 15,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-4',
    sku: 'LB-MSK-5P',
    productName: '콜라겐 마스크 5매입',
    warehouseName: 'ICN-A',
    availableStock: 420,
    allocatedStock: 60,
    totalStock: 480,
    inboundExpected: 200,
    lastInboundDate: '2026-03-10',
    warningThreshold: 30,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-5',
    sku: 'LB-TNR-150',
    productName: '리파이닝 토너 150ml',
    warehouseName: 'PUS-B',
    availableStock: 0,
    allocatedStock: 0,
    totalStock: 0,
    inboundExpected: 150,
    lastInboundDate: '2026-02-20',
    warningThreshold: 20,
    status: 'OUT',
  },
  {
    id: 'seller-inventory-6',
    sku: 'LB-EYE-20',
    productName: '아이크림 20ml',
    warehouseName: 'ICN-A',
    availableStock: 67,
    allocatedStock: 8,
    totalStock: 75,
    inboundExpected: 0,
    lastInboundDate: '2026-03-02',
    warningThreshold: 10,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-7',
    sku: 'LB-CLN-200',
    productName: '젤 클렌저 200ml',
    warehouseName: 'ICN-A',
    availableStock: 310,
    allocatedStock: 40,
    totalStock: 350,
    inboundExpected: 0,
    lastInboundDate: '2026-03-06',
    warningThreshold: 25,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-8',
    sku: 'LB-SUN-50',
    productName: 'UV 선크림 SPF50 50ml',
    warehouseName: 'PUS-B',
    availableStock: 5,
    allocatedStock: 3,
    totalStock: 8,
    inboundExpected: 80,
    lastInboundDate: '2026-02-25',
    warningThreshold: 15,
    status: 'LOW',
  },
  {
    id: 'seller-inventory-9',
    sku: 'LB-MST-100',
    productName: '미스트 토닝 100ml',
    warehouseName: 'ICN-A',
    availableStock: 185,
    allocatedStock: 20,
    totalStock: 205,
    inboundExpected: 0,
    lastInboundDate: '2026-03-08',
    warningThreshold: 20,
    status: 'NORMAL',
  },
  {
    id: 'seller-inventory-10',
    sku: 'LB-EXF-80',
    productName: '엑스폴리에이팅 스크럽 80g',
    warehouseName: 'PUS-B',
    availableStock: 93,
    allocatedStock: 7,
    totalStock: 100,
    inboundExpected: 50,
    lastInboundDate: '2026-03-01',
    warningThreshold: 18,
    status: 'NORMAL',
  },
]

const SELLER_INVENTORY_DETAIL_MAP = {
  'seller-inventory-1': {
    locationCode: 'ICN-A / A-03-02',
    safetyStockDays: 24,
    coverageDays: 31,
    turnoverRate: '3.8/mo',
    lastCycleCount: '2026-03-12',
    nextInboundAsnNo: 'ASN-20260318-001',
    salesChannel: 'Amazon US',
    memo: '광고 집행 중인 핵심 SKU. 가용 재고 안정 구간 유지.',
  },
  'seller-inventory-2': {
    locationCode: 'ICN-A / B-01-04',
    safetyStockDays: 6,
    coverageDays: 3,
    turnoverRate: '6.2/mo',
    lastCycleCount: '2026-03-11',
    nextInboundAsnNo: 'ASN-20260318-001',
    salesChannel: 'Amazon US',
    memo: '재고 부족 구간. 입고 예정 100개 반영 필요.',
  },
  'seller-inventory-5': {
    locationCode: 'PUS-B / HOLD-02',
    safetyStockDays: 0,
    coverageDays: 0,
    turnoverRate: '0.0/mo',
    lastCycleCount: '2026-03-01',
    nextInboundAsnNo: 'ASN-20260320-007',
    salesChannel: 'Seller Manual',
    memo: '품절 상태. 신규 입고 전까지 판매 중지 검토.',
  },
  'seller-inventory-8': {
    locationCode: 'PUS-B / C-02-01',
    safetyStockDays: 4,
    coverageDays: 2,
    turnoverRate: '5.4/mo',
    lastCycleCount: '2026-03-09',
    nextInboundAsnNo: 'ASN-20260317-003',
    salesChannel: 'Amazon US',
    memo: '선케어 시즌 대응용 긴급 보충 대상.',
  },
}

// 재고 목록 테이블 렌더링에 사용하는 컬럼 정의.
export const SELLER_INVENTORY_LIST_COLUMNS = [
  { key: 'sku', label: 'SKU', width: '130px' },
  { key: 'productName', label: '상품명', width: '220px' },
  { key: 'warehouseName', label: '창고', width: '110px' },
  { key: 'availableStock', label: '가용재고', width: '110px', align: 'right' },
  { key: 'allocatedStock', label: '할당재고', width: '110px', align: 'right' },
  { key: 'totalStock', label: '총재고', width: '110px', align: 'right' },
  { key: 'inboundExpected', label: '입고예정', width: '110px', align: 'right' },
  { key: 'lastInboundDate', label: '최근 입고일', width: '130px' },
  { key: 'warningThreshold', label: '경고 임계치', width: '120px', align: 'right' },
  { key: 'status', label: '상태', width: '120px' },
]

// 재고 상태 라벨과 배지 색상을 반환한다.
export function getSellerInventoryStatusMeta(status) {
  return SELLER_INVENTORY_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

// 재고 상세 모달에 필요한 로컬 mock 정보를 반환한다.
export function getSellerInventoryDetailById(inventoryId, row = {}) {
  const detail = SELLER_INVENTORY_DETAIL_MAP[inventoryId]
  const totalStock = Number(row.totalStock ?? 0)
  const availableStock = Number(row.availableStock ?? 0)
  const allocatedStock = Number(row.allocatedStock ?? 0)
  const availableRate = totalStock > 0 ? Number(((availableStock / totalStock) * 100).toFixed(1)) : 0
  const allocatedRate = totalStock > 0 ? Number(((allocatedStock / totalStock) * 100).toFixed(1)) : 0

  return {
    locationCode: detail?.locationCode ?? `${row.warehouseName ?? 'WH'} / 미지정`,
    safetyStockDays: detail?.safetyStockDays ?? 14,
    coverageDays: detail?.coverageDays ?? 14,
    turnoverRate: detail?.turnoverRate ?? '2.0/mo',
    lastCycleCount: detail?.lastCycleCount ?? row.lastInboundDate ?? '-',
    nextInboundAsnNo: detail?.nextInboundAsnNo ?? '미정',
    salesChannel: detail?.salesChannel ?? 'Seller',
    memo: detail?.memo ?? `${row.productName ?? '상품'} 재고 상세 메모 준비중`,
    availableRate,
    allocatedRate,
  }
}

/**
 * 상태, 창고, 검색어를 함께 적용해 재고 목록을 만든다.
 * 검색은 SKU, 상품명, 창고명을 함께 조회한다.
 */
export function filterSellerInventoryRows(
  rows = [],
  { status = 'all', warehouse = 'all', search = '' } = {},
) {
  const normalizedSearch = String(search).trim().toLowerCase()

  return rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status
    const matchesWarehouse = warehouse === 'all' || row.warehouseName === warehouse

    if (!normalizedSearch) return matchesStatus && matchesWarehouse

    const haystack = [
      row.sku,
      row.productName,
      row.warehouseName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesStatus && matchesWarehouse && haystack.includes(normalizedSearch)
  })
}
