'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerProps {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

export function useTimer({ initialSeconds, onExpire, autoStart = true }: UseTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(autoStart)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsActive(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, secondsLeft])

  const start = useCallback(() => setIsActive(true), [])
  const pause = useCallback(() => setIsActive(false), [])
  const reset = useCallback((newSeconds?: number) => {
    setSecondsLeft(newSeconds !== undefined ? newSeconds : initialSeconds)
    setIsActive(false)
  }, [initialSeconds])

  const formatted = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`

  return {
    secondsLeft,
    formatted,
    isActive,
    start,
    pause,
    reset,
  }
}
