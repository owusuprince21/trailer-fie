export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatYear = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.getFullYear().toString();
};

export const formatRuntime = (minutes: number): string => {
  if (!minutes) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const formatVoteAverage = (voteAverage: number): string => {
  return Math.round(voteAverage * 10).toString();
};

export const getVoteAverageColor = (voteAverage: number): string => {
  const score = voteAverage * 10;
  if (score >= 70) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
};