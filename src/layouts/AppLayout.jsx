import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import Navbar from '@/components/navigation/Navbar'
import RightSidebar from '@/components/rightsidebar/RightSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useSidebar } from '@/hooks/useSidebar'
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
    const { isSidebarExpanded } = useSidebar();

    return (
        <>
            <div className="min-h-screen container-xl mx-auto">
                <Navbar/>
                <div
                    className={`mx-auto grid max-w-512 grid-cols-1 transition-[grid-template-columns] duration-200 ease-out ${
                        isSidebarExpanded
                            ? 'lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_25rem]'
                            : 'lg:grid-cols-[5rem_minmax(0,1fr)] xl:grid-cols-[5rem_minmax(0,1fr)_25rem]'
                    }`}
                >

                    <aside className="hidden bg-(--surface-lowest) lg:block">
                        <Sidebar />
                    </aside>

                    <main className="bg-(--surface-low)">
                        <Outlet />
                    </main>

                    <aside className="hidden bg-(--surface-low) xl:block">
                        <RightSidebar />
                    </aside>

                </div>
                <MobileBottomNav/>
            </div>
        </>
    )
}
