import * as XLSX from 'xlsx'
import type { Report } from '@/types'

export type ReportExportInvoice = {
  id: string
  billing_month: string
  due_date: string
  status: 'unpaid' | 'pending' | 'paid'
  total_amount: number
  contracts: {
    rooms: { number: string } | null
  } | null
  users: { name: string; email?: string | null } | null
  payments?: {
    id: string
    status: string
    transaction_date: string | null
    rejection_reason: string | null
    created_at: string
    verified_at: string | null
  }[] | null
}

export function exportMonthlyReportWorkbook(report: Report, invoices: ReportExportInvoice[]) {
  const workbook = XLSX.utils.book_new()
  const monthLabel = formatMonth(report.month_year)
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')
  const overdueInvoices = invoices.filter(isOverdue)

  appendSheet(workbook, 'Summary', [
    { Metric: 'Reporting Month', Value: monthLabel },
    { Metric: 'Generated At', Value: formatDateTime(report.created_at) },
    { Metric: 'Total Revenue', Value: Number(report.total_revenue) },
    { Metric: 'Total Rooms', Value: report.total_rooms },
    { Metric: 'Occupied Rooms', Value: report.occupied_rooms },
    { Metric: 'Occupancy Rate', Value: `${Number(report.occupancy_rate)}%` },
    { Metric: 'Paid Invoices', Value: paidInvoices.length },
    { Metric: 'Overdue Invoices', Value: overdueInvoices.length },
  ])

  appendSheet(workbook, 'Transactions', invoices.map((invoice) => {
    const latestPayment = latestPaymentFor(invoice)
    return {
      'Invoice ID': invoiceCode(invoice.id),
      Tenant: invoice.users?.name ?? 'Unknown tenant',
      Email: invoice.users?.email ?? '',
      Room: invoice.contracts?.rooms?.number ?? '',
      'Billing Month': formatMonth(invoice.billing_month),
      'Due Date': formatDate(invoice.due_date),
      Amount: Number(invoice.total_amount),
      'Invoice Status': invoice.status,
      'Payment Status': latestPayment?.status ?? '',
      'Transaction Date': latestPayment?.transaction_date ? formatDate(latestPayment.transaction_date) : '',
      'Reviewed At': latestPayment?.verified_at ? formatDateTime(latestPayment.verified_at) : '',
      'Rejection Reason': latestPayment?.rejection_reason ?? '',
    }
  }))

  appendSheet(workbook, 'Overdue', overdueInvoices.map((invoice) => ({
    'Invoice ID': invoiceCode(invoice.id),
    Tenant: invoice.users?.name ?? 'Unknown tenant',
    Room: invoice.contracts?.rooms?.number ?? '',
    'Due Date': formatDate(invoice.due_date),
    Amount: Number(invoice.total_amount),
    Status: invoice.status,
  })))

  XLSX.writeFile(workbook, `kostly-report-${report.month_year.slice(0, 7)}.xlsx`)
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: Record<string, string | number>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  sheet['!cols'] = Object.keys(rows[0] ?? {}).map((key) => ({ wch: Math.max(14, key.length + 4) }))
  XLSX.utils.book_append_sheet(workbook, sheet, name)
}

function latestPaymentFor(invoice: ReportExportInvoice) {
  return [...(invoice.payments ?? [])].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]
}

function isOverdue(invoice: ReportExportInvoice) {
  return invoice.status !== 'paid' && invoice.due_date < new Date().toISOString().slice(0, 10)
}

function invoiceCode(id: string) {
  return `#INV${id.slice(0, 5).toUpperCase()}`
}

function formatMonth(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
