import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/home_repository.dart';

// ─── Repository Provider ──────────────────────────────────────────────────────

final homeRepositoryProvider = Provider<HomeRepository>((_) => const HomeRepository());

// ─── Data Providers ───────────────────────────────────────────────────────────

/// Active contract for the current tenant. Cached for the session.
final activeContractProvider = FutureProvider.autoDispose<ActiveContract?>((ref) async {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.fetchActiveContract();
});

/// Earliest pending invoice for the current tenant.
final pendingInvoiceProvider = FutureProvider.autoDispose<PendingInvoice?>((ref) async {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.fetchPendingInvoice();
});

/// Most recent active maintenance ticket.
final activeTicketProvider = FutureProvider.autoDispose<ActiveTicket?>((ref) async {
  final repo = ref.watch(homeRepositoryProvider);
  return repo.fetchActiveTicket();
});
