import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Spinner } from 'react-bootstrap';
import { FaPills } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import type { LoginRequestDto } from '../types/auth'; // Adjust path if needed

const Login = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginRequestDto>({
    defaultValues: {
      username: '',
      password: ''
    }
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Aggressively clear fields on mount to bypass browser autofill
  useEffect(() => {
    const timer = setTimeout(() => {
      reset({ username: '', password: '' });
    }, 100);
    return () => clearTimeout(timer);
  }, [reset]);

  const onSubmit = async (data: LoginRequestDto) => {
    setLoading(true);
    try {
      await authService.login(data);
      toast.success('Login Successful!');
      navigate('/dashboard'); // Navigate to dashboard
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#440860' }}>
      <Card className="p-4 shadow-sm login-card">
        <Card.Body className="text-center ">
          <div className="mb-3 d-flex justify-content-center align-items-center gap-2">
            <FaPills size={30} className="text-primary rotate-45" style={{ transform: 'rotate(45deg)' }} />
            <h3 className="m-0 text-primary fw-bold">RxFlow</h3>
          </div>

          <h4 className="fw-bold mb-1">Login</h4>
          <p className="text-muted mb-4 small">Enter your email below to login to your account</p>

          <Form onSubmit={handleSubmit(onSubmit)} className="text-start">
            {/* Dummy fields to trick browser autofill */}
            <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label className="fw-bold small">Username</Form.Label>
              <Form.Control
                type="text"
                autoComplete="off"
                placeholder=""
                className={`bg-lighter ${errors.username ? 'is-invalid' : ''}`}
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && <span className="text-danger small">{errors.username.message}</span>}
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label className="fw-bold small">Password</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                placeholder=""
                className={`bg-lighter ${errors.password ? 'is-invalid' : ''}`}
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <span className="text-danger small">{errors.password.message}</span>}
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mb-3 text-white fw-bold" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
            </Button>
          </Form>

          <div className="d-flex align-items-center mb-3">
            <div className="flex-grow-1 border-bottom"></div>
            <span className="px-2 text-muted small">OR CONTINUE WITH</span>
            <div className="flex-grow-1 border-bottom"></div>
          </div>

          <Button variant="outline-dark" className="w-100 fw-bold border-0 bg-light text-dark">
            Login as Guest
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
