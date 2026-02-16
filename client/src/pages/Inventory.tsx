import { Container, Card } from 'react-bootstrap';

const Inventory = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Inventory Management</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Inventory Overview</Card.Title>
                    <Card.Text>
                        This is the inventory management page. Here you can view and manage all pharmacy inventory items.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Inventory;
