import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DayOverview from './pages/DayOverview'
import WorkoutPlayer from './pages/WorkoutPlayer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/day/:dayNumber" element={<DayOverview />} />
        <Route path="/workout/:dayNumber" element={<WorkoutPlayer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
