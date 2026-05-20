import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/payment_providers.dart';

// ─── Status helpers ────────────────────────────────────────────────────────────
Color _statusColor(String status) {
  switch (status) {
    case 'verified':   return const Color(0xFF16A34A);
    case 'rejected':   return const Color(0xFFDC2626);
    default:           return const Color(0xFFD97706); // not_verified → amber
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'verified':     return 'VERIFIED';
    case 'rejected':     return 'REJECTED';
    default:             return 'UNVERIFIED';
  }
}

// ─── Screen ────────────────────────────────────────────────────────────────────
class PaymentsListScreen extends ConsumerWidget {
  const PaymentsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncPayments = ref.watch(tenantPaymentsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Payments',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.black54),
            onPressed: () => ref.invalidate(tenantPaymentsProvider),
          ),
        ],
      ),
      body: asyncPayments.when(
        data: (payments) {
          if (payments.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long_outlined,
                      size: 64, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'No payments yet',
                    style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade500,
                        fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap "+ New payment" to submit your first payment.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(tenantPaymentsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: payments.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final p = payments[i];
                final status = p['status'] as String;
                final invoice = p['invoices'] as Map<String, dynamic>?;
                final invoiceId = invoice?['id'] as String? ?? p['invoice_id'] as String;
                final shortId = '#INV${invoiceId.substring(0, 6).toUpperCase()}';
                final date = DateTime.tryParse(p['created_at'] as String? ?? '');
                final dateStr = date != null
                    ? DateFormat('d MMMM yyyy').format(date)
                    : '-';

                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  title: Text(
                    shortId,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                  subtitle: Text(
                    dateStr,
                    style:
                        TextStyle(fontSize: 12, color: Colors.grey.shade500),
                  ),
                  trailing: Text(
                    _statusLabel(status),
                    style: TextStyle(
                      color: _statusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  onTap: () => context.push('/payments/${p['id']}'),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(e.toString(), textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(tenantPaymentsProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
      // ── FAB ──────────────────────────────────────────────────────────────────
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await context.push('/payments/new');
          ref.invalidate(tenantPaymentsProvider);
        },
        backgroundColor: const Color(0xFF3B5998),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'New payment',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
