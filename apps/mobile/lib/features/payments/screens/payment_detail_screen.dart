import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../maintenance/providers/maintenance_providers.dart';
import '../providers/payment_providers.dart';

class PaymentDetailScreen extends ConsumerStatefulWidget {
  final String paymentId;
  const PaymentDetailScreen({super.key, required this.paymentId});

  @override
  ConsumerState<PaymentDetailScreen> createState() =>
      _PaymentDetailScreenState();
}

class _PaymentDetailScreenState extends ConsumerState<PaymentDetailScreen> {
  bool _isOpeningDispute = false;

  @override
  Widget build(BuildContext context) {
    final asyncPayment = ref.watch(paymentDetailProvider(widget.paymentId));

    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: const Text(
          'Payment Details',
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFFF4F4F4),
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: asyncPayment.when(
        data: (payment) => _buildDetail(context, payment),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                const SizedBox(height: 12),
                Text(
                  e.toString().replaceFirst('Exception: ', ''),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, Map<String, dynamic> payment) {
    final invoice = payment['invoices'] as Map<String, dynamic>?;
    final invoiceId =
        invoice?['id'] as String? ?? payment['invoice_id'] as String;
    final shortId = '#${invoiceId.substring(0, 6).toUpperCase()}';
    final status = payment['status'] as String;
    final amount = invoice?['total_amount'] as num? ?? 0;
    final invoiceStatus = invoice?['status'] as String?;
    final rejectionReason = payment['rejection_reason'] as String?;

    final currency = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'IDR ',
      decimalDigits: 0,
    );

    Color statusColor;
    String statusLabel;
    switch (status) {
      case 'verified':
        statusColor = const Color(0xFF16A34A);
        statusLabel = 'VERIFIED';
        break;
      case 'rejected':
        statusColor = const Color(0xFFDC2626);
        statusLabel = 'REJECTED';
        break;
      default:
        statusColor = const Color(0xFF2E41A2);
        statusLabel = 'UNVERIFIED';
    }

    String? proofUrl = payment['proof_signed_url'] as String?;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Invoice ID ──────────────────────────────────────────────────────
          Text(
            'Invoice $shortId',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            statusLabel,
            style: TextStyle(
              color: statusColor,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),

          const SizedBox(height: 24),

          // ── Amount ──────────────────────────────────────────────────────────
          const Text(
            'PAYMENT AMOUNT',
            style: TextStyle(fontSize: 11, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          Text(
            currency.format(amount),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),

          const SizedBox(height: 20),

          // ── Target ──────────────────────────────────────────────────────────
          const Text(
            'PAYMENT TARGET',
            style: TextStyle(fontSize: 11, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          const Text(
            'Monthly rent payment',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),

          // ── Rejection reason ────────────────────────────────────────────────
          if (status == 'rejected' && rejectionReason != null) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Color(0xFFDC2626),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Payment Rejected',
                          style: TextStyle(
                            color: Color(0xFFDC2626),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          rejectionReason,
                          style: const TextStyle(
                            color: Color(0xFFDC2626),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isOpeningDispute
                    ? null
                    : () => _openPaymentDispute(context, payment),
                icon: _isOpeningDispute
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.forum_outlined),
                label: Text(
                  _isOpeningDispute
                      ? 'Opening dispute...'
                      : 'Discuss in Maintenance Center',
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: invoiceStatus == 'paid'
                    ? null
                    : () => context.push('/payments/new?invoice=$invoiceId'),
                icon: const Icon(Icons.upload_file_outlined),
                label: const Text('Submit new proof'),
              ),
            ),
          ],

          const SizedBox(height: 28),

          // ── Proof image ──────────────────────────────────────────────────────
          const Text(
            'Your proof',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (proofUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                proofUrl,
                width: double.infinity,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return const SizedBox(
                    height: 200,
                    child: Center(child: CircularProgressIndicator()),
                  );
                },
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.broken_image_outlined,
                      size: 48,
                      color: Colors.grey,
                    ),
                  ),
                ),
              ),
            )
          else
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text(
                  'No proof image uploaded',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openPaymentDispute(
    BuildContext context,
    Map<String, dynamic> payment,
  ) async {
    final paymentId = payment['id'] as String;
    final invoice = payment['invoices'] as Map<String, dynamic>?;
    final invoiceId =
        invoice?['id'] as String? ?? payment['invoice_id'] as String;
    final rejectionReason = payment['rejection_reason'] as String?;
    final shortInvoice = '#${invoiceId.substring(0, 6).toUpperCase()}';
    final message = [
      'Payment dispute for invoice $shortInvoice.',
      if (rejectionReason != null && rejectionReason.trim().isNotEmpty)
        'Rejection reason: ${rejectionReason.trim()}',
      'I want to discuss this rejected payment.',
    ].join('\n\n');

    setState(() => _isOpeningDispute = true);
    try {
      final ticketId = await ref
          .read(maintenanceRepositoryProvider)
          .createPaymentDispute(paymentId: paymentId, message: message);
      ref.invalidate(maintenanceTicketsProvider);
      ref.invalidate(maintenanceTicketProvider(ticketId));
      if (context.mounted) context.push('/maintenance/$ticketId');
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isOpeningDispute = false);
    }
  }
}
