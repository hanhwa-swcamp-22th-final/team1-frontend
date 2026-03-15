/**
 * utils/format.js — 표시 값 포맷 유틸리티
 *
 * 모든 함수는 null/undefined/NaN/빈값 입력 시 '-' 반환 (edge case 처리 포함).
 * 컴포넌트에서 직접 포맷 로직 작성 금지. 이 파일 함수만 사용할 것.
 */

/**
 * 날짜 포맷
 *
 * @param {Date|string|number} date — Date 객체, ISO 문자열, Unix timestamp(ms) 모두 허용
 * @param {'date'|'datetime'|'time'} [pattern='date']
 * @returns {string}
 *
 * 입력 → 출력 예:
 *   formatDate('2026-03-15')                 → '2026-03-15'
 *   formatDate('2026-03-15T09:30:00', 'datetime') → '2026-03-15 09:30'
 *   formatDate('2026-03-15T09:30:00', 'time')     → '09:30'
 *   formatDate(null)                          → '-'
 *   formatDate('invalid')                     → '-'
 */
export function formatDate(date, pattern = 'date') {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d)) return '-'  // 파싱 실패 시 '-' 반환

  const pad = (n) => String(n).padStart(2, '0')
  const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (pattern === 'time')     return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (pattern === 'datetime') return `${ymd} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return ymd
}

/**
 * 금액 포맷 (USD)
 *
 * @param {number} amount
 * @returns {string}
 *
 * 입력 → 출력 예:
 *   formatCurrency(1234.56)  → '$1,234.56'
 *   formatCurrency(0)        → '$0.00'
 *   formatCurrency(null)     → '-'
 *   formatCurrency(NaN)      → '-'
 *   formatCurrency(-50)      → '-$50.00'
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '-'
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * 무게 포맷 (g → kg 자동 변환)
 * 1000g 이상이면 kg으로 변환하여 표시.
 *
 * @param {number} grams — 그램(g) 단위 입력
 * @returns {string}
 *
 * 입력 → 출력 예:
 *   formatWeight(500)   → '500 g'
 *   formatWeight(1000)  → '1.00 kg'
 *   formatWeight(1234)  → '1.23 kg'
 *   formatWeight(null)  → '-'
 *   formatWeight(NaN)   → '-'
 */
export function formatWeight(grams) {
  if (grams == null || isNaN(grams)) return '-'
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`
  return `${grams} g`
}

/**
 * 숫자 천단위 구분 (한국어 로케일)
 *
 * @param {number} num
 * @returns {string}
 *
 * 입력 → 출력 예:
 *   formatNumber(1234567)  → '1,234,567'
 *   formatNumber(0)        → '0'
 *   formatNumber(null)     → '-'
 *   formatNumber(NaN)      → '-'
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '-'
  return new Intl.NumberFormat('ko-KR').format(num)
}
