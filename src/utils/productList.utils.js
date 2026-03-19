/**
 * 셀러 상품 목록 화면용 로컬 mock 데이터와 가공 유틸.
 * API 연동 전 단계라 상태/카테고리 필터와 검색 흐름을 화면에서 먼저 확인할 수 있게 한다.
 */

// 상품 목록 화면에서 사용하는 상태 필터 값.
export const SELLER_PRODUCT_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'ACTIVE', label: '판매중' },
  { key: 'LOW_STOCK', label: '재고부족' },
  { key: 'OUT_OF_STOCK', label: '품절' },
  { key: 'INACTIVE', label: '비활성' },
]

// 상품 목록 화면에서 사용하는 카테고리 필터 값.
export const SELLER_PRODUCT_CATEGORY_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: '스킨케어', label: '스킨케어' },
  { key: '세럼/앰플', label: '세럼/앰플' },
  { key: '마스크팩', label: '마스크팩' },
  { key: '선케어', label: '선케어' },
  { key: '클렌징', label: '클렌징' },
]

// 상품 상태별 배지 표현을 화면 범위에서만 관리한다.
export const SELLER_PRODUCT_STATUS_META = {
  ACTIVE: { label: '판매중', tone: 'green' },
  LOW_STOCK: { label: '재고부족', tone: 'amber' },
  OUT_OF_STOCK: { label: '품절', tone: 'red' },
  INACTIVE: { label: '비활성', tone: 'blue' },
}

// 상품 목록 테이블 mock 원본 데이터.
export const SELLER_PRODUCT_LIST_ROWS = [
  {
    id: 'seller-product-1',
    sku: 'LB-AMP-30',
    productName: '루미에르 앰플 30ml',
    category: '세럼/앰플',
    warehouseName: 'ICN-A',
    salePrice: 30,
    costPrice: 8,
    availableStock: 248,
    allocatedStock: 42,
    status: 'ACTIVE',
  },
  {
    id: 'seller-product-2',
    sku: 'LB-SRM-50',
    productName: '히알루론 세럼 50ml',
    category: '세럼/앰플',
    warehouseName: 'ICN-A',
    salePrice: 25,
    costPrice: 6.5,
    availableStock: 8,
    allocatedStock: 26,
    status: 'LOW_STOCK',
  },
  {
    id: 'seller-product-3',
    sku: 'LB-CRM-100',
    productName: '비타민C 크림 100ml',
    category: '스킨케어',
    warehouseName: 'PUS-B',
    salePrice: 35,
    costPrice: 10,
    availableStock: 152,
    allocatedStock: 18,
    status: 'ACTIVE',
  },
  {
    id: 'seller-product-4',
    sku: 'LB-MSK-5P',
    productName: '콜라겐 마스크 5매입',
    category: '마스크팩',
    warehouseName: 'ICN-A',
    salePrice: 18,
    costPrice: 4.5,
    availableStock: 420,
    allocatedStock: 56,
    status: 'ACTIVE',
  },
  {
    id: 'seller-product-5',
    sku: 'LB-TNR-150',
    productName: '리파이닝 토너 150ml',
    category: '스킨케어',
    warehouseName: 'PUS-B',
    salePrice: 22,
    costPrice: 5.8,
    availableStock: 0,
    allocatedStock: 0,
    status: 'OUT_OF_STOCK',
  },
  {
    id: 'seller-product-6',
    sku: 'LB-EYE-20',
    productName: '아이크림 20ml',
    category: '스킨케어',
    warehouseName: 'ICN-A',
    salePrice: 45,
    costPrice: 12,
    availableStock: 67,
    allocatedStock: 12,
    status: 'ACTIVE',
  },
  {
    id: 'seller-product-7',
    sku: 'LB-CLN-200',
    productName: '젤 클렌저 200ml',
    category: '클렌징',
    warehouseName: 'ICN-A',
    salePrice: 15,
    costPrice: 4.2,
    availableStock: 310,
    allocatedStock: 0,
    status: 'INACTIVE',
  },
  {
    id: 'seller-product-8',
    sku: 'LB-SUN-50',
    productName: 'UV 선크림 SPF50 50ml',
    category: '선케어',
    warehouseName: 'PUS-B',
    salePrice: 28,
    costPrice: 7.2,
    availableStock: 5,
    allocatedStock: 14,
    status: 'LOW_STOCK',
  },
  {
    id: 'seller-product-9',
    sku: 'LB-MST-100',
    productName: '미스트 토닝 100ml',
    category: '스킨케어',
    warehouseName: 'ICN-A',
    salePrice: 20,
    costPrice: 5.2,
    availableStock: 185,
    allocatedStock: 30,
    status: 'ACTIVE',
  },
  {
    id: 'seller-product-10',
    sku: 'LB-FOA-120',
    productName: '약산성 폼클렌저 120ml',
    category: '클렌징',
    warehouseName: 'PUS-B',
    salePrice: 19,
    costPrice: 4.9,
    availableStock: 93,
    allocatedStock: 11,
    status: 'ACTIVE',
  },
]

// 상품 목록 테이블 렌더링에 사용하는 컬럼 정의.
export const SELLER_PRODUCT_LIST_COLUMNS = [
  { key: 'image', label: '이미지', width: '72px', align: 'center' },
  { key: 'sku', label: 'SKU', width: '130px' },
  { key: 'productName', label: '상품명', width: '220px' },
  { key: 'warehouseName', label: '보관 창고', width: '110px' },
  { key: 'salePrice', label: '판매가', width: '110px' },
  { key: 'costPrice', label: '원가', width: '110px' },
  { key: 'stock', label: '가용 / 할당', width: '130px' },
  { key: 'status', label: '상태', width: '110px' },
  { key: 'actions', label: '관리', width: '140px', align: 'center' },
]

// 상품 상태 라벨과 배지 색상을 반환한다.
export function getSellerProductStatusMeta(status) {
  return SELLER_PRODUCT_STATUS_META[status] ?? { label: status ?? '-', tone: 'default' }
}

/**
 * 상태, 카테고리, 검색어를 함께 적용해 상품 목록을 만든다.
 * 검색은 SKU, 상품명, 카테고리, 창고명을 함께 조회한다.
 */
export function filterSellerProductRows(
  rows = [],
  { status = 'all', category = 'all', search = '' } = {},
) {
  const normalizedSearch = String(search).trim().toLowerCase()

  return rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status
    const matchesCategory = category === 'all' || row.category === category

    if (!normalizedSearch) return matchesStatus && matchesCategory

    const haystack = [
      row.sku,
      row.productName,
      row.category,
      row.warehouseName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesStatus && matchesCategory && haystack.includes(normalizedSearch)
  })
}
