import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/supabase_client.dart';
import 'shell/main_shell.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/set_password_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';
import 'features/auth/services/auth_service.dart';
import 'features/home/screens/home_screen.dart';
import 'features/contracts/screens/contract_screen.dart';
import 'features/contracts/screens/extend_contract_screen.dart';
import 'features/profile/screens/profile_screen.dart';

// ─── Placeholder screen ───────────────────────────────────────────────────────
class _Placeholder extends StatelessWidget {
  final String name;
  const _Placeholder(this.name);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F0F0),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.construction_rounded,
              size: 48,
              color: Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 12),
            Text(
              name,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Coming soon',
              style: TextStyle(color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/home',

    // Auth guard — runs on every navigation event
    redirect: (context, state) {
      final session = supabase.auth.currentSession;
      final isLoggedIn = session != null;
      final path = state.matchedLocation;
      final isOnAuthScreen = [
        '/login',
        '/forgot-password',
        '/reset-password',
      ].contains(path);

      // Not logged in → login
      if (!isLoggedIn && !isOnAuthScreen) return '/login';

      // Logged in but on login → redirect to app (or set-password if first login)
      if (isLoggedIn && path == '/login') {
        return AuthService().mustChangePassword ? '/set-password' : '/home';
      }

      return null;
    },

    routes: [
      // ── Auth (no bottom nav) ──────────────────────────────────────────────
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(
        path: '/set-password',
        builder: (_, _) => const SetPasswordScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, _) => const ResetPasswordScreen(),
      ),

      // ── Full-screen flows (no bottom nav) ─────────────────────────────────
      GoRoute(
        path: '/pay/:invoiceId',
        builder: (_, state) =>
            _Placeholder('Pay Invoice ${state.pathParameters['invoiceId']}'),
      ),
      GoRoute(path: '/extend', builder: (_, _) => const ExtendContractScreen()),
      GoRoute(
        path: '/maintenance/new',
        builder: (_, _) => const _Placeholder('New Ticket'),
      ),
      GoRoute(
        path: '/maintenance/:id',
        builder: (_, state) =>
            _Placeholder('Ticket ${state.pathParameters['id']}'),
      ),
      GoRoute(
        path: '/invoices/:id',
        builder: (_, state) =>
            _Placeholder('Invoice ${state.pathParameters['id']}'),
      ),

      // ── Main shell with bottom nav ─────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => MainShell(navigationShell: shell),
        branches: [
          // Tab 0 — Home
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
            ],
          ),
          // Tab 1 — Payments / Invoices list
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/invoices',
                builder: (_, _) => const _Placeholder('Invoices'),
              ),
            ],
          ),
          // Tab 2 — Maintenance
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/maintenance',
                builder: (_, _) => const _Placeholder('Maintenance Tickets'),
              ),
            ],
          ),
          // Tab 3 — Contracts
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/contracts',
                builder: (_, _) => const ContractScreen(),
              ),
            ],
          ),
          // Tab 4 — Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (_, _) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
