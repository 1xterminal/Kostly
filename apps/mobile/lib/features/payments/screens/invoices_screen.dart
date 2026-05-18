import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/payment_providers.dart';

class InvoicesScreen extends ConsumerWidget {
  const InvoicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoicesAsyncValue = ref.watch(invoicesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Invoices', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      body: invoicesAsyncValue.when(
        data: (invoices) {
          if (invoices.isEmpty) {
            return const Center(child: Text('No invoices found.'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(invoicesProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: invoices.length,
              itemBuilder: (context, index) {
                final invoice = invoices[index];
                final status = invoice['status'] as String;
                final payments = List<Map<String, dynamic>>.from(invoice['payments'] ?? []);
                
                // Real status is sometimes pending if payment is uploaded
                String displayStatus = status;
                if (status == 'unpaid' && payments.isNotEmpty) {
                   final latestPayment = payments.first;
                   if (latestPayment['status'] == 'not_verified') {
                     displayStatus = 'pending';
                   } else if (latestPayment['status'] == 'rejected') {
                     displayStatus = 'rejected';
                   }
                }

                Color statusColor;
                switch (displayStatus) {
                  case 'paid':
                    statusColor = Colors.green;
                    break;
                  case 'pending':
                    statusColor = Colors.orange;
                    break;
                  case 'rejected':
                    statusColor = Colors.red;
                    break;
                  default:
                    statusColor = Colors.grey;
                }

                final amount = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp', decimalDigits: 0)
                    .format(invoice['total_amount']);
                final billingMonth = DateFormat('MMMM yyyy').format(DateTime.parse(invoice['billing_month']));

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    title: Text(billingMonth, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Due: ${DateFormat('dd MMM yyyy').format(DateTime.parse(invoice['due_date']))}'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            displayStatus.toUpperCase(),
                            style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    onTap: () {
                      context.push('/invoices/${invoice['id']}');
                    },
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
