import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/widgets/gradient_fab.dart';
import '../providers/maintenance_providers.dart';
import '../repositories/maintenance_repository.dart';

const _kText = Color(0xFF111111);
const _kMuted = Color(0xFF858585);
const _kOrange = Color(0xFFD44B14);

final _timeFormat = DateFormat('h:mm a');

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(maintenanceTicketsProvider);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'Maintenance Center',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: _kText,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () async =>
                        ref.invalidate(maintenanceTicketsProvider),
                    child: ticketsAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (error, _) => ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          _MessageRow(message: error.toString(), isError: true),
                        ],
                      ),
                      data: (tickets) {
                        if (tickets.isEmpty) {
                          return ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: const [
                              _MessageRow(
                                message: 'No maintenance tickets yet.',
                              ),
                            ],
                          );
                        }

                        return ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: tickets.length,
                          separatorBuilder: (_, _) => const Divider(
                            height: 1,
                            color: Color(0xFFD7D7D7),
                          ),
                          itemBuilder: (context, index) {
                            final ticket = tickets[index];
                            return _TicketRow(
                              ticket: ticket,
                              onTap: () =>
                                  context.push('/maintenance/${ticket.id}'),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      floatingActionButton: GradientFAB(
        onPressed: () => context.push('/maintenance/new'),
        icon: const Icon(Icons.report_problem_outlined),
        label: const Text('Report a problem'),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}

class _TicketRow extends StatelessWidget {
  final MaintenanceTicket ticket;
  final VoidCallback onTap;

  const _TicketRow({required this.ticket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: const Color(0xFFF8F8F8),
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8.0,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8.0,
              children: [
                Expanded(
                  child: Text(
                    _ticketTitle(ticket),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: _kText,
                    ),
                  ),
                ),
                Text(
                  _timeFormat.format(ticket.createdAt),
                  style: const TextStyle(color: _kMuted),
                ),
              ],
            ),
            Text(
              _statusLabel(ticket.ticketStatus),
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: _statusColor(ticket.ticketStatus),
              ),
            ),
            Text(
              ticket.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(height: 1.15, color: _kText),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageRow extends StatelessWidget {
  final String message;
  final bool isError;

  const _MessageRow({required this.message, this.isError = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Text(
        message,
        style: TextStyle(color: isError ? const Color(0xFFDC2626) : _kMuted),
      ),
    );
  }
}

String _ticketTitle(MaintenanceTicket ticket) {
  final firstLine = ticket.description.split(RegExp(r'\r?\n')).first;
  final firstSentence = firstLine.split(RegExp(r'[.!?]')).first.trim();
  if (firstSentence.length <= 24) return firstSentence;
  return '${firstSentence.substring(0, 24)}...';
}

String _statusLabel(String status) {
  if (status == 'reported' || status == 'in_progress') return 'UNRESOLVED';
  if (status == 'resolved') return 'RESOLVED';
  return 'CLOSED';
}

Color _statusColor(String status) {
  if (status == 'reported' || status == 'in_progress') return _kOrange;
  if (status == 'resolved') return const Color(0xFF059669);
  return _kMuted;
}
