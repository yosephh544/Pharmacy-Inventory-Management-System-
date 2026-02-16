
import { Container, Card, Row, Col } from 'react-bootstrap';

const Dashboard = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Dashboard</h2>

            <Row>
                <Col md={4} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Inventory</Card.Title>
                            <h3 className="text-primary">1,234</h3>
                            <Card.Text className="text-muted">Items in stock</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Low Stock Alerts</Card.Title>
                            <h3 className="text-warning">23</h3>
                            <Card.Text className="text-muted">Items need reorder</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} className="mb-3">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Orders Today</Card.Title>
                            <h3 className="text-success">47</h3>
                            <Card.Text className="text-muted">Completed orders</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm mt-4">
                <Card.Body>
                    <Card.Title>Welcome to RxFlow Inventory</Card.Title>
                    <Card.Text>
                        Your pharmacy inventory management system is ready. Use the navigation bar above to access different features.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Dashboard;
