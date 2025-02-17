export const formatDate = (date: Date): string => {
  const now = new Date();
  const expenseDate = new Date(date);

  // If it's today, show time
  if (expenseDate.toDateString() === now.toDateString()) {
    return `Today, ${expenseDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }

  // If it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (expenseDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // If it's within this year, show date without year
  if (expenseDate.getFullYear() === now.getFullYear()) {
    return expenseDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Otherwise show full date
  return expenseDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
