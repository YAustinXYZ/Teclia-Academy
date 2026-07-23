export const exportStudentsToCsv = (students, filename = 'estudiantes.csv') => {
  if (!students || students.length === 0) return;
  const headers = ['ID', 'Nombre', 'Email', 'Usuario', 'Estado', 'Plan', 'Avatar URL', 'Fecha de registro'];
  const rows = students.map((s) => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.email || '',
    s.username || '',
    s.status || 'active',
    s.plan_tier || 'free',
    `"${(s.avatar_url || '').replace(/"/g, '""')}"`,
    s.created_at ? new Date(s.created_at).toLocaleDateString('es-CR') : '',
  ]);
  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
