import { useState } from 'react';
import { Navbar as BSNavbar, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import { FaPills, FaSearch, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Navbar = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationCount] = useState(3); // Placeholder notification count

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log('Search query:', searchQuery);
    };

    return (
        <BSNavbar className="navbar-custom shadow-sm" expand="lg">
            <div className="navbar-content d-flex align-items-center w-100 px-4">
                {/* Left Side: Pharmacy Branding */}
                <div className="d-flex align-items-center gap-2 me-3">
                    <FaPills size={24} className="text-white" style={{ transform: 'rotate(45deg)' }} />
                    <span className="pharmacy-title text-white fw-bold fs-5 d-none d-sm-inline">RxFlow</span>
                </div>

                {/* Right Side: Search, Notification, Profile */}
                <div className="d-flex align-items-center gap-3 flex-grow-1 justify-content-end">
                    {/* Search Bar */}
                    <Form onSubmit={handleSearch} className="search-form">
                        <InputGroup className="search-bar">
                            <InputGroup.Text className="bg-white border-end-0">
                                <FaSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                type="search"
                                placeholder="Search inventory..."
                                className="border-start-0 ps-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </Form>

                    {/* Notification Bell */}
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            className="notification-btn position-relative p-2 text-white"
                            id="notification-dropdown"
                        >
                            <FaBell size={20} />
                            {notificationCount > 0 && (
                                <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 start-100 translate-middle notification-badge"
                                >
                                    {notificationCount}
                                </Badge>
                            )}
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="notification-dropdown">
                            <Dropdown.Header>Notifications</Dropdown.Header>
                            <Dropdown.Item>Low stock alert: Aspirin</Dropdown.Item>
                            <Dropdown.Item>New order received</Dropdown.Item>
                            <Dropdown.Item>Inventory update completed</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-center text-primary">
                                View all notifications
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Profile Dropdown */}
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            className="profile-btn d-flex align-items-center gap-2 text-white text-decoration-none p-2"
                            id="profile-dropdown"
                        >
                            <div className="profile-avatar bg-white text-primary rounded-circle d-flex align-items-center justify-content-center">
                                <FaUser size={16} />
                            </div>
                            <span className="d-none d-md-inline">Admin</span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="profile-dropdown">
                            <Dropdown.Header>
                                <div className="fw-bold">Admin User</div>
                                <small className="text-muted">admin@rxflow.com</small>
                            </Dropdown.Header>
                            <Dropdown.Divider />
                            <Dropdown.Item>
                                <FaUser className="me-2" /> Profile Settings
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="text-danger">
                                <FaSignOutAlt className="me-2" /> Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
        </BSNavbar>
    );
};

export default Navbar;
