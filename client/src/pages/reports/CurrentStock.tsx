import { Container, Card } from 'react-bootstrap';

const CurrentStock = () => {
    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4">Current Stock Report</h2>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title>Stock Overview</Card.Title>
                    <Card.Text>
                        This is the current stock report page. Here you can view detailed information about current inventory levels.
                    </Card.Text>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CurrentStock;
