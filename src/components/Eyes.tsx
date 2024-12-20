import { motion } from "motion/react"

interface EyesProps {
  isBlinking: boolean
  gazeX?: number
  gazeY?: number
  position?: { x: number, y: number }
  alignment?: 'start' | 'center' | 'end'
}

const containerVariants = {
  initial: {
    scale: 0.7,
    opacity: 0,
    y: 10
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1.1, 0.32, 1],
      delay: 0.2
    }
  },
  exit: {
    scale: 0.7,
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
}

const Eyes = ({ isBlinking = false, gazeX = 0.5, gazeY = 0.5, alignment = 'center' }: EyesProps) => {
  // Calculate pupil offset based on gaze (limit the movement range)
  const pupilOffsetX = (gazeX - 0.5) * 40  // Max 15px movement left/right
  const pupilOffsetY = (gazeY - 0.5) * 30  // Max 10px movement up/down

  // Define the open and closed states for both eyelids
  const upperLidOpen = "M128.5 53.5C59.3 55.5 33 99.6667 28.5 121.5H0V0L261.5 0V121.5H227.5C214.7 65.1 156.167 52.6667 128.5 53.5Z"
  const upperLidClosed = "M128.5 117.5C59.3 117.5 33 117.5 28.5 117.5H0V0L261.5 0V117.5H227.5C214.7 117.5 156.167 117.5 128.5 117.5Z"
  
  const lowerLidOpen = "M128.5 181C59.3 179 33 134.833 28.5 113H0V234.5H261.5V113H227.5C214.7 169.4 156.167 181.833 128.5 181Z"
  const lowerLidClosed = "M128.5 117.5C59.3 117.5 33 117.5 28.5 117.5H0V234.5H261.5V117.5H227.5C214.7 117.5 156.167 117.5 128.5 117.5Z"

  // Animation variants for the eyelids
  const eyelidVariants = {
    open: (isUpper: boolean) => ({
      d: isUpper ? upperLidOpen : lowerLidOpen,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }),
    closed: (isUpper: boolean) => ({
      d: isUpper ? upperLidClosed : lowerLidClosed,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    })
  }

  // Animation variants for the pupil and reflections
  const pupilVariants = {
    visible: {
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hidden: {
      scale: 0.9,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  }

  // Top blurred line variants
  const blurredLineVariants = {
    open: {
      d: "M10 86C23.8 68 66.6 33 127 36.2C202.4 40.3 240.4 101.5 251 103C240.4 101.5 202.4 40.3 127 36.2C66.6 33 23.8 68 10 86Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M10 117.5C23.8 117.5 66.6 117.5 127 117.5C202.4 117.5 240.4 117.5 251 117.5C240.4 117.5 202.4 117.5 127 117.5C66.6 117.5 23.8 117.5 10 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  // Bottom blurred line variants
  const bottomBlurredLineVariants = {
    open: {
      d: "M251 148C237.2 166 194.4 201 134 197.8C58.6 193.7 20.6 132.5 10 131C20.6 132.5 58.6 193.7 134 197.8C194.4 201 237.2 166 251 148Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M251 117.5C237.2 117.5 194.4 117.5 134 117.5C58.6 117.5 20.6 117.5 10 117.5C20.6 117.5 58.6 117.5 134 117.5C194.4 117.5 237.2 117.5 251 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  // Top outer blurred line variants
  const outerBlurredLineVariants = {
    open: {
      d: "M-7 49C24.8 47.8 102 -10 190 38C244 67.5 279 107 291.5 103C279 107 244 67.5 190 38C102 -10 24.8 47.8 -7 49Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M-7 117.5C24.8 117.5 102 117.5 190 117.5C244 117.5 279 117.5 291.5 117.5C279 117.5 244 117.5 190 117.5C102 117.5 24.8 117.5 -7 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  // Bottom outer blurred line variants
  const bottomOuterBlurredLineVariants = {
    open: {
      d: "M278 149C246.8 155.3 180 224 85.4 191C27.3 170.6 -13.6 137 -25 143.5C-13.6 137 27.3 170.6 85.4 191C180 224 246.8 155.3 278 149Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M278 117.5C246.8 117.5 180 117.5 85.4 117.5C27.3 117.5 -13.6 117.5 -25 117.5C-13.6 117.5 27.3 117.5 85.4 117.5C180 117.5 246.8 117.5 278 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  // Top arc line variants
  const arcLineVariants = {
    open: {
      d: "M29 36C100 -5.7 166 6.7 228 46C166 6.7 100 -5.7 29 36Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M29 117.5C100 117.5 166 117.5 228 117.5C166 117.5 100 117.5 29 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  // Bottom arc line variants
  const bottomArcLineVariants = {
    open: {
      d: "M228 165C157 207 91 194 29 155C91 194 157 207 228 165Z",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    closed: {
      d: "M228 117.5C157 117.5 91 117.5 29 117.5C91 117.5 157 117.5 228 117.5Z",
      transition: {
        duration: 0.25,
        ease: "easeIn"
      }
    }
  }

  return (
    <motion.div 
      className={`w-full h-full flex items-center justify-center`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <svg
        className={`w-full h-full self-${alignment} max-w-[350px] max-h-[235px]`}
        viewBox="-50 0 350 235"
        preserveAspectRatio="xMidYMid meet"
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

          <filter id="filter0_f_302_14" x="-25" y="0" width="320" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="4.1" result="effect1_foregroundBlur_302_14"/>
          </filter>
          <filter id="filter1_f_302_14" x="-25" y="85" width="320" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="4.1" result="effect1_foregroundBlur_302_14"/>
          </filter>
          <filter id="filter2_f_302_14" x="-50" y="-30" width="400" height="170" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="7.6" result="effect1_foregroundBlur_302_14"/>
          </filter>
          <filter id="filter3_f_302_14" x="-50" y="95" width="400" height="170" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="7.6" result="effect1_foregroundBlur_302_14"/>
          </filter>
          <filter id="filter4_f_302_14" x="0" y="-20" width="260" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="3.35" result="effect1_foregroundBlur_302_14"/>
          </filter>
          <filter id="filter5_f_302_14" x="0" y="105" width="260" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
          cx="50"
          cy="117.5"
          rx="50"
          ry="90"
          fill="url(#corner-gradient-left)"
        />

        <ellipse
          cx="205"
          cy="117.5"
          rx="50"
          ry="90"
          fill="url(#corner-gradient-right)"
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

        {/* Pupil group with animations */}
        <motion.g
          variants={pupilVariants}
          animate={isBlinking ? "hidden" : "visible"}
        >
          {/* Pupil */}
          <motion.ellipse
            cx={131}
            cy={117.5}
            rx="50"
            ry="50"
            fill="url(#pupil-gradient)"
            filter="url(#pupil-blur)"
            animate={{
              cx: 131 + pupilOffsetX,
              cy: 117.5 + pupilOffsetY
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />

          {/* Light reflections */}
          <motion.circle
            cx={111}
            cy={102.5}
            r="5"
            fill="white"
            animate={{
              cx: 111 + pupilOffsetX,
              cy: 102.5 + pupilOffsetY
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />
          <motion.circle
            cx={124}
            cy={102.5}
            r="3"
            fill="white"
            animate={{
              cx: 124 + pupilOffsetX,
              cy: 102.5 + pupilOffsetY
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />
        </motion.g>

        {/* Upper eyelid */}
        <motion.path 
          custom={true}
          variants={eyelidVariants}
          animate={isBlinking ? "closed" : "open"}
          fill="#000"
        />
        
        {/* Lower eyelid */}
        <motion.path 
          custom={false}
          variants={eyelidVariants}
          animate={isBlinking ? "closed" : "open"}
          fill="#000"
        />
        
        {/* Top blurred lines */}
        <g filter="url(#filter0_f_302_14)">
          <motion.path
            custom={true}
            variants={blurredLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#2A2A2A"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g filter="url(#filter2_f_302_14)">
          <motion.path
            custom={true}
            variants={outerBlurredLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#777777"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g filter="url(#filter4_f_302_14)">
          <motion.path
            custom={true}
            variants={arcLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#838383"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        
        {/* Bottom blurred lines */}
        <g filter="url(#filter1_f_302_14)">
          <motion.path
            variants={bottomBlurredLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#2A2A2A"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g filter="url(#filter3_f_302_14)">
          <motion.path
            variants={bottomOuterBlurredLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#777777"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g filter="url(#filter5_f_302_14)">
          <motion.path
            variants={bottomArcLineVariants}
            animate={isBlinking ? "closed" : "open"}
            stroke="#838383"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </motion.div>
  )
}

export default Eyes 