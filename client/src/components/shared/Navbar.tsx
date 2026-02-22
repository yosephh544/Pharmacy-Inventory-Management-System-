import { useState, useEffect, useCallback } from 'react';
import { Navbar as BSNavbar, Form, InputGroup, Dropdown, Badge, Spinner } from 'react-bootstrap';
import { FaPills, FaSearch, FaBell, FaUser, FaSignOutAlt, FaExclamationTriangle, FaBox } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import api from '../../services/api';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    linkUrl?: string;
}

interface NotificationSummary {
    unreadCount: number;
    notifications: Notification[];
}

const Navbar = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<NotificationSummary>({ unreadCount: 0, notifications: [] });
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [readDynamicNotifications, setReadDynamicNotifications] = useState<Set<number>>(new Set());
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        setUserProfile(authService.getUserProfile());
    }, []);

    // Load read dynamic notifications from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('readDynamicNotifications');
        if (stored) {
            try {
                const ids = JSON.parse(stored) as number[];
                setReadDynamicNotifications(new Set(ids));
            } catch (e) {
                console.error('Failed to load read notifications from localStorage', e);
            }
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        const token = authService.getCurrentUser();
        if (!token) {
            setNotifications({ unreadCount: 0, notifications: [] });
            return;
        }
        setLoadingNotifications(true);
        try {
            const res = await api.get('/notifications');
            // Support both camelCase and PascalCase from API
            const data = res.data as Record<string, unknown>;
            const rawNotifications = (data.notifications ?? data.Notifications ?? []) as unknown[];

            // Normalize notification objects (API may return camelCase or PascalCase)
            const list = rawNotifications.map((n: unknown) => {
                const o = n as Record<string, unknown>;
                return {
                    id: Number(o.id ?? o.Id),
                    title: String(o.title ?? o.Title ?? ''),
                    message: String(o.message ?? o.Message ?? ''),
                    type: String(o.type ?? o.Type ?? 'system'),
                    isRead: Boolean(o.isRead ?? o.IsRead),
                    createdAt: String(o.createdAt ?? o.CreatedAt ?? new Date().toISOString()),
                    linkUrl: o.linkUrl != null ? String(o.linkUrl) : o.LinkUrl != null ? String(o.LinkUrl) : undefined,
                };
            });

            // Get current read state from localStorage for dynamic notifications
            const stored = localStorage.getItem('readDynamicNotifications');
            const readSet = stored ? new Set(JSON.parse(stored) as number[]) : readDynamicNotifications;

            const processedNotifications = list.map(n => {
                if (n.id < 0 || n.id > 100000) {
                    return { ...n, isRead: readSet.has(n.id) };
                }
                return n;
            });

            const unreadCount = processedNotifications.filter(n => !n.isRead).length;
            setNotifications({
                unreadCount,
                notifications: processedNotifications,
            });
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setNotifications({ unreadCount: 0, notifications: [] });
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    // Load from API on mount (when authenticated) and refresh periodically
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    // Refetch from API whenever the user opens the notification dropdown
    const handleNotificationDropdownToggle = useCallback((isOpen: boolean) => {
        if (isOpen) {
            loadNotifications();
        }
    }, [loadNotifications]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement search functionality
        console.log('Search query:', searchQuery);
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Handle dynamic notifications (negative IDs or high IDs) - store in localStorage
        if (!notification.isRead && (notification.id < 0 || notification.id > 100000)) {
            const newReadSet = new Set(readDynamicNotifications);
            newReadSet.add(notification.id);
            setReadDynamicNotifications(newReadSet);
            localStorage.setItem('readDynamicNotifications', JSON.stringify(Array.from(newReadSet)));

            // Update local state
            setNotifications(prev => ({
                ...prev,
                notifications: prev.notifications.map(n =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1)
            }));
        }
        // Handle stored notifications (positive IDs < 100000)
        else if (!notification.isRead && notification.id > 0 && notification.id < 100000) {
            try {
                await api.post(`/notifications/${notification.id}/read`);
                // Update local state
                setNotifications(prev => ({
                    ...prev,
                    notifications: prev.notifications.map(n =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    ),
                    unreadCount: Math.max(0, prev.unreadCount - 1)
                }));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (notification.linkUrl) {
            navigate(notification.linkUrl);
        }
    };

    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
        e.stopPropagation();

        // Handle dynamic notifications - remove from localStorage
        if (notificationId < 0 || notificationId > 100000) {
            const newReadSet = new Set(readDynamicNotifications);
            newReadSet.delete(notificationId);
            setReadDynamicNotifications(newReadSet);
            localStorage.setItem('readDynamicNotifications', JSON.stringify(Array.from(newReadSet)));

            setNotifications(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== notificationId),
                unreadCount: prev.notifications.filter(n => n.id !== notificationId && !n.isRead).length
            }));
            return;
        }

        // Handle stored notifications
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== notificationId),
                unreadCount: prev.notifications.filter(n => n.id !== notificationId && !n.isRead).length
            }));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'low-stock':
                return <FaBox className="text-warning me-2" />;
            case 'near-expiry':
                return <FaExclamationTriangle className="text-danger me-2" />;
            case 'expired':
                return <FaExclamationTriangle className="text-danger me-2" />;
            default:
                return <FaBell className="text-primary me-2" />;
        }
    };

    const getNotificationBadgeColor = (type: string) => {
        switch (type) {
            case 'low-stock':
                return 'warning';
            case 'near-expiry':
                return 'danger';
            case 'expired':
                return 'danger';
            default:
                return 'primary';
        }
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
                    <Dropdown align="end" onToggle={handleNotificationDropdownToggle}>
                        <Dropdown.Toggle
                            variant="link"
                            className="notification-btn position-relative p-2 text-white"
                            id="notification-dropdown"
                        >
                            <FaBell size={20} />
                            {notifications.unreadCount > 0 && (
                                <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 start-100 translate-middle notification-badge"
                                >
                                    {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                                </Badge>
                            )}
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="notification-dropdown" style={{ minWidth: '350px', maxHeight: '500px', overflowY: 'auto' }}>
                            <Dropdown.Header className="d-flex justify-content-between align-items-center">
                                <span>Notifications</span>
                                {notifications.unreadCount > 0 && (
                                    <Badge bg="danger" pill>
                                        {notifications.unreadCount} new
                                    </Badge>
                                )}
                            </Dropdown.Header>
                            <Dropdown.Divider />
                            {loadingNotifications ? (
                                <Dropdown.Item disabled>
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                </Dropdown.Item>
                            ) : notifications.notifications.length === 0 ? (
                                <Dropdown.Item disabled>
                                    <div className="text-center text-muted py-3">
                                        No notifications
                                    </div>
                                </Dropdown.Item>
                            ) : (
                                <>
                                    {notifications.notifications.map((notification) => (
                                        <Dropdown.Item
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-3 ${!notification.isRead ? 'bg-light' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-1">
                                                        {getNotificationIcon(notification.type)}
                                                        <strong className={!notification.isRead ? 'fw-bold' : ''}>
                                                            {notification.title}
                                                        </strong>
                                                        {!notification.isRead && (
                                                            <Badge bg={getNotificationBadgeColor(notification.type)} pill className="ms-2">
                                                                New
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted small ms-4">
                                                        {notification.message}
                                                    </div>
                                                    <div className="text-muted small ms-4 mt-1">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                {notification.id > 0 && (
                                                    <button
                                                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </Dropdown.Item>
                                    ))}
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        className="text-center text-primary"
                                        onClick={() => navigate('/reports/current-stock')}
                                    >
                                        View All Reports
                                    </Dropdown.Item>
                                </>
                            )}
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
                            <span className="d-none d-md-inline">{userProfile?.fullName || userProfile?.username || 'User'}</span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="profile-dropdown">
                            <Dropdown.Header>
                                <div className="fw-bold">{userProfile?.fullName || 'User'}</div>
                                <small className="text-muted">{userProfile?.username || ''}</small>
                            </Dropdown.Header>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => navigate('/profile')}>
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
