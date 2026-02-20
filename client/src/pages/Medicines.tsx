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
import { FaPlus, FaBoxes, FaSearch, FaEllipsisV } from 'react-icons/fa';
import api from '../services/api';

interface MedicineListItem {
    id: number;
    name: string;
    code: string;
    genericName?: string;
    categoryName?: string;
    totalStock: number;
    reorderLevel: number;
    unitPrice?: number;
    isActive: boolean;
}

interface MedicineResponse {
    id: number;
    name: string;
    code: string;
    genericName?: string;
    strength?: string;
    manufacturer?: string;
    reorderLevel: number;
    requiresPrescription: boolean;
    isActive: boolean;
    unitPrice?: number;
    categoryId: number;
    categoryName?: string;
    totalStock: number;
}

interface MedicineCategory {
    id: number;
    name: string;
}

interface BatchListItem {
    id: number;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    isActive: boolean;
}

const Medicines = () => {
    const [medicines, setMedicines] = useState<MedicineListItem[]>([]);
    const [categories, setCategories] = useState<MedicineCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0); // 0 = all
    const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'active', 'inactive'

    // Create / edit medicine modal
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<MedicineResponse | null>(null);
    const [medName, setMedName] = useState('');
    const [medCode, setMedCode] = useState('');
    const [medGenericName, setMedGenericName] = useState('');
    const [medStrength, setMedStrength] = useState('');
    const [medManufacturer, setMedManufacturer] = useState('');
    const [medReorderLevel, setMedReorderLevel] = useState<number | ''>(0);
    const [medRequiresRx, setMedRequiresRx] = useState(false);
    const [medCategoryId, setMedCategoryId] = useState<number>(0);
    const [medUnitPrice, setMedUnitPrice] = useState<number | ''>('');
    const [medSubmitAttempted, setMedSubmitAttempted] = useState(false);

    // Category create
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Batches modal
    const [showBatchesModal, setShowBatchesModal] = useState(false);
    const [selectedMedicineForBatches, setSelectedMedicineForBatches] = useState<MedicineListItem | null>(null);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [batches, setBatches] = useState<BatchListItem[]>([]);

    // Create / adjust batch
    const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
    const [batchNumber, setBatchNumber] = useState('');
    const [batchExpiryDate, setBatchExpiryDate] = useState('');
    const [batchQuantity, setBatchQuantity] = useState<number | ''>('');
    const [batchPurchasePrice, setBatchPurchasePrice] = useState<number | ''>('');
    const [batchSellingPrice, setBatchSellingPrice] = useState<number | ''>('');
    const [batchSubmitAttempted, setBatchSubmitAttempted] = useState(false);

    const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
    const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<BatchListItem | null>(null);
    const [newStockQuantity, setNewStockQuantity] = useState<number | ''>('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustSubmitAttempted, setAdjustSubmitAttempted] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [medRes, catRes] = await Promise.all([
                api.get<MedicineListItem[]>('/medicines/GetMedicines'),
                api.get<MedicineCategory[]>('/medicine-categories/GetAllCategories'),
            ]);
            setMedicines(medRes.data);
            setCategories(catRes.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load medicines or categories.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openCreateMedicineModal = () => {
        setEditingMedicine(null);
        setMedName('');
        setMedCode('');
        setMedGenericName('');
        setMedStrength('');
        setMedManufacturer('');
        setMedReorderLevel(0);
        setMedRequiresRx(false);
        setMedCategoryId(categories.length > 0 ? categories[0].id : 0);
        setMedUnitPrice('');
        setMedSubmitAttempted(false);
        setShowMedicineModal(true);
    };

    const openEditMedicineModal = async (id: number) => {
        try {
            setError(null);
            const res = await api.get<MedicineResponse>(`/medicines/GetMedicineById/${id}`);
            const med = res.data;
            setEditingMedicine(med);
            setMedName(med.name);
            setMedCode(med.code);
            setMedGenericName(med.genericName ?? '');
            setMedStrength(med.strength ?? '');
            setMedManufacturer(med.manufacturer ?? '');
            setMedReorderLevel(med.reorderLevel);
            setMedRequiresRx(med.requiresPrescription);
            setMedCategoryId(med.categoryId);
            setMedUnitPrice(med.unitPrice ?? '');
            setMedSubmitAttempted(false);
            setShowMedicineModal(true);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load medicine details.';
            setError(message);
        }
    };

    const handleSaveMedicine = async () => {
        setMedSubmitAttempted(true);
        setError(null);
        setActionMessage(null);

        const nameError = !medName.trim();
        const codeError = !editingMedicine && !medCode.trim(); // code only required on create
        const categoryError = !medCategoryId || medCategoryId <= 0;

        if (nameError || codeError || categoryError) {
            setError('Please fill all required medicine fields.');
            return;
        }

        const payload = {
            name: medName.trim(),
            code: medCode.trim(),
            genericName: medGenericName.trim() || null,
            strength: medStrength.trim() || null,
            manufacturer: medManufacturer.trim() || null,
            reorderLevel: Number(medReorderLevel) || 0,
            requiresPrescription: medRequiresRx,
            categoryId: medCategoryId,
            unitPrice: medUnitPrice === '' ? null : Number(medUnitPrice),
        };

        try {
            if (editingMedicine) {
                // Update
                const updatePayload: any = {
                    name: payload.name,
                    genericName: payload.genericName,
                    strength: payload.strength,
                    manufacturer: payload.manufacturer,
                    reorderLevel: payload.reorderLevel,
                    requiresPrescription: payload.requiresPrescription,
                    categoryId: payload.categoryId,
                    unitPrice: payload.unitPrice,
                };
                await api.put(`/medicines/UpdateMedicine/${editingMedicine.id}`, updatePayload);
                setActionMessage(`Medicine "${payload.name}" was updated successfully.`);
            } else {
                // Create
                await api.post('/medicines/CreateMedicine', payload);
                setActionMessage(`Medicine "${payload.name}" was created successfully.`);
            }

            setShowMedicineModal(false);
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to save medicine.';
            setError(message);
        }
    };

    const handleToggleMedicineActive = async (med: MedicineListItem) => {
        setError(null);
        setActionMessage(null);
        try {
            if (med.isActive) {
                // Soft delete (deactivate)
                await api.delete(`/medicines/DeleteMedicine/${med.id}`);
                setActionMessage(`Medicine "${med.name}" was deactivated successfully.`);
            } else {
                // Reactivate via UpdateMedicine
                await api.put(`/medicines/UpdateMedicine/${med.id}`, { isActive: true });
                setActionMessage(`Medicine "${med.name}" was reactivated successfully.`);
            }
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                (med.isActive ? 'Failed to deactivate medicine.' : 'Failed to reactivate medicine.');
            setError(message);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Category name is required.');
            return;
        }
        setCategorySubmitting(true);
        setError(null);
        setActionMessage(null);
        try {
            await api.post('/medicine-categories/CreateCategory', { name: newCategoryName.trim() });
            setNewCategoryName('');
            setActionMessage('Medicine category was created successfully.');
            await loadData();
            // Don't close modal automatically - let user manage multiple categories
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create category.';
            setError(message);
        } finally {
            setCategorySubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        setError(null);
        setActionMessage(null);
        try {
            await api.delete(`/medicine-categories/DeleteCategory/${id}`);
            setActionMessage(`Medicine category with ID ${id} was deleted successfully.`);
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to delete category.';
            setError(message);
        }
    };

    const openBatchesModal = async (medicine: MedicineListItem) => {
        setSelectedMedicineForBatches(medicine);
        setBatches([]);
        setBatchesLoading(true);
        setShowBatchesModal(true);
        setError(null);
        try {
            const res = await api.get<BatchListItem[]>(`/batches/GetBatchesByMedicine/${medicine.id}`);
            setBatches(res.data);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load batches.';
            setError(message);
        } finally {
            setBatchesLoading(false);
        }
    };

    const openCreateBatchModal = () => {
        setBatchNumber('');
        setBatchExpiryDate('');
        setBatchQuantity('');
        setBatchPurchasePrice('');
        setBatchSellingPrice('');
        setBatchSubmitAttempted(false);
        setShowCreateBatchModal(true);
    };

    const handleCreateBatch = async () => {
        setBatchSubmitAttempted(true);
        if (
            !selectedMedicineForBatches ||
            !batchNumber.trim() ||
            !batchExpiryDate ||
            batchQuantity === '' ||
            batchPurchasePrice === '' ||
            batchSellingPrice === ''
        ) {
            setError('Please fill all required batch fields.');
            return;
        }

        setError(null);
        setActionMessage(null);
        try {
            await api.post('/batches/CreateBatch', {
                medicineId: selectedMedicineForBatches.id,
                batchNumber: batchNumber.trim(),
                expiryDate: new Date(batchExpiryDate).toISOString(),
                quantity: Number(batchQuantity),
                purchasePrice: Number(batchPurchasePrice),
                sellingPrice: Number(batchSellingPrice),
                supplierId: 0, // use default supplier logic in backend
                receivedDate: new Date().toISOString(),
            });

            setShowCreateBatchModal(false);
            setActionMessage('Batch was created successfully.');
            if (selectedMedicineForBatches) {
                await openBatchesModal(selectedMedicineForBatches);
                await loadData();
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create batch.';
            setError(message);
        }
    };

    const openAdjustStockModal = (batch: BatchListItem) => {
        setSelectedBatchForAdjust(batch);
        setNewStockQuantity(batch.quantity);
        setAdjustReason('');
        setAdjustSubmitAttempted(false);
        setShowAdjustStockModal(true);
    };

    const handleAdjustStock = async () => {
        setAdjustSubmitAttempted(true);
        if (!selectedBatchForAdjust || newStockQuantity === '' || !adjustReason.trim()) {
            setError('Please enter the new quantity and a reason for adjustment.');
            return;
        }

        setError(null);
        setActionMessage(null);
        try {
            await api.post(`/batches/AdjustStock/${selectedBatchForAdjust.id}`, {
                newQuantity: Number(newStockQuantity),
                reason: adjustReason.trim(),
            });

            setShowAdjustStockModal(false);
            setActionMessage(`Stock for batch "${selectedBatchForAdjust.batchNumber}" was adjusted successfully.`);
            if (selectedMedicineForBatches) {
                await openBatchesModal(selectedMedicineForBatches);
                await loadData();
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to adjust stock.';
            setError(message);
        }
    };

    const handleDeleteBatch = async (batch: BatchListItem) => {
        setError(null);
        setActionMessage(null);
        try {
            await api.delete(`/batches/DeleteBatch/${batch.id}`);
            setActionMessage(`Batch "${batch.batchNumber}" was deleted successfully.`);
            if (selectedMedicineForBatches) {
                await openBatchesModal(selectedMedicineForBatches);
                await loadData();
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to delete batch.';
            setError(message);
        }
    };

    // Filter medicines based on search, category, and status
    const filteredMedicines = medicines.filter(med => {
        const matchesSearch =
            med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            med.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (med.genericName && med.genericName.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // For category filter, we need to match by category name since we don't have categoryId in MedicineListItem
        const matchesCategory = 
            selectedCategoryId === 0 || 
            med.categoryName === categories.find(c => c.id === selectedCategoryId)?.name;
        
        const matchesStatus =
            selectedStatus === 'all' ||
            (selectedStatus === 'active' && med.isActive) ||
            (selectedStatus === 'inactive' && !med.isActive);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter(m => m.isActive).length;
    const inactiveMedicines = totalMedicines - activeMedicines;
    const lowStockMedicines = medicines.filter(m => m.isActive && m.totalStock <= m.reorderLevel).length;

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategoryId(0);
        setSelectedStatus('all');
    };

    return (
        <Container fluid className="mt-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Medicines Management</h2>
                    <p className="text-muted mb-0">Manage inventory, stock & batches efficiently</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => setShowCategoryModal(true)}>
                        Manage Categories
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openCreateMedicineModal}>
                        <FaPlus /> Add Medicine
                    </Button>
                </div>
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

            {/* Stats Cards Row */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted small">Total</div>
                                    <div className="h4 mb-0">{totalMedicines}</div>
                                </div>
                                <FaBoxes className="text-primary" size={32} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
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
                <Col md={3}>
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
                <Col md={3}>
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
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={selectedCategoryId}
                                onChange={e => setSelectedCategoryId(Number(e.target.value))}
                            >
                                <option value={0}>All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Form.Select>
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
                        <Col md={2}>
                            <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Medicines Table */}
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
                                    <th>Stock</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedicines.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-4">
                                            {medicines.length === 0
                                                ? 'No medicines found. Click "Add Medicine" to create one.'
                                                : 'No medicines match your filters.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMedicines.map((med, index) => {
                                        const isLowStock = med.isActive && med.totalStock <= med.reorderLevel;
                                        return (
                                            <tr key={med.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold">{med.name}</div>
                                                    <div className="text-muted small">Code: {med.code}</div>
                                                </td>
                                                <td>{med.categoryName ?? '-'}</td>
                                                <td>{med.totalStock}</td>
                                                <td>{med.unitPrice ? `${med.unitPrice.toFixed(2)} ETB` : '-'}</td>
                                                <td>
                                                    {isLowStock ? (
                                                        <Badge bg="warning">Low Stock</Badge>
                                                    ) : med.isActive ? (
                                                        <Badge bg="success">Active</Badge>
                                                    ) : (
                                                        <Badge bg="secondary">Inactive</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <Dropdown>
                                                        <Dropdown.Toggle
                                                            variant="link"
                                                            id={`dropdown-${med.id}`}
                                                            className="text-decoration-none"
                                                        >
                                                            <FaEllipsisV />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => openBatchesModal(med)}>
                                                                Manage Batches
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => openEditMedicineModal(med.id)}>
                                                                Edit
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item
                                                                onClick={() => handleToggleMedicineActive(med)}
                                                            >
                                                                {med.isActive ? 'Disable' : 'Enable'}
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
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

            {/* Create / Edit Medicine Modal */}
            <Modal show={showMedicineModal} onHide={() => setShowMedicineModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingMedicine ? 'Edit Medicine' : 'Add Medicine'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={medName}
                                onChange={e => setMedName(e.target.value)}
                                isInvalid={medSubmitAttempted && !medName.trim()}
                                placeholder="Enter medicine name"
                            />
                            <Form.Control.Feedback type="invalid">
                                Name is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        {!editingMedicine && (
                            <Form.Group className="mb-3">
                                <Form.Label>Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={medCode}
                                    onChange={e => setMedCode(e.target.value)}
                                    isInvalid={medSubmitAttempted && !medCode.trim()}
                                    placeholder="Enter unique medicine code"
                                />
                                <Form.Control.Feedback type="invalid">
                                    Code is required.
                                </Form.Control.Feedback>
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Generic Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={medGenericName}
                                onChange={e => setMedGenericName(e.target.value)}
                                placeholder="Enter generic name (optional)"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Strength</Form.Label>
                            <Form.Control
                                type="text"
                                value={medStrength}
                                onChange={e => setMedStrength(e.target.value)}
                                placeholder="e.g. 500mg"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Manufacturer</Form.Label>
                            <Form.Control
                                type="text"
                                value={medManufacturer}
                                onChange={e => setMedManufacturer(e.target.value)}
                                placeholder="Enter manufacturer"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Reorder Level</Form.Label>
                            <Form.Control
                                type="number"
                                value={medReorderLevel}
                                onChange={e => setMedReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                                min={0}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                id="requiresRx"
                                label="Requires prescription"
                                checked={medRequiresRx}
                                onChange={e => setMedRequiresRx(e.target.checked)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={medCategoryId}
                                onChange={e => setMedCategoryId(Number(e.target.value))}
                                isInvalid={medSubmitAttempted && (!medCategoryId || medCategoryId <= 0)}
                            >
                                {categories.length === 0 && (
                                    <option value={0}>No categories available</option>
                                )}
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                                Please select a category.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Unit Price</Form.Label>
                            <Form.Control
                                type="number"
                                value={medUnitPrice}
                                onChange={e => setMedUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                min={0}
                                step="0.01"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMedicineModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveMedicine}>
                        {editingMedicine ? 'Save Changes' : 'Create Medicine'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Batches Modal */}
            <Modal
                show={showBatchesModal}
                onHide={() => setShowBatchesModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Batches for {selectedMedicineForBatches?.name ?? ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="text-muted">
                            Manage batches and stock levels for this medicine.
                        </div>
                        <Button variant="primary" size="sm" onClick={openCreateBatchModal}>
                            <FaPlus /> Add Batch
                        </Button>
                    </div>
                    {batchesLoading ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Batch No.</th>
                                    <th>Expiry</th>
                                    <th>Qty</th>
                                    <th>Purchase</th>
                                    <th>Selling</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted py-3">
                                            No batches found.
                                        </td>
                                    </tr>
                                ) : (
                                    batches.map((b, index) => (
                                        <tr key={b.id}>
                                            <td>{index + 1}</td>
                                            <td>{b.batchNumber}</td>
                                            <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                                            <td>{b.quantity}</td>
                                            <td>{b.purchasePrice}</td>
                                            <td>{b.sellingPrice}</td>
                                            <td>
                                                <Badge bg={b.isActive ? 'success' : 'secondary'}>
                                                    {b.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => openAdjustStockModal(b)}
                                                >
                                                    Adjust Stock
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteBatch(b)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
            </Modal>

            {/* Create Batch Modal */}
            <Modal show={showCreateBatchModal} onHide={() => setShowCreateBatchModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Batch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Batch Number</Form.Label>
                            <Form.Control
                                type="text"
                                value={batchNumber}
                                onChange={e => setBatchNumber(e.target.value)}
                                isInvalid={batchSubmitAttempted && !batchNumber.trim()}
                            />
                            <Form.Control.Feedback type="invalid">
                                Batch number is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Expiry Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={batchExpiryDate}
                                onChange={e => setBatchExpiryDate(e.target.value)}
                                isInvalid={batchSubmitAttempted && !batchExpiryDate}
                            />
                            <Form.Control.Feedback type="invalid">
                                Expiry date is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                value={batchQuantity}
                                onChange={e => setBatchQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                isInvalid={batchSubmitAttempted && batchQuantity === ''}
                                min={0}
                            />
                            <Form.Control.Feedback type="invalid">
                                Quantity is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Purchase Price</Form.Label>
                            <Form.Control
                                type="number"
                                value={batchPurchasePrice}
                                onChange={e => setBatchPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                                isInvalid={batchSubmitAttempted && batchPurchasePrice === ''}
                                min={0}
                                step="0.01"
                            />
                            <Form.Control.Feedback type="invalid">
                                Purchase price is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Selling Price</Form.Label>
                            <Form.Control
                                type="number"
                                value={batchSellingPrice}
                                onChange={e => setBatchSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                isInvalid={batchSubmitAttempted && batchSellingPrice === ''}
                                min={0}
                                step="0.01"
                            />
                            <Form.Control.Feedback type="invalid">
                                Selling price is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateBatchModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateBatch}>
                        Create Batch
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal show={showAdjustStockModal} onHide={() => setShowAdjustStockModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Adjust Stock for {selectedBatchForAdjust?.batchNumber ?? ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>New Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                value={newStockQuantity}
                                onChange={e => setNewStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                isInvalid={adjustSubmitAttempted && newStockQuantity === ''}
                                min={0}
                            />
                            <Form.Control.Feedback type="invalid">
                                New quantity is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Reason</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)}
                                isInvalid={adjustSubmitAttempted && !adjustReason.trim()}
                            />
                            <Form.Control.Feedback type="invalid">
                                Reason is required.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdjustStockModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAdjustStock}>
                        Adjust Stock
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Category Management Modal */}
            <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Categories</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        className="mb-4"
                        onSubmit={e => {
                            e.preventDefault();
                            handleCreateCategory();
                        }}
                    >
                        <Form.Group>
                            <Form.Label>Add New Category</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    placeholder="Category name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={categorySubmitting || !newCategoryName.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                        </Form.Group>
                    </Form>
                    <hr />
                    <div>
                        <h6 className="mb-3">Existing Categories</h6>
                        {categories.length === 0 ? (
                            <div className="text-muted text-center py-3">No categories defined.</div>
                        ) : (
                            <ul className="list-unstyled">
                                {categories.map(cat => (
                                    <li
                                        key={cat.id}
                                        className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                                    >
                                        <span>{cat.name}</span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(cat.id)}
                                        >
                                            Delete
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Medicines;

