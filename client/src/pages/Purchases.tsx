import { Container, Card } from 'react-bootstrap';

const Purchases = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Purchases</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Purchase Management</Card.Title>
                    <Card.Text>
                        This is the purchases page. Here you can manage purchase orders and supplier transactions.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Purchases;
