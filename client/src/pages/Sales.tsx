import { Container, Card } from 'react-bootstrap';

const Sales = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Sales (POS)</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Point of Sale</Card.Title>
                    <Card.Text>
                        This is the sales/POS page. Here you can process sales transactions and manage the point of sale system.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Sales;
