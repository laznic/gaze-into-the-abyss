import { useEffect, useState } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const MAX_PARTICIPANTS = 10

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

    const joinRoom = async (roomNumber = 1) => {
      // Create a channel for the specific room
      const room = supabase.channel(`room_${roomNumber}`, {
        config: {
          presence: {
            key: userId
          }
        }
      })

      room
        .on('presence', { event: 'join' }, ({ key }) => {
          // currentPresences does not return correct info hence manually fetching the state
          const presenceState = room.presenceState<Participant>()
          const presencesWithoutMe = Object.keys(presenceState).filter(key => key !== userId)
          
          if (key === userId && presencesWithoutMe.length >= MAX_PARTICIPANTS) {
            room.unsubscribe()
            // Try next room recursively
            joinRoom(roomNumber + 1)
          } else {
            currentChannel = room
    
            setRoomState({
              channel: currentChannel,
              participants: presenceState
            })
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
        // Start the room joining process
        joinRoom()
      }
    })

    // Cleanup
    return () => {
      tempChannel.unsubscribe()
      if (currentChannel) {
        currentChannel.unsubscribe()
      }
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-4 bg-black/50 p-2 rounded text-white text-sm">
      <div>Connected Participants: {Object.keys(roomState.participants).length}</div>
      <pre className="text-xs">
        {JSON.stringify(roomState.participants, null, 2)}
      </pre>
    </div>
  )
} 