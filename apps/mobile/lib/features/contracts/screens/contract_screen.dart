import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/contract_provider.dart';

class ContractScreen extends ConsumerWidget {
  const ContractScreen({super.key});

  String _formatDate(DateTime date) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _formatCurrency(double amount) {
    return 'IDR ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contractAsync = ref.watch(activeContractProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('My Contract', style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () => context.push('/extend'),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Extend'),
          ),
        ],
      ),
      body: contractAsync.when(
        data: (contract) {
          if (contract == null) {
            return const Center(child: Text('No active contract found.'));
          }

          final roomName = contract.room != null ? 'Room #${contract.room!.number}' : 'Unknown Room';

          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSection('OCCUPIED ROOM', roomName),
                const SizedBox(height: 24),
                _buildSection('RENT PRICE', _formatCurrency(contract.monthlyRate)),
                const SizedBox(height: 24),
                _buildSection('CONTRACT PERIOD', '${_formatDate(contract.startDate)} - ${_formatDate(contract.endDate)}'),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF4B5563),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          content,
          style: const TextStyle(
            fontSize: 16,
            color: Color(0xFF111827),
          ),
        ),
      ],
    );
  }
}
