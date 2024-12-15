import { Route, Routes } from 'react-router'
import { RealtimeRoom } from './components/RealtimeRoom'
import Main from './components/Main'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Routes>  
        <Route path="/room" element={<RealtimeRoom />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </div>
  )
}

export default App
