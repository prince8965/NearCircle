import { Link } from 'react-router-dom'
import { clearAllDemoData } from '../../utils/storage'
import { Logo } from './Logo'

export function Footer() {
  const resetDemo = () => {
    if (window.confirm('Reset all demo data (RSVPs, follows, created events) in this browser?')) {
      clearAllDemoData()
      window.location.assign('/')
    }
  }
  return (
    <footer className="mt-16 border-t border-[#1E293B] bg-[#070A12]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-ink-muted">Find your people, nearby.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
          <Link to="/" className="hover:text-white">Discover</Link>
          <Link to="/community" className="hover:text-white">Community</Link>
          <Link to="/communities" className="hover:text-white">Communities</Link>
          <Link to="/my-events" className="hover:text-white">My Events</Link>
          <Link to="/organizer" className="hover:text-white">Organizer Dashboard</Link>
        </nav>
        <div className="max-w-sm text-xs leading-relaxed text-ink-faint">
          <p>
            Prototype built for a college hackathon. All events, communities and organizers shown are fictional demo
            content. RSVPs, follows and created events are saved only in this browser.
          </p>
          <button type="button" onClick={resetDemo} className="mt-2 font-medium text-brand hover:underline underline-offset-2">
            Reset demo data
          </button>
        </div>
      </div>
    </footer>
  )
}
