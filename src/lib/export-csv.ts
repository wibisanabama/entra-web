/**
 * Utility for exporting data tables to CSV files with UTF-8 BOM encoding for Excel compatibility.
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T, index: number) => string | number | null | undefined;
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  // Escape cell content to follow RFC 4180 CSV standard
  const escapeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const stringVal = String(cell);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return `"${stringVal}"`;
  };

  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(escapeCell).join(','));

  // Add data rows
  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(','));
  }

  const csvContent = csvRows.join('\r\n');

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens Indonesian text with proper character encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Attendee Manifest to CSV
 */
export function exportAttendeesToCsv(eventTitle: string, attendees: any[], usersMap: Record<string, any>) {
  const headers = [
    'No',
    'Nama Lengkap',
    'Email Peserta',
    'Kode Tiket',
    'ID Kategori Tiket',
    'Status Tiket',
    'Status Kehadiran',
    'Tanggal Terbit'
  ];

  const rows = attendees.map((ticket, index) => {
    const user = usersMap[ticket.user_id];
    const isUsed = ticket.status?.toUpperCase() === 'USED' || ticket.status?.toUpperCase() === 'CHECKED_IN';
    const formattedDate = ticket.created_at
      ? new Date(ticket.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    return [
      index + 1,
      user?.full_name || 'Pengunjung',
      user?.email || ticket.user_id,
      ticket.ticket_code || '-',
      ticket.ticket_type_id || '-',
      ticket.status || 'ACTIVE',
      isUsed ? 'HADIR' : 'BELUM HADIR',
      formattedDate
    ];
  });

  const sanitizedTitle = (eventTitle || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `manifest-peserta-${sanitizedTitle}-${dateStr}.csv`;

  exportToCsv(filename, headers, rows);
}

/**
 * Exports Order Transactions List to CSV
 */
export function exportOrdersToCsv(orders: any[], eventMap?: Record<string, string>) {
  const headers = [
    'No',
    'Order ID',
    'Event / Acara',
    'Total Nominal (IDR)',
    'Status Pembayaran',
    'Waktu Transaksi'
  ];

  const rows = orders.map((order, index) => {
    const eventName = eventMap && order.event_id ? eventMap[order.event_id] || order.event_id : order.event_id || '-';
    const amount = Number(order.total_amount) || 0;
    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    return [
      index + 1,
      order.id,
      eventName,
      amount,
      order.status || 'PENDING',
      formattedDate
    ];
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `rekap-pesanan-tiket-${dateStr}.csv`;

  exportToCsv(filename, headers, rows);
}
