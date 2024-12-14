import { useEffect, useState, useCallback } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Eyes from './Eyes'

const MAX_PARTICIPANTS = 10
const THROTTLE_MS = 33
const BLINK_THRESHOLD = 80 // Adjust this value based on testing
const SAMPLES_SIZE = 30 // Number of samples to keep for rolling average
const THRESHOLD_MULTIPLIER = 1.2 // 30% above baseline

interface Participant {
  isBlinking: boolean
  online_at: string
  gazeX: number
  gazeY: number
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

  useEffect(() => {
    let currentChannel: RealtimeChannel | null = null
    const tempChannel = supabase.channel('room_discovery')
    const userId = window.crypto.randomUUID()
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
      // .showVideo(false) // Optionally hide video feed
      // .showFaceOverlay(false) // Hide face overlay
      // .showFaceFeedbackBox(false) // Hide face feedback box
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
        currentChannel.track({
          isBlinking,
          gazeX,
          gazeY,
          online_at: new Date().toISOString()
        })
      }
    }, THROTTLE_MS)

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
              isBlinking: false,
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
    webgazer.showVideo(true)
    webgazer.showFaceOverlay(true)
    webgazer.showFaceFeedbackBox(true)
    webgazer.showPredictionPoints(true)
    webgazer.applyKalmanFilter(true)
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
      webgazer.showVideo(false)
      webgazer.showFaceOverlay(false)
      webgazer.showFaceFeedbackBox(false)
      webgazer.showPredictionPoints(true)
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
        <>
          {/* Eyes for each participant */}
          {Object.entries(roomState.participants).map(([key, presences]) => {
            const participant = presences[0]
            return (
              <Eyes
                key={key}
                isBlinking={participant.isBlinking}
                gazeX={participant.gazeX}
                gazeY={participant.gazeY}
              />
            )
          })}
        </>
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
          <div>Threshold: {BLINK_THRESHOLD}</div>
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