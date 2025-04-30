import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import CreateTask from '../components/tasks/CreateTask';

const CreateTaskPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const videoId = id || queryParams.get('videoId');
  
  return <CreateTask videoId={videoId} />;
};

export default CreateTaskPage; 