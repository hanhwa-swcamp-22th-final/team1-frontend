/**
 * utils/validate.js — 입력값 유효성 검사 유틸리티
 *
 * ⚠️  백엔드 동일성 확인 필요:
 *   이 파일의 정규식은 백엔드 유효성 검사와 반드시 동일해야 합니다.
 *   백엔드 변경 시 이 파일도 함께 업데이트할 것.
 */

/**
 * 이메일 형식 검사
 * 패턴: {공백·@이외}@{공백·@이외}.{공백·@이외}
 * 주의: RFC 5321 완전 준수가 아닌 실용적 검사. 복잡한 엣지케이스는 무시.
 *
 * @param {string} email
 * @returns {boolean}
 *
 * 통과: 'user@example.com', 'user+tag@sub.domain.co.kr'
 * 실패: 'user@', '@example.com', 'user@example', ''
 */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

/**
 * 비밀번호 복잡도 검사
 * 규칙: 영문 소문자 + 영문 대문자 + 숫자 + 특수문자 포함, 최소 8자
 * 패턴 분해:
 *   (?=.*[a-z])    — 소문자 최소 1개
 *   (?=.*[A-Z])    — 대문자 최소 1개
 *   (?=.*\d)       — 숫자 최소 1개
 *   (?=.*[\W_])    — 특수문자 최소 1개 (\W = 비단어문자, _ 포함)
 *   .{8,}          — 전체 8자 이상
 *
 * TODO: 백엔드 비밀번호 정책 확인 후 규칙 동기화 필요
 *
 * @param {string} pw
 * @returns {boolean}
 *
 * 통과: 'Abcd1234!'
 * 실패: 'password' (대문자·특수문자 없음), 'Abc1!' (8자 미만)
 */
export function validatePassword(pw) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(String(pw))
}

/**
 * SKU 코드 형식 검사
 * 규칙: 영문자(대소) + 숫자 + 하이픈(-) 조합, 4~32자
 * 패턴: ^[A-Za-z0-9-]{4,32}$
 *
 * TODO: 백엔드 SKU 규칙 확인 (공백, 언더스코어 허용 여부)
 *
 * @param {string} sku
 * @returns {boolean}
 *
 * 통과: 'SKU-001', 'PROD-A123-XL'
 * 실패: 'AB' (너무 짧음), 'SKU 001' (공백), 'SKU@001' (특수문자)
 */
export function validateSku(sku) {
  return /^[A-Za-z0-9-]{4,32}$/.test(String(sku).trim())
}
