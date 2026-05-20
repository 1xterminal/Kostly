import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/maintenance_repository.dart';

final maintenanceRepositoryProvider = Provider<MaintenanceRepository>((ref) {
  return const MaintenanceRepository();
});

final maintenanceTicketsProvider = FutureProvider.autoDispose<List<MaintenanceTicket>>((ref) async {
  return ref.read(maintenanceRepositoryProvider).fetchTickets();
});

final maintenanceTicketProvider = FutureProvider.autoDispose.family<MaintenanceTicket?, String>((ref, id) async {
  return ref.read(maintenanceRepositoryProvider).fetchTicketById(id);
});

final activeMaintenanceRoomProvider = FutureProvider.autoDispose<MaintenanceRoom?>((ref) async {
  return ref.read(maintenanceRepositoryProvider).fetchActiveRoom();
});
