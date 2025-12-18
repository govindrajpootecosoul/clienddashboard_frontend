'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  BarChart3, 
  LogOut,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/search', label: 'Search', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative`}>
          <div className={`p-6 border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && <h1 className="text-xl font-bold text-gray-900">Client Dashboard</h1>}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
            {isCollapsed ? (
              <div className="mb-4 flex justify-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
            <Button
              variant="outline"
              className={`w-full ${isCollapsed ? 'px-0' : ''}`}
              onClick={handleLogout}
              title={isCollapsed ? 'Logout' : ''}
            >
              <LogOut className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

