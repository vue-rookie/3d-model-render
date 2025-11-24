"use client"

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  username: string
  purchasedProducts?: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  const setToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [])

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setState({ user: data.user, token, isLoading: false })
      } else {
        setToken(null)
        setState({ user: null, token: null, isLoading: false })
      }
    } catch {
      setToken(null)
      setState({ user: null, token: null, isLoading: false })
    }
  }, [setToken])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser(token)
    } else {
      setState({ user: null, token: null, isLoading: false })
    }
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (data.success) {
      setToken(data.token)
      setState({ user: data.user, token: data.token, isLoading: false })
    }
    return data
  }

  const register = async (email: string, password: string, username: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })
    const data = await response.json()
    if (data.success) {
      setToken(data.token)
      setState({ user: data.user, token: data.token, isLoading: false })
    }
    return data
  }

  const logout = () => {
    setToken(null)
    setState({ user: null, token: null, isLoading: false })
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetchUser(token)
    }
  }

  return {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isLoggedIn: !!state.user,
    login,
    register,
    logout,
    refreshUser,
  }
}
