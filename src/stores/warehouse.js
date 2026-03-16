/**
 * stores/warehouse.js — WH_MANAGER 현재 선택 창고 스토어
 *
 * ⚠️  사용 제한:
 *   이 스토어는 WH_MANAGER Role 화면(views/whManager/)에서만 사용.
 *   다른 Role(SELLER, MASTER_ADMIN 등)은 창고를 선택하는 개념이 없음.
 *   SELLER는 자신의 재고가 위치한 창고를 서버에서 받아 표시만 함.
 *
 * selectedWarehouse 객체 형태 (예시):
 *   {
 *     id:   number,    // 창고 고유 ID
 *     name: string,    // 창고명 (예: "인천 1창고")
 *     code: string,    // 창고 코드 (예: "WH-ICN-001")
 *     ...              // 백엔드 API 스펙에 따라 추가 필드 가능
 *   }
 *
 * persist 적용 이유:
 *   WH_MANAGER가 창고 목록에서 창고를 선택한 뒤
 *   새로고침해도 선택이 유지되어야 UX가 자연스러움.
 *   persist key: 'conk-warehouse'
 *
 * 사용 예:
 *   import { useWarehouseStore } from '@/stores/warehouse'
 *   const wh = useWarehouseStore()
 *   wh.setWarehouse(warehouseData)  // 창고 목록에서 선택 시
 *   console.log(wh.selectedWarehouse?.name)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWarehouseStore = defineStore(
  'warehouse',
  () => {
    /** 현재 선택된 창고. null이면 미선택 상태 */
    const selectedWarehouse = ref(null)

    /**
     * 창고 선택
     * WH_MANAGER 창고 목록 화면에서 창고 클릭 시 호출
     * @param {{ id, name, code, ... }} wh
     */
    function setWarehouse(wh) {
      selectedWarehouse.value = wh
    }

    /**
     * 창고 선택 해제 (로그아웃 시 또는 창고 삭제 시)
     */
    function clearWarehouse() {
      selectedWarehouse.value = null
    }

    return { selectedWarehouse, setWarehouse, clearWarehouse }
  },
  {
    // 새로고침 후에도 선택된 창고 유지
    persist: {
      key: 'conk-warehouse',
      storage: localStorage,
    },
  }
)
