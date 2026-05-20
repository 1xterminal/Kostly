import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/maintenance_providers.dart';

const _kPrimary = Color(0xFF3341A5);
const _kText = Color(0xFF111827);
const _kMuted = Color(0xFF6B7280);

final _detailDateFormat = DateFormat('d MMM yyyy, HH:mm');

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

    return Scaffold(
      backgroundColor: const Color(0xFFEBEBEB),
      appBar: AppBar(
        title: const Text('Ticket Details', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ticketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _Message(message: error.toString(), isError: true),
        data: (ticket) {
          if (ticket == null) return const _Message(message: 'Ticket not found.');

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  children: [
                    Container(
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
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: _kText),
                                ),
                              ),
                              _StatusChip(status: ticket.ticketStatus),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(ticket.description, style: const TextStyle(fontSize: 15, color: _kText)),
                          const SizedBox(height: 10),
                          Text(_detailDateFormat.format(ticket.createdAt), style: const TextStyle(fontSize: 12, color: _kMuted)),
                          if (ticket.resolvedMessage != null && ticket.resolvedMessage!.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            const Text('Resolution', style: TextStyle(fontWeight: FontWeight.w700, color: _kText)),
                            const SizedBox(height: 4),
                            Text(ticket.resolvedMessage!, style: const TextStyle(color: _kMuted)),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text('Replies', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _kText)),
                    const SizedBox(height: 10),
                    if (ticket.replies.isEmpty)
                      const Text('No replies yet.', style: TextStyle(color: _kMuted))
                    else
                      ...ticket.replies.map((reply) => Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${reply.sender?.name ?? 'Unknown'} (${reply.sender?.role ?? 'user'})',
                                        style: const TextStyle(fontWeight: FontWeight.w700, color: _kText),
                                      ),
                                    ),
                                    Text(_detailDateFormat.format(reply.createdAt), style: const TextStyle(fontSize: 11, color: _kMuted)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(reply.message, style: const TextStyle(color: _kText)),
                              ],
                            ),
                          )),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
                decoration: const BoxDecoration(
                  color: Color(0xFFF5F5F5),
                  border: Border(top: BorderSide(color: Color(0xFFDDDDDD))),
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
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _replyController,
                            minLines: 1,
                            maxLines: 4,
                            decoration: InputDecoration(
                              hintText: 'Write a reply...',
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        IconButton.filled(
                          onPressed: _isSending ? null : _sendReply,
                          icon: _isSending
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.send),
                          style: IconButton.styleFrom(backgroundColor: _kPrimary, foregroundColor: Colors.white),
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

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'in_progress' => const Color(0xFF2563EB),
      'resolved' => const Color(0xFF059669),
      'closed' => const Color(0xFF6B7280),
      _ => const Color(0xFFD97706),
    };

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
