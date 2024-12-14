interface EyesProps {
  isBlinking: boolean
}

const Eyes = ({ isBlinking = false }: EyesProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="flex gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Left eye */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="bg-white rounded-full transition-all duration-150"
        >
          {/* Eyelid */}
          <path
            d={`M 10 ${isBlinking ? 50 : 10} Q 50 ${isBlinking ? 50 : 0} 90 ${isBlinking ? 50 : 10} L 90 ${isBlinking ? 50 : 90} Q 50 ${isBlinking ? 50 : 100} 10 ${isBlinking ? 50 : 90} Z`}
            fill="white"
            className="transition-all duration-150"
          />
          {/* Pupil */}
          <circle
            cx={50}
            cy={50}
            r="20"
            fill="black"
            className={`eye-pupil transition-opacity duration-150 ${isBlinking ? 'opacity-0' : 'opacity-100'}`}
          />
        </svg>

        {/* Right eye */}
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="bg-white rounded-full transition-all duration-150"
        >
          {/* Eyelid */}
          <path
            d={`M 10 ${isBlinking ? 50 : 10} Q 50 ${isBlinking ? 50 : 0} 90 ${isBlinking ? 50 : 10} L 90 ${isBlinking ? 50 : 90} Q 50 ${isBlinking ? 50 : 100} 10 ${isBlinking ? 50 : 90} Z`}
            fill="white"
            className="transition-all duration-150"
          />
          {/* Pupil */}
          <circle
            cx={50}
            cy={50}
            r="20"
            fill="black"
            className={`eye-pupil transition-opacity duration-150 ${isBlinking ? 'opacity-0' : 'opacity-100'}`}
          />
        </svg>
      </div>
    </div>
  )
}

export default Eyes 