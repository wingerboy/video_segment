import { Box, Typography } from '@mui/material';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      {icon && (
        <Box sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        {description}
      </Typography>
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;