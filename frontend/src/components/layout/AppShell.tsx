import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  X,
  Sun,
  LogOut
} from 'lucide-react';
import { useStandIQ } from '../../stores/standiq.store';
import { useAuth } from '../../stores/auth.store';
import { GlobalSearch } from '../search/GlobalSearch';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, theme, setTheme } = useStandIQ();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const displayName = authUser?.full_name || user.name || 'User';
  const displayEmail = authUser?.email || user.email || '';
  const displayRole = authUser?.role || user.role || 'Procurement Officer';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'AS';

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block md:w-64 md:h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl z-10 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Global Top Header Bar - High z-index to stay above page content */}
        <header className="h-16 border-b border-slate-200/80 bg-white px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 relative z-30 shadow-2xs">
          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2.5 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="BISense Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">BISense</span>
            </Link>
          </div>

          {/* Global Search Bar - Prominent & Wide */}
          <div className="flex-1 max-w-2xl hidden sm:block">
            <GlobalSearch 
              triggerButton={
                <div className="flex items-center justify-between w-full h-10 px-3.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl cursor-pointer transition-colors text-slate-400 group">
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
                    <span>Search BIS standards, procurements, requirements, tenders...</span>
                  </div>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-400 font-semibold shadow-2xs">
                    Ctrl K
                  </kbd>
                </div>
              }
            />
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {/* Notifications Alert Bell with red dot */}
            <Link
              to="/changes"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shrink-0"
              title="Notifications & Amendments"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </Link>

            {/* Vertical Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1.5 hidden sm:block" />

            {/* User Profile Pill */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px] block">
                      {displayName.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Organization</span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate" title={displayName}>{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate" title={displayEmail}>{displayEmail}</p>
                    <span className="mt-1 inline-block text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded border border-blue-200/50">
                      {displayRole}
                    </span>
                  </div>
                  <div className="py-1">
                    {/* Theme / Appearance Quick Switcher */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextTheme = theme === 'Soothing' ? 'Dark' : theme === 'Dark' ? 'Light' : 'Soothing';
                        setTheme(nextTheme as any);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-slate-400" />
                        <span>Theme</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {theme}
                      </span>
                    </button>
                    <Link 
                      to="/settings" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      Settings &amp; Appearance
                    </Link>
                    <Link 
                      to="/basket" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      Standards Basket
                    </Link>
                    <Link 
                      to="/approval" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      Approval Queue
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <div className="px-3 py-1.5 text-slate-400 text-[11px] flex items-center justify-between">
                      <span>BIS Portal Sync</span>
                      <span className="text-emerald-600 font-medium">Connected</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
