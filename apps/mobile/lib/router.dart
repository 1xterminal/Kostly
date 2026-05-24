import 'dart:async';

import 'package:flutter/foundation.dart';
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
import 'features/payments/screens/payments_list_screen.dart';
import 'features/payments/screens/new_payment_screen.dart';
import 'features/payments/screens/payment_detail_screen.dart';
import 'features/maintenance/screens/new_ticket_screen.dart';
import 'features/maintenance/screens/ticket_details_screen.dart';
import 'features/maintenance/screens/tickets_screen.dart';
import 'features/profile/screens/profile_screen.dart';

// ─── Router ───────────────────────────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  final authRefresh = GoRouterRefreshStream(supabase.auth.onAuthStateChange);
  ref.onDispose(authRefresh.dispose);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: authRefresh,

    // Auth guard — runs on every navigation event
    redirect: (context, state) {
      final session = supabase.auth.currentSession;
      final isLoggedIn = session != null;
      final path = state.matchedLocation;
      final isOnPublicAuthScreen = [
        '/login',
        '/forgot-password',
        '/reset-password',
      ].contains(path);

      // Not logged in → login
      if (!isLoggedIn && !isOnPublicAuthScreen) return '/login';

      if (isLoggedIn) {
        final mustChangePassword = AuthService().mustChangePassword;

        // Owner-created tenants must finish onboarding before using the app.
        if (mustChangePassword && path != '/set-password') {
          return '/set-password';
        }

        // Logged in but on login/onboarding after completion → redirect to app.
        if (!mustChangePassword &&
            (path == '/login' || path == '/set-password')) {
          return '/home';
        }
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

      GoRoute(
        path: '/payments/new',
        builder: (_, _) => const NewPaymentScreen(),
      ),
      GoRoute(
        path: '/payments/:id',
        builder: (_, state) =>
            PaymentDetailScreen(paymentId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/extend', builder: (_, _) => const ExtendContractScreen()),
      GoRoute(
        path: '/maintenance/new',
        builder: (_, _) => const NewTicketScreen(),
      ),
      GoRoute(
        path: '/maintenance/:id',
        builder: (_, state) =>
            TicketDetailsScreen(ticketId: state.pathParameters['id']!),
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
          // Tab 1 — Payments list
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/payments',
                builder: (_, _) => const PaymentsListScreen(),
              ),
            ],
          ),
          // Tab 2 — Maintenance
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/maintenance',
                builder: (_, _) => const TicketsScreen(),
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

class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
