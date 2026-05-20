import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mobile/core/supabase_client.dart';

class AuthService {
  static bool _mustChangePasswordOverride = false;

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
        .select('role, onboarding, tenant_status')
        .eq('id', userId)
        .maybeSingle();

    if (profile == null) {
      await supabase.auth.signOut();
      throw Exception(
        'This tenant account has not been onboarded by the property owner.',
      );
    }

    if (profile['role'] != 'tenant') {
      await supabase.auth.signOut();
      throw Exception(
        'This app is for tenants only. Property owners use the Kostly web dashboard.',
      );
    }

    if (profile['tenant_status'] == 'archived') {
      await supabase.auth.signOut();
      throw Exception('This tenant account has been archived.');
    }

    _mustChangePasswordOverride =
        profile['onboarding'] != true ||
        response.user?.userMetadata?['must_change_password'] == true;

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

    final userId = supabase.auth.currentUser?.id;
    if (userId == null) {
      throw Exception('Session expired. Please log in again.');
    }

    await supabase.from('users').update({'onboarding': true}).eq('id', userId);

    _mustChangePasswordOverride = false;
  }

  /// Sends a password reset email (forgot password flow).
  Future<void> forgotPassword(String email) async {
    await supabase.auth.resetPasswordForEmail(email);
  }

  /// Used on /reset-password after arriving from the email deep link.
  Future<void> resetPassword(String newPassword) async {
    await supabase.auth.updateUser(UserAttributes(password: newPassword));
  }

  Future<void> signOut() async {
    _mustChangePasswordOverride = false;
    await supabase.auth.signOut();
  }

  User? get currentUser => supabase.auth.currentUser;

  bool get mustChangePassword =>
      _mustChangePasswordOverride ||
      supabase.auth.currentUser?.userMetadata?['must_change_password'] == true;
}
