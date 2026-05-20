import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import '../providers/home_providers.dart';
import '../repositories/home_repository.dart';

// ─── Constants ────────────────────────────────────────────────────────────────

const _kPrimary   = Color(0xFF3341A5);
const _kBg        = Color(0xFFEBEBEB);
const _kCardBg    = Color(0xFFF5F5F5);
const _kBorder    = Color(0xFFDDDDDD);
const _kLabelGray = Color(0xFF9CA3AF);
const _kBodyBlack = Color(0xFF111827);
const _kSubGray   = Color(0xFF6B7280);

final _currencyFmt = NumberFormat.currency(locale: 'id_ID', symbol: 'IDR ', decimalDigits: 0);
final _dateFmt     = DateFormat('d MMM');

// ─── Home Screen ──────────────────────────────────────────────────────────────

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user     = supabase.auth.currentUser;
    final fullName = user?.userMetadata?['full_name'] as String? ?? 'Tenant';

    final contractAsync = ref.watch(activeContractProvider);
    final invoiceAsync  = ref.watch(pendingInvoiceProvider);
    final ticketAsync   = ref.watch(activeTicketProvider);

    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: RefreshIndicator(
          color: _kPrimary,
          onRefresh: () async {
            ref.invalidate(activeContractProvider);
            ref.invalidate(pendingInvoiceProvider);
            ref.invalidate(activeTicketProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                // ── Header ────────────────────────────────────────────────────
                Text(
                  'Welcome, $fullName',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: _kBodyBlack,
                  ),
                ),
                const SizedBox(height: 18),

                // ── Room + WiFi (from contract) ───────────────────────────────
                contractAsync.when(
                  loading: () => const _SkeletonBlock(height: 80),
                  error: (e, _) => _ErrorTile(message: e.toString()),
                  data: (contract) => contract == null
                      ? const _EmptyTile(message: 'No active contract')
                      : _RoomHeader(contract: contract),
                ),
                const SizedBox(height: 24),

                // ── Contract Card ─────────────────────────────────────────────
                contractAsync.when(
                  loading: () => const _SkeletonBlock(height: 140),
                  error: (e, _) => _ErrorTile(message: e.toString()),
                  data: (contract) => _InfoCard(
                    label: 'YOUR CONTRACT',
                    children: [
                      Text(
                        contract == null
                            ? '—'
                            : '${contract.monthsRemaining} month${contract.monthsRemaining == 1 ? '' : 's'}',
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: _kBodyBlack,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        contract == null
                            ? 'No active contract'
                            : 'remaining · ends ${_dateFmt.format(contract.endDate)}',
                        style: const TextStyle(fontSize: 14, color: _kSubGray),
                      ),
                      const SizedBox(height: 14),
                      const _CardDivider(),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _CardAction(
                            icon: Icons.info_outline_rounded,
                            label: 'Details',
                            onTap: () => context.go('/contracts'),
                          ),
                          const Spacer(),
                          if (contract != null)
                            _CardAction(
                              icon: Icons.add,
                              label: 'Extend',
                              onTap: () => context.go('/extend'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // ── Payment Card ──────────────────────────────────────────────
                invoiceAsync.when(
                  loading: () => const _SkeletonBlock(height: 140),
                  error: (e, _) => _ErrorTile(message: e.toString()),
                  data: (invoice) => _InfoCard(
                    label: 'NEXT PAYMENT',
                    children: [
                      Text(
                        invoice == null ? '—' : _currencyFmt.format(invoice.totalAmount),
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: _kBodyBlack,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        invoice == null
                            ? 'All paid up 🎉'
                            : 'Due on ${_dateFmt.format(invoice.dueDate)}',
                        style: const TextStyle(fontSize: 14, color: _kSubGray),
                      ),
                      const SizedBox(height: 14),
                      const _CardDivider(),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _CardAction(
                            icon: Icons.info_outline_rounded,
                            label: 'Details',
                            onTap: () => context.go('/payments'),
                          ),
                          const Spacer(),
                          if (invoice != null)
                            _CardAction(
                              icon: Icons.crop_free_rounded,
                              label: 'Pay now',
                              onTap: () => context.go('/payments/new'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // ── Maintenance Card ──────────────────────────────────────────
                ticketAsync.when(
                  loading: () => const _SkeletonBlock(height: 160),
                  error: (e, _) => _ErrorTile(message: e.toString()),
                  data: (ticket) => _InfoCard(
                    label: 'ACTIVE MAINTENANCE',
                    children: [
                      if (ticket == null) ...[
                        const Text(
                          'No active tickets',
                          style: TextStyle(fontSize: 16, color: _kSubGray),
                        ),
                      ] else ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                ticket.description,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: _kBodyBlack,
                                ),
                              ),
                            ),
                            Text(
                              _dateFmt.format(ticket.createdAt),
                              style: const TextStyle(fontSize: 12, color: _kSubGray),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ticket.ticketStatus.toUpperCase().replaceAll('_', ' '),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(ticket.ticketStatus),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                      const _CardDivider(),
                      const SizedBox(height: 12),
                      _CardAction(
                        icon: Icons.report_problem_outlined,
                        label: 'Report a problem',
                        onTap: () => context.go('/maintenance/new'),
                      ),
                    ],
                  ),
                ),

              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    return switch (status) {
      'in_progress' => const Color(0xFF3B82F6),  // blue
      'resolved'    => const Color(0xFF10B981),  // green
      'closed'      => _kSubGray,
      _             => const Color(0xFFD97706),  // amber (reported)
    };
  }
}

// ─── Room + WiFi header ───────────────────────────────────────────────────────

class _RoomHeader extends StatelessWidget {
  final ActiveContract contract;
  const _RoomHeader({required this.contract});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _UpperLabel('YOUR ROOM IS'),
        const SizedBox(height: 2),
        Text(
          'Room #${contract.roomNumber}',
          style: const TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.w700,
            color: _kBodyBlack,
            letterSpacing: -0.5,
          ),
        ),
        if (contract.wifiPassword != null) ...[
          const SizedBox(height: 14),
          const _UpperLabel('WIFI PASSWORD'),
          const SizedBox(height: 2),
          _WifiPassword(password: contract.wifiPassword!),
        ],
      ],
    );
  }
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

class _SkeletonBlock extends StatefulWidget {
  final double height;
  const _SkeletonBlock({required this.height});
  @override
  State<_SkeletonBlock> createState() => _SkeletonBlockState();
}

class _SkeletonBlockState extends State<_SkeletonBlock>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _anim = Tween(begin: 0.4, end: 0.85).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, child) => Container(
        height: widget.height,
        decoration: BoxDecoration(
          color: Color.fromRGBO(209, 213, 219, _anim.value),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}

// ─── Error tile ───────────────────────────────────────────────────────────────

class _ErrorTile extends StatelessWidget {
  final String message;
  const _ErrorTile({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty tile ───────────────────────────────────────────────────────────────

class _EmptyTile extends StatelessWidget {
  final String message;
  const _EmptyTile({required this.message});

  @override
  Widget build(BuildContext context) {
    return Text(message, style: const TextStyle(fontSize: 14, color: _kSubGray));
  }
}

// ─── Uppercase Label ──────────────────────────────────────────────────────────

class _UpperLabel extends StatelessWidget {
  final String text;
  const _UpperLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: _kLabelGray,
        letterSpacing: 0.8,
      ),
    );
  }
}

// ─── Wifi Password ────────────────────────────────────────────────────────────

class _WifiPassword extends StatefulWidget {
  final String password;
  const _WifiPassword({required this.password});

  @override
  State<_WifiPassword> createState() => _WifiPasswordState();
}

class _WifiPasswordState extends State<_WifiPassword> {
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          _revealed ? widget.password : '● ● ● ●',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _kBodyBlack,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: () => setState(() => _revealed = !_revealed),
          child: Icon(
            _revealed ? Icons.visibility_off_outlined : Icons.visibility_outlined,
            size: 22,
            color: _kSubGray,
          ),
        ),
      ],
    );
  }
}

// ─── Info Card ────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final String label;
  final List<Widget> children;
  const _InfoCard({required this.label, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: _kCardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _UpperLabel(label),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

// ─── Card Divider ─────────────────────────────────────────────────────────────

class _CardDivider extends StatelessWidget {
  const _CardDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, color: _kBorder);
  }
}

// ─── Card Action Button ───────────────────────────────────────────────────────

class _CardAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _CardAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: _kPrimary),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: _kPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
