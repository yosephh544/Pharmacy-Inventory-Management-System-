import { useEffect, useState } from 'react';
import {
    Container,
    Card,
    Row,
    Col,
    Table,
    Spinner,
    Alert,
    Badge,
    Button,
    InputGroup,
} from 'react-bootstrap';
import { FaBoxes, FaDownload, FaSearch } from 'react-icons/fa';
import api from '../../services/api';

interface CurrentStockItem {
    medicineId: number;
    medicineName: string;
    medicineCode: string;
    categoryName?: string;
    totalStock: number;
    reorderLevel: number;
    isLowStock: boolean;
    unitPrice?: number;
}

const CurrentStock = () => {
    const [data, setData] = useState<CurrentStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<CurrentStockItem[]>('/reports/current-stock');
            setData(res.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load current stock report.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredData = data.filter(item =>
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalMedicines = data.length;
    const lowStockCount = data.filter(d => d.isLowStock).length;
    const totalValue = data.reduce((sum, d) => sum + (d.totalStock * (d.unitPrice || 0)), 0);

    const handleExport = async () => {
        try {
            const res = await api.get('/reports/export', {
                params: {
                    reportType: 'current-stock',
                    format: 'csv',
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `current-stock-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert('Failed to export report: ' + (err?.response?.data?.message || err?.message));
        }
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Current Stock Report</h2>
                    <p className="text-muted mb-0">Overview of current inventory levels across all medicines</p>
                </div>
                <Button variant="primary" onClick={handleExport} className="d-flex align-items-center gap-2">
                    <FaDownload /> Export CSV
                </Button>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={4}>
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
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Low Stock Items</div>
                                    <div className="h4 mb-0 text-warning">{lowStockCount}</div>
                                </div>
                                <FaBoxes className="text-warning" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total Inventory Value</div>
                                    <div className="h4 mb-0 text-success">{totalValue.toFixed(2)} ETB</div>
                                </div>
                                <FaBoxes className="text-success" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Search */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <InputGroup>
                        <InputGroup.Text>
                            <FaSearch />
                        </InputGroup.Text>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by medicine name, code, or category..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            {/* Table */}
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
                                    <th className="text-end">Unit Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            {data.length === 0
                                                ? 'No stock data available.'
                                                : 'No items match your search.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.medicineId}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="fw-bold">{item.medicineName}</div>
                                                <div className="text-muted small">Code: {item.medicineCode}</div>
                                            </td>
                                            <td>{item.categoryName ?? '-'}</td>
                                            <td className="text-end">{item.totalStock}</td>
                                            <td className="text-end">{item.reorderLevel}</td>
                                            <td className="text-end">
                                                {item.unitPrice ? `${item.unitPrice.toFixed(2)} ETB` : '-'}
                                            </td>
                                            <td>
                                                {item.isLowStock ? (
                                                    <Badge bg="warning">Low Stock</Badge>
                                                ) : (
                                                    <Badge bg="success">Adequate</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CurrentStock;
