import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/widgets/gradient_fab.dart';
import '../providers/contract_provider.dart';

class ExtendContractScreen extends ConsumerStatefulWidget {
  const ExtendContractScreen({super.key});

  @override
  ConsumerState<ExtendContractScreen> createState() => _ExtendContractScreenState();
}

class _ExtendContractScreenState extends ConsumerState<ExtendContractScreen> {
  DateTime? _selectedDate;
  final TextEditingController _dateController = TextEditingController();

  String _formatDate(DateTime date) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _pickDate(BuildContext context, DateTime minDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: minDate.add(const Duration(days: 1)),
      firstDate: minDate.add(const Duration(days: 1)),
      lastDate: minDate.add(const Duration(days: 365 * 5)), // Up to 5 years
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _dateController.text = '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
      });
    }
  }

  bool _isLoading = false;

  Future<void> _submit(String contractId) async {
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an extend date.')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(extendRequestServiceProvider).submitRequest(contractId, _selectedDate!, null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Extend request submitted successfully')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contractAsync = ref.watch(activeContractProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Request an Extend', style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: contractAsync.when(
        data: (contract) {
          if (contract == null) {
            return const Center(child: Text('No active contract found.'));
          }

          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CONTRACT PERIOD',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4B5563),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatDate(contract.startDate)} - ${_formatDate(contract.endDate)}',
                  style: const TextStyle(fontSize: 16, color: Color(0xFF111827)),
                ),
                const SizedBox(height: 32),
                const Text(
                  'Extend date to',
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _dateController,
                  readOnly: true,
                  onTap: () => _pickDate(context, contract.endDate),
                  decoration: InputDecoration(
                    hintText: 'DD/MM/YYYY',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                  ),
                ),
                const Spacer(),
                Center(
                  child: GradientFAB(
                    onPressed: _isLoading ? null : () => _submit(contract.id),
                    icon: _isLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save_outlined),
                    label: Text(_isLoading ? 'Submitting...' : 'Submit'),
                  ),
                )
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
