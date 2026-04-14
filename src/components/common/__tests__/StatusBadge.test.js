import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'

function mountStatusBadge(props) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(StatusBadge, props)
  app.mount(container)

  return { app, container }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('StatusBadge', () => {
  it('order type은 백엔드 raw status를 프론트 표시 상태로 렌더링한다', async () => {
    const { app, container } = mountStatusBadge({
      status: 'PACKING',
      type: 'order',
    })

    await nextTick()

    const badge = container.querySelector('.badge')

    expect(container.textContent).toContain('물품준비중')
    expect(badge?.classList.contains('badge--purple')).toBe(true)

    app.unmount()
  })

  it('order type이 아니면 기존 상태 매핑을 그대로 사용한다', async () => {
    const { app, container } = mountStatusBadge({
      status: 'RECEIVED',
      type: 'asn',
    })

    await nextTick()

    const badge = container.querySelector('.badge')

    expect(container.textContent).toContain('입고완료')
    expect(badge?.classList.contains('badge--green')).toBe(true)

    app.unmount()
  })
})
