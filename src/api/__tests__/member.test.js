import { describe, it, expect, vi, beforeEach } from 'vitest'
import instance from '@/api/instance'
import { login, refreshSession, logoutSession, getSellerStats } from '@/api/member'

vi.mock('@/api/instance', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
  },
}))

describe('member API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login은 POST /member/auth/login을 호출한다', async () => {
    const payload = { email: 'test@test.com', password: '1234' }
    await login(payload)
    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/member/auth/login', payload, {
      _skipAuthRefresh: true,
    })
  })

  it('refreshSession은 POST /member/auth/refresh를 호출한다', async () => {
    await refreshSession()
    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/member/auth/refresh', null, {
      _skipAuthRefresh: true,
    })
  })

  it('logoutSession은 POST /member/auth/logout을 호출한다', async () => {
    await logoutSession()
    expect(instance.post).toHaveBeenCalledOnce()
    expect(instance.post).toHaveBeenCalledWith('/member/auth/logout')
  })

  it('getSellerStats는 GET /member/sellers/stats를 호출한다', async () => {
    await getSellerStats()
    expect(instance.get).toHaveBeenCalledOnce()
    expect(instance.get).toHaveBeenCalledWith('/member/sellers/stats')
  })
})
