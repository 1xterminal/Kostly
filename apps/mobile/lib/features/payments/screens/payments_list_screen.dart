import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/widgets/gradient_fab.dart';
import '../providers/payment_providers.dart';

Color _statusColor(String status) {
  switch (status) {
    case 'verified':
      return const Color(0xFF16A34A);
    case 'rejected':
      return const Color(0xFFDC2626);
    default:
      return const Color(0xFF2E41A2); // not_verified → blue
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'verified':
      return 'VERIFIED';
    case 'rejected':
      return 'REJECTED';
    default:
      return 'UNVERIFIED';
  }
}

// ─── Screen ────────────────────────────────────────────────────────────────────
class PaymentsListScreen extends ConsumerWidget {
  const PaymentsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncPayments = ref.watch(tenantPaymentsProvider);

    return Scaffold(
      // backgroundColor: const Color(0xFFF4F4F4),
      // appBar: AppBar(
      //   title: const Text(
      //     'Payments',
      //     style: TextStyle(
      //       fontSize: 22,
      //       fontWeight: FontWeight.w600,
      //       letterSpacing: -0.2,
      //     ),
      //   ),
      //   backgroundColor: const Color(0xFFF4F4F4),
      //   elevation: 0,
      //   centerTitle: false,
      //   actions: [
      //     IconButton(
      //       icon: const Icon(Icons.refresh, color: Colors.black54),
      //       onPressed: () => ref.invalidate(tenantPaymentsProvider),
      //     ),
      //   ],
      // ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(tenantPaymentsProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payments',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.2,
                  ),
                ),
                // Expanded(
                asyncPayments.when(
                  data: (payments) {
                    if (payments.isEmpty) {
                      return Center(
                        child: Column(
                          spacing: 8,
                          children: [
                            Icon(
                              Icons.receipt_long_outlined,
                              size: 64,
                              color: Colors.grey.shade400,
                            ),
                            // const SizedBox(height: 16),
                            Text(
                              'No payments yet',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade600,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            // const SizedBox(height: 8),
                            Text(
                              'Tap "+ New payment" to submit your first payment.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                        //   )
                        // )
                      );
                    }

                    return Padding(
                      padding: const EdgeInsets.fromLTRB(0, 16, 0, 96),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: payments.map((p) {
                          final status = p['status'] as String;
                          final invoice =
                              p['invoices'] as Map<String, dynamic>?;
                          final invoiceId =
                              invoice?['id'] as String? ??
                              p['invoice_id'] as String;
                          final shortId =
                              '#INV${invoiceId.substring(0, 6).toUpperCase()}';
                          final date = DateTime.tryParse(
                            p['created_at'] as String? ?? '',
                          );
                          final dateStr = date != null
                              ? DateFormat('d MMMM yyyy').format(date)
                              : '-';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              title: Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  shortId,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                              subtitle: Text(
                                _statusLabel(status),
                                style: TextStyle(
                                  color: _statusColor(status),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    dateStr,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade400,
                                    ),
                                  ),
                                ],
                              ),
                              onTap: () => context.push('/payments/${p['id']}'),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            size: 48,
                            color: Colors.red,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            e.toString(),
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.red),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () =>
                                ref.invalidate(tenantPaymentsProvider),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  //   ),
                ),
                // )
              ],
            ),
          ),
        ),
      ),
      // ── FAB ──────────────────────────────────────────────────────────────────
      floatingActionButton: GradientFAB(
        onPressed: () async {
          await context.push('/payments/new');
          ref.invalidate(tenantPaymentsProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text('New payment'),
      ),
      // FloatingActionButton.extended(
      //   onPressed: () async {
      //     await context.push('/payments/new');
      //     ref.invalidate(tenantPaymentsProvider);
      //   },
      //   // backgroundColor: const Color(0xFF2E41A2),
      //   elevation: 2,
      //   icon: const Icon(Icons.add, size: 20),
      //   label: const Text(
      //     'New payment',
      //     // style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      //   ),
      // ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
