
import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaBoxes, FaExclamationTriangle, FaPills } from 'react-icons/fa';
import api from '../services/api';

interface DashboardMedicineItem {
    id: number;
    name: string;
    code: string;
    categoryName?: string;
    totalStock: number;
    reorderLevel: number;
    unitPrice?: number;
    isActive: boolean;
}

const Dashboard = () => {
    const [medicines, setMedicines] = useState<DashboardMedicineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const medRes = await api.get<DashboardMedicineItem[]>('/medicines/GetMedicines');
            setMedicines(medRes.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load dashboard data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter(m => m.isActive).length;
    const inactiveMedicines = totalMedicines - activeMedicines;
    const lowStockMedicines = medicines.filter(
        m => m.isActive && m.reorderLevel > 0 && m.totalStock <= m.reorderLevel
    );

    // Simple category breakdown for the right-side card
    const categoryCounts = medicines.reduce<Record<string, number>>((acc, med) => {
        const key = med.categoryName || 'Uncategorized';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return (
        <Container fluid className="mt-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Dashboard</h2>
                    <p className="text-muted mb-0">High-level view of your inventory and stock health</p>
                </div>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Stats Row */}
            <Row className="mb-4">
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total Medicines</div>
                                    <div className="h4 mb-0">{totalMedicines}</div>
                                </div>
                                <FaBoxes className="text-primary" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Active</div>
                                    <div className="h4 mb-0 text-success">{activeMedicines}</div>
                                </div>
                                <FaPills className="text-success" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Inactive</div>
                                    <div className="h4 mb-0 text-muted">{inactiveMedicines}</div>
                                </div>
                                <FaPills className="text-secondary" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Low Stock</div>
                                    <div className="h4 mb-0 text-warning">{lowStockMedicines.length}</div>
                                </div>
                                <FaExclamationTriangle className="text-warning" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Low Stock Table */}
                <Col md={7} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Card.Title className="mb-0">Low Stock Medicines</Card.Title>
                                <span className="text-muted small">
                                    Showing {lowStockMedicines.length} item(s)
                                </span>
                            </div>
                            {loading ? (
                                <div className="d-flex justify-content-center py-4">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : lowStockMedicines.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    No medicines are currently below their reorder level.
                                </div>
                            ) : (
                                <Table responsive hover size="sm">
                                    <thead className="medicines-table-header">
                                        <tr>
                                            <th>#</th>
                                            <th>Medicine</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Reorder</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockMedicines.slice(0, 10).map((med, index) => (
                                            <tr key={med.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold">{med.name}</div>
                                                    <div className="text-muted small">Code: {med.code}</div>
                                                </td>
                                                <td>{med.categoryName ?? '-'}</td>
                                                <td>{med.totalStock}</td>
                                                <td>{med.reorderLevel}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Category Breakdown */}
                <Col md={5} className="mb-4">
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Card.Title>Inventory by Category</Card.Title>
                            <p className="text-muted small">
                                Overview of how many medicines you have in each category.
                            </p>
                            {loading ? (
                                <div className="d-flex justify-content-center py-4">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </Spinner>
                                </div>
                            ) : Object.keys(categoryCounts).length === 0 ? (
                                <div className="text-muted">No medicines available.</div>
                            ) : (
                                <ul className="list-unstyled mb-0">
                                    {Object.entries(categoryCounts).map(([name, count]) => (
                                        <li
                                            key={name}
                                            className="d-flex justify-content-between align-items-center mb-2"
                                        >
                                            <span>{name}</span>
                                            <Badge bg="primary" pill>
                                                {count}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
