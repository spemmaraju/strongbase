import BottomNav from './BottomNav'
import useMediaQuery from '../hooks/useMediaQuery'

// On wide screens (≥768px) BottomNav becomes a left rail — shift content right.
// On narrow it stays a bottom bar — shift content up to avoid it.
export default function Layout({ children }) {
  const isWide = useMediaQuery('(min-width: 768px)')
  return (
    <div style={isWide ? { paddingLeft: 80 } : { paddingBottom: 80 }}>
      {children}
      <BottomNav />
    </div>
  )
}
