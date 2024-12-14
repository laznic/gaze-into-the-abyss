import { useEffect, useState } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const MAX_PARTICIPANTS = 10
const THROTTLE_MS = 200 // 50ms throttle time (20 updates per second)

interface Participant {
  x: number
  y: number
  online_at: string
}

interface RoomState {
  channel: RealtimeChannel | null
  participants: RealtimePresenceState<Participant>
}

export function RealtimeRoom() {
  const [roomState, setRoomState] = useState<RoomState>({
    channel: null,
    participants: {}
  })

  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null
    const tempChannel = supabase.channel('room_discovery')
    const userId = window.crypto.randomUUID()

    // Create throttled position tracking function that updates at most every 50ms
    const throttledTrackPosition = createThrottledFunction((x: number, y: number) => {
      if (currentChannel) {
        currentChannel.track({
          x,
          y,
          online_at: new Date().toISOString()
        })
      }
    }, THROTTLE_MS)

    const handleMouseMove = (event: MouseEvent) => {
      throttledTrackPosition(event.clientX, event.clientY)
    }

    const joinRoom = async (roomNumber = 1) => {
      const room = supabase.channel(`room_${roomNumber}`, {
        config: {
          presence: {
            key: userId
          }
        }
      })

      room
        .on('presence', { event: 'join' }, ({ key }) => {
          const presenceState = room.presenceState<Participant>()
          const presencesWithoutMe = Object.keys(presenceState).filter(key => key !== userId)
          
          if (key === userId && presencesWithoutMe.length >= MAX_PARTICIPANTS) {
            room.unsubscribe()
            joinRoom(roomNumber + 1)
          } else {
            currentChannel = room
            setRoomState({
              channel: currentChannel,
              participants: presenceState
            })
          }
        })
        .on('presence', { event: 'sync' }, () => {
          // Update state whenever any presence changes (including mouse movements)
          if (currentChannel) {
            setRoomState(prev => ({
              ...prev,
              participants: currentChannel.presenceState<Participant>()
            }))
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await room.track({
              x: 0,
              y: 0,
              online_at: new Date().toISOString(),
              room: roomNumber
            })
          }
        })
    }

    // Subscribe to temp channel only once
    tempChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        joinRoom()
      }
    })

    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      tempChannel.unsubscribe()
      if (currentChannel) {
        currentChannel.unsubscribe()
      }
    }
  }, [])

  return (
    <>
      {/* Cursor elements for each participant */}
      {Object.entries(roomState.participants).map(([key, presences]) => {
        const participant = presences[0] // Get first presence state for this participant
        return (
          <div
            key={key}
            className="fixed w-4 h-4 rounded-full bg-blue-500/50 pointer-events-none"
            style={{
              left: participant.x,
              top: participant.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Optional: Add a tooltip showing participant ID */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/75 px-2 py-1 rounded text-white text-xs whitespace-nowrap">
              {key.slice(0, 6)}
            </div>
          </div>
        )
      })}

      {/* Existing debug panel */}
      <div className="fixed bottom-4 left-4 bg-black/50 p-2 rounded text-white text-sm">
        <div>Connected Participants: {Object.keys(roomState.participants).length}</div>
        <pre className="text-xs">
          {JSON.stringify(roomState.participants, null, 2)}
        </pre>
      </div>
    </>
  )
} 

/**
 * Creates a throttled version of a function that can only be called at most once 
 * in the specified time period.
 * 
 * @param functionToThrottle The function to be throttled
 * @param waitTimeMs The minimum time that must pass between function calls
 * @returns A throttled version of the input function
 */
function createThrottledFunction<T extends (...args: unknown[]) => unknown>(
  functionToThrottle: T,
  waitTimeMs: number
): (...args: Parameters<T>) => void {
  let isWaitingToExecute = false

  return function throttledFunction(...args: Parameters<T>) {
    // If we're not waiting, execute the function immediately
    if (!isWaitingToExecute) {
      // Call the original function
      functionToThrottle.apply(this, args)
      
      // Set the waiting flag
      isWaitingToExecute = true

      // Start the timer to reset the waiting flag
      setTimeout(() => {
        isWaitingToExecute = false
      }, waitTimeMs)
    }
    // If we are waiting, the function call is ignored
  }
}