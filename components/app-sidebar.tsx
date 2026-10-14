'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShoppingCart,
  Target,
  ReceiptText,
  Package,
  LogOut,
  Store,
  ArrowUpDown,
  Key,
  Trash2,
  UserCog,
  Building2,
  Activity,
  Settings,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

type Role = 'ADMIN' | 'MANAGER' | 'SALES'

type MenuItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission: string // "page:/dashboard/..."
}

const menuItems: MenuItem[] = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard, permission: 'page:/dashboard' },
  { title: 'Analitik', url: '/dashboard/analitik', icon: BarChart3, permission: 'page:/dashboard/analitik' },
  { title: 'Penjualan', url: '/dashboard/penjualan', icon: ShoppingCart, permission: 'page:/dashboard/penjualan' },
  { title: 'Target', url: '/dashboard/target', icon: Target, permission: 'page:/dashboard/target' },
  { title: 'Hutang Barang', url: '/dashboard/hutang', icon: ReceiptText, permission: 'page:/dashboard/hutang' },
]

const masterItems: MenuItem[] = [
  { title: 'Sales', url: '/dashboard/sales', icon: Users, permission: 'page:/dashboard/sales' },
  { title: 'Cabang', url: '/dashboard/cabang', icon: Store, permission: 'page:/dashboard/cabang' },
  { title: 'Customer', url: '/dashboard/customer', icon: Building2, permission: 'page:/dashboard/customer' },
  { title: 'Produk', url: '/dashboard/produk', icon: Package, permission: 'page:/dashboard/produk' },
]

const adminItems: MenuItem[] = [
  { title: 'Import/Export', url: '/dashboard/import-export', icon: ArrowUpDown, permission: 'page:/dashboard/import-export' },
  { title: 'API Keys', url: '/dashboard/api-keys', icon: Key, permission: 'page:/dashboard/api-keys' },
  { title: 'API Logs', url: '/dashboard/api-keys/logs', icon: Activity, permission: 'page:/dashboard/api-keys/logs' },
  { title: 'Trash', url: '/dashboard/trash', icon: Trash2, permission: 'page:/dashboard/trash' },
  { title: 'Users', url: '/dashboard/users', icon: UserCog, permission: 'page:/dashboard/users' },
  { title: 'Permissions', url: '/dashboard/settings/permissions', icon: Settings, permission: 'page:/dashboard/settings/permissions' },
]

export function AppSidebar({
  user,
  permissions,
}: {
  user: { email: string; nama: string; role: Role }
  permissions: string[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const initials = user.nama
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ← Filter by permission, bukan role
  const filterByPermission = (items: MenuItem[]) =>
    items.filter((item) => permissions.includes(item.permission))

  const visibleMenu = filterByPermission(menuItems)
  const visibleMaster = filterByPermission(masterItems)
  const visibleAdmin = filterByPermission(adminItems)

  const roleColor = {
    ADMIN: 'bg-purple-600 hover:bg-purple-600',
    MANAGER: 'bg-blue-600 hover:bg-blue-600',
    SALES: 'bg-slate-600 hover:bg-slate-600',
  }[user.role]

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Sales Dashboard</span>
            <span className="text-xs text-muted-foreground leading-tight">Fuboru Indonesia</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {visibleMenu.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMenu.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleMaster.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Master Data</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMaster.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left text-sm">
                      <span className="font-medium truncate">{user.nama}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent side="right" align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <Badge className={roleColor}>{user.role}</Badge>
                </div>
                <div className="my-1 h-px bg-border" />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}