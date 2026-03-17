/**
 * 셀러 주문 등록 관련 유틸 모음.
 * 업로드 포맷 정보와 수동 등록 검증 로직을 한 곳에서 관리한다.
 */
import { validateSku } from '@/utils/validate'

// 엑셀 업로드 파싱 전에 반드시 있어야 하는 필수 헤더 목록.
export const ORDER_UPLOAD_REQUIRED_COLUMNS = [
  '주문번호',
  '주문일자',
  '수령인',
  '연락처',
  '배송지',
  'SKU',
  '수량',
]

// 주문 업로드 포맷 예시를 표로 보여줄 때 사용하는 컬럼 정의.
export const ORDER_PREVIEW_COLUMNS = [
  { key: 'orderNo', label: '주문번호', width: '150px' },
  { key: 'orderDate', label: '주문일자', width: '120px' },
  { key: 'recipient', label: '수령인', width: '100px' },
  { key: 'contact', label: '연락처', width: '140px' },
  { key: 'address', label: '배송지' },
  { key: 'sku', label: 'SKU', width: '150px' },
  { key: 'quantity', label: '수량', width: '90px', align: 'right' },
  { key: 'requestNote', label: '요청사항', width: '180px' },
]

// 실제 업로드 연결 전 화면에서 보여줄 샘플 행 데이터.
export const ORDER_TEMPLATE_PREVIEW_ROWS = [
  {
    id: 'sample-order-1',
    orderNo: 'ORD-20260317-001',
    orderDate: '2026-03-17',
    recipient: '홍길동',
    contact: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123',
    sku: 'SKU-AMPLE-001',
    quantity: '2',
    requestNote: '부재 시 문 앞 보관',
  },
]

// 원본 엑셀 헤더를 정리한 뒤 누락된 필수 헤더만 반환한다.
export function getMissingOrderUploadColumns(headers = []) {
  const normalizedHeaders = new Set(
    headers
      .map((header) => String(header).trim())
      .filter(Boolean),
  )

  return ORDER_UPLOAD_REQUIRED_COLUMNS.filter((header) => !normalizedHeaders.has(header))
}

// 업로드한 엑셀 행 데이터를 화면 미리보기 표 형식으로 변환한다.
export function mapOrderUploadRows(rows = []) {
  return rows.map((row, index) => ({
    id: `upload-order-${index + 1}`,
    orderNo: String(row['주문번호'] ?? '').trim(),
    orderDate: String(row['주문일자'] ?? '').trim(),
    recipient: String(row['수령인'] ?? '').trim(),
    contact: String(row['연락처'] ?? '').trim(),
    address: String(row['배송지'] ?? '').trim(),
    sku: String(row.SKU ?? '').trim(),
    quantity: String(row['수량'] ?? '').trim(),
    requestNote: String(row['요청사항'] ?? '').trim(),
  }))
}

// 현재 수동 주문 등록 폼을 검증하고 필드별 에러 메시지를 반환한다.
export function validateOrderForm(form = {}) {
  const errors = {
    orderNo: '',
    orderDate: '',
    recipient: '',
    contact: '',
    address1: '',
    sku: '',
    quantity: '',
  }

  // 필수값을 먼저 검사해서 화면에 바로 에러를 연결할 수 있게 한다.
  if (!String(form.orderNo ?? '').trim()) errors.orderNo = '주문번호를 입력하세요.'
  if (!form.orderDate) errors.orderDate = '주문일자를 선택하세요.'
  if (!String(form.recipient ?? '').trim()) errors.recipient = '수령인을 입력하세요.'
  if (!String(form.contact ?? '').trim()) errors.contact = '연락처를 입력하세요.'
  if (!String(form.address1 ?? '').trim()) errors.address1 = '기본 배송지를 입력하세요.'

  // SKU 는 프로젝트 공통 검증 규칙을 그대로 재사용한다.
  const sku = String(form.sku ?? '').trim()
  if (!sku) {
    errors.sku = 'SKU를 입력하세요.'
  } else if (!validateSku(sku)) {
    errors.sku = 'SKU 형식이 올바르지 않습니다.'
  }

  // API 연동 전이라도 수량은 1 이상만 허용한다.
  if (!form.quantity || Number(form.quantity) < 1) {
    errors.quantity = '수량은 1 이상이어야 합니다.'
  }

  return errors
}
