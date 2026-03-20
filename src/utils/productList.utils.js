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

const SELLER_PRODUCT_DETAIL_MAP = {
  'seller-product-1': {
    brand: 'LUMIERE BEAUTY',
    barcode: '8809812300011',
    originCountry: '대한민국 (KR)',
    hsCode: '3304.99.5000',
    customsValue: 8,
    unitWeightLbs: 0.32,
    dimensions: '5.8 x 1.9 x 1.9 in',
    leadTimeDays: 5,
    shelfLifeMonths: 24,
    description: '흡수가 빠른 브라이트닝 앰플. Amazon 주력 SKU로 운영 중이다.',
    memo: 'Prime 묶음 프로모션 후보 SKU',
    keywords: ['Amazon', 'Prime', 'Best Seller'],
  },
  'seller-product-2': {
    brand: 'LUMIERE BEAUTY',
    barcode: '8809812300012',
    originCountry: '대한민국 (KR)',
    hsCode: '3304.99.5000',
    customsValue: 6.5,
    unitWeightLbs: 0.41,
    dimensions: '6.1 x 2.2 x 2.2 in',
    leadTimeDays: 7,
    shelfLifeMonths: 24,
    description: '보습 강화 세럼. 재고 부족 구간이라 보충 입고 우선 SKU로 관리한다.',
    memo: 'ICN-A 안전재고 20 미만',
    keywords: ['Low Stock', 'Hydration', 'Refill Priority'],
  },
  'seller-product-4': {
    brand: 'LUMIERE BEAUTY',
    barcode: '8809812300014',
    originCountry: '대한민국 (KR)',
    hsCode: '3307.90.0000',
    customsValue: 4.5,
    unitWeightLbs: 0.58,
    dimensions: '8.4 x 5.6 x 1.3 in',
    leadTimeDays: 4,
    shelfLifeMonths: 30,
    description: '5매입 번들 마스크팩. 프로모션 배너와 묶음 판매에 자주 쓰이는 SKU다.',
    memo: 'Amazon 광고 집행 중',
    keywords: ['Mask Pack', 'Bundle', 'Campaign'],
  },
  'seller-product-7': {
    brand: 'LUMIERE BEAUTY',
    barcode: '8809812300017',
    originCountry: '대한민국 (KR)',
    hsCode: '3304.99.9000',
    customsValue: 4.2,
    unitWeightLbs: 0.76,
    dimensions: '7.2 x 2.7 x 2.7 in',
    leadTimeDays: 10,
    shelfLifeMonths: 24,
    description: '민감성용 젤 클렌저. 시즌 종료로 현재 판매 비활성 상태다.',
    memo: '리뉴얼 패키지 적용 전 임시 비활성',
    keywords: ['Inactive', 'Renewal', 'Cleansing'],
  },
  'seller-product-8': {
    brand: 'LUMIERE BEAUTY',
    barcode: '8809812300018',
    originCountry: '대한민국 (KR)',
    hsCode: '3304.99.9000',
    customsValue: 7.2,
    unitWeightLbs: 0.37,
    dimensions: '5.6 x 2.1 x 1.9 in',
    leadTimeDays: 6,
    shelfLifeMonths: 24,
    description: 'SPF50 선크림. 재고 부족으로 긴급 보충 대상에 포함되어 있다.',
    memo: 'PUS-B 재고 5개',
    keywords: ['Suncare', 'Low Stock', 'PUS-B'],
  },
}

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

// 상품 상세 모달에 필요한 로컬 mock 정보를 반환한다.
export function getSellerProductDetailById(productId, product = {}) {
  const detail = SELLER_PRODUCT_DETAIL_MAP[productId]
  const salePrice = Number(product.salePrice ?? 0)
  const costPrice = Number(product.costPrice ?? 0)
  const totalStock = Number(product.availableStock ?? 0) + Number(product.allocatedStock ?? 0)
  const marginAmount = Number((salePrice - costPrice).toFixed(2))
  const marginRate = salePrice > 0 ? Number((((salePrice - costPrice) / salePrice) * 100).toFixed(1)) : 0

  return {
    brand: detail?.brand ?? 'LUMIERE BEAUTY',
    barcode: detail?.barcode ?? '미등록',
    originCountry: detail?.originCountry ?? '대한민국 (KR)',
    hsCode: detail?.hsCode ?? '3304.99.9000',
    customsValue: detail?.customsValue ?? costPrice,
    unitWeightLbs: detail?.unitWeightLbs ?? 0,
    dimensions: detail?.dimensions ?? '사이즈 정보 준비중',
    leadTimeDays: detail?.leadTimeDays ?? 7,
    shelfLifeMonths: detail?.shelfLifeMonths ?? 24,
    description: detail?.description ?? `${product.productName ?? '상품'} 상세 정보 준비중`,
    memo: detail?.memo ?? '상세 운영 메모 준비 전 기본 정보만 표시합니다.',
    keywords: detail?.keywords ?? [product.category ?? '기본', product.warehouseName ?? 'Warehouse'],
    totalStock,
    marginAmount,
    marginRate,
  }
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
