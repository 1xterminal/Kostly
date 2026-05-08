import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';

// ─── Constants ────────────────────────────────────────────────────────────────

const _kPrimary    = Color(0xFF3341A5);
const _kBg         = Color(0xFFEBEBEB);
const _kCardBg     = Color(0xFFF5F5F5);
const _kBorder     = Color(0xFFDDDDDD);
const _kLabelGray  = Color(0xFF9CA3AF);
const _kBodyBlack  = Color(0xFF111827);
const _kSubGray    = Color(0xFF6B7280);

// ─── Home Screen ──────────────────────────────────────────────────────────────

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: replace with real data from Supabase
    final user     = supabase.auth.currentUser;
    final fullName = user?.userMetadata?['full_name'] as String? ?? 'User1234';

    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ── Header ──────────────────────────────────────────────────────
              Text(
                'Welcome, $fullName',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: _kBodyBlack,
                ),
              ),
              const SizedBox(height: 18),

              // "YOUR ROOM IS" label + room name
              const _UpperLabel('YOUR ROOM IS'),
              const SizedBox(height: 2),
              const Text(
                'Room #1', // TODO: from contract query
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  color: _kBodyBlack,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 14),

              // "WIFI PASSWORD" label + masked password with reveal
              const _UpperLabel('WIFI PASSWORD'),
              const SizedBox(height: 2),
              const _WifiPassword(password: 'kost2026'),
              const SizedBox(height: 24),

              // ── Contract Card ────────────────────────────────────────────────
              _InfoCard(
                label: 'YOUR CONTRACT',
                children: [
                  const Text(
                    '4 months', // TODO: from contracts query
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: _kBodyBlack,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'remaining',
                    style: TextStyle(fontSize: 14, color: _kSubGray),
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
                      _CardAction(
                        icon: Icons.add,
                        label: 'Extend',
                        onTap: () => context.go('/extend'),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // ── Payment Card ─────────────────────────────────────────────────
              _InfoCard(
                label: 'NEXT PAYMENT',
                children: [
                  const Text(
                    'IDR 240,000', // TODO: from invoices query
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: _kBodyBlack,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Due on 2 May', // TODO: from invoices query
                    style: TextStyle(fontSize: 14, color: _kSubGray),
                  ),
                  const SizedBox(height: 14),
                  const _CardDivider(),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _CardAction(
                        icon: Icons.info_outline_rounded,
                        label: 'Details',
                        onTap: () => context.go('/invoices'),
                      ),
                      const Spacer(),
                      _CardAction(
                        icon: Icons.crop_free_rounded,
                        label: 'Pay now',
                        onTap: () {}, // TODO: context.go('/pay/invoice-id')
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // ── Maintenance Card ─────────────────────────────────────────────
              _InfoCard(
                label: 'ACTIVE MAINTENANCE',
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Expanded(
                        child: Text(
                          'AC Problem', // TODO: from maintenance_tickets query
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: _kBodyBlack,
                          ),
                        ),
                      ),
                      const Text(
                        '12:34 PM', // TODO: from ticket timestamp
                        style: TextStyle(fontSize: 12, color: _kSubGray),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'UNRESOLVED',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFD97706),
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Woi balikin AC gua! Ko nga nyala nyala', // TODO: from ticket
                    style: TextStyle(fontSize: 13, color: _kSubGray),
                  ),
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

            ],
          ),
        ),
      ),
    );
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
