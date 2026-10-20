import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import Navbar from '@/components/navigation/Navbar'
import RightSidebar from '@/components/rightsidebar/RightSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useSidebar } from '@/hooks/useSidebar'
import { useUnreadTitle } from '@/hooks/useUnreadTitle'
import { Outlet, useLocation } from 'react-router-dom'

export default function AppLayout() {
    useUnreadTitle();

    const { isSidebarExpanded } = useSidebar();

    // The messages page is a two-pane workspace that wants every pixel it can get: the suggested
    // people/communities rail tells the reader nothing about the conversation they opened, so it is
    // dropped there and the thread takes the whole width.
    const { pathname } = useLocation();
    const showRightSidebar = !pathname.startsWith('/messages');

    return (
        <>
            <div className="min-h-screen container-xl mx-auto">
                <Navbar/>
                <div
                    className={`mx-auto grid max-w-512 grid-cols-1 transition-[grid-template-columns] duration-200 ease-out ${
                        isSidebarExpanded
                            ? 'lg:grid-cols-[13rem_minmax(0,1fr)]'
                            : 'lg:grid-cols-[5rem_minmax(0,1fr)]'
                    } ${
                        showRightSidebar
                            ? isSidebarExpanded
                                ? 'xl:grid-cols-[13rem_minmax(0,1fr)_25rem]'
                                : 'xl:grid-cols-[5rem_minmax(0,1fr)_25rem]'
                            : ''
                    }`}
                >

                    <aside className="hidden bg-(--surface-low) lg:block">
                        <Sidebar />
                    </aside>

                    <main className="bg-(--surface-low)">
                        <Outlet />
                    </main>

                    {showRightSidebar && (
                        <aside className="hidden bg-(--surface-low) xl:block">
                            <RightSidebar />
                        </aside>
                    )}

                </div>
                <MobileBottomNav/>
            </div>
        </>
    )
}
