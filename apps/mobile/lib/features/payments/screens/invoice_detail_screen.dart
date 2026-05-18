import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/payment_providers.dart';

class InvoiceDetailScreen extends ConsumerWidget {
  final String invoiceId;
  const InvoiceDetailScreen({super.key, required this.invoiceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoiceAsyncValue = ref.watch(invoiceDetailProvider(invoiceId));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Invoice Details', style: TextStyle(color: Colors.black, fontSize: 18)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black),
        elevation: 0,
      ),
      body: invoiceAsyncValue.when(
        data: (invoice) {
          final status = invoice['status'] as String;
          final payments = List<Map<String, dynamic>>.from(invoice['payments'] ?? []);
          
          Map<String, dynamic>? latestPayment;
          if (payments.isNotEmpty) {
             // sort by created_at desc
             payments.sort((a, b) => DateTime.parse(b['created_at']).compareTo(DateTime.parse(a['created_at'])));
             latestPayment = payments.first;
          }

          String displayStatus = status;
          if (status == 'unpaid' && latestPayment != null) {
            if (latestPayment['status'] == 'not_verified') {
              displayStatus = 'pending';
            } else if (latestPayment['status'] == 'rejected') {
              displayStatus = 'rejected';
            }
          }

          final amount = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp', decimalDigits: 0)
              .format(invoice['total_amount']);
              
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        DateFormat('MMMM yyyy').format(DateTime.parse(invoice['billing_month'])),
                        style: const TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        amount,
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getStatusColor(displayStatus).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          displayStatus.toUpperCase(),
                          style: TextStyle(
                            color: _getStatusColor(displayStatus),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Details
                const Text('Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      _buildDetailRow('Due Date', DateFormat('dd MMM yyyy').format(DateTime.parse(invoice['due_date']))),
                      const Divider(height: 24),
                      _buildDetailRow('Invoice Date', DateFormat('dd MMM yyyy').format(DateTime.parse(invoice['invoice_date']))),
                    ],
                  ),
                ),

                if (displayStatus == 'rejected' && latestPayment != null && latestPayment['rejection_reason'] != null) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.error_outline, color: Colors.red, size: 20),
                            SizedBox(width: 8),
                            Text('Payment Rejected', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(latestPayment['rejection_reason'] ?? 'Invalid proof of payment', style: const TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Actions
                if (displayStatus == 'unpaid' || displayStatus == 'rejected')
                  ElevatedButton(
                    onPressed: () {
                      context.push('/pay/${invoice['id']}').then((_) {
                        ref.refresh(invoiceDetailProvider(invoiceId).future);
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B5998),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Pay Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'paid': return Colors.green;
      case 'pending': return Colors.orange;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }
}
