export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: '#52c41a',
    inactive: '#ff4d4f',
    pending: '#faad14',
    draft: '#1890ff',
    published: '#52c41a',
    archived: '#8c8c8c',
    approved: '#52c41a',
    rejected: '#ff4d4f',
    completed: '#52c41a',
    in_progress: '#1890ff',
  };
  
  return statusColors[status] || '#8c8c8c';
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    active: '活跃',
    inactive: '禁用',
    pending: '待处理',
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    in_progress: '进行中',
  };
  
  return statusTexts[status] || status;
};