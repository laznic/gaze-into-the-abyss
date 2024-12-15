interface EyesProps {
  isBlinking: boolean
  gazeX?: number  // Normalized value between 0 and 1
  gazeY?: number  // Normalized value between 0 and 1
}

const Eyes = ({ isBlinking = false, gazeX = 0.5, gazeY = 0.5 }: EyesProps) => {
  // Calculate pupil offset based on gaze (limit the movement range)
  const pupilOffsetX = (gazeX - 0.5) * 40  // Max 15px movement left/right
  const pupilOffsetY = (gazeY - 0.5) * 30  // Max 10px movement up/down

  // Define the open and closed states for both eyelids
  const upperLidOpen = "M128.5 53.5C59.3 55.5 33 99.6667 28.5 121.5H0V0L261.5 0V121.5H227.5C214.7 65.1 156.167 52.6667 128.5 53.5Z"
  const upperLidClosed = "M128.5 117.5C59.3 117.5 33 117.5 28.5 117.5H0V0L261.5 0V117.5H227.5C214.7 117.5 156.167 117.5 128.5 117.5Z"
  
  const lowerLidOpen = "M128.5 181C59.3 179 33 134.833 28.5 113H0V234.5H261.5V113H227.5C214.7 169.4 156.167 181.833 128.5 181Z"
  const lowerLidClosed = "M128.5 117.5C59.3 117.5 33 117.5 28.5 117.5H0V234.5H261.5V117.5H227.5C214.7 117.5 156.167 117.5 128.5 117.5Z"

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg
          width="300"
          height="235"
          viewBox="-50 0 350 235"
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
            <radialGradient 
              id="corner-gradient-left"
              cx="0.3"
              cy="0.5"
              r="0.25"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <radialGradient 
              id="corner-gradient-right"
              cx="0.7"
              cy="0.5"
              r="0.25"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <filter id="drop-shadow" color-interpolation-filters="linearRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
              <feDropShadow stdDeviation="5 10" in="blur" dx="0" dy="5" flood-color="#000" flood-opacity="0.5" x="0%" y="0%" width="100%" height="100%" result="dropShadow"/>
            </filter>

            <filter id="filter0_f_302_14" x="-5" y="25.2998" width="282.4" height="88.4005" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="4.1" result="effect1_foregroundBlur_302_14"/>
            </filter>
            <filter id="filter1_f_302_14" x="-5" y="110.3" width="282.4" height="88.4005" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="4.1" result="effect1_foregroundBlur_302_14"/>
            </filter>
            <filter id="filter2_f_302_14" x="-21.7" y="1.30036" width="333.901" height="119.435" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="7.6" result="effect1_foregroundBlur_302_14"/>
            </filter>
            <filter id="filter3_f_302_14" x="-39.6396" y="114.991" width="338.703" height="92.5252" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="7.6" result="effect1_foregroundBlur_302_14"/>
            </filter>
            <filter id="filter4_f_302_14" x="22.7996" y="0.799973" width="217.401" height="54.4003" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="3.35" result="effect1_foregroundBlur_302_14"/>
            </filter>
            <filter id="filter5_f_302_14" x="22.7997" y="135.8" width="217.401" height="54.4004" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feGaussianBlur stdDeviation="3.35" result="effect1_foregroundBlur_302_14"/>
            </filter>
          </defs>


          {/* Eyeball */}
          <ellipse
            cx="131"
            cy="117.5"
            rx="100"
            ry="65"
            fill="url(#eyeball-gradient)"
          />

          {/* After the main eyeball ellipse but before the eyelids, add the corner shadows */}
          <ellipse
            cx="60"
            cy="117.5"
            rx="90"
            ry="120"
            fill="url(#corner-gradient-left)"
          />

          <ellipse
            cx="202"
            cy="117.5"
            rx="90"
            ry="120"
            fill="url(#corner-gradient-right)"
          />

          {/* Upper eyelid */}
          <path 
            d={isBlinking ? upperLidClosed : upperLidOpen}
            fill="#0a0a0a"
            filter="url(#drop-shadow)"
            className="transition-all duration-150"
          />
          
          {/* Lower eyelid */}
          <path 
            d={isBlinking ? lowerLidClosed : lowerLidOpen}
            fill="#0a0a0a"
            className="transition-all duration-150"
          />

          {/* Pupil with filter and gradient */}
          <ellipse
            cx={131 + pupilOffsetX}
            cy={117.5 + pupilOffsetY}
            rx="50"
            ry="50"
            fill="url(#pupil-gradient)"
            filter="url(#pupil-blur)"
            className={`transition-all duration-150 ${isBlinking ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Light reflections */}
          <circle
            cx={111 + pupilOffsetX}
            cy={102.5 + pupilOffsetY}
            r="5"
            fill="white"
            className="transition-all duration-150"
          />
          <circle
            cx={124 + pupilOffsetX}
            cy={102.5 + pupilOffsetY}
            r="3"
            fill="white"
            className="transition-all duration-150"
          />

          {/* Corner reflections - repositioned diagonally */}
          <circle
            cx={45}
            cy={135}
            r="1.5"
            fill="white"
            className="opacity-60"
          />
          <circle
            cx={215}
            cy={100}
            r="2"
            fill="white"
            className="opacity-60"
          />

          {/* Smaller companion reflections - repositioned diagonally */}
          <circle
            cx={35}
            cy={120}
            r="1"
            fill="white"
            className="opacity-40"
          />
          <circle
            cx={222}
            cy={110}
            r="1.5"
            fill="white"
            className="opacity-40"
          />

          <g filter="url(#filter0_f_302_14)">
          <path d="M10 86C23.8 68 66.6 33 127 36.2C202.4 40.3 240.4 101.5 251 103C240.4 101.5 202.4 40.3 127 36.2C66.6 33 23.8 68 10 86Z" stroke="#2A2A2A" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <g filter="url(#filter1_f_302_14)">
          <path d="M251 138C237.2 156 194.4 191 134 187.8C58.6 183.7 20.6 122.5 10 121C20.6 122.5 58.6 183.7 134 187.8C194.4 191 237.2 156 251 138Z" stroke="#2A2A2A" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <g filter="url(#filter2_f_302_14)">
          <path d="M-7 49C24.8 47.8 102 -10 190 38C244 67.5 279 107 291.5 103C279 107 244 67.5 190 38C102 -10 24.8 47.8 -7 49Z" stroke="#777777" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <g filter="url(#filter3_f_302_14)">
          <path d="M278 139C246.8 145.3 180 214 85.4 181C27.3 160.6 -13.6 127 -25 133.5C-13.6 127 27.3 160.6 85.4 181C180 214 246.8 145.3 278 139Z" stroke="#777777" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <g filter="url(#filter4_f_302_14)">
          <path d="M29 36C100 -5.7 166 6.7 228 46C166 6.7 100 -5.7 29 36Z" stroke="#838383" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <g filter="url(#filter5_f_302_14)">
          <path d="M228 155C157 197 91 184 29 145C91 184 157 197 228 155Z" stroke="#838383" strokeWidth="5" strokeLinecap="round"/>
          </g>
        </svg>
      </div>
    </div>
  )
}

export default Eyes 