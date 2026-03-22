/**
 * 셀러 ASN 목록 화면용 로컬 mock 데이터와 가공 유틸.
 * API 연동 전 단계라 KPI, 필터, 테이블 렌더링을 화면에서 바로 확인할 수 있게 한다.
 */
import { ASN_STATUS } from '@/constants/index.js'

// ASN 목록 화면에서 사용하는 mock 원본 데이터.
export const SELLER_ASN_LIST_ROWS = [
  {
    id: 'seller-asn-1',
    asnNo: 'ASN-20260318-001',
    warehouseName: 'NJ Warehouse',
    expectedDate: '2026-03-21',
    createdAt: '2026-03-18',
    skuCount: 3,
    totalQuantity: 420,
    status: ASN_STATUS.SUBMITTED,
    referenceNo: 'BL-240318-01',
    note: '온도 민감 상품 포함',
  },
  {
    id: 'seller-asn-2',
    asnNo: 'ASN-20260317-003',
    warehouseName: 'LA Warehouse',
    expectedDate: '2026-03-19',
    createdAt: '2026-03-17',
    skuCount: 2,
    totalQuantity: 180,
    status: ASN_STATUS.SUBMITTED,
    referenceNo: 'AIR-240317-02',
    note: '급행 입고 요청',
  },
  {
    id: 'seller-asn-3',
    asnNo: 'ASN-20260316-002',
    warehouseName: 'TX Warehouse',
    expectedDate: '2026-03-18',
    createdAt: '2026-03-16',
    skuCount: 4,
    totalQuantity: 560,
    status: ASN_STATUS.RECEIVED,
    referenceNo: 'TR-240316-03',
    note: '검수 완료',
  },
  {
    id: 'seller-asn-4',
    asnNo: 'ASN-20260314-005',
    warehouseName: 'NJ Warehouse',
    expectedDate: '2026-03-17',
    createdAt: '2026-03-14',
    skuCount: 1,
    totalQuantity: 96,
    status: ASN_STATUS.CANCELLED,
    referenceNo: 'SEA-240314-09',
    note: '선적 취소',
  },
  {
    id: 'seller-asn-5',
    asnNo: 'ASN-20260313-004',
    warehouseName: 'LA Warehouse',
    expectedDate: '2026-03-16',
    createdAt: '2026-03-13',
    skuCount: 5,
    totalQuantity: 720,
    status: ASN_STATUS.RECEIVED,
    referenceNo: 'BL-240313-04',
    note: '정상 입고',
  },
]

const SELLER_ASN_DETAIL_MAP = {
  'seller-asn-1': {
    supplierName: 'Lumiere Beauty HQ',
    originCountry: '대한민국',
    originPort: 'Busan Port',
    transportMode: 'Ocean Freight',
    incoterms: 'FOB',
    bookingNo: 'BK-260318-001',
    carrier: 'Maersk',
    arrivalWindow: '2026-03-21 AM',
    documents: ['Invoice', 'Packing List', 'MSDS'],
    items: [
      { sku: 'LB-AMP-30', productName: '루미에르 앰플 30ml', quantity: 180, cartons: 18 },
      { sku: 'LB-SRM-50', productName: '히알루론 세럼 50ml', quantity: 120, cartons: 12 },
      { sku: 'LB-CRM-100', productName: '비타민C 크림 100ml', quantity: 120, cartons: 10 },
    ],
  },
  'seller-asn-2': {
    supplierName: 'Lumiere Beauty Air Hub',
    originCountry: '대한민국',
    originPort: 'ICN Air Cargo',
    transportMode: 'Air Freight',
    incoterms: 'FCA',
    bookingNo: 'BK-260317-009',
    carrier: 'Korean Air Cargo',
    arrivalWindow: '2026-03-19 PM',
    documents: ['Invoice', 'Packing List'],
    items: [
      { sku: 'LB-SUN-50', productName: 'UV 선크림 SPF50 50ml', quantity: 80, cartons: 8 },
      { sku: 'LB-MSK-5P', productName: '콜라겐 마스크 5매입', quantity: 100, cartons: 10 },
    ],
  },
  'seller-asn-3': {
    supplierName: 'Lumiere Beauty Dallas',
    originCountry: '미국',
    originPort: 'Dallas FTZ',
    transportMode: 'Ground',
    incoterms: 'DAP',
    bookingNo: 'BK-260316-004',
    carrier: 'XPO Logistics',
    arrivalWindow: '2026-03-18 14:00',
    documents: ['Inbound Sheet', 'Packing List'],
    items: [
      { sku: 'LB-FOA-120', productName: '약산성 폼클렌저 120ml', quantity: 160, cartons: 8 },
      { sku: 'LB-TNR-150', productName: '리파이닝 토너 150ml', quantity: 120, cartons: 6 },
      { sku: 'LB-CLN-200', productName: '젤 클렌저 200ml', quantity: 140, cartons: 7 },
      { sku: 'LB-MST-100', productName: '미스트 토닝 100ml', quantity: 140, cartons: 7 },
    ],
  },
}

// 테이블 렌더링에 사용하는 컬럼 정의.
export const SELLER_ASN_LIST_COLUMNS = [
  { key: 'asnNo', label: 'ASN 번호', width: '170px' },
  { key: 'warehouseName', label: '목적 창고', width: '140px' },
  { key: 'expectedDate', label: '입고 예정일', width: '120px' },
  { key: 'skuCount', label: 'SKU 수', width: '90px', align: 'right' },
  { key: 'totalQuantity', label: '총 입고 수량', width: '110px', align: 'right' },
  { key: 'referenceNo', label: '참조 번호', width: '130px' },
  { key: 'createdAt', label: '등록일', width: '110px' },
  { key: 'status', label: '상태', width: '100px' },
  { key: 'actions', label: '관리', width: '150px', align: 'center' },
]

// ASN 상세 응답을 화면에서 바로 사용할 수 있게 정규화한다.
export function normalizeSellerAsnDetail(detail = null, row = {}) {
  if (detail) {
    return {
      ...detail,
      totalCartons: Array.isArray(detail.items)
        ? detail.items.reduce((sum, item) => sum + Number(item.cartons ?? 0), 0)
        : 0,
    }
  }

  return {
    supplierName: 'Lumiere Beauty Partner',
    originCountry: '대한민국',
    originPort: 'Origin Hub',
    transportMode: 'Mixed',
    incoterms: 'EXW',
    bookingNo: row.referenceNo ?? '-',
    carrier: '배차 정보 준비중',
    arrivalWindow: row.expectedDate ?? '-',
    documents: ['Packing List'],
    totalCartons: row.skuCount ?? 0,
    items: [
      {
        sku: row.referenceNo ?? 'SKU-PENDING',
        productName: row.note ?? '상세 품목 정보 준비중',
        quantity: row.totalQuantity ?? 0,
        cartons: row.skuCount ?? 0,
      },
    ],
  }
}

// ASN 상세 모달에 필요한 로컬 mock 정보를 반환한다.
export function getSellerAsnDetailById(asnId, row = {}) {
  return normalizeSellerAsnDetail(SELLER_ASN_DETAIL_MAP[asnId] ?? null, row)
}

// 상단 요약 카드에서 사용하는 KPI 값을 계산한다.
export function getSellerAsnKpi(rows = []) {
  return {
    total: rows.length,
    submitted: rows.filter((row) => row.status === ASN_STATUS.SUBMITTED).length,
    received: rows.filter((row) => row.status === ASN_STATUS.RECEIVED).length,
    cancelled: rows.filter((row) => row.status === ASN_STATUS.CANCELLED).length,
  }
}

/**
 * 상태 필터와 검색어를 적용해 화면에 표시할 ASN 목록을 만든다.
 * 검색어는 ASN 번호, 창고명, 참조 번호, 메모를 함께 조회한다.
 */
export function filterSellerAsnRows(rows = [], { status = 'all', search = '' } = {}) {
  const normalizedSearch = String(search).trim().toLowerCase()

  return rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status

    if (!normalizedSearch) return matchesStatus

    const haystack = [
      row.asnNo,
      row.warehouseName,
      row.referenceNo,
      row.note,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesStatus && haystack.includes(normalizedSearch)
  })
}
