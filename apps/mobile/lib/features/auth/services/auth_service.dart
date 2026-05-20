import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mobile/core/supabase_client.dart';

class AuthService {
  /// Sign in — only 'tenant' role accounts can use the mobile app.
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    final response = await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );

    final userId = response.user?.id;
    if (userId == null) {
      await supabase.auth.signOut();
      throw Exception('Login failed. Please try again.');
    }

    final profile = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    if (profile == null || profile['role'] != 'tenant') {
      await supabase.auth.signOut();
      throw Exception(
        'This app is for tenants only. Property owners use the Kostly web dashboard.',
      );
    }

    return response;
  }

  /// Used on first login — tenant sets their own password.
  /// Also clears the must_change_password flag.
  Future<void> setInitialPassword(String newPassword) async {
    await supabase.auth.updateUser(
      UserAttributes(
        password: newPassword,
        data: {'must_change_password': false},
      ),
    );
  }

  /// Sends a password reset email (forgot password flow).
  Future<void> forgotPassword(String email) async {
    await supabase.auth.resetPasswordForEmail(email);
  }

  /// Used on /reset-password after arriving from the email deep link.
  Future<void> resetPassword(String newPassword) async {
    await supabase.auth.updateUser(
      UserAttributes(password: newPassword),
    );
  }

  Future<void> signOut() => supabase.auth.signOut();

  User? get currentUser => supabase.auth.currentUser;

  bool get mustChangePassword =>
      supabase.auth.currentUser?.userMetadata?['must_change_password'] == true;
}
