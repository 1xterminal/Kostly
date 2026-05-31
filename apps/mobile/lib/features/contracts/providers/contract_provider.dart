import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/supabase_client.dart';
import '../../../models/contract.dart';

final activeContractProvider = FutureProvider.autoDispose<Contract?>((
  ref,
) async {
  final userId = supabase.auth.currentUser?.id;
  if (userId == null) return null;

  try {
    final response = await supabase
        .from('contracts')
        .select('*, room:rooms(*)')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    if (response == null) return null;

    // Safely handle the room join — Supabase PostgREST can return
    // the nested relation as either a Map or a List depending on
    // the query planner. We normalise it here before passing to Freezed.
    final rawRoom = response['room'];
    Map<String, dynamic>? roomMap;
    if (rawRoom is Map<String, dynamic>) {
      roomMap = rawRoom;
    } else if (rawRoom is List && rawRoom.isNotEmpty) {
      roomMap = rawRoom.first as Map<String, dynamic>;
    }

    final contractData = Map<String, dynamic>.from(response);
    contractData['room'] = roomMap;

    return Contract.fromJson(contractData);
  } catch (e) {
    throw Exception('Failed to load active contract: $e');
  }
});

class LatestExtendRequest {
  final String id;
  final String? extensionInvoiceId;
  final DateTime requestedEndDate;
  final String status;
  final DateTime createdAt;

  const LatestExtendRequest({
    required this.id,
    this.extensionInvoiceId,
    required this.requestedEndDate,
    required this.status,
    required this.createdAt,
  });

  factory LatestExtendRequest.fromJson(Map<String, dynamic> json) {
    return LatestExtendRequest(
      id: json['id'] as String,
      extensionInvoiceId: json['extension_invoice_id'] as String?,
      requestedEndDate: DateTime.parse(json['requested_end_date'] as String),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  bool get isPending => status == 'pending';
  bool get isAwaitingPayment => status == 'awaiting_payment';
  bool get blocksNewRequest => isPending || isAwaitingPayment;
}

final latestExtendRequestProvider = FutureProvider.autoDispose
    .family<LatestExtendRequest?, String>((ref, contractId) async {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await supabase
          .from('extend_requests')
          .select(
            'id, extension_invoice_id, requested_end_date, status, created_at',
          )
          .eq('tenant_id', userId)
          .eq('contract_id', contractId)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response == null) return null;
      return LatestExtendRequest.fromJson(Map<String, dynamic>.from(response));
    });

class ExtendRequestService {
  Future<void> submitRequest(
    String contractId,
    DateTime requestedEndDate,
    String? note,
  ) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    // Check if there's already a pending request
    final existing = await supabase
        .from('extend_requests')
        .select('id')
        .eq('contract_id', contractId)
        .inFilter('status', ['pending', 'awaiting_payment'])
        .maybeSingle();

    if (existing != null) {
      throw Exception(
        'You already have an extension request waiting for review or payment.',
      );
    }

    await supabase.from('extend_requests').insert({
      'contract_id': contractId,
      'tenant_id': userId,
      'requested_end_date': requestedEndDate.toIso8601String().split('T').first,
      'note': note,
      'status': 'pending',
    });
  }
}

final extendRequestServiceProvider = Provider<ExtendRequestService>((ref) {
  return ExtendRequestService();
});
