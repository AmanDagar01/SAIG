import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  List,
  Map,
  TrendingUp,
  Database,
  Menu,
  X,
  Radio
} from 'lucide-react';

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/events", label: "Event Feed", icon: List },
  { path: "/map", label: "Map View", icon: Map },
  { path: "/trends", label: "Trends", icon: TrendingUp },
  { path: "/sources", label: "Sources", icon: Database },
];

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-bg-secondary border-b border-border-primary sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Shield className="w-8 h-8 text-accent-blue" />
              <Radio className="w-3 h-3 text-accent-red absolute -top-0.5 -right-0.5 pulse-dot" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                OSINT Monitor
              </h1>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">
                Iran-Israel Conflict Tracker
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 bg-accent-green rounded-full pulse-dot" />
            <span>LIVE</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-text-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border-primary bg-bg-secondary px-4 py-3 animate-slide-in">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent-blue/15 text-accent-blue"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}