import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/supabase_client.dart';

// ── Tenant's submitted payments (Payments List screen) ─────────────────────────
final tenantPaymentsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final userId = supabase.auth.currentUser?.id;
  if (userId == null) throw Exception('Not logged in');

  final response = await supabase
      .from('payments')
      .select('*, invoices(id, total_amount, billing_month)')
      .eq('tenant_id', userId)
      .order('created_at', ascending: false);

  return List<Map<String, dynamic>>.from(response as List);
});

// ── Unpaid invoices with no pending payment (for "New Payment" dropdown) ────────
final unpaidInvoicesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final userId = supabase.auth.currentUser?.id;
  if (userId == null) throw Exception('Not logged in');

  // Get invoices that are unpaid and don't have a not_verified payment already
  final response = await supabase
      .from('invoices')
      .select('*, payments(status)')
      .eq('tenant_id', userId)
      .eq('status', 'unpaid')
      .order('billing_month', ascending: false);

  final invoices = List<Map<String, dynamic>>.from(response as List);

  // Filter out invoices that already have a pending (not_verified) payment
  return invoices.where((inv) {
    final payments = List<Map<String, dynamic>>.from(inv['payments'] ?? []);
    final hasPending = payments.any((p) => p['status'] == 'not_verified');
    return !hasPending;
  }).toList();
});

// ── Single payment detail ───────────────────────────────────────────────────────
final paymentDetailProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>(
  (ref, paymentId) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final response = await supabase
        .from('payments')
        .select('*, invoices(id, total_amount, billing_month, status)')
        .eq('id', paymentId)
        .eq('tenant_id', userId)
        .maybeSingle();

    if (response == null) throw Exception('Payment not found or access denied.');
    
    final payment = Map<String, dynamic>.from(response);
    final proofPath = payment['proof_images'] as String?;
    if (proofPath != null && proofPath.isNotEmpty) {
      try {
        payment['proof_signed_url'] = await supabase.storage
            .from('payments')
            .createSignedUrl(proofPath, 60);
      } catch (e) {
        // ignore error, url will be null
      }
    }
    return payment;
  },
);


