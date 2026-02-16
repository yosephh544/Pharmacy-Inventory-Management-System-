import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div className="main-layout">
            <Navbar />
            <div className="layout-with-sidebar">
                <Sidebar />
                <main className="content-with-sidebar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
