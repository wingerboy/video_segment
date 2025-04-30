import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('邮箱格式无效')
    .required('请输入邮箱'),
  password: Yup.string()
    .required('请输入密码')
});

const Login = () => {
  const { login, error } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      setLoading(true);
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      setStatus({ error: error.response?.data?.message || '登录失败' });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            登录
          </Typography>
          
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, status }) => (
              <Form>
                {(error || status?.error) && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error || status.error}
                  </Alert>
                )}
                
                <Field
                  as={TextField}
                  name="email"
                  label="邮箱"
                  fullWidth
                  margin="normal"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
                
                <Field
                  as={TextField}
                  name="password"
                  label="密码"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={isSubmitting || loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : '登录'}
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2">
                    还没有账号？{' '}
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                      注册
                    </Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 