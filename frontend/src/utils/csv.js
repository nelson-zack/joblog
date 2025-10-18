const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportJobsToCsv = (jobs, filename = null) => {
  const headers = [
    'Title',
    'Company',
    'Status',
    'Date Applied',
    'Tags',
    'Notes',
    'Link'
  ];
  const rows = jobs.map((job) => [
    job.title,
    job.company,
    job.status,
    job.date_applied,
    job.tags,
    job.notes?.replace(/\n/g, ' '),
    job.link
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell || ''}"`).join(','))
    .join('\n');

  const name =
    filename ||
    `joblog-export-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, name, 'text/csv;charset=utf-8;');
};
