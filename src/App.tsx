import { Route, Routes } from 'react-router'
import { RealtimeRoom } from './components/RealtimeRoom'
import Main from './components/Main'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Background Elements */}
      <svg className="fixed inset-0 w-full h-full -z-10">
        <defs>
          <filter id="noise">
            <feTurbulence 
              id="turbFreq"
              type="fractalNoise" 
              baseFrequency="0.01"
              seed="5"
              numOctaves="1"
            >
            </feTurbulence>
            <feGaussianBlur stdDeviation="10">
              <animate
                attributeName="stdDeviation"
                values="10;50;10"
                dur="20s"
                repeatCount="indefinite"
              />
            </feGaussianBlur>
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 1
                      0 1 0 0 1
                      0 0 1 0 1
                      0 0 0 25 -13"
            />
          </filter>
        </defs>
        <rect width="200%" height="200%" filter="url(#noise)" className="rotation-animation" />
      </svg>
      <div className="fixed inset-0 w-[95vw] h-[95vh] bg-black rounded-full blur-[128px] m-auto" />

      <Routes>  
        <Route path="/room" element={<RealtimeRoom />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </div>
  )
}

export default App
