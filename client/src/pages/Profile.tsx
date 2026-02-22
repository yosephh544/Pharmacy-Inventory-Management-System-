import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { FaUser, FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await api.post('/profile/change-password', {
                oldPassword,
                newPassword,
                confirmPassword
            });
            setSuccessMessage("Password updated successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">User Profile</h2>

            <Row>
                <Col lg={4} md={5}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body className="text-center py-5">
                            <div className="profile-avatar-large bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '100px', height: '100px' }}>
                                <FaUser size={50} />
                            </div>
                            <h4>Account Information</h4>
                            <p className="text-muted">Manage your security settings</p>
                            <hr />
                            <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-bold">
                                <FaShieldAlt /> Security Status: Active
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8} md={7}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title className="d-flex align-items-center gap-2 mb-4">
                                <FaLock /> Change Password
                            </Card.Title>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {successMessage && <Alert variant="success">{successMessage}</Alert>}

                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter current password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        className="w-100 py-2"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Close
                                    </Button>
                                    <Button variant="primary" type="submit" disabled={loading} className="w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" /> processing...
                                            </>
                                        ) : (
                                            <>
                                                <FaKey /> Update Password
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
