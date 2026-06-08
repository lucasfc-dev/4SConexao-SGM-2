'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user && user.is_super) {
      router.replace('/admin/gerenciar-estabelecimentos')
    }

  }, [router])
}