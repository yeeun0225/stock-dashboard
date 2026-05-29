'use client'

import { useEffect, useState } from 'react'

function getKoreanTime(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ClientTimestamp() {
  const [time, setTime] = useState('')

  useEffect(() => {
    setTime(getKoreanTime())
    const id = setInterval(() => setTime(getKoreanTime()), 1000)
    return () => clearInterval(id)
  }, [])

  return <>{time || '—'}</>
}
