import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/maintenance_providers.dart';
import '../repositories/maintenance_repository.dart';

const _kBg = Color(0xFFEBEBEB);
const _kPrimary = Color(0xFF3341A5);
const _kText = Color(0xFF111827);
const _kMuted = Color(0xFF6B7280);

final _dateFormat = DateFormat('d MMM yyyy');

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(maintenanceTicketsProvider);

    return Scaffold(
      backgroundColor: _kBg,
      appBar: AppBar(
        title: const Text('Maintenance', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => context.push('/maintenance/new'),
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'New ticket',
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _kPrimary,
        onRefresh: () async => ref.invalidate(maintenanceTicketsProvider),
        child: ticketsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: [_MessageCard(message: error.toString(), isError: true)],
          ),
          data: (tickets) {
            if (tickets.isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                children: const [
                  _MessageCard(message: 'No maintenance tickets yet.'),
                ],
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              itemCount: tickets.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final ticket = tickets[index];
                return _TicketCard(
                  ticket: ticket,
                  onTap: () => context.push('/maintenance/${ticket.id}'),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: _kPrimary,
        foregroundColor: Colors.white,
        onPressed: () => context.push('/maintenance/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final MaintenanceTicket ticket;
  final VoidCallback onTap;

  const _TicketCard({required this.ticket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(ticket.ticketStatus);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFDDDDDD)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ticket.room == null ? 'Maintenance Ticket' : 'Room #${ticket.room!.number}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: _kText),
                  ),
                ),
                _StatusChip(status: ticket.ticketStatus, color: color),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              ticket.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, color: _kMuted),
            ),
            const SizedBox(height: 12),
            Text(
              _dateFormat.format(ticket.createdAt),
              style: const TextStyle(fontSize: 12, color: _kMuted),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  final Color color;

  const _StatusChip({required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Text(
        status.toUpperCase().replaceAll('_', ' '),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color),
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  final String message;
  final bool isError;

  const _MessageCard({required this.message, this.isError = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFFEF2F2) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isError ? const Color(0xFFFECACA) : const Color(0xFFDDDDDD)),
      ),
      child: Text(message, style: TextStyle(color: isError ? const Color(0xFFDC2626) : _kMuted)),
    );
  }
}

Color _statusColor(String status) {
  return switch (status) {
    'in_progress' => const Color(0xFF2563EB),
    'resolved' => const Color(0xFF059669),
    'closed' => const Color(0xFF6B7280),
    _ => const Color(0xFFD97706),
  };
}
