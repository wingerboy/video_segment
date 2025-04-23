import { useInfiniteScroll } from 'ahooks';
import { CircularProgress, Box } from '@mui/material';
import { useState, useEffect } from 'react';

const InfiniteScrollList = ({
  fetchData,
  containerRef,
  renderItem,
  reloadDeps = [],
  pageSize = 10,
  initialData = []
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const fetchDataWrapper = async (d) => {
    console.log('开始调用接口');
    // 这里添加一个逻辑，当 reload 时强制从第一页开始
    const isReload = !d;
    const page = isReload ? 1 : Math.floor(d.list.length / pageSize) + 1;
    console.log('请求页码:', page);
    const result = await fetchData(page, pageSize);
    console.log('接口返回结果:', result);

    if (page === 1) {
      return {
        list: result.list,
        total: result.total,
        hasMore: result.hasNextPage
      };
    }

    return {
      list: [...(d?.list || []), ...result.list],
      total: result.total,
      hasMore: result.hasNextPage
    };
  };

  const { data, loading, loadMore } = useInfiniteScroll(
    fetchDataWrapper,
    {
      target: containerRef,
      isNoMore: (d) => !d?.hasMore,
      onLoadMore: () => {
        if (isInitialized && !loading && data?.hasMore) {
          loadMore();
        }
      },
      reloadDeps: reloadDeps,
      initialData: { list: initialData }
    }
  );

  return (
    <>
      {data?.list?.map((item, index) => renderItem(item, index))}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </>
  );
};

export default InfiniteScrollList;
