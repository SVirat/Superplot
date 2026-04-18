import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

export default function Header() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleMobileNav() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.mobile-overlay')?.classList.toggle('open');
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger" onClick={toggleMobileNav}>
          <Menu size={22} />
        </button>
      </div>
      <div className="header-user" ref={ref}>
        {user ? (
          <>
            <button
              className="header-avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ border: 'none' }}
            >
              {user.image ? (
                <img src={user.image} alt={user.name} referrerPolicy="no-referrer" />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </button>
            {dropdownOpen && (
              <div className="header-dropdown">
                <div className="header-dropdown-info">
                  <div className="name">{user.name}</div>
                  <div className="email">{user.email}</div>
                </div>
                <button onClick={() => { signOut(); setDropdownOpen(false); }}>
                  <LogOut size={14} style={{ marginRight: 8, verticalAlign: -2 }} />
                  Sign out
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </header>
  );
}
