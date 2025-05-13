import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = ({ component: Component, isAdmin = false, isAgent = false, ...rest }) => {
  const { currentUser, loading } = useContext(AuthContext);
  const location = useLocation();

  // 如果正在加载用户信息，暂时不做路由跳转
  if (loading) {
    return <div>加载中...</div>;
  }

  // 如果用户未登录，重定向到登录页面
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果路由需要管理员权限，但当前用户不是管理员，重定向到首页
  if (isAdmin && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 如果路由需要代理商权限，但当前用户既不是代理商也不是管理员，重定向到首页
  if (isAgent && currentUser.role !== 'agent' && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 用户已登录且拥有访问权限，渲染组件
  return <Component {...rest} />;
};

export default PrivateRoute; 