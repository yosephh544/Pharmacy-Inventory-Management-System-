import { useEffect, useState } from 'react';
import {
    Container,
    Card,
    Row,
    Col,
    Button,
    Table,
    Badge,
    Spinner,
    Alert,
    Modal,
    Form,
    InputGroup,
    Dropdown,
} from 'react-bootstrap';
import { FaPlus, FaShoppingCart, FaSearch, FaEllipsisV, FaReceipt, FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';

interface Medicine {
    id: number;
    name: string;
    code: string;
    categoryName?: string;
    totalStock: number;
    unitPrice?: number;
    sellingPrice?: number;
    isActive: boolean;
}

interface SaleItem {
    medicineId: number;
    quantity: number;
}

interface Sale {
    id: number;
    invoiceNumber?: string;
    saleDate: string;
    totalAmount: number;
    paymentMethod?: string;
    isCancelled: boolean;
    soldByUserId: number;
    soldByUserName?: string;
    items: SaleItemDetail[];
}

interface SaleItemDetail {
    id: number;
    medicineName?: string;
    medicineCode?: string;
    batchNumber?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

const Sales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Create Sale Modal (POS)
    const [showCreateSaleModal, setShowCreateSaleModal] = useState(false);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [selectedMedicineId, setSelectedMedicineId] = useState<number>(0);
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [submittingSale, setSubmittingSale] = useState(false);

    // View Sale Details Modal
    const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [salesRes, medicinesRes] = await Promise.all([
                api.get<{ items: Sale[]; totalCount: number; page: number; pageSize: number }>('/sales/GetSales'),
                api.get<Medicine[]>('/medicines/GetMedicines'),
            ]);
            setSales(salesRes.data.items);
            // Keep all active medicines; we'll show stock info in the dropdown
            const activeMeds = medicinesRes.data.filter(m => m.isActive);
            setMedicines(activeMeds);
            if (activeMeds.length === 0) {
                console.warn('No active medicines found. Check if medicines exist and are marked as active.');
            }
        } catch (err: any) {
            console.error('Failed to load data:', err);
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load sales data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSales = sales.filter(sale => {
        const matchesSearch =
            sale.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.soldByUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.items.some(item => item.medicineName?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDate =
            (!fromDate || sale.saleDate >= fromDate) &&
            (!toDate || sale.saleDate <= toDate + 'T23:59:59');

        return matchesSearch && matchesDate;
    });

    const totalSales = sales.length;
    const totalRevenue = sales.filter(s => !s.isCancelled).reduce((sum, s) => sum + s.totalAmount, 0);
    const cancelledSales = sales.filter(s => s.isCancelled).length;
    const todaySales = sales.filter(s => {
        const saleDate = new Date(s.saleDate).toDateString();
        return saleDate === new Date().toDateString() && !s.isCancelled;
    }).length;

    const handleResetFilters = () => {
        setSearchQuery('');
        setFromDate('');
        setToDate('');
    };

    const openCreateSaleModal = () => {
        setSaleItems([]);
        setSelectedMedicineId(0);
        setSelectedQuantity(1);
        setPaymentMethod('Cash');
        setError(null);
        setActionMessage(null);
        setShowCreateSaleModal(true);
    };

    const addItemToSale = () => {
        if (!selectedMedicineId || selectedQuantity <= 0) {
            setError('Please select a medicine and enter a valid quantity.');
            return;
        }

        const medicine = medicines.find(m => m.id === selectedMedicineId);
        if (!medicine) {
            setError('Selected medicine not found.');
            return;
        }

        if (medicine.totalStock < selectedQuantity) {
            setError(`Insufficient stock. Available: ${medicine.totalStock}`);
            return;
        }

        const existingIndex = saleItems.findIndex(item => item.medicineId === selectedMedicineId);
        if (existingIndex >= 0) {
            const newItems = [...saleItems];
            newItems[existingIndex].quantity += selectedQuantity;
            if (newItems[existingIndex].quantity > medicine.totalStock) {
                setError(`Total quantity exceeds available stock: ${medicine.totalStock}`);
                return;
            }
            setSaleItems(newItems);
        } else {
            setSaleItems([...saleItems, { medicineId: selectedMedicineId, quantity: selectedQuantity }]);
        }

        setSelectedMedicineId(0);
        setSelectedQuantity(1);
        setError(null);
    };

    const removeItemFromSale = (index: number) => {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return saleItems.reduce((total, item) => {
            const medicine = medicines.find(m => m.id === item.medicineId);
            const price = medicine?.sellingPrice || 0;
            return total + price * item.quantity;
        }, 0);
    };

    const handleCreateSale = async () => {
        if (saleItems.length === 0) {
            setError('Please add at least one item to the sale.');
            return;
        }

        setSubmittingSale(true);
        setError(null);
        setActionMessage(null);

        try {
            await api.post('/sales/CreateSale', {
                items: saleItems,
                paymentMethod: paymentMethod || 'Cash',
            });

            setActionMessage('Sale created successfully!');
            setShowCreateSaleModal(false);
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create sale.';
            setError(message);
        } finally {
            setSubmittingSale(false);
        }
    };

    const handleViewSaleDetails = async (id: number) => {
        try {
            const res = await api.get<Sale>(`/sales/${id}`);
            setSelectedSale(res.data);
            setShowSaleDetailsModal(true);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load sale details.';
            setError(message);
        }
    };

    const handleCancelSale = async (id: number) => {
        if (!window.confirm('Are you sure you want to cancel this sale? Stock will be restored.')) {
            return;
        }

        setError(null);
        setActionMessage(null);
        try {
            await api.post(`/sales/${id}/cancel`);
            setActionMessage('Sale cancelled successfully. Stock has been restored.');
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to cancel sale.';
            setError(message);
        }
    };

    return (
        <Container fluid className="mt-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Sales (POS)</h2>
                    <p className="text-muted mb-0">Process sales transactions and view sales history</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openCreateSaleModal}>
                    <FaPlus /> New Sale
                </Button>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {actionMessage && (
                <Alert variant="success" className="mb-3" onClose={() => setActionMessage(null)} dismissible>
                    {actionMessage}
                </Alert>
            )}

            {/* Stats Cards Row */}
            <Row className="mb-4">
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total Sales</div>
                                    <div className="h4 mb-0">{totalSales}</div>
                                </div>
                                <FaShoppingCart className="text-primary" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total Revenue</div>
                                    <div className="h4 mb-0 text-success">{totalRevenue.toFixed(2)} ETB</div>
                                </div>
                                <FaReceipt className="text-success" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Today's Sales</div>
                                    <div className="h4 mb-0 text-info">{todaySales}</div>
                                </div>
                                <FaShoppingCart className="text-info" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Cancelled</div>
                                    <div className="h4 mb-0 text-danger">{cancelledSales}</div>
                                </div>
                                <FaTimesCircle className="text-danger" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters Row */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by invoice, medicine, or cashier..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="date"
                                placeholder="From Date"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="date"
                                placeholder="To Date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </Col>
                        <Col md={2}>
                            <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Sales Table */}
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
                                    <th>Invoice</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th className="text-end">Amount</th>
                                    <th>Payment</th>
                                    <th>Cashier</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted py-4">
                                            {sales.length === 0
                                                ? 'No sales found. Click "New Sale" to create one.'
                                                : 'No sales match your filters.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale, index) => (
                                        <tr key={sale.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="fw-bold">{sale.invoiceNumber || `#${sale.id}`}</div>
                                            </td>
                                            <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                                            <td>{sale.items.length} item(s)</td>
                                            <td className="text-end">{sale.totalAmount.toFixed(2)} ETB</td>
                                            <td>{sale.paymentMethod || '-'}</td>
                                            <td>{sale.soldByUserName || `User ${sale.soldByUserId}`}</td>
                                            <td>
                                                {sale.isCancelled ? (
                                                    <Badge bg="danger">Cancelled</Badge>
                                                ) : (
                                                    <Badge bg="success">Completed</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Dropdown>
                                                    <Dropdown.Toggle
                                                        variant="link"
                                                        id={`dropdown-${sale.id}`}
                                                        className="text-decoration-none"
                                                    >
                                                        <FaEllipsisV />
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item onClick={() => handleViewSaleDetails(sale.id)}>
                                                            View Details
                                                        </Dropdown.Item>
                                                        {!sale.isCancelled && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    onClick={() => handleCancelSale(sale.id)}
                                                                    className="text-danger"
                                                                >
                                                                    Cancel Sale
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Create Sale Modal (POS) */}
            <Modal show={showCreateSaleModal} onHide={() => setShowCreateSaleModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>New Sale (Point of Sale)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={8}>
                            <Form.Label>Select Medicine</Form.Label>
                            <Form.Select
                                value={selectedMedicineId}
                                onChange={e => {
                                    setSelectedMedicineId(Number(e.target.value));
                                    setError(null);
                                }}
                            >
                                <option value={0}>-- Select Medicine --</option>
                                {medicines.length === 0 ? (
                                    <option disabled>No medicines available</option>
                                ) : (
                                    medicines.map(med => (
                                        <option
                                            key={med.id}
                                            value={med.id}
                                            disabled={med.totalStock <= 0 || !med.sellingPrice}
                                        >
                                            {med.name} ({med.code}) - Stock: {med.totalStock} - Price: {med.sellingPrice?.toFixed(2) || 'N/A'} ETB
                                            {med.totalStock <= 0 ? ' [OUT OF STOCK]' : ''}
                                            {med.totalStock > 0 && !med.sellingPrice ? ' [NO PRICE]' : ''}
                                        </option>
                                    ))
                                )}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                value={selectedQuantity}
                                onChange={e => setSelectedQuantity(Number(e.target.value))}
                            />
                        </Col>
                        <Col md={1} className="d-flex align-items-end">
                            <Button variant="primary" onClick={addItemToSale} className="w-100">
                                Add
                            </Button>
                        </Col>
                    </Row>

                    {saleItems.length > 0 && (
                        <>
                            <hr />
                            <h6>Sale Items</h6>
                            <Table size="sm">
                                <thead>
                                    <tr>
                                        <th>Medicine</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit Price</th>
                                        <th className="text-end">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleItems.map((item, index) => {
                                        const medicine = medicines.find(m => m.id === item.medicineId);
                                        const price = medicine?.sellingPrice || 0;
                                        return (
                                            <tr key={index}>
                                                <td>{medicine?.name || 'Unknown'}</td>
                                                <td className="text-end">{item.quantity}</td>
                                                <td className="text-end">{price.toFixed(2)} ETB</td>
                                                <td className="text-end">{(price * item.quantity).toFixed(2)} ETB</td>
                                                <td>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => removeItemFromSale(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan={3} className="text-end">
                                            Total:
                                        </th>
                                        <th className="text-end">{calculateTotal().toFixed(2)} ETB</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </>
                    )}

                    <hr />
                    <Row>
                        <Col md={6}>
                            <Form.Label>Payment Method</Form.Label>
                            <Form.Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Other">Other</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateSaleModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateSale} disabled={saleItems.length === 0 || submittingSale}>
                        {submittingSale ? 'Processing...' : 'Complete Sale'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Sale Details Modal */}
            <Modal show={showSaleDetailsModal} onHide={() => setShowSaleDetailsModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Sale Details - {selectedSale?.invoiceNumber || `#${selectedSale?.id}`}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSale && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Invoice Number:</strong> {selectedSale.invoiceNumber || `#${selectedSale.id}`}
                                </Col>
                                <Col md={6}>
                                    <strong>Date:</strong> {new Date(selectedSale.saleDate).toLocaleString()}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Payment Method:</strong> {selectedSale.paymentMethod || 'N/A'}
                                </Col>
                                <Col md={6}>
                                    <strong>Cashier:</strong> {selectedSale.soldByUserName || `User ${selectedSale.soldByUserId}`}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={12}>
                                    <strong>Status:</strong>{' '}
                                    {selectedSale.isCancelled ? (
                                        <Badge bg="danger">Cancelled</Badge>
                                    ) : (
                                        <Badge bg="success">Completed</Badge>
                                    )}
                                </Col>
                            </Row>
                            <hr />
                            <h6>Items</h6>
                            <Table size="sm">
                                <thead>
                                    <tr>
                                        <th>Medicine</th>
                                        <th>Batch</th>
                                        <th className="text-end">Qty</th>
                                        <th className="text-end">Unit Price</th>
                                        <th className="text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                {item.medicineName} ({item.medicineCode})
                                            </td>
                                            <td>{item.batchNumber || '-'}</td>
                                            <td className="text-end">{item.quantity}</td>
                                            <td className="text-end">{item.unitPrice.toFixed(2)} ETB</td>
                                            <td className="text-end">{item.lineTotal.toFixed(2)} ETB</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan={4} className="text-end">
                                            Total Amount:
                                        </th>
                                        <th className="text-end">{selectedSale.totalAmount.toFixed(2)} ETB</th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSaleDetailsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Sales;
