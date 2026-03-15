/**
 * stores/ui.js — 전역 UI 상태 스토어 (persist 없음)
 *
 * 포함 상태:
 *   isLoading     — 전역 로딩 오버레이 표시 여부
 *
 * persist 미적용 이유:
 *   로딩 상태는 페이지 이동 시 초기화가 맞음.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // 전역 로딩 오버레이: true 시 LoadingSpinner fullscreen 표시
  const isLoading = ref(false)

  /**
   * 전역 로딩 상태 제어
   * 사용 패턴:
   *   ui.setLoading(true)
   *   try {
   *     await someApiCall()
   *   } finally {
   *     ui.setLoading(false)  // 성공/실패 모두 반드시 false로
   *   }
   *
   * @param {boolean} val
   */
  function setLoading(val) {
    isLoading.value = val
  }

  return { isLoading, setLoading }
})