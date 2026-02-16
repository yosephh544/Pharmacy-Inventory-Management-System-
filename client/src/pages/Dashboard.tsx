
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <Card.Title>Welcome to RxFlow Inventory</Card.Title>
                    <Card.Text>
                        You have successfully logged in. This is the dashboard placeholder.
                    </Card.Text>
                    <Button variant="danger" onClick={handleLogout}>Logout</Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Dashboard;
