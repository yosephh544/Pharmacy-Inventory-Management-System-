import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Button, Table, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaUserPlus, FaUserShield, FaEdit } from 'react-icons/fa';
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

interface PharmacyProfile {
    id: number;
    name: string;
    code: string;
}

const SystemUsers = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [roles, setRoles] = useState<SystemRole[]>([]);
    const [pharmacies, setPharmacies] = useState<PharmacyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFullName, setNewFullName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRoleIds, setNewRoleIds] = useState<number[]>([]);
    const [newPharmacyProfileId, setNewPharmacyProfileId] = useState<number>(0);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Edit User State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [editRoleIds, setEditRoleIds] = useState<number[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, rolesRes, pharmaciesRes] = await Promise.all([
                api.get<SystemUser[]>('/users/GetUsers'),
                api.get<SystemRole[]>('/roles/GetRoles'),
                api.get<PharmacyProfile[]>('/pharmacies'),
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setPharmacies(pharmaciesRes.data);
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

    const handleOpenCreateModal = () => {
        setError(null);
        setActionMessage(null);
        setNewFullName('');
        setNewUsername('');
        setNewPassword('');
        setNewRoleIds([]);
        setSubmitAttempted(false);
        // Default to first pharmacy if available
        setNewPharmacyProfileId(pharmacies.length > 0 ? pharmacies[0].id : 0);
        setShowCreateModal(true);
    };

    const handleToggleRoleSelection = (roleId: number, isEdit: boolean = false) => {
        if (isEdit) {
            setEditRoleIds(prev =>
                prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
            );
        } else {
            setNewRoleIds(prev =>
                prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
            );
        }
    };

    const handleCreateUser = async () => {
        setError(null);
        setActionMessage(null);
        setSubmitAttempted(true);

        const fullNameError = !newFullName.trim();
        const usernameError = !newUsername.trim();
        const passwordError = !newPassword.trim();
        const rolesError = newRoleIds.length === 0;
        const pharmacyError = !newPharmacyProfileId || newPharmacyProfileId <= 0;

        if (fullNameError || usernameError || passwordError || rolesError || pharmacyError) {
            setError('Please fill all required fields before creating a user.');
            return;
        }

        try {
            await api.post('/users/CreateUser', {
                fullName: newFullName.trim(),
                username: newUsername.trim(),
                password: newPassword,
                pharmacyProfileId: newPharmacyProfileId,
                roleIds: newRoleIds,
            });

            setShowCreateModal(false);
            setActionMessage(`User "${newUsername}" was created successfully.`);
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create user.';
            setError(message);
        }
    };

    const handleToggleUserStatus = async (user: SystemUser) => {
        setError(null);
        setActionMessage(null);

        try {
            if (user.isActive) {
                // Deactivate (soft delete)
                await api.delete(`/users/DeleteUser/${user.id}`);
                setActionMessage(`User with ID ${user.id} was deactivated successfully.`);
            } else {
                // Reactivate using UpdateUser API
                await api.put(`/users/UpdateUser/${user.id}`, {
                    isActive: true,
                });
                setActionMessage(`User with ID ${user.id} was reactivated successfully.`);
            }

            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                (user.isActive ? 'Failed to deactivate user.' : 'Failed to reactivate user.');
            setError(message);
        }
    };

    const handleOpenEditModal = (user: SystemUser) => {
        setSelectedUser(user);
        // Map user's role names back to role IDs
        const userRoleIds = roles
            .filter(r => user.roles.includes(r.name))
            .map(r => r.id);
        setEditRoleIds(userRoleIds);
        setShowEditModal(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        setIsUpdating(true);
        setError(null);
        try {
            await api.put(`/users/UpdateUser/${selectedUser.id}`, {
                roleIds: editRoleIds
            });
            setShowEditModal(false);
            setActionMessage(`User "${selectedUser.username}" roles updated successfully.`);
            await loadData();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to update user roles.');
        } finally {
            setIsUpdating(false);
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
                    onClick={handleOpenCreateModal}
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
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenEditModal(user)}
                                                    >
                                                        <FaEdit /> Edit
                                                    </Button>
                                                    <Button
                                                        variant={user.isActive ? 'outline-danger' : 'outline-success'}
                                                        size="sm"
                                                        onClick={() => handleToggleUserStatus(user)}
                                                    >
                                                        {user.isActive ? 'Disable' : 'Enable'}
                                                    </Button>
                                                </div>
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

            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newFullName}
                                onChange={e => setNewFullName(e.target.value)}
                                isInvalid={submitAttempted && !newFullName.trim()}
                                placeholder="Enter full name"
                            />
                            <Form.Control.Feedback type="invalid">
                                Full name is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                isInvalid={submitAttempted && !newUsername.trim()}
                                placeholder="Enter username"
                            />
                            <Form.Control.Feedback type="invalid">
                                Username is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                isInvalid={submitAttempted && !newPassword.trim()}
                                placeholder="Enter temporary password"
                            />
                            <Form.Control.Feedback type="invalid">
                                Password is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Pharmacy</Form.Label>
                            <Form.Select
                                value={newPharmacyProfileId}
                                onChange={e => setNewPharmacyProfileId(Number(e.target.value))}
                                disabled={pharmacies.length === 0}
                                isInvalid={submitAttempted && (!newPharmacyProfileId || newPharmacyProfileId <= 0)}
                            >
                                {pharmacies.length === 0 && (
                                    <option value={0}>No pharmacies available</option>
                                )}
                                {pharmacies.map(pharmacy => (
                                    <option key={pharmacy.id} value={pharmacy.id}>
                                        {pharmacy.name} ({pharmacy.code})
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                Please select a pharmacy profile.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Roles</Form.Label>
                            <div>
                                {roles.map(role => (
                                    <Form.Check
                                        key={role.id}
                                        inline
                                        type="checkbox"
                                        id={`new-user-role-${role.id}`}
                                        label={role.name}
                                        checked={newRoleIds.includes(role.id)}
                                        onChange={() => handleToggleRoleSelection(role.id)}
                                    />
                                ))}
                            </div>
                            {submitAttempted && newRoleIds.length === 0 && (
                                <div className="text-danger small mt-1">
                                    Please select at least one role.
                                </div>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreateUser}
                    >
                        Create User
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit User Roles: {selectedUser?.username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control type="text" value={selectedUser?.fullName || ''} disabled />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Assign Roles</Form.Label>
                            <div>
                                {roles.map(role => (
                                    <Form.Check
                                        key={role.id}
                                        inline
                                        type="checkbox"
                                        id={`edit-user-role-${role.id}`}
                                        label={role.name}
                                        checked={editRoleIds.includes(role.id)}
                                        onChange={() => handleToggleRoleSelection(role.id, true)}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateUser} disabled={isUpdating}>
                        {isUpdating ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SystemUsers;
