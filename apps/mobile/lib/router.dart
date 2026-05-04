import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/supabase_client.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/set_password_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/reset_password_screen.dart';
import 'features/auth/services/auth_service.dart';


// ─── Placeholder screen ───────────────────────────────────────────────────────
// Swap these out as each feature screen gets built by the team.
class _Placeholder extends StatelessWidget {
  final String name;
  const _Placeholder(this.name);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.construction, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            const Text('This screen is not built yet.', style: TextStyle(color: Colors.grey)),
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

    // Auth guard — redirects to /login if no active session
    redirect: (context, state) {
      final session = supabase.auth.currentSession;
      final isLoggedIn = session != null;
      final path = state.matchedLocation;
      final isOnAuthScreen = ['/login', '/forgot-password', '/reset-password']
          .contains(path);

      // Not logged in — send to login (allow auth screens through)
      if (!isLoggedIn && !isOnAuthScreen) return '/login';

      // Already logged in — don't show login again
      if (isLoggedIn && path == '/login') {
        final mustChange = AuthService().mustChangePassword;
        return mustChange ? '/set-password' : '/home';
      }

      return null;
    },

    routes: [
      // ── Auth ──────────────────────────────────────────────────────────────
      GoRoute(
        path: '/login',
        builder: (_, _) => const LoginScreen(),
      ),
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

      // ── Home (contract overview) ───────────────────────────────────────────
      GoRoute(
        path: '/home',
        builder: (_, _) => const _Placeholder('Home'),
      ),

      // ── Invoices ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/invoices',
        builder: (_, _) => const _Placeholder('Invoices'),
      ),
      GoRoute(
        path: '/invoices/:id',
        builder: (_, state) => _Placeholder('Invoice ${state.pathParameters['id']}'),
      ),

      // ── Payments ──────────────────────────────────────────────────────────
      GoRoute(
        path: '/pay/:invoiceId',
        builder: (_, state) => _Placeholder('Pay Invoice ${state.pathParameters['invoiceId']}'),
      ),

      // ── Maintenance ───────────────────────────────────────────────────────
      GoRoute(
        path: '/maintenance',
        builder: (_, _) => const _Placeholder('Maintenance Tickets'),
      ),
      GoRoute(
        path: '/maintenance/new',
        builder: (_, _) => const _Placeholder('New Ticket'),
      ),
      GoRoute(
        path: '/maintenance/:id',
        builder: (_, state) => _Placeholder('Ticket ${state.pathParameters['id']}'),
      ),

      // ── Extend Contract ───────────────────────────────────────────────────
      GoRoute(
        path: '/extend',
        builder: (_, _) => const _Placeholder('Extend Contract'),
      ),

      // ── Profile ───────────────────────────────────────────────────────────
      GoRoute(
        path: '/profile',
        builder: (_, _) => const _Placeholder('Profile'),
      ),
    ],
  );
});
