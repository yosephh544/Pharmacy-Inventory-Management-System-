import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaPills, FaHome, FaBox, FaCapsules, FaShoppingCart, FaTruck, FaFileAlt, FaChevronDown, FaChevronRight, FaUserCog } from 'react-icons/fa';

const Sidebar = () => {
    const [reportsExpanded, setReportsExpanded] = useState(false);

    // TODO: Replace with actual user role from authentication context
    const userRole = 'admin'; // Hardcoded for now - will be replaced with actual auth
    const isAdmin = userRole === 'admin';

    const toggleReports = () => {
        setReportsExpanded(!reportsExpanded);
    };

    return (
        <div className="sidebar">
            {/* Sidebar Header */}


            {/* Sidebar Menu */}
            <nav className="sidebar-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <FaHome className="sidebar-icon" />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/inventory"
                    className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                    <FaBox className="sidebar-icon" />
                    <span>Inventory</span>
                </NavLink>

                <NavLink
                    to="/medicines"
                    className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                    <FaCapsules className="sidebar-icon" />
                    <span>Medicines</span>
                </NavLink>

                <NavLink
                    to="/sales"
                    className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                    <FaShoppingCart className="sidebar-icon" />
                    <span>Sales (POS)</span>
                </NavLink>

                <NavLink
                    to="/purchases"
                    className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                    <FaTruck className="sidebar-icon" />
                    <span>Purchases</span>
                </NavLink>

                {/* Admin Only - System Users */}
                {isAdmin && (
                    <NavLink
                        to="/system-users"
                        className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                    >
                        <FaUserCog className="sidebar-icon" />
                        <span>System Users</span>
                    </NavLink>
                )}

                {/* Reports with Submenu */}
                <div className="sidebar-menu-section">
                    <div
                        className="sidebar-menu-item sidebar-menu-toggle"
                        onClick={toggleReports}
                    >
                        <FaFileAlt className="sidebar-icon" />
                        <span>Reports</span>
                        {reportsExpanded ? (
                            <FaChevronDown className="sidebar-chevron ms-auto" size={12} />
                        ) : (
                            <FaChevronRight className="sidebar-chevron ms-auto" size={12} />
                        )}
                    </div>

                    {reportsExpanded && (
                        <div className="sidebar-submenu">
                            <NavLink
                                to="/reports/current-stock"
                                className={({ isActive }) => `sidebar-submenu-item ${isActive ? 'active' : ''}`}
                            >
                                <span>Current Stock</span>
                            </NavLink>

                            <NavLink
                                to="/reports/sales"
                                className={({ isActive }) => `sidebar-submenu-item ${isActive ? 'active' : ''}`}
                            >
                                <span>Sales Report</span>
                            </NavLink>

                            <NavLink
                                to="/reports/expiry"
                                className={({ isActive }) => `sidebar-submenu-item ${isActive ? 'active' : ''}`}
                            >
                                <span>Expiry Report</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
