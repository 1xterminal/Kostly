import 'package:flutter_riverpod/flutter_riverpod.dart';

final mockInvoices = [
  {
    'id': 'inv-1',
    'total_amount': 1500000,
    'billing_month': '2026-05-01',
    'due_date': '2026-05-05',
    'invoice_date': '2026-05-01',
    'status': 'unpaid',
    'payments': [
      {
        'id': 'pay-1',
        'status': 'not_verified',
        'created_at': DateTime.now().toIso8601String(),
        'rejection_reason': null,
      }
    ]
  },
  {
    'id': 'inv-2',
    'total_amount': 2000000,
    'billing_month': '2026-04-01',
    'due_date': '2026-04-05',
    'invoice_date': '2026-04-01',
    'status': 'paid',
    'payments': [
      {
        'id': 'pay-2',
        'status': 'verified',
        'created_at': DateTime.now().subtract(const Duration(days: 30)).toIso8601String(),
        'rejection_reason': null,
      }
    ]
  },
  {
    'id': 'inv-3',
    'total_amount': 1500000,
    'billing_month': '2026-06-01',
    'due_date': '2026-06-05',
    'invoice_date': '2026-06-01',
    'status': 'unpaid',
    'payments': []
  }
];

final invoicesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 500));
  return mockInvoices;
});

final invoiceDetailProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, invoiceId) async {
  await Future.delayed(const Duration(milliseconds: 500));
  return mockInvoices.firstWhere((inv) => inv['id'] == invoiceId, orElse: () => mockInvoices.first);
});
