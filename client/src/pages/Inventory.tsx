import { useEffect, useState } from 'react';
import {
    Container,
    Card,
    Row,
    Col,
    Table,
    Spinner,
    Alert,
    Form,
    InputGroup,
    Badge,
    Button,
} from 'react-bootstrap';
import { FaSearch, FaBoxes } from 'react-icons/fa';
import api from '../services/api';

interface InventoryMedicineItem {
    id: number;
    name: string;
    code: string;
    categoryName?: string;
    totalStock: number;
    reorderLevel: number;
    unitPrice?: number;
    isActive: boolean;
}

/**
 * INVENTORY PAGE - Read-Only Stock Overview
 * 
 * Purpose: This page provides a focused, read-only view of current stock levels
 * across all medicines. It's designed for monitoring and reporting purposes.
 * 
 * Key Differences from Medicines Page:
 * - Medicines Page: Full CRUD operations (create, edit, manage batches, manage categories)
 * - Inventory Page: Read-only view focused on stock levels, reorder levels, and status
 * 
 * Use Cases:
 * - Managers/Viewers: Quick overview of stock levels without editing capabilities
 * - Stock monitoring: Identify low stock items at a glance
 * - Reporting: View current inventory status across all medicines
 * - Dashboard-style view: Clean, simple interface for checking stock health
 * 
 * This page complements the Medicines page by providing a simplified view
 * for users who only need to monitor inventory, not manage it.
 */
const Inventory = () => {
    const [medicines, setMedicines] = useState<InventoryMedicineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all' | 'active' | 'inactive'

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const medRes = await api.get<InventoryMedicineItem[]>('/medicines/GetMedicines');
            setMedicines(medRes.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load inventory data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredMedicines = medicines.filter(med => {
        const matchesSearch =
            med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            med.code.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            selectedStatus === 'all' ||
            (selectedStatus === 'active' && med.isActive) ||
            (selectedStatus === 'inactive' && !med.isActive);

        return matchesSearch && matchesStatus;
    });

    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter(m => m.isActive).length;
    const inactiveMedicines = totalMedicines - activeMedicines;
    const lowStockMedicines = medicines.filter(
        m => m.isActive && m.reorderLevel > 0 && m.totalStock <= m.reorderLevel
    ).length;

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
    };

    return (
        <Container fluid className="mt-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Inventory Management</h2>
                    <p className="text-muted mb-0">
                        Overview of current stock levels across all medicines
                    </p>
                </div>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Stats Cards Row */}
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
                                <FaBoxes className="text-success" size={32} />
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
                                <FaBoxes className="text-secondary" size={32} />
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
                                    <div className="h4 mb-0 text-warning">{lowStockMedicines}</div>
                                </div>
                                <FaBoxes className="text-warning" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters Row */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by medicine name or code..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Button
                                variant="outline-secondary"
                                onClick={handleResetFilters}
                                className="w-100"
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Inventory Table */}
            <Card className="shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    ) : (
                        <Table responsive hover>
                            <thead className="medicines-table-header">
                                <tr>
                                    <th>#</th>
                                    <th>Medicine</th>
                                    <th>Category</th>
                                    <th className="text-end">Stock</th>
                                    <th className="text-end">Reorder Level</th>
                                    <th className="text-end">Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedicines.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            {medicines.length === 0
                                                ? 'No inventory records found.'
                                                : 'No items match your filters.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMedicines.map((med, index) => {
                                        const isLowStock =
                                            med.isActive &&
                                            med.reorderLevel > 0 &&
                                            med.totalStock <= med.reorderLevel;
                                        return (
                                            <tr key={med.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold">{med.name}</div>
                                                    <div className="text-muted small">
                                                        Code: {med.code}
                                                    </div>
                                                </td>
                                                <td>{med.categoryName ?? '-'}</td>
                                                <td className="text-end">{med.totalStock}</td>
                                                <td className="text-end">{med.reorderLevel}</td>
                                                <td className="text-end">
                                                    {med.unitPrice
                                                        ? `${med.unitPrice.toFixed(2)} ETB`
                                                        : '-'}
                                                </td>
                                                <td>
                                                    {isLowStock ? (
                                                        <Badge bg="warning">Low Stock</Badge>
                                                    ) : med.isActive ? (
                                                        <Badge bg="success">Active</Badge>
                                                    ) : (
                                                        <Badge bg="secondary">Inactive</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Inventory;
