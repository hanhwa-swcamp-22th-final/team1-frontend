/**
 * utils/storage.js — localStorage / sessionStorage 헬퍼
 *
 * JSON 직렬화/역직렬화를 래핑하고 에러를 무시하는 유틸리티.
 *
 * ls vs ss 선택 기준:
 *   ls (localStorage)    — 브라우저를 닫아도 유지 (로그인 상태, 사용자 설정 등)
 *   ss (sessionStorage)  — 탭/창 닫으면 삭제 (임시 필터 값, 폼 임시 저장 등)
 *
 * ⚠️  주의사항:
 *   - pinia-plugin-persistedstate가 관리하는 키('conk-auth', 'conk-warehouse')는
 *     이 헬퍼 대신 스토어의 setAuth/setWarehouse 등을 통해 수정할 것.
 *   - 민감 정보(비밀번호, 카드번호 등) 저장 금지.
 *   - QuotaExceededError: set() 내부에서 catch로 무시됨.
 *     대용량 데이터 저장 시 IndexedDB 사용을 고려할 것.
 *
 * 사용 예:
 *   import { ls, ss } from '@/utils/storage'
 *
 *   // localStorage 사용
 *   ls.set('user-prefs', { theme: 'dark', lang: 'ko' })
 *   const prefs = ls.get('user-prefs')  // { theme: 'dark', lang: 'ko' } 또는 null
 *   ls.remove('user-prefs')
 *
 *   // sessionStorage 사용 (탭 유지 기간만)
 *   ss.set('draft-asn', formData)
 *   const draft = ss.get('draft-asn')   // null (탭 닫으면)
 */

const make = (storage) => ({
  /**
   * 값 읽기
   * @param {string} key
   * @returns {any|null} 파싱된 값 또는 null(키 없음/파싱 실패)
   */
  get(key) {
    try {
      const raw = storage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      // JSON.parse 실패 시 null 반환 (손상된 데이터)
      return null
    }
  },

  /**
   * 값 저장
   * @param {string} key
   * @param {any} value — JSON으로 직렬화 가능한 값
   */
  set(key, value) {
    try {
      storage.setItem(key, JSON.stringify(value))
    } catch {
      // QuotaExceededError 등 스토리지 한계 초과 시 무시
    }
  },

  /**
   * 키 삭제
   * @param {string} key
   */
  remove(key) {
    storage.removeItem(key)
  },
})

/** localStorage 헬퍼 — 브라우저 닫아도 유지 */
export const ls = make(localStorage)

/** sessionStorage 헬퍼 — 탭/창 닫으면 삭제 */
export const ss = make(sessionStorage)
