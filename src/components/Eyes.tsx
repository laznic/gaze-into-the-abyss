interface EyesProps {
  isBlinking: boolean
  gazeX?: number  // Normalized value between 0 and 1
  gazeY?: number  // Normalized value between 0 and 1
}

const Eyes = ({ isBlinking = false, gazeX = 0.5, gazeY = 0.5 }: EyesProps) => {
  // Calculate pupil offset based on gaze (limit the movement range)
  const pupilOffsetX = (gazeX - 0.5) * 30  // Max 15px movement left/right
  const pupilOffsetY = (gazeY - 0.5) * 20  // Max 10px movement up/down

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg
          width="240"
          height="140"
          viewBox="0 0 240 140"
          className="transition-all duration-150"
        >
          {/* Definitions for gradients and filters */}
          <defs>
            <filter id="pupil-blur">
              <feGaussianBlur stdDeviation="0.75" />
            </filter>
            <radialGradient id="eyeball-gradient">
              <stop offset="60%" stopColor="#dcdae0" />
              <stop offset="100%" stopColor="#a8a7ad" />
            </radialGradient>
            <radialGradient 
              id="pupil-gradient"
              cx="0.35"
              cy="0.35"
              r="0.65"
            >
              <stop offset="0%" stopColor="#444" />
              <stop offset="75%" stopColor="#000" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          </defs>

          {/* Eyeball */}
          <ellipse
            cx="120"
            cy="70"
            rx="100"
            ry="65"
            fill="url(#eyeball-gradient)"
          />

          {/* Pupil with filter and gradient */}
          <ellipse
            cx={120 + pupilOffsetX}
            cy={70 + pupilOffsetY}
            rx="48"
            ry="48"
            fill="url(#pupil-gradient)"
            filter="url(#pupil-blur)"
            className={`transition-all duration-150 ${isBlinking ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Light reflections */}
          <circle
            cx={95 + pupilOffsetX}
            cy={55 + pupilOffsetY}
            r="7"
            fill="white"
            className="transition-all duration-150"
          />
          <circle
            cx={113 + pupilOffsetX}
            cy={55 + pupilOffsetY}
            r="4"
            fill="white"
            className="transition-all duration-150"
          />
        </svg>
      </div>
    </div>
  )
}

export default Eyes 