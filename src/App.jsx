import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Home from './pages/Home'
import DayOverview from './pages/DayOverview'
import WorkoutPlayer from './pages/WorkoutPlayer'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — always accessible */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes — require a logged-in user */}
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/day/:dayNumber" element={<AuthGuard><DayOverview /></AuthGuard>} />
        <Route path="/workout/:dayNumber" element={<AuthGuard><WorkoutPlayer /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
