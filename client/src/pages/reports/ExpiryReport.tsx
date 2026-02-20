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
    Form,
    Nav,
    InputGroup,
} from 'react-bootstrap';
import { FaExclamationTriangle, FaDownload, FaSearch } from 'react-icons/fa';
import api from '../../services/api';

interface NearExpiryItem {
    batchId: number;
    medicineId: number;
    medicineName: string;
    medicineCode: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    remainingQuantity: number;
    purchasePrice: number;
    sellingPrice: number;
}

interface ExpiredItem {
    batchId: number;
    medicineId: number;
    medicineName: string;
    medicineCode: string;
    batchNumber: string;
    expiryDate: string;
    daysExpired: number;
    remainingQuantity: number;
    purchasePrice: number;
    financialLoss: number;
}

const ExpiryReport = () => {
    const [activeTab, setActiveTab] = useState<'near-expiry' | 'expired'>('near-expiry');
    const [nearExpiryData, setNearExpiryData] = useState<NearExpiryItem[]>([]);
    const [expiredData, setExpiredData] = useState<ExpiredItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [daysThreshold, setDaysThreshold] = useState(30);

    const loadNearExpiry = async () => {
        try {
            const res = await api.get<NearExpiryItem[]>('/reports/near-expiry', {
                params: { daysThreshold },
            });
            setNearExpiryData(res.data);
        } catch (err: any) {
            throw err;
        }
    };

    const loadExpired = async () => {
        try {
            const res = await api.get<ExpiredItem[]>('/reports/expired');
            setExpiredData(res.data);
        } catch (err: any) {
            throw err;
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([loadNearExpiry(), loadExpired()]);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load expiry report.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [daysThreshold]);

    const filteredNearExpiry = nearExpiryData.filter(item =>
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredExpired = expiredData.filter(item =>
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalFinancialLoss = expiredData.reduce((sum, item) => sum + item.financialLoss, 0);

    const handleExport = async (reportType: 'near-expiry' | 'expired') => {
        try {
            const res = await api.get('/reports/export', {
                params: {
                    reportType,
                    format: 'csv',
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
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
                    <h2 className="mb-1">Expiry Report</h2>
                    <p className="text-muted mb-0">Monitor batches expiring soon and expired stock</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => handleExport(activeTab)}
                    className="d-flex align-items-center gap-2"
                >
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
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Near Expiry</div>
                                    <div className="h4 mb-0 text-warning">{nearExpiryData.length}</div>
                                </div>
                                <FaExclamationTriangle className="text-warning" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Expired Stock</div>
                                    <div className="h4 mb-0 text-danger">{expiredData.length}</div>
                                    <div className="text-muted small mt-1">Loss: {totalFinancialLoss.toFixed(2)} ETB</div>
                                </div>
                                <FaExclamationTriangle className="text-danger" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={key => setActiveTab(key as any)}>
                        <Nav.Item>
                            <Nav.Link eventKey="near-expiry">Near Expiry</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="expired">Expired</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Body>
            </Card>

            {/* Filters */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        {activeTab === 'near-expiry' && (
                            <Col md={3}>
                                <Form.Label>Days Threshold</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={daysThreshold}
                                    onChange={e => setDaysThreshold(Number(e.target.value))}
                                />
                            </Col>
                        )}
                        <Col md={activeTab === 'near-expiry' ? 9 : 12}>
                            <Form.Label>Search</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by medicine name, code, or batch number..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Near Expiry Table */}
            {activeTab === 'near-expiry' && (
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
                                        <th>Batch Number</th>
                                        <th className="text-end">Expiry Date</th>
                                        <th className="text-end">Days Until Expiry</th>
                                        <th className="text-end">Quantity</th>
                                        <th className="text-end">Purchase Price</th>
                                        <th className="text-end">Selling Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNearExpiry.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-muted py-4">
                                                {nearExpiryData.length === 0
                                                    ? 'No batches expiring soon.'
                                                    : 'No items match your search.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredNearExpiry.map((item, index) => (
                                            <tr key={item.batchId}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold">{item.medicineName}</div>
                                                    <div className="text-muted small">Code: {item.medicineCode}</div>
                                                </td>
                                                <td>{item.batchNumber}</td>
                                                <td className="text-end">
                                                    {new Date(item.expiryDate).toLocaleDateString()}
                                                </td>
                                                <td className="text-end">
                                                    <Badge bg={item.daysUntilExpiry <= 7 ? 'danger' : 'warning'}>
                                                        {item.daysUntilExpiry} days
                                                    </Badge>
                                                </td>
                                                <td className="text-end">{item.remainingQuantity}</td>
                                                <td className="text-end">{item.purchasePrice.toFixed(2)} ETB</td>
                                                <td className="text-end">{item.sellingPrice.toFixed(2)} ETB</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* Expired Table */}
            {activeTab === 'expired' && (
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
                                        <th>Batch Number</th>
                                        <th className="text-end">Expiry Date</th>
                                        <th className="text-end">Days Expired</th>
                                        <th className="text-end">Quantity</th>
                                        <th className="text-end">Purchase Price</th>
                                        <th className="text-end">Financial Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpired.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center text-muted py-4">
                                                {expiredData.length === 0
                                                    ? 'No expired batches found.'
                                                    : 'No items match your search.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpired.map((item, index) => (
                                            <tr key={item.batchId}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold">{item.medicineName}</div>
                                                    <div className="text-muted small">Code: {item.medicineCode}</div>
                                                </td>
                                                <td>{item.batchNumber}</td>
                                                <td className="text-end">
                                                    {new Date(item.expiryDate).toLocaleDateString()}
                                                </td>
                                                <td className="text-end">
                                                    <Badge bg="danger">{item.daysExpired} days</Badge>
                                                </td>
                                                <td className="text-end">{item.remainingQuantity}</td>
                                                <td className="text-end">{item.purchasePrice.toFixed(2)} ETB</td>
                                                <td className="text-end text-danger fw-bold">
                                                    {item.financialLoss.toFixed(2)} ETB
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default ExpiryReport;
