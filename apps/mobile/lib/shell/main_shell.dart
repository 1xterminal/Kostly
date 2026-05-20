import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// ─── Bottom Nav Items ─────────────────────────────────────────────────────────

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem(this.icon, this.label);
}

// Icons matched to the mockup image
const _navItems = [
  _NavItem(Icons.grid_view_rounded,          'Home'),      // 4-square grid
  _NavItem(Icons.credit_card_outlined,       'Payments'),  // credit card
  _NavItem(Icons.confirmation_number_outlined,'Maintenance'), // ticket/coupon
  _NavItem(Icons.receipt_outlined,           'Contracts'), // receipt/doc
  _NavItem(Icons.account_circle_outlined,    'Profile'),   // person circle
];

const _kPrimary = Color(0xFF3341A5);

// ─── Shell ────────────────────────────────────────────────────────────────────

class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const MainShell({super.key, required this.navigationShell});

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEBEBEB),
      body: navigationShell,
      bottomNavigationBar: _BottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: _onTap,
      ),
    );
  }
}

// ─── Custom Bottom Nav Bar ────────────────────────────────────────────────────

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final void Function(int) onTap;
  const _BottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFEBEBEB),
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
      child: SafeArea(
        top: false,
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: const Color(0xFFF4F4F4),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE0E0E0)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            children: List.generate(_navItems.length, (i) {
              final isActive = i == currentIndex;
              final item = _navItems[i];

              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeInOut,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      // Active: light blue fill + blue border (matches mockup)
                      color: isActive
                          ? _kPrimary.withValues(alpha: 0.08)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: isActive
                          ? Border.all(
                              color: _kPrimary.withValues(alpha: 0.55),
                              width: 1.5,
                            )
                          : null,
                    ),
                    child: Center(
                      child: Icon(
                        item.icon,
                        size: 24,
                        color: isActive ? _kPrimary : const Color(0xFF374151),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
