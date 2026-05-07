import BottomNav from './BottomNav'

// Wraps pages that use the bottom navigation bar.
// Adds bottom padding so content never hides behind the fixed nav.
export default function Layout({ children }) {
  return (
    <div style={{ paddingBottom: 80 }}>
      {children}
      <BottomNav />
    </div>
  )
}
