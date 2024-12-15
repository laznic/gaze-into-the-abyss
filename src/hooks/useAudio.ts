import { useRef, useEffect, useCallback } from 'react'

export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audioRef.current = audio
    audio.volume = 0.4

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [src])

  const play = useCallback(() => {
    audioRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  return { play, pause }
} 