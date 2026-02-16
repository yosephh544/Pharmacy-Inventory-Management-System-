import { Container, Card } from 'react-bootstrap';

const ExpiryReport = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Expiry Report</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Expiring Items</Card.Title>
                    <Card.Text>
                        This is the expiry report page. Here you can view medicines that are expiring soon or have already expired.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ExpiryReport;
