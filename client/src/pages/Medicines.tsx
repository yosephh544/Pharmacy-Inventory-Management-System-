import { Container, Card } from 'react-bootstrap';

const Medicines = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Medicines</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Medicines Catalog</Card.Title>
                    <Card.Text>
                        This is the medicines page. Here you can view and manage the pharmacy's medicine catalog.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Medicines;
