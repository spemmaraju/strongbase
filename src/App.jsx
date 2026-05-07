import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import Home from './pages/Home'
import DayOverview from './pages/DayOverview'
import WorkoutPlayer from './pages/WorkoutPlayer'
import History from './pages/History'
import WorkoutDetail from './pages/WorkoutDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes with bottom nav */}
        <Route path="/"        element={<AuthGuard><Layout><Home /></Layout></AuthGuard>} />
        <Route path="/history" element={<AuthGuard><Layout><History /></Layout></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Layout><Profile /></Layout></AuthGuard>} />

        {/* Protected routes without bottom nav (immersive) */}
        <Route path="/day/:dayNumber"      element={<AuthGuard><DayOverview /></AuthGuard>} />
        <Route path="/workout/:dayNumber"  element={<AuthGuard><WorkoutPlayer /></AuthGuard>} />
        <Route path="/history/:logId"      element={<AuthGuard><WorkoutDetail /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
