import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/contract_provider.dart';
import '../../../models/contract.dart';

// ─── Constants ────────────────────────────────────────────────────────────────
const _kPrimary    = Color(0xFF3341A5);
const _kBg         = Color(0xFFEBEBEB);
const _kCardBg     = Color(0xFFF5F5F5);
const _kBorder     = Color(0xFFDDDDDD);
const _kBodyBlack  = Color(0xFF111827);
const _kSubGray    = Color(0xFF6B7280);
const _kLabelGray  = Color(0xFF9CA3AF);

final _currencyFmt = NumberFormat.currency(locale: 'id_ID', symbol: 'IDR ', decimalDigits: 0);
final _dateFmt     = DateFormat('d MMM yyyy');

// ─── Contract Screen ──────────────────────────────────────────────────────────

class ContractScreen extends ConsumerWidget {
  const ContractScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contractAsync = ref.watch(activeContractProvider);

    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: RefreshIndicator(
          // color: _kPrimary,
          onRefresh: () async => ref.invalidate(activeContractProvider),
          child: contractAsync.when(
            loading: () => const _LoadingSkeleton(),
            error:   (e, _) => _ErrorView(message: e.toString()),
            data:    (contract) => contract == null
                ? const _EmptyState()
                : _ContractBody(contract: contract),
          ),
        ),
      ),
    );
  }
}

// ─── Main Body ────────────────────────────────────────────────────────────────

class _ContractBody extends StatelessWidget {
  final Contract contract;
  const _ContractBody({required this.contract});

  @override
  Widget build(BuildContext context) {
    final now        = DateTime.now();
    final totalDays  = contract.endDate.difference(contract.startDate).inDays;
    final daysLeft   = contract.endDate.difference(now).inDays.clamp(0, totalDays);
    final progress   = totalDays > 0 ? daysLeft / totalDays : 0.0;
    final monthsLeft = (daysLeft / 30).ceil();

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // ── Page title ─────────────────────────────────────────────────────
          const Text(
            'My Contract',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: _kBodyBlack,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Tap the card to see details · Pull to refresh',
            style: const TextStyle(fontSize: 12, color: _kLabelGray),
          ),
          const SizedBox(height: 24),

          // ── Room badge card ─────────────────────────────────────────────────
          _SectionCard(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _kPrimary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.door_front_door_outlined, color: _kPrimary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('OCCUPIED ROOM', style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: _kLabelGray, letterSpacing: 0.8,
                      )),
                      const SizedBox(height: 2),
                      Text(
                        contract.room != null
                            ? 'Room #${contract.room!.number}'
                            : 'Room #${contract.roomId.substring(0, 8)}',
                        style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700,
                          color: _kBodyBlack, letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'ACTIVE',
                      style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: Color(0xFF065F46), letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
              if (contract.room?.wifiPassword != null) ...[
                const SizedBox(height: 14),
                const Divider(height: 1, color: _kBorder),
                const SizedBox(height: 12),
                _WifiRow(password: contract.room!.wifiPassword!),
              ],
            ],
          ),
          const SizedBox(height: 14),

