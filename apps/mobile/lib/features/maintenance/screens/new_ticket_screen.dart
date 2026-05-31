import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/validators.dart';
import '../providers/maintenance_providers.dart';

const _kPrimary = Color(0xFF3341A5);

class NewTicketScreen extends ConsumerStatefulWidget {
  const NewTicketScreen({super.key});

  @override
  ConsumerState<NewTicketScreen> createState() => _NewTicketScreenState();
}

class _NewTicketScreenState extends ConsumerState<NewTicketScreen> {
  final _descriptionController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final roomAsync = ref.watch(activeMaintenanceRoomProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFEBEBEB),
      appBar: AppBar(
        title: const Text('New Ticket', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: roomAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _BodyMessage(message: error.toString(), isError: true),
        data: (room) {
          if (room == null) {
            return const _BodyMessage(message: 'No active room found for your account.');
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Room #${room.number}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Describe the maintenance issue clearly so owner can respond faster.',
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _descriptionController,
                  minLines: 6,
                  maxLines: 10,
                  decoration: InputDecoration(
                    hintText: 'Example: AC leaking near the window...',
                    filled: true,
                    fillColor: const Color(0xFFF5F5F5),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    // focusedBorder: OutlineInputBorder(
                    //   borderRadius: BorderRadius.circular(16),
                    //   borderSide: const BorderSide(color: _kPrimary),
                    // ),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : () => _submit(room.id),
                    icon: const Icon(Icons.send_outlined),
                    label: Text(_isSubmitting ? 'Submitting...' : 'Submit Ticket'),
                    // style: FilledButton.styleFrom(
                    //   backgroundColor: _kPrimary,
                    //   padding: const EdgeInsets.symmetric(vertical: 14),
                    //   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    // ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _submit(String roomId) async {
    final description = _descriptionController.text.trim();
    final validationError = validateMaintenanceDescription(description);
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await ref.read(maintenanceRepositoryProvider).createTicket(
            roomId: roomId,
            description: description,
          );
      ref.invalidate(maintenanceTicketsProvider);
      if (mounted) context.pop();
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}

class _BodyMessage extends StatelessWidget {
  final String message;
  final bool isError;

  const _BodyMessage({required this.message, this.isError = false});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: TextStyle(color: isError ? const Color(0xFFDC2626) : const Color(0xFF6B7280)),
        ),
      ),
    );
  }
}
