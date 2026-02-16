import { Container, Card, Row, Col, Button, Table } from 'react-bootstrap';
import { FaUserPlus, FaUserShield } from 'react-icons/fa';

const SystemUsers = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>System Users</h2>
                <Button variant="primary" className="d-flex align-items-center gap-2">
                    <FaUserPlus /> Add New User
                </Button>
            </div>

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title className="d-flex align-items-center gap-2">
                        <FaUserShield /> User Management
                    </Card.Title>
                    <Card.Text className="text-muted mb-3">
                        Manage system users, assign roles, and control access permissions.
                    </Card.Text>

                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Admin User</td>
                                <td>admin@rxflow.com</td>
                                <td><span className="badge bg-danger">Admin</span></td>
                                <td><span className="badge bg-success">Active</span></td>
                                <td>
                                    <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
                                    <Button variant="outline-danger" size="sm">Disable</Button>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>John Pharmacist</td>
                                <td>john@rxflow.com</td>
                                <td><span className="badge bg-primary">Pharmacist</span></td>
                                <td><span className="badge bg-success">Active</span></td>
                                <td>
                                    <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
                                    <Button variant="outline-danger" size="sm">Disable</Button>
                                </td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Jane Cashier</td>
                                <td>jane@rxflow.com</td>
                                <td><span className="badge bg-info">Cashier</span></td>
                                <td><span className="badge bg-success">Active</span></td>
                                <td>
                                    <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
                                    <Button variant="outline-danger" size="sm">Disable</Button>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Available Roles</Card.Title>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <span className="badge bg-danger me-2">Admin</span>
                                    Full system access and user management
                                </li>
                                <li className="mb-2">
                                    <span className="badge bg-primary me-2">Pharmacist</span>
                                    Manage inventory, medicines, and prescriptions
                                </li>
                                <li className="mb-2">
                                    <span className="badge bg-info me-2">Cashier</span>
                                    Process sales and view reports
                                </li>
                                <li className="mb-2">
                                    <span className="badge bg-secondary me-2">Viewer</span>
                                    Read-only access to reports
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Quick Stats</Card.Title>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Users:</span>
                                <strong>3</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Active Users:</span>
                                <strong className="text-success">3</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Inactive Users:</span>
                                <strong className="text-muted">0</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Admins:</span>
                                <strong className="text-danger">1</strong>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SystemUsers;
