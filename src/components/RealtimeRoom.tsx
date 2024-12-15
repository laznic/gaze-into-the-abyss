import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Eyes from './Eyes'

const MAX_PARTICIPANTS = 10
const THROTTLE_MS = 33
const SAMPLES_SIZE = 30 // Number of samples to keep for rolling average
const THRESHOLD_MULTIPLIER = 1.2 // 30% above baseline

interface Participant {
  isBlinking: boolean
  online_at: string
  gazeX: number
  gazeY: number
  position?: Position
  room?: number
}

interface RoomState {
  channel: RealtimeChannel | null
  participants: RealtimePresenceState<Participant>
}

interface DebugData {
  leftBrightness: number
  rightBrightness: number
  avgBrightness: number
  isBlinking: boolean
  error: string | null
}

interface CalibrationPoint {
  x: number
  y: number
}

interface Position {
  x: number
  y: number
}

declare global {
  interface Window {
    webgazer: {
      showPredictionPoints: (show: boolean) => typeof window.webgazer
      setGazeListener: (listener: (data: any) => void) => typeof window.webgazer
      begin: () => void
      end: () => void
      getTracker: () => any
      clearData: () => typeof window.webgazer
      showVideo: (show: boolean) => typeof window.webgazer
      showFaceOverlay: (show: boolean) => typeof window.webgazer
      showFaceFeedbackBox: (show: boolean) => typeof window.webgazer
      recordScreenPosition: (x: number, y: number, type: string) => typeof window.webgazer
    }
  }
}

const GRID_POSITIONS = [
  'center',      // 0: Center
  'middleLeft',  // 1: Left
  'middleRight', // 2: Right
  'topCenter',   // 3: Top
  'bottomCenter',// 4: Bottom
  'topLeft',     // 5: Top Left
  'topRight',    // 6: Top Right
  'bottomLeft',  // 7: Bottom Left
  'bottomRight'  // 8: Bottom Right
]

