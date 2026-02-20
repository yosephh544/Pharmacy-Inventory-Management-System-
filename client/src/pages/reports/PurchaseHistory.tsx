import { useEffect, useState } from 'react';
import {
    Container,
    Card,
    Row,
    Col,
    Table,
    Spinner,
    Alert,
    Button,
    Form,
    InputGroup,
} from 'react-bootstrap';
import { FaShoppingBag, FaDownload, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import api from '../../services/api';

interface PurchaseHistoryItem {
    purchaseId: number;
    invoiceNumber?: string;
    purchaseDate: string;
    supplierId: number;
    supplierName: string;
    itemId: number;
    medicineId?: number;
    medicineName?: string;
    medicineCode?: string;
    batchNumber?: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    lineTotal: number;
    purchaseTotalAmount: number;
}

const PurchaseHistory = () => {
    const [data, setData] = useState<PurchaseHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            const res = await api.get<PurchaseHistoryItem[]>('/reports/purchase-history', { params });
            setData(res.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load purchase history.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [fromDate, toDate]);

    const filteredData = data.filter(item =>
        item.medicineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicineCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPurchases = data.length;
    const totalAmount = data.reduce((sum, item) => sum + item.purchaseTotalAmount, 0);
    const uniqueSuppliers = new Set(data.map(item => item.supplierId)).size;

    const handleExport = async () => {
        try {
            const params: any = {
                reportType: 'purchase-history',
                format: 'csv',
            };
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;

            const res = await api.get('/reports/export', {
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `purchase-history-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert('Failed to export report: ' + (err?.response?.data?.message || err?.message));
        }
    };

    const handleResetFilters = () => {
        setFromDate('');
        setToDate('');
        setSearchQuery('');
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Purchase History Report</h2>
                    <p className="text-muted mb-0">View all purchase records and supplier transactions</p>
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
                                    <div className="text-muted small">Total Purchases</div>
                                    <div className="h4 mb-0">{totalPurchases}</div>
                                </div>
                                <FaShoppingBag className="text-primary" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total Amount</div>
                                    <div className="h4 mb-0 text-success">{totalAmount.toFixed(2)} ETB</div>
                                </div>
                                <FaShoppingBag className="text-success" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Suppliers</div>
                                    <div className="h4 mb-0 text-info">{uniqueSuppliers}</div>
                                </div>
                                <FaShoppingBag className="text-info" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label>From Date</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaCalendarAlt />
                                </InputGroup.Text>
                                <Form.Control
                                    type="date"
                                    value={fromDate}
                                    onChange={e => setFromDate(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Label>To Date</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaCalendarAlt />
                                </InputGroup.Text>
                                <Form.Control
                                    type="date"
                                    value={toDate}
                                    onChange={e => setToDate(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={5}>
                            <Form.Label>Search</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by medicine, supplier, invoice, or batch..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={1} className="d-flex align-items-end">
                            <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                Reset
                            </Button>
                        </Col>
                    </Row>
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
                                    <th>Purchase Date</th>
                                    <th>Invoice</th>
                                    <th>Supplier</th>
                                    <th>Medicine</th>
                                    <th>Batch</th>
                                    <th className="text-end">Quantity</th>
                                    <th className="text-end">Unit Price</th>
                                    <th className="text-end">Line Total</th>
                                    <th className="text-end">Purchase Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center text-muted py-4">
                                            {data.length === 0
                                                ? 'No purchase history available.'
                                                : 'No items match your filters.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={`${item.purchaseId}-${item.itemId}`}>
                                            <td>{index + 1}</td>
                                            <td>{new Date(item.purchaseDate).toLocaleDateString()}</td>
                                            <td>{item.invoiceNumber || `#${item.purchaseId}`}</td>
                                            <td>{item.supplierName}</td>
                                            <td>
                                                {item.medicineName ? (
                                                    <>
                                                        <div className="fw-bold">{item.medicineName}</div>
                                                        {item.medicineCode && (
                                                            <div className="text-muted small">Code: {item.medicineCode}</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>{item.batchNumber || '-'}</td>
                                            <td className="text-end">{item.quantity}</td>
                                            <td className="text-end">{item.unitPrice.toFixed(2)} ETB</td>
                                            <td className="text-end">{item.lineTotal.toFixed(2)} ETB</td>
                                            <td className="text-end fw-bold">{item.purchaseTotalAmount.toFixed(2)} ETB</td>
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

export default PurchaseHistory;