          // ── Duration progress card ──────────────────────────────────────────
          _SectionCard(
            children: [
              const _Label('CONTRACT DURATION'),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    '$monthsLeft',
                    style: const TextStyle(
                      fontSize: 36, fontWeight: FontWeight.w700,
                      color: _kBodyBlack, letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'month${monthsLeft == 1 ? '' : 's'} remaining',
                    style: const TextStyle(fontSize: 15, color: _kSubGray),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress.toDouble(),
                  minHeight: 8,
                  backgroundColor: const Color(0xFFE5E7EB),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    progress > 0.3 ? _kPrimary : const Color(0xFFEF4444),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_dateFmt.format(contract.startDate),
                      style: const TextStyle(fontSize: 11, color: _kLabelGray)),
                  Text(_dateFmt.format(contract.endDate),
                      style: const TextStyle(fontSize: 11, color: _kLabelGray)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // ── Financials card ─────────────────────────────────────────────────
          _SectionCard(
            children: [
              const _Label('MONTHLY RENT'),
              const SizedBox(height: 4),
              Text(
                _currencyFmt.format(contract.monthlyRate),
                style: const TextStyle(
                  fontSize: 24, fontWeight: FontWeight.w700,
                  color: _kBodyBlack, letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'per month · paid monthly',
                style: const TextStyle(fontSize: 13, color: _kSubGray),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // ── Period detail card ──────────────────────────────────────────────
          _SectionCard(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _DateBlock(label: 'START DATE', date: contract.startDate),
                  ),
                  Container(width: 1, height: 48, color: _kBorder),
                  Expanded(
                    child: _DateBlock(label: 'END DATE', date: contract.endDate, alignRight: true),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── Extend button ───────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push('/extend'),
              icon: const Icon(Icons.calendar_month_outlined, size: 20),
              label: const Text(
                'Request Contract Extension',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _kPrimary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

// ─── Label ────────────────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11, fontWeight: FontWeight.w700,
        color: _kLabelGray, letterSpacing: 0.8,
      ),
    );
  }
}

// ─── Date Block ───────────────────────────────────────────────────────────────

class _DateBlock extends StatelessWidget {
  final String label;
  final DateTime date;
  final bool alignRight;
  const _DateBlock({required this.label, required this.date, this.alignRight = false});

  @override
  Widget build(BuildContext context) {
    final align = alignRight ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    return Padding(
      padding: EdgeInsets.only(left: alignRight ? 16 : 0, right: alignRight ? 0 : 16),
      child: Column(
        crossAxisAlignment: align,
        children: [
          _Label(label),
          const SizedBox(height: 4),
          Text(
            _dateFmt.format(date),
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _kBodyBlack),
          ),
        ],
      ),
    );
  }
}

// ─── WiFi Password Row ────────────────────────────────────────────────────────

class _WifiRow extends StatefulWidget {
  final String password;
  const _WifiRow({required this.password});

  @override
  State<_WifiRow> createState() => _WifiRowState();
}

class _WifiRowState extends State<_WifiRow> {
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.wifi, size: 18, color: _kSubGray),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('WIFI PASSWORD', style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w700,
              color: _kLabelGray, letterSpacing: 0.8,
            )),
            const SizedBox(height: 2),
            Text(
              _revealed ? widget.password : '● ● ● ●  ● ● ● ●',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: _revealed ? _kBodyBlack : _kSubGray,
                letterSpacing: _revealed ? 0.5 : 2,
              ),
            ),
          ],
        ),
        const Spacer(),
        Row(
          children: [
            if (_revealed)
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: widget.password));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('WiFi password copied!'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                child: const Icon(Icons.copy_outlined, size: 18, color: _kSubGray),
              ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () => setState(() => _revealed = !_revealed),
              child: Icon(
                _revealed ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                size: 20, color: _kSubGray,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: SizedBox(
        height: MediaQuery.of(context).size.height - 200,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: _kCardBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: _kBorder),
                ),
                child: const Icon(Icons.receipt_long_outlined, size: 48, color: _kLabelGray),
              ),
              const SizedBox(height: 20),
              const Text(
                'No Active Contract',
                style: TextStyle(
                  fontSize: 20, fontWeight: FontWeight.w700, color: _kBodyBlack,
                ),
              ),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'Your contract will appear here once your owner has assigned you to a room.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: _kSubGray, height: 1.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

class _LoadingSkeleton extends StatelessWidget {
  const _LoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Shimmer(width: 160, height: 28, radius: 8),
          const SizedBox(height: 24),
          _Shimmer(width: double.infinity, height: 90, radius: 16),
          const SizedBox(height: 14),
          _Shimmer(width: double.infinity, height: 130, radius: 16),
          const SizedBox(height: 14),
          _Shimmer(width: double.infinity, height: 80, radius: 16),
          const SizedBox(height: 14),
          _Shimmer(width: double.infinity, height: 80, radius: 16),
        ],
      ),
    );
  }
}

class _Shimmer extends StatefulWidget {
  final double width, height, radius;
  const _Shimmer({required this.width, required this.height, required this.radius});

  @override
  State<_Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<_Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 0.75).animate(_ctrl);
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
      builder: (_, _) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Color.fromRGBO(209, 213, 219, _anim.value),
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}

// ─── Error View ───────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final String message;
  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: SizedBox(
        height: MediaQuery.of(context).size.height - 200,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Color(0xFFDC2626)),
                const SizedBox(height: 16),
                const Text('Failed to load contract',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: _kSubGray)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
