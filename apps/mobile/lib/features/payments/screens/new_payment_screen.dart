import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../providers/payment_providers.dart';

class NewPaymentScreen extends ConsumerStatefulWidget {
  const NewPaymentScreen({super.key});

  @override
  ConsumerState<NewPaymentScreen> createState() => _NewPaymentScreenState();
}

class _NewPaymentScreenState extends ConsumerState<NewPaymentScreen> {
  Map<String, dynamic>? _selectedInvoice;
  XFile? _selectedImage;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  final _currency = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'IDR ',
    decimalDigits: 2,
  );

  // ── Pick image ──────────────────────────────────────────────────────────────
  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 80,
    );
    if (image != null) {
      setState(() => _selectedImage = image);
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    if (_selectedInvoice == null || _selectedImage == null) return;

    setState(() => _isUploading = true);
    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not logged in');

      final invoiceId = _selectedInvoice!['id'] as String;
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_proof.jpg';
      final storagePath = 'payments/$userId/$fileName';

      // 1. Upload to Storage
      final bytes = await _selectedImage!.readAsBytes();
      await supabase.storage
          .from('payment-proofs')
          .uploadBinary(
            storagePath,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      // 2. Insert payment + mark invoice pending through trusted transaction
      final response = await supabase.functions.invoke(
        'submit-payment',
        body: {
          'invoice_id': invoiceId,
          'proof_images': storagePath,
          'transaction_date': DateTime.now().toIso8601String().split('T').first,
        },
      );
      if (response.status >= 400) {
        final body = response.data;
        final message = body is Map && body['error'] != null
            ? body['error'].toString()
            : 'Payment submission failed';
        throw Exception(message);
      }

      ref.invalidate(tenantPaymentsProvider);
      ref.invalidate(unpaidInvoicesProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment submitted! Awaiting owner verification.'),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
        context.pop();
      }
    } on StorageException catch (e) {
      _showError('Storage error: ${e.message}');
    } catch (e) {
      _showError('Submit failed: $e');
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    final asyncInvoices = ref.watch(unpaidInvoicesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F4),
      appBar: AppBar(
        title: const Text(
          'New payment',
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: const Color(0xFFF4F4F4),
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: asyncInvoices.when(
        data: (invoices) => _buildForm(invoices),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildForm(List<Map<String, dynamic>> invoices) {
    final amount = _selectedInvoice != null
        ? _currency.format(_selectedInvoice!['total_amount'] ?? 0)
        : null;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Invoice ID dropdown ─────────────────────────────────────────────
          const Text(
            'Invoice ID',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFFD1D5DB)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: invoices.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'No unpaid invoices available.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : DropdownButtonHideUnderline(
                    child: DropdownButton<Map<String, dynamic>>(
                      value: _selectedInvoice,
                      isExpanded: true,
                      hint: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'Select invoice',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                      items: invoices.map((inv) {
                        final id = inv['id'] as String;
                        return DropdownMenuItem(
                          value: inv,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              '#${id.substring(0, 6).toUpperCase()}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) =>
                          setState(() => _selectedInvoice = val),
                    ),
                  ),
          ),

          // ── Invoice Info ────────────────────────────────────────────────────
          if (_selectedInvoice != null) ...[
            const SizedBox(height: 24),
            const Text(
              'Invoice Info',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _infoRow('PAYMENT AMOUNT', amount ?? '-'),
            const SizedBox(height: 12),
            _infoRow('PAYMENT TARGET', 'Rental Room Cloud'),
          ],

          // ── Upload proof ────────────────────────────────────────────────────
          const SizedBox(height: 28),
          const Text(
            'Upload your transaction proof',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: _isUploading ? null : _pickImage,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(
                  color: _selectedImage != null
                      ? const Color(0xFF2E41A2)
                      : const Color(0xFFD1D5DB),
                ),
                borderRadius: BorderRadius.circular(8),
                color: Colors.white,
              ),
              child: _selectedImage != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: kIsWeb
                          ? Image.network(
                              _selectedImage!.path,
                              height: 200,
                              fit: BoxFit.cover,
                            )
                          : Image.file(
                              File(_selectedImage!.path),
                              height: 200,
                              fit: BoxFit.cover,
                            ),
                    )
                  : Row(
                      children: [
                        const Icon(
                          Icons.attach_file,
                          color: Colors.grey,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Upload an image',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 48),

          // ── Submit button ───────────────────────────────────────────────────
          Align(
            alignment: Alignment.center,
            child: ElevatedButton.icon(
              onPressed:
                  (_selectedInvoice == null ||
                      _selectedImage == null ||
                      _isUploading)
                  ? null
                  : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E41A2),
                disabledBackgroundColor: Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              icon: _isUploading
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.send, color: Colors.white, size: 18),
              label: Text(
                _isUploading ? 'Uploading…' : 'Submit',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
