import { useEffect, useRef, useState } from 'react'

interface WindInstance {
  id: number
  stopWind: () => void
}

const WindSound = () => {
  const [isListening, setIsListening] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const activeWindsRef = useRef<WindInstance[]>([])
  const nextWindIdRef = useRef(0)

  // Mic detection settings
  const VOLUME_THRESHOLD = 0.0015
  const DETECTION_INTERVAL = 50
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const SILENCE_DURATION = 200
  const [debugVolume, setDebugVolume] = useState(0)

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      })
      micStreamRef.current = stream
      
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      const micSource = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.2
      micSource.connect(analyser)
      analyserRef.current = analyser

      const processor = audioContext.createScriptProcessor(2048, 1, 1)
      micProcessorRef.current = processor
      analyser.connect(processor)
      processor.connect(audioContext.destination)

      let isWindPlaying = false
      const volumeHistory: number[] = []
      
      processor.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(array)
        
        // Focus on speech frequencies (roughly 85-255 Hz)
        let total = 0
        const startBin = Math.floor(85 * analyser.fftSize / audioContext.sampleRate)
        const endBin = Math.floor(255 * analyser.fftSize / audioContext.sampleRate)
        
        for (let i = startBin; i < endBin; i++) {
          total += array[i]
        }
        
        // Normalize and apply exponential scaling for better sensitivity
        const normalizedVolume = Math.pow(total / ((endBin - startBin) * 256), 2)
        
        // Keep a short history for smoothing
        volumeHistory.push(normalizedVolume)
        if (volumeHistory.length > 5) {
          volumeHistory.shift()
        }
        
        // Use average of recent volumes
        const averageVolume = volumeHistory.reduce((a, b) => a + b) / volumeHistory.length
        setDebugVolume(averageVolume)
        
        if (averageVolume > VOLUME_THRESHOLD) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
            silenceTimeoutRef.current = null
          }
          
          if (!isWindPlaying) {
            console.log('Starting wind, volume:', averageVolume)
            isWindPlaying = true
            startNewWind()
          }
        } else if (isWindPlaying && !silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Stopping wind, volume:', averageVolume)
            isWindPlaying = false
            stopAllWinds()
            silenceTimeoutRef.current = null
          }, SILENCE_DURATION)
        }
      }

      setIsListening(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopListening = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
      micStreamRef.current = null
    }
    
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect()
      micProcessorRef.current = null
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    stopAllWinds()
    setIsListening(false)
  }

  const startNewWind = () => {
    const windId = nextWindIdRef.current++
    const stopWind = createWind()
    activeWindsRef.current.push({ id: windId, stopWind })

    // Clean up fully faded out winds
    setTimeout(() => {
      activeWindsRef.current = activeWindsRef.current.filter(wind => wind.id !== windId)
    }, 7000)
  }

  const stopAllWinds = () => {
    activeWindsRef.current.forEach(wind => wind.stopWind())
  }

  const createWind = () => {
    const audioContext = new AudioContext()
    
    // Create oscillator for speech-like modulation
    const oscillator = audioContext.createOscillator()
    const oscillatorGain = audioContext.createGain()
    const modulationGain = audioContext.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.value = 1.75
    oscillatorGain.gain.value = 0.7
    modulationGain.gain.value = 0.8

    // Create noise
    const noiseBuffer = createNoiseBuffer(audioContext)
    const noiseNode = audioContext.createBufferSource()
    noiseNode.buffer = noiseBuffer
    noiseNode.loop = true

    // Create filters
    const bandpass = audioContext.createBiquadFilter()
    const highpass = audioContext.createBiquadFilter()
    const resonantFilter = audioContext.createBiquadFilter()
    
    // Configure filters
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 800
    bandpass.Q.value = 4.0

    highpass.type = 'highpass'
    highpass.frequency.value = 100
    highpass.Q.value = 1.0

    resonantFilter.type = 'peaking'
    resonantFilter.frequency.value = 2000
    resonantFilter.Q.value = 8.0
    resonantFilter.gain.value = 12

    // Create delays and gains
    const delay1 = audioContext.createDelay(10.0)
    const delay2 = audioContext.createDelay(10.0)
    const delay3 = audioContext.createDelay(10.0)
    
    delay1.delayTime.value = 1.2
    delay2.delayTime.value = 1.8
    delay3.delayTime.value = 2.4

    const feedbackGain1 = audioContext.createGain()
    const feedbackGain2 = audioContext.createGain()
    const feedbackGain3 = audioContext.createGain()
    
    feedbackGain1.gain.value = 0.1
    feedbackGain2.gain.value = 0.1
    feedbackGain3.gain.value = 0.1

    // Create reverb
    const reverbLength = 8
    const sampleRate = audioContext.sampleRate
    const bufferLength = sampleRate * reverbLength
    const reverbBuffer = audioContext.createBuffer(2, bufferLength, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = reverbBuffer.getChannelData(channel)
      for (let i = 0; i < bufferLength; i++) {
        const decay = Math.exp(-i / (sampleRate * 3.0))
        const modulation = Math.sin(i * 0.0005) * 0.2
        channelData[i] = (Math.random() * 2 - 1) * (decay + modulation)
      }
    }

    const reverb = audioContext.createConvolver()
    reverb.buffer = reverbBuffer
    const reverbGain = audioContext.createGain()
    reverbGain.gain.value = 0.1

    const mainGain = audioContext.createGain()
    mainGain.gain.value = 0

    // Connect everything
    noiseNode.connect(bandpass)
    bandpass.connect(highpass)
    highpass.connect(resonantFilter)
    
    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(modulationGain.gain)
    
    resonantFilter.connect(modulationGain)
    modulationGain.connect(delay1)
    modulationGain.connect(delay2)
    modulationGain.connect(delay3)
    
    delay1.connect(feedbackGain1)
    delay2.connect(feedbackGain2)
    delay3.connect(feedbackGain3)
    
    feedbackGain1.connect(delay2)
    feedbackGain2.connect(delay3)
    feedbackGain3.connect(delay1)
    
    delay1.connect(reverb)
    delay2.connect(reverb)
    delay3.connect(reverb)
    modulationGain.connect(reverb)
    
    reverb.connect(reverbGain)
    reverbGain.connect(mainGain)
    modulationGain.connect(mainGain)
    
    mainGain.connect(audioContext.destination)

    // Start with fade in
    mainGain.gain.setTargetAtTime(0.15, audioContext.currentTime, 4.0)

    // Start everything
    noiseNode.start()
    oscillator.start()

    let buildupTime = 0
    const slowLFO = 0.02
    const gustLFO = 0.008

    // Start modulation
    const modulate = () => {
      const time = audioContext.currentTime
      buildupTime += 0.016
      
      const phase = Math.min(buildupTime / 5, 1)
      const gustIntensity = (Math.sin(time * gustLFO) + 1) * 0.5 * phase
      
      const baseFreq = 600 + (Math.sin(time * slowLFO) * 500)
      const randomVar = Math.random() * 50 - 25
      
      const targetFreq = baseFreq + (randomVar * gustIntensity)
      
      bandpass.frequency.setTargetAtTime(
        targetFreq,
        time,
        0.2 + (gustIntensity * 0.3)
      )
      
      resonantFilter.frequency.setTargetAtTime(
        1200 + (Math.sin(time * 0.015) * 1000),
        time,
        0.3
      )
      
      if (isPlaying) {
        requestAnimationFrame(modulate)
      }
    }

    let isPlaying = true
    modulate()

    // Return stop function
    return () => {
      const fadeOutDuration = 1.5
      isPlaying = false

      mainGain.gain.setValueAtTime(mainGain.gain.value, audioContext.currentTime)
      mainGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOutDuration)
      reverbGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOutDuration)

      setTimeout(() => {
        noiseNode.stop()
        oscillator.stop()
        audioContext.close()
      }, fadeOutDuration * 1000)
    }
  }

  // Also add this helper function at the component level
  const createNoiseBuffer = (audioContext: AudioContext) => {
    const bufferSize = 4 * audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      const harmonic = Math.sin(i * 0.01) * 0.2
      output[i] = (Math.random() * 2 - 1) + harmonic
    }

    return buffer
  }

  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => isListening ? stopListening() : startListening()}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 
                   transition-colors duration-200 flex items-center gap-2"
      >
        <div 
          className={`w-3 h-3 rounded-full ${
            isListening ? 'bg-red-500' : 'bg-gray-400'
          }`} 
        />
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      {isListening && (
        <div className="mt-2 text-sm text-gray-600">
          Volume: {debugVolume.toFixed(6)}
          <div 
            className="w-full h-2 bg-gray-200 rounded mt-1"
            style={{
              background: `linear-gradient(to right, 
                ${debugVolume > VOLUME_THRESHOLD ? 'green' : 'gray'} 
                ${(debugVolume * 1000)}%, 
                #eee ${(debugVolume * 1000)}%)`
            }}
          />
        </div>
      )}
    </div>
  )
}

export default WindSound 