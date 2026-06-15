import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:mobile/features/widgets/gradient_fab.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../../home/providers/home_providers.dart';
import '../providers/payment_providers.dart';

class NewPaymentScreen extends ConsumerStatefulWidget {
  final String? initialInvoiceId;

  const NewPaymentScreen({super.key, this.initialInvoiceId});

  @override
  ConsumerState<NewPaymentScreen> createState() => _NewPaymentScreenState();
}

class _NewPaymentScreenState extends ConsumerState<NewPaymentScreen> {
  static const _maxProofBytes = 5 * 1024 * 1024;
  static const _allowedProofExtensions = {
    'jpg',
    'jpeg',
    'png',
    'webp',
    'heic',
    'heif',
  };

  Map<String, dynamic>? _selectedInvoice;
  XFile? _selectedImage;
  Uint8List? _selectedImageBytes;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  final _currency = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'IDR ',
    decimalDigits: 0,
  );
  final _date = DateFormat('d MMM yyyy');
  final _month = DateFormat('MMMM yyyy');

  // ── Pick image ──────────────────────────────────────────────────────────────
  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 80,
    );
    if (image != null) {
      final validationError = await _validateProofImage(image);
      if (validationError != null) {
        _showError(validationError);
        return;
      }
      final bytes = await image.readAsBytes();
      setState(() {
        _selectedImage = image;
        _selectedImageBytes = bytes;
      });
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    if (_selectedInvoice == null) {
      _showError('Select an invoice first.');
      return;
    }
    if (_selectedImage == null) {
      _showError('Upload a payment proof image first.');
      return;
    }

    setState(() => _isUploading = true);
    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not logged in');

      final invoiceId = _selectedInvoice!['id'] as String;
      final proofExtension = _proofExtension(_selectedImage!);
      final contentType = _proofContentType(proofExtension);
      final fileName =
          '${DateTime.now().millisecondsSinceEpoch}_proof.$proofExtension';
      final storagePath = 'payments/$userId/$fileName';

      // 1. Upload to Storage
      final bytes = await _selectedImage!.readAsBytes();
      if (bytes.length > _maxProofBytes) {
        throw Exception('Payment proof must be 5 MB or smaller.');
      }
      await supabase.storage
          .from('payment-proofs')
          .uploadBinary(
            storagePath,
            bytes,
            fileOptions: FileOptions(contentType: contentType),
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
      ref.invalidate(pendingInvoiceProvider);

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

  Future<String?> _validateProofImage(XFile image) async {
    final extension = _proofExtension(image);
    if (!_allowedProofExtensions.contains(extension)) {
      return 'Upload JPG, PNG, WEBP, HEIC, or HEIF image only.';
    }

    final length = await image.length();
    if (length > _maxProofBytes) {
      return 'Payment proof must be 5 MB or smaller.';
    }

    return null;
  }

  String _proofExtension(XFile image) {
    final path = image.name.isNotEmpty ? image.name : image.path;
    final parts = path.split('.');
    if (parts.length < 2) return 'jpg';
    return parts.last.toLowerCase();
  }

  String _proofContentType(String extension) {
    return switch (extension) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      'heic' => 'image/heic',
      'heif' => 'image/heif',
      _ => 'image/jpeg',
    };
  }

  String _formatDateValue(Object? value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    return parsed == null ? '-' : _date.format(parsed);
  }

  String _formatMonthValue(Object? value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    return parsed == null ? '-' : _month.format(parsed);
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
      floatingActionButton: GradientFAB(
        onPressed:
            (_selectedInvoice == null || _selectedImage == null || _isUploading)
            ? null
            : _submit,
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
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildForm(List<Map<String, dynamic>> invoices) {
    _maybePreselectInvoice(invoices);

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
                        final amount = _currency.format(
                          inv['total_amount'] ?? 0,
                        );
                        return DropdownMenuItem(
                          value: inv,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_formatMonthValue(inv['billing_month'])} - $amount',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  '#${id.substring(0, 6).toUpperCase()} - due ${_formatDateValue(inv['due_date'])}',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
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
            _infoRow(
              'BILLING MONTH',
              _formatMonthValue(_selectedInvoice!['billing_month']),
            ),
            const SizedBox(height: 12),
            _infoRow(
              'DUE DATE',
              _formatDateValue(_selectedInvoice!['due_date']),
            ),
            const SizedBox(height: 12),
            _infoRow('PAYMENT TARGET', 'Monthly rent payment'),
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
              child: _selectedImageBytes != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.memory(
                        _selectedImageBytes!,
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
          // Align(
          //   alignment: Alignment.center,
          //   child: ElevatedButton.icon(
          //     onPressed:
          //         (_selectedInvoice == null ||
          //             _selectedImage == null ||
          //             _isUploading)
          //         ? null
          //         : _submit,
          //     style: ElevatedButton.styleFrom(
          //       backgroundColor: const Color(0xFF2E41A2),
          //       disabledBackgroundColor: Colors.grey.shade300,
          //       padding: const EdgeInsets.symmetric(
          //         horizontal: 24,
          //         vertical: 12,
          //       ),
          //       shape: RoundedRectangleBorder(
          //         borderRadius: BorderRadius.circular(30),
          //       ),
          //     ),
          //     icon: _isUploading
          //         ? const SizedBox(
          //             height: 16,
          //             width: 16,
          //             child: CircularProgressIndicator(
          //               color: Colors.white,
          //               strokeWidth: 2,
          //             ),
          //           )
          //         : const Icon(Icons.send, color: Colors.white, size: 18),
          //     label: Text(
          //       _isUploading ? 'Uploading…' : 'Submit',
          //       style: const TextStyle(
          //         fontSize: 15,
          //         fontWeight: FontWeight.w600,
          //         color: Colors.white,
          //       ),
          //     ),
          //   ),
          // ),
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

  void _maybePreselectInvoice(List<Map<String, dynamic>> invoices) {
    if (_selectedInvoice != null || widget.initialInvoiceId == null) return;

    Map<String, dynamic>? matchingInvoice;
    for (final invoice in invoices) {
      if (invoice['id'] == widget.initialInvoiceId) {
        matchingInvoice = invoice;
        break;
      }
    }
    if (matchingInvoice == null) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _selectedInvoice != null) return;
      setState(() => _selectedInvoice = matchingInvoice);
    });
  }
}
