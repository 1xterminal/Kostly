import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import '../providers/maintenance_providers.dart';
import '../repositories/maintenance_repository.dart';

const _kBg = Color(0xFFF1F1F1);
const _kText = Color(0xFF111111);
const _kMuted = Color(0xFF7F7F7F);
const _kOrange = Color(0xFFD44B14);

final _reportedFormat = DateFormat('EEE, d MMM \'at\' h:mm a');

class TicketDetailsScreen extends ConsumerStatefulWidget {
  final String ticketId;

  const TicketDetailsScreen({super.key, required this.ticketId});

  @override
  ConsumerState<TicketDetailsScreen> createState() => _TicketDetailsScreenState();
}

class _TicketDetailsScreenState extends ConsumerState<TicketDetailsScreen> {
  final _replyController = TextEditingController();
  bool _isSending = false;
  String? _error;

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync = ref.watch(maintenanceTicketProvider(widget.ticketId));
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: ticketAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _Message(message: error.toString(), isError: true),
          data: (ticket) {
            if (ticket == null) return const _Message(message: 'Ticket not found.');

            return Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  height: 64,
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const Text(
                        'Ticket Details',
                        style: TextStyle(fontWeight: FontWeight.w700, color: _kText),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: [
                      Column(
                        spacing: 16,
                        children: [
                          Align(
                            alignment: Alignment.centerLeft,
                            child: _StatusPill(status: ticket.ticketStatus),
                          ),
                          // const SizedBox(height: 34),
                          Row(
                            spacing: 16,
                            children: [
                              Row(
                                spacing: 4,
                                children: [
                                  const Icon(Icons.confirmation_number_outlined),
                                  Text(
                                    '#${_shortTicketId(ticket.id)}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: _kText),
                                  ),
                                ],
                              ),
                              Row(
                                spacing: 4,
                                children: [
                                  const Icon(Icons.bed_outlined),
                                  Text(
                                    'Room #${ticket.room?.number ?? '-'}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: _kText),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ]
                      ),

                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        spacing: 16,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            spacing: 8,
                            children: [
                              Text(
                                _ticketTitle(ticket),
                                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w500, color: _kText, letterSpacing: -1.2),
                              ),
                              // const SizedBox(height: 18),
                              Text.rich(
                                TextSpan(
                                  text: 'Reported by ',
                                  children: [
                                    const TextSpan(text: 'You', style: TextStyle(fontWeight: FontWeight.w800)),
                                    TextSpan(text: '\non ${_reportedFormat.format(ticket.createdAt)}'),
                                  ],
                                ),
                                style: const TextStyle(height: 1.28, color: _kText),
                              ),
                            ],
                          ),
                          // const SizedBox(height: 26),
                          Text(
                            ticket.description,
                            style: const TextStyle(fontSize: 16, height: 1.16, color: _kText),
                          ),
                          if (ticket.resolvedMessage != null && ticket.resolvedMessage!.isNotEmpty) ...[
                            // const SizedBox(height: 22),
                            Text(ticket.resolvedMessage!, style: const TextStyle(fontSize: 20, color: _kMuted)),
                          ],

                          // const SizedBox(height: 26),
                          Text(
                            '${ticket.replies.length} RESPONSE${ticket.replies.length == 1 ? '' : 'S'}',
                            style: const TextStyle(fontWeight: FontWeight.w900, color: _kText),
                          ),

                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      // const SizedBox(height: 24),
                      ...ticket.replies.map((reply) => Padding(
                        padding: const EdgeInsets.only(bottom: 22),
                        child: Row(
                          spacing: 16,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const CircleAvatar(radius: 16, backgroundColor: Color(0xFFD9D9D9)),
                            // const SizedBox(width: 22),
                            Expanded(
                              child: Column(
                                spacing: 8,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text.rich(
                                    TextSpan(
                                      text: _replySenderName(reply),
                                      style: const TextStyle(fontWeight: FontWeight.w800),
                                      children: [
                                        TextSpan(
                                          text: ' • ${_relativeTime(reply.createdAt)}',
                                          style: const TextStyle(fontWeight: FontWeight.w400),
                                        ),
                                      ],
                                    ),
                                    style: const TextStyle(color: _kText),
                                  ),
                                  // const SizedBox(height: 10),
                                  Text(reply.message, style: const TextStyle(fontSize: 16, height: 1.15, color: _kText)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.fromLTRB(24, 16, 24, 16 + MediaQuery.of(context).padding.bottom),
                  decoration: const BoxDecoration(
                    color: _kBg,
                    border: Border(top: BorderSide(color: Color(0xFFCFCFCF))),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
                        ),
                      Row(
                        spacing: 16,
                        children: [
                          const CircleAvatar(radius: 16, backgroundColor: Color(0xFFD9D9D9)),
                          // const SizedBox(width: 22),
                          Expanded(
                            child: TextField(
                              controller: _replyController,
                              minLines: 1,
                              maxLines: 4,
                              // style: const TextStyle(fontSize: 24),
                              decoration: const InputDecoration(
                                hintText: 'Enter message',
                                hintStyle: TextStyle(color: Color(0xFF8F8F8F)),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: _isSending ? null : _sendReply,
                            icon: _isSending
                                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                                : Icon(Icons.send_outlined, color: _replyController.text.isEmpty ? _kMuted: colorScheme.primary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _sendReply() async {
    final message = _replyController.text.trim();
    if (message.isEmpty) return;

    setState(() {
      _isSending = true;
      _error = null;
    });

    try {
      await ref.read(maintenanceRepositoryProvider).addReply(
            ticketId: widget.ticketId,
            message: message,
          );
      _replyController.clear();
      ref.invalidate(maintenanceTicketProvider(widget.ticketId));
      ref.invalidate(maintenanceTicketsProvider);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }
}

class _StatusPill extends StatelessWidget {
  final String status;

  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      height: 24,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.55)),
      ),
      child: Text(
        _statusLabel(status),
        style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 2, color: color),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  final String message;
  final bool isError;

  const _Message({required this.message, this.isError = false});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: TextStyle(color: isError ? const Color(0xFFDC2626) : _kMuted),
        ),
      ),
    );
  }
}

String _ticketTitle(MaintenanceTicket ticket) {
  final firstLine = ticket.description.split(RegExp(r'\r?\n')).first;
  final firstSentence = firstLine.split(RegExp(r'[.!?]')).first.trim();
  return firstSentence.isEmpty ? 'Maintenance Ticket' : firstSentence;
}

String _shortTicketId(String id) => id.replaceAll('-', '').substring(0, 4).toUpperCase();

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

String _relativeTime(DateTime value) {
  final diff = DateTime.now().difference(value);
  if (diff.inMinutes < 60) return '${diff.inMinutes.clamp(1, 59)} min ago';
  if (diff.inHours < 24) return '${diff.inHours} hr ago';
  return '${diff.inDays} d ago';
}

String _replySenderName(TicketReply reply) {
  final sender = reply.sender;
  if (sender != null) return sender.name;

  if (reply.senderId == supabase.auth.currentUser?.id) return 'You';
  return 'Owner';
}