export function RealtimeRoom() {
  const [roomState, setRoomState] = useState<RoomState>({
    channel: null,
    participants: {}
  })
  const [debugData, setDebugData] = useState<DebugData>({
    leftBrightness: 0,
    rightBrightness: 0,
    avgBrightness: 0,
    isBlinking: false,
    error: null
  })
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([])
  const [currentPoint, setCurrentPoint] = useState(0)
  const userId = useRef(window.crypto.randomUUID())
  const assignedPositions = useRef<Map<string, Position>>(new Map())

  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null
    const tempChannel = supabase.channel('room_discovery')
    let lastBlinkTime = Date.now()
    let isCurrentlyBlinking = false

    // Create a canvas for processing eye patches
    const imageCanvas = document.createElement('canvas')
    const ctx = imageCanvas.getContext('2d')

    // Add rolling brightness samples array
    const brightnessSamples: number[] = []

    // Initialize WebGazer with blink detection
    window.webgazer
      .showPredictionPoints(true) // Show prediction points
      .showVideo(false) // Optionally hide video feed
      .showFaceOverlay(false) // Hide face overlay
      .showFaceFeedbackBox(false) // Hide face feedback box
      .setGazeListener(async (data: any) => {
        if (data == null || !currentChannel || !ctx) return

        try {
          // Get normalized gaze coordinates
          const gazeX = data.x / window.innerWidth
          const gazeY = data.y / window.innerHeight

          // Get video element
          const videoElement = document.getElementById('webgazerVideoFeed') as HTMLVideoElement
          if (!videoElement) {
            setDebugData(prev => ({ ...prev, error: 'Video feed not found' }))
            return
          }

          // Set canvas size to match video
          imageCanvas.width = videoElement.videoWidth
          imageCanvas.height = videoElement.videoHeight

          // Draw current frame to canvas
          ctx.drawImage(videoElement, 0, 0)

          // Get eye patches
          const tracker = window.webgazer.getTracker()
          const patches = await tracker.getEyePatches(
            videoElement,
            imageCanvas,
            videoElement.videoWidth,
            videoElement.videoHeight
          )

          if (!patches?.right?.patch?.data || !patches?.left?.patch?.data) {
            setDebugData(prev => ({ ...prev, error: 'No eye patches detected' }))
            return
          }

          // Calculate brightness for each eye
          const calculateBrightness = (imageData: ImageData) => {
            let total = 0

            for (let i = 0; i < imageData.data.length; i += 4) {
              // Convert RGB to grayscale
              const r = imageData.data[i]
              const g = imageData.data[i + 1]
              const b = imageData.data[i + 2]
              total += (r + g + b) / 3
            }
            return total / (imageData.width * imageData.height)
          }

          const rightEyeBrightness = calculateBrightness(patches.right.patch)
          const leftEyeBrightness = calculateBrightness(patches.left.patch)
          const avgBrightness = (rightEyeBrightness + leftEyeBrightness) / 2

          // Update rolling average
          if (brightnessSamples.length >= SAMPLES_SIZE) {
            brightnessSamples.shift() // Remove oldest sample
          }
          brightnessSamples.push(avgBrightness)

          // Calculate dynamic threshold from rolling average
          const rollingAverage = brightnessSamples.reduce((a, b) => a + b, 0) / brightnessSamples.length
          const dynamicThreshold = rollingAverage * THRESHOLD_MULTIPLIER

          // Update debug data
          setDebugData({
            leftBrightness: leftEyeBrightness,
            rightBrightness: rightEyeBrightness,
            avgBrightness,
            isBlinking: isCurrentlyBlinking,
            error: null
          })
          
          // Detect blink using dynamic threshold
          const blinkDetected = avgBrightness > dynamicThreshold

          // Debounce blink detection to avoid rapid changes
          if (blinkDetected !== isCurrentlyBlinking) {
            const now = Date.now()
            if (now - lastBlinkTime > 100) { // Minimum time between blink state changes
              isCurrentlyBlinking = blinkDetected
              lastBlinkTime = now
              throttledTrackPosition(blinkDetected, gazeX, gazeY)
            }
          } else {
            throttledTrackPosition(isCurrentlyBlinking, gazeX, gazeY)
          }
        } catch (error) {
          console.error('Error processing gaze data:', error)
          setDebugData(prev => ({ ...prev, error: error?.toString() || 'Unknown error' }))
        }
      })
      .saveDataAcrossSessions(true)
      .begin()

    // Create throttled position tracking function
    const throttledTrackPosition = createThrottledFunction((isBlinking: boolean, gazeX: number, gazeY: number) => {
      if (currentChannel) {
        const presenceState = currentChannel.presenceState<Participant>()
        const myPresence = presenceState[userId.current]?.[0]
        
        if (!myPresence) {
          console.error('No presence found for current user')
          return
        }

        // Track with all current data, preserving position
        currentChannel.track({
          isBlinking,
          gazeX,
          gazeY,
          online_at: new Date().toISOString(),
          position: myPresence.position,  // Preserve existing position
          room: myPresence.room          // Preserve room number
        })
      }
    }, THROTTLE_MS)

    const joinRoom = async (roomNumber = 1) => {
      const room = supabase.channel(`room_${roomNumber}`, {
        config: {
          presence: {
            key: userId.current
          }
        }
      })

      room
        .on('presence', { event: 'join' }, ({ key }) => {
          const presenceState = room.presenceState<Participant>()
          const presencesWithoutMe = Object.keys(presenceState).filter(key => key !== userId.current)
          
          if (key === userId.current && presencesWithoutMe.length >= MAX_PARTICIPANTS) {
            room.unsubscribe()
            joinRoom(roomNumber + 1)
          } else {
            currentChannel = room
            
            // Get all participants with positions first
            const participantsWithPositions = Object.entries(presenceState)
              .filter(([_, presences]) => presences[0].position)
              .sort((a, b) => a[1][0].online_at.localeCompare(b[1][0].online_at))

            // Get participants without positions
            const participantsWithoutPositions = Object.entries(presenceState)
              .filter(([_, presences]) => !presences[0].position)
              .sort((a, b) => a[1][0].online_at.localeCompare(b[1][0].online_at))

            // Build the updated state preserving order
            const updatedState = {} as RealtimePresenceState<Participant>
            
            // First add all participants that already have positions
            participantsWithPositions.forEach(([k, presences]) => {
              updatedState[k] = presences
            })

            // Then calculate positions for new participants
            participantsWithoutPositions.forEach(([k, presences]) => {
              // Check if we already have a position assigned for this participant
              let position = assignedPositions.current.get(k)
              
              if (!position) {
                // Only calculate new position if we don't have one stored
                const positionIndex = Object.keys(updatedState)
                  .filter(key => key !== userId.current)
                  .length
                position = findAvailablePosition(positionIndex)
                // Store the new position
                assignedPositions.current.set(k, position)
              }
              
              updatedState[k] = [{ ...presences[0], position }]
            })

            setRoomState({
              channel: currentChannel,
              participants: updatedState
            })
          }
        })
        .on('presence', { event: 'sync' }, () => {
          if (currentChannel) {
            const presenceState = currentChannel.presenceState<Participant>()
            
            // Same logic as join handler
            const participantsWithPositions = Object.entries(presenceState)
              .filter(([_, presences]) => presences[0].position)
              .sort((a, b) => a[1][0].online_at.localeCompare(b[1][0].online_at))

            const participantsWithoutPositions = Object.entries(presenceState)
              .filter(([_, presences]) => !presences[0].position)
              .sort((a, b) => a[1][0].online_at.localeCompare(b[1][0].online_at))

            const updatedState = {} as RealtimePresenceState<Participant>
            
            participantsWithPositions.forEach(([k, presences]) => {
              updatedState[k] = presences
            })

            participantsWithoutPositions.forEach(([k, presences]) => {
              // Check if we already have a position assigned for this participant
              let position = assignedPositions.current.get(k)
              
              if (!position) {
                // Only calculate new position if we don't have one stored
                const positionIndex = Object.keys(updatedState)
                  .filter(key => key !== userId.current)
                  .length
                position = findAvailablePosition(positionIndex)
                // Store the new position
                assignedPositions.current.set(k, position)
              }
              
              updatedState[k] = [{ ...presences[0], position }]
            })

            setRoomState(prev => ({
              ...prev,
              participants: updatedState
            }))
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await room.track({
              isBlinking: false,
              gazeX: 0.5,
              gazeY: 0.5,
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

    // Cleanup
    return () => {
      tempChannel.unsubscribe()
      if (currentChannel) {
        currentChannel.unsubscribe()
      }
      window.webgazer.end()
    }
  }, [])

  const startCalibration = useCallback(() => {
    const points: CalibrationPoint[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.5, y: 0.5 },
      { x: 0.1, y: 0.9 },
      { x: 0.9, y: 0.9 },
    ]
    setCalibrationPoints(points)
    setCurrentPoint(0)
    setIsCalibrating(true)

    // Update WebGazer settings one at a time
    const webgazer = window.webgazer
    webgazer.clearData()
    // webgazer.showVideo(true)
    // webgazer.showFaceOverlay(true)
    // webgazer.showFaceFeedbackBox(true)
    // webgazer.showPredictionPoints(true)
    // webgazer.applyKalmanFilter(true)
  }, [])

  const handleCalibrationClick = useCallback((event: React.MouseEvent) => {
    if (!isCalibrating) return

    // Record click location for calibration
    const x = event.clientX
    const y = event.clientY
    window.webgazer.recordScreenPosition(x, y, 'click')

    if (currentPoint < calibrationPoints.length - 1) {
      setCurrentPoint(prev => prev + 1)
    } else {
      setIsCalibrating(false)
      // Update WebGazer settings one at a time
      const webgazer = window.webgazer
      // webgazer.showVideo(false)
      // webgazer.showFaceOverlay(false)
      // webgazer.showFaceFeedbackBox(false)
      // webgazer.showPredictionPoints(true)
    }
  }, [isCalibrating, currentPoint, calibrationPoints.length])

  return (
    <>
      {isCalibrating ? (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCalibrationClick}
        >
          {calibrationPoints.map((point, index) => (
            <div
              key={index}
              className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                index === currentPoint ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
              } z-50`}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
              }}
            />
          ))}
          <div className="text-white text-center z-50">
            Click the red dot to calibrate ({currentPoint + 1}/{calibrationPoints.length})
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-8 md:gap-2 md:p-4 lg:max-w-6xl lg:mx-auto">
          {Object.entries(roomState.participants).map(([key, presences]) => {
            const participant = presences[0]
            if (key === userId.current) return null
            
            return (
              <div 
                key={key}
                className={`flex items-center justify-center ${getGridClass(participant.position)}`}
              >
                <Eyes
                  isBlinking={participant.isBlinking}
                  gazeX={participant.gazeX ?? 0.5}
                  gazeY={participant.gazeY ?? 0.5}
                  alignment={getEyeAlignment(participant.position)}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Debug panel */}
      <div className="fixed bottom-4 left-4 bg-black/50 p-2 rounded text-white text-sm space-y-2">
        <button 
          onClick={startCalibration}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Calibrate WebGazer
        </button>
        <div>Connected Participants: {Object.keys(roomState.participants).length}</div>
        
        {/* Eye tracking debug info */}
        <div className="space-y-1">
          <div>Left Eye Brightness: {debugData.leftBrightness.toFixed(2)}</div>
          <div>Right Eye Brightness: {debugData.rightBrightness.toFixed(2)}</div>
          <div>Average Brightness: {debugData.avgBrightness.toFixed(2)}</div>
          <div>Blinking: {debugData.isBlinking ? 'Yes' : 'No'}</div>
          {debugData.error && (
            <div className="text-red-400">Error: {debugData.error}</div>
          )}
        </div>

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

function findAvailablePosition(index: number): string {
  // Return position based on index, or first position if index is out of bounds
  return GRID_POSITIONS[index] || GRID_POSITIONS[0]
}

// Helper function to convert position to Tailwind grid classes
function getGridClass(position: string): string {
  switch (position) {
    case 'center': return 'col-start-2 row-start-2'
    case 'middleLeft': return 'col-start-1 row-start-2'
    case 'middleRight': return 'col-start-3 row-start-2'
    case 'topCenter': return 'col-start-2 row-start-1'
    case 'bottomCenter': return 'col-start-2 row-start-3'
    case 'topLeft': return 'col-start-1 row-start-1'
    case 'topRight': return 'col-start-3 row-start-1'
    case 'bottomLeft': return 'col-start-1 row-start-3'
    case 'bottomRight': return 'col-start-3 row-start-3'
    default: return 'col-start-2 row-start-2'
  }
}

function getEyeAlignment(position: string): 'start' | 'center' | 'end' {
  switch (position) {
    case 'topLeft':
    case 'topRight':
      return 'end'
    case 'bottomLeft':
    case 'bottomRight':
      return 'start'
    default:
      return 'center'
  }
}