import { describe, expect, it } from 'vitest'

import {
  SELLER_MODAL_SIZE_PRESETS,
  buildSellerModalPanelStyle,
  getSellerModalSizePreset,
} from '@/utils/seller/sellerModal.utils.js'

describe('sellerModal utils', () => {
  it('기본 size 프리셋을 반환한다', () => {
    expect(getSellerModalSizePreset()).toEqual(SELLER_MODAL_SIZE_PRESETS.default)
  })

  it('알 수 없는 size 는 default 프리셋으로 처리한다', () => {
    expect(getSellerModalSizePreset('unknown')).toEqual(SELLER_MODAL_SIZE_PRESETS.default)
  })

  it('compact size 기준 패널 스타일을 만든다', () => {
    expect(buildSellerModalPanelStyle({ size: 'compact' })).toEqual({
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'min(560px, 90vh)',
    })
  })

  it('width prop 이 있으면 프리셋 너비보다 우선한다', () => {
    expect(buildSellerModalPanelStyle({ size: 'tall', width: '640px' })).toEqual({
      width: '640px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'min(820px, 90vh)',
    })
  })
})
