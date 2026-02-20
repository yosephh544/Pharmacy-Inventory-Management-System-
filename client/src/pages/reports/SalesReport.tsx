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
    Nav,
    InputGroup,
} from 'react-bootstrap';
import { FaChartLine, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import api from '../../services/api';

interface DailySalesItem {
    date: string;
    transactionCount: number;
    totalRevenue: number;
}

interface MonthlySalesItem {
    year: number;
    month: number;
    monthName: string;
    transactionCount: number;
    totalRevenue: number;
}

const SalesReport = () => {
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
    const [dailyData, setDailyData] = useState<DailySalesItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlySalesItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());

    const loadDailySales = async () => {
        try {
            const params: any = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            const res = await api.get<DailySalesItem[]>('/reports/sales-daily', { params });
            setDailyData(res.data);
        } catch (err: any) {
            throw err;
        }
    };

    const loadMonthlySales = async () => {
        try {
            const params: any = {};
            if (year) params.year = year;
            const res = await api.get<MonthlySalesItem[]>('/reports/sales-monthly', { params });
            setMonthlyData(res.data);
        } catch (err: any) {
            throw err;
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'daily') {
                await loadDailySales();
            } else {
                await loadMonthlySales();
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load sales report.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab, fromDate, toDate, year]);

    const totalDailyRevenue = dailyData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalDailyTransactions = dailyData.reduce((sum, item) => sum + item.transactionCount, 0);
    const avgDailyRevenue = dailyData.length > 0 ? totalDailyRevenue / dailyData.length : 0;

    const totalMonthlyRevenue = monthlyData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalMonthlyTransactions = monthlyData.reduce((sum, item) => sum + item.transactionCount, 0);
    const avgMonthlyRevenue = monthlyData.length > 0 ? totalMonthlyRevenue / monthlyData.length : 0;

    const handleExport = async (reportType: 'sales-daily' | 'sales-monthly') => {
        try {
            const params: any = {
                reportType,
                format: 'csv',
            };
            if (reportType === 'sales-daily') {
                if (fromDate) params.fromDate = fromDate;
                if (toDate) params.toDate = toDate;
            } else {
                if (year) params.year = year;
            }

            const res = await api.get('/reports/export', {
                params,
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

    const handleResetFilters = () => {
        setFromDate('');
        setToDate('');
        setYear(new Date().getFullYear());
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="mb-1">Sales Report</h2>
                    <p className="text-muted mb-0">Daily and monthly sales analytics</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => handleExport(activeTab === 'daily' ? 'sales-daily' : 'sales-monthly')}
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
            {activeTab === 'daily' ? (
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Total Revenue</div>
                                        <div className="h4 mb-0 text-success">{totalDailyRevenue.toFixed(2)} ETB</div>
                                    </div>
                                    <FaChartLine className="text-success" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Total Transactions</div>
                                        <div className="h4 mb-0 text-primary">{totalDailyTransactions}</div>
                                    </div>
                                    <FaChartLine className="text-primary" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Average Daily Revenue</div>
                                        <div className="h4 mb-0 text-info">{avgDailyRevenue.toFixed(2)} ETB</div>
                                    </div>
                                    <FaChartLine className="text-info" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Total Revenue</div>
                                        <div className="h4 mb-0 text-success">{totalMonthlyRevenue.toFixed(2)} ETB</div>
                                    </div>
                                    <FaChartLine className="text-success" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Total Transactions</div>
                                        <div className="h4 mb-0 text-primary">{totalMonthlyTransactions}</div>
                                    </div>
                                    <FaChartLine className="text-primary" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="text-muted small">Average Monthly Revenue</div>
                                        <div className="h4 mb-0 text-info">{avgMonthlyRevenue.toFixed(2)} ETB</div>
                                    </div>
                                    <FaChartLine className="text-info" size={32} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Tabs */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={key => setActiveTab(key as any)}>
                        <Nav.Item>
                            <Nav.Link eventKey="daily">Daily Sales</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="monthly">Monthly Sales</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Body>
            </Card>

            {/* Filters */}
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        {activeTab === 'daily' ? (
                            <>
                                <Col md={4}>
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
                                <Col md={4}>
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
                                <Col md={4} className="d-flex align-items-end">
                                    <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                        Reset Filters
                                    </Button>
                                </Col>
                            </>
                        ) : (
                            <>
                                <Col md={4}>
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={2020}
                                        max={2100}
                                        value={year}
                                        onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Leave empty for all years"
                                    />
                                </Col>
                                <Col md={4} className="d-flex align-items-end">
                                    <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100">
                                        Reset Filters
                                    </Button>
                                </Col>
                            </>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            {/* Daily Sales Table */}
            {activeTab === 'daily' && (
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
                                        <th>Date</th>
                                        <th className="text-end">Transactions</th>
                                        <th className="text-end">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyData.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted py-4">
                                                No sales data available for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyData.map((item, index) => (
                                            <tr key={item.date}>
                                                <td>{index + 1}</td>
                                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="text-end">{item.transactionCount}</td>
                                                <td className="text-end fw-bold text-success">
                                                    {item.totalRevenue.toFixed(2)} ETB
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

            {/* Monthly Sales Table */}
            {activeTab === 'monthly' && (
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
                                        <th>Year</th>
                                        <th>Month</th>
                                        <th className="text-end">Transactions</th>
                                        <th className="text-end">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted py-4">
                                                No sales data available for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        monthlyData.map((item, index) => (
                                            <tr key={`${item.year}-${item.month}`}>
                                                <td>{index + 1}</td>
                                                <td>{item.year}</td>
                                                <td>{item.monthName}</td>
                                                <td className="text-end">{item.transactionCount}</td>
                                                <td className="text-end fw-bold text-success">
                                                    {item.totalRevenue.toFixed(2)} ETB
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

export default SalesReport;
