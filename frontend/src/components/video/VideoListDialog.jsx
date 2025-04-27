import React, { useRef, useContext } from 'react'

import { Grid, Dialog, DialogTitle, DialogContent } from '@mui/material'
import { getAllVideos } from '../../services/videoService.js'
import { AuthContext } from '../../contexts/AuthContext.js'
import { API_BASE_URL } from '../../config.js'
import dayjs from 'dayjs'
import { DATE_SECOND_FORMAT } from '../../constants/index.ts'
import InfiniteScrollList from '../common/InfiniteScrollList.jsx'
import VideoCard from './VideoCard.jsx'

const statusColors = {
  waiting: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
}

const statusTranslations = {
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败'
}

const pageSize = 10

const VideoListDialog = React.forwardRef((props, ref) => {
  const { handleSelectClick, open, handleCloseClick } = props
  const { currentUser } = useContext(AuthContext)
  const videoContainerRef = useRef(null)

  const fetchVideos = async (page = 1, size = pageSize) => {
    try {
      return await getAllVideos({
        pageNum: page,
        pageSize: size,
        userId: currentUser.id
      })
    } catch (error) {
      console.error('获取视频列表失败:', error)
      return { list: [], total: 0, hasNextPage: false }
    }
  }

  const getVideoThumbnail = (video) => {
    if (video.finalVideo) {
      return `${API_BASE_URL}/${video.finalVideo}`
    } else if (video.extractedForeground) {
      return `${API_BASE_URL}/${video.extractedForeground}`
    } else if (video.originalVideo) {
      return `${API_BASE_URL}/${video.originalVideo}`
    }
    return 'https://via.placeholder.com/320x180?text=无预览'
  }

  const formatDate = (dateString) => {
    return dayjs(dateString).format(DATE_SECOND_FORMAT)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => handleCloseClick(false)}
        maxWidth='820px'
        fullWidth
      >
        <DialogTitle>选择视频</DialogTitle>
        <DialogContent>
          <div
            ref={videoContainerRef}
            style={{
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 250px)',
              marginBottom: '20px',
              paddingBottom: '30px' // 添加底部内边距
            }}
          >
            <Grid container spacing={3}>
              <InfiniteScrollList
                fetchData={fetchVideos}
                containerRef={videoContainerRef}
                // 不传递 initialData，让 InfiniteScrollList 自己发起首次请求
                // initialData={videos}
                renderItem={(video) => (
                  <Grid item xs={12} sm={6} md={4} key={video.id}>
                    <VideoCard
                      onClick={() => handleSelectClick(video)}
                      video={video}
                      width={240}
                      // onDelete={handleDeleteClick}
                      getThumbnail={getVideoThumbnail}
                      formatDate={formatDate}
                      statusTranslations={statusTranslations}
                      statusColors={statusColors}
                    />
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

export default VideoListDialog
