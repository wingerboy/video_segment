import { Card, CardActionArea, CardMedia, CardContent, CardActions, Typography, Button, Chip, Box, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { Delete, Visibility } from '@mui/icons-material';

const VideoCard = ({
  video,
  onClick,
  onDelete,
  getThumbnail,
  formatDate,
  statusTranslations,
  statusColors,
  width = 300
}) => {
  const cardClickHandler = () => {
    if (onClick) {
      onClick(video);
    } else {
      window.open(`/videos/${video.id}`, '_self');
    }
  };
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width, // 固定宽度
        maxWidth: '100%'
      }}
    >
      <CardActionArea onClick={cardClickHandler}>
        <CardMedia
          component='video'
          sx={{ height: 180 }}
          image={getThumbnail(video)}
          alt={video.name}
        />
        <CardContent>
          <Tooltip title={video.name || `视频 ${video.id}`} arrow>
            <Typography variant='h6' component='div' noWrap>
              {video.name || `视频 ${video.id}`}
            </Typography>
          </Tooltip>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Chip
              label={statusTranslations[video.status] || video.status}
              color={statusColors[video.status] || 'default'}
              size='small'
            />
            <Typography variant='caption' color='text.secondary'>
              {formatDate(video.createdAt)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
      {onDelete ?<CardActions>
        <Button
          size='small'
          color='error'
          onClick={() => onDelete(video)}
          startIcon={<Delete />}
        >
          删除
        </Button>
        <Button
          size='small'
          color='primary'
          component={Link}
          to={`/videos/${video.id}`}
          startIcon={<Visibility />}
        >
          查看
        </Button>
      </CardActions> : null}

    </Card>
  )
};

export default VideoCard;
