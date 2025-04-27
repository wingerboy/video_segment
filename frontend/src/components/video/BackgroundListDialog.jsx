import React, { useRef, useContext } from 'react'
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material'
import { getAllBackgrounds } from '../../services/videoService.js'
import { AuthContext } from '../../contexts/AuthContext.js'
import { API_BASE_URL } from '../../config.js'
import dayjs from 'dayjs'
import { DATE_SECOND_FORMAT } from '../../constants/index.ts'
import InfiniteScrollList from '../common/InfiniteScrollList.jsx'

const pageSize = 10

const BackgroundListDialog = React.forwardRef((props, ref) => {
  const { handleSelectClick, open, handleCloseClick } = props
  const { currentUser } = useContext(AuthContext)

  const backgroundContainerRef = useRef(null)

  const fetchBackgrounds = async (page = 1, size = pageSize) => {
    console.log('Fetching backgrounds...')
    try {
      return await getAllBackgrounds({
        pageNum: page,
        pageSize: size,
        userId: currentUser.id
      })
    } catch (error) {
      console.error('获取背景列表失败:', error)
      return { list: [], total: 0, hasNextPage: false }
    }
  }

  const getBackgroundImageUrl = (background) => {
    return `${API_BASE_URL}/${background.path}`
  }

  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => handleCloseClick(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>选择背景</DialogTitle>
        <DialogContent>
          <div
            ref={backgroundContainerRef}
            style={{
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 250px)',
              marginBottom: '20px',
              paddingBottom: '30px' // 添加底部内边距
            }}
          >
            <Grid container spacing={3}>
              <InfiniteScrollList
                fetchData={fetchBackgrounds}
                containerRef={backgroundContainerRef}
                // initialData={backgrounds} // 传递初始数据
                renderItem={(background) => (
                  <Grid item xs={12} sm={6} md={3} key={background.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onClick={() => handleSelectClick(background)}
                    >
                      <CardMedia
                        component='img'
                        height='180'
                        image={getBackgroundImageUrl(background)}
                        alt={background.name || '背景图片'}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant='subtitle1' component='div' noWrap>
                          {background.name ||
                            `背景 ${String(background.id).substring(0, 8)}`}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          上传于{' '}
                          {formatDate(background.createdAt || new Date())}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              />
            </Grid>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

export default BackgroundListDialog
