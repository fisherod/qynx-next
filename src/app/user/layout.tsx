'use client'

import { useState, useEffect } from 'react'
import { ApiUser, getUser, getUserIdByEmail } from '@/lib/auth-api'
import { AUTH_USER_ID_KEY, AUTH_USERNAME_KEY } from '@/lib/constants'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<ApiUser | null>(null)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof sessionStorage === 'undefined') return

    let cancelled = false
    const run = async () => {
      let userId: string | null = sessionStorage.getItem(AUTH_USER_ID_KEY)
      const email = sessionStorage.getItem(AUTH_USERNAME_KEY)
      if (!userId && email) {
        userId = await getUserIdByEmail(email)
      }

      if (!userId) return

      const user = await getUser(userId)
      if (!user) return

      setUser(user)
      if (cancelled) return
    }
    run()
    return () => { cancelled = true }
  }, [mounted])



  return (
    <>
      {children}
    </>
  )
}
