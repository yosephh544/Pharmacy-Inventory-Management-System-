import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaUserPlus, FaUserShield } from 'react-icons/fa';
import api from '../services/api';

interface SystemUser {
    id: number;
    fullName: string;
    username: string;
    isActive: boolean;
    roles: string[];
}

interface SystemRole {
    id: number;
    name: string;
    userCount: number;
}

const SystemUsers = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get<SystemUser[]>('/users/GetUsers'),
                api.get<SystemRole[]>('/roles/GetRoles'),
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load users or roles.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDisableUser = async (userId: number) => {
        setError(null);
        setActionMessage(null);
        try {
            await api.delete(`/users/DeleteUser/${userId}`);
            setActionMessage(`User with ID ${userId} was deactivated successfully.`);
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to deactivate user.';
            setError(message);
        }
    };

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminCount = users.filter(u => u.roles.includes('Admin')).length;

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>System Users</h2>
                <Button
                    variant="primary"
                    className="d-flex align-items-center gap-2"
                    disabled
                    title="User creation UI coming soon"
                >
                    <FaUserPlus /> Add New User
                </Button>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {actionMessage && (
                <Alert variant="success" className="mb-3">
                    {actionMessage}
                </Alert>
            )}

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title className="d-flex align-items-center gap-2">
                        <FaUserShield /> User Management
                    </Card.Title>
                    <Card.Text className="text-muted mb-3">
                        Manage system users, assign roles, and control access permissions.
                    </Card.Text>

                    {loading ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Roles</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-3">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id}>
                                            <td>{index + 1}</td>
                                            <td>{user.fullName}</td>
                                            <td>{user.username}</td>
                                            <td>
                                                {user.roles.length === 0
                                                    ? (
                                                        <Badge bg="secondary">No roles</Badge>
                                                    )
                                                    : user.roles.map(role => (
                                                        <Badge
                                                            key={role}
                                                            bg={role === 'Admin' ? 'danger' : 'primary'}
                                                            className="me-1"
                                                        >
                                                            {role}
                                                        </Badge>
                                                    ))}
                                            </td>
                                            <td>
                                                <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    disabled={!user.isActive}
                                                    onClick={() => handleDisableUser(user.id)}
                                                >
                                                    Disable
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Available Roles</Card.Title>
                            {loading ? (
                                <div className="d-flex justify-content-center py-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="text-muted">No roles defined.</div>
                            ) : (
                                <ul className="list-unstyled">
                                    {roles.map(role => (
                                        <li key={role.id} className="mb-2">
                                            <Badge
                                                bg={role.name === 'Admin' ? 'danger' : 'primary'}
                                                className="me-2"
                                            >
                                                {role.name}
                                            </Badge>
                                            Assigned users: {role.userCount}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Quick Stats</Card.Title>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Users:</span>
                                <strong>{totalUsers}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Active Users:</span>
                                <strong className="text-success">{activeUsers}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Inactive Users:</span>
                                <strong className="text-muted">{inactiveUsers}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Admins:</span>
                                <strong className="text-danger">{adminCount}</strong>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SystemUsers;
