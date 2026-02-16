import { Container, Card } from 'react-bootstrap';

const SalesReport = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Sales Report</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Sales Analytics</Card.Title>
                    <Card.Text>
                        This is the sales report page. Here you can view detailed sales analytics and transaction history.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SalesReport;
