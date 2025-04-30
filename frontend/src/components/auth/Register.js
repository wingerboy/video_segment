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
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, '用户名至少需要3个字符')
    .required('请输入用户名'),
  email: Yup.string()
    .email('邮箱格式无效')
    .required('请输入邮箱'),
  password: Yup.string()
    .min(6, '密码至少需要6个字符')
    .required('请输入密码'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], '两次输入的密码不匹配')
    .required('请确认密码')
});

const Register = () => {
  const { register, error } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      setLoading(true);
      await register(values.username, values.email, values.password);
      navigate('/');
    } catch (error) {
      setStatus({ error: error.response?.data?.message || '注册失败' });
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
            注册
          </Typography>
          
          <Formik
            initialValues={{ 
              username: '', 
              email: '', 
              password: '', 
              confirmPassword: '' 
            }}
            validationSchema={RegisterSchema}
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
                  name="username"
                  label="用户名"
                  fullWidth
                  margin="normal"
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                
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
                
                <Field
                  as={TextField}
                  name="confirmPassword"
                  label="确认密码"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
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
                  {loading ? <CircularProgress size={24} /> : '注册'}
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2">
                    已有账号？{' '}
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      登录
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

export default Register; 