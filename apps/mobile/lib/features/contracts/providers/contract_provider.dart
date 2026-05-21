import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/supabase_client.dart';
import '../../../models/contract.dart';

final activeContractProvider = FutureProvider.autoDispose<Contract?>((ref) async {
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

class ExtendRequestService {
  Future<void> submitRequest(String contractId, DateTime requestedEndDate, String? note) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    // Check if there's already a pending request
    final existing = await supabase
        .from('extend_requests')
        .select('id')
        .eq('contract_id', contractId)
        .eq('status', 'pending')
        .maybeSingle();

    if (existing != null) {
      throw Exception('You already have a pending extend request for this contract.');
    }

    await supabase.from('extend_requests').insert({
      'contract_id': contractId,
      'tenant_id': userId,
      'requested_end_date': requestedEndDate.toIso8601String(),
      'note': note,
      'status': 'pending',
    });
  }
}

final extendRequestServiceProvider = Provider<ExtendRequestService>((ref) {
  return ExtendRequestService();
});
