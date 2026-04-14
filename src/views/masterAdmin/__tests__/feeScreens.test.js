import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ROUTE_NAMES } from '@/constants/routes'
import { SYSTEM_ADMIN_MENU_GROUPS } from '@/components/layout/menus/systemAdmin'
import systemAdminRoutes from '@/router/routes/systemAdmin'

function readSource(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('admin fee screens', () => {
  it('시스템관리자 수입 부가비용 페이지 연결이 제거되어 있다', () => {
    const menuItems = SYSTEM_ADMIN_MENU_GROUPS.flatMap((group) => group.items)

    expect('SYS_IMPORT_SURCHARGE' in ROUTE_NAMES).toBe(false)
    expect(menuItems.some((item) => item.label === '수입 부가비용')).toBe(false)
    expect(systemAdminRoutes.some((route) => route.path === '/system/import-surcharges')).toBe(false)
    expect(
      existsSync(resolve(process.cwd(), 'src/views/systemAdmin/ImportSurchargeView.vue')),
    ).toBe(false)
  })

  it('현재 설정 요금 조회 화면은 보관비와 피킹/패킹 2열만 유지한다', () => {
    const source = readSource('src/views/masterAdmin/FeeView.vue')

    expect(source).not.toContain('라스트마일 표준 요율')
    expect(source).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(source).toContain('@media (max-width: 960px)')
  })

  it('3PL 사용료 설정 화면은 보관비와 피킹 및 패킹 단가 2열만 유지한다', () => {
    const source = readSource('src/views/masterAdmin/FeeSettings.vue')

    expect(source).not.toContain('라스트마일 배송 요율')
    expect(source).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(source).toContain('@media (max-width: 960px)')
  })
})
