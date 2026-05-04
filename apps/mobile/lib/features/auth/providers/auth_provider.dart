import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../services/auth_service.dart';

/// The AuthService instance — inject this in screens via ref.read
final authServiceProvider = Provider<AuthService>((_) => AuthService());

/// Streams Supabase auth state changes (signIn, signOut, tokenRefresh).
/// GoRouter's redirect re-evaluates on every new event, so this is what
/// drives automatic navigation between /login and /home.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return supabase.auth.onAuthStateChange;
});
