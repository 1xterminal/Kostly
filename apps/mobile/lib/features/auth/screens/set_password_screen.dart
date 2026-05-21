import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/validators.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_widgets.dart';

class SetPasswordScreen extends ConsumerStatefulWidget {
  const SetPasswordScreen({super.key});

  @override
  ConsumerState<SetPasswordScreen> createState() => _SetPasswordScreenState();
}

class _SetPasswordScreenState extends ConsumerState<SetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      await ref.read(authServiceProvider).setInitialPassword(
        _passwordController.text,
      );
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String? _validatePassword(String? v) => validatePassword(v);

  String? _validateConfirm(String? v) =>
      validateConfirmPassword(v, _passwordController.text);

  @override
  Widget build(BuildContext context) {
    // Get display name from Supabase user metadata
    final user = ref.read(authServiceProvider).currentUser;
    final name = user?.userMetadata?['full_name'] ?? user?.email ?? 'User';

    return Scaffold(
      backgroundColor: kAuthBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 80, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  'Welcome, $name',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: kAuthTitle,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 12),

                // Subtitle
                const Text(
                  'Before we continue to your first registration, please enter a new password to make your account secure.',
                  style: TextStyle(
                    fontSize: 15,
                    color: kAuthGray,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),

                if (_error != null) AuthErrorBanner(_error!),

                // Password
                AuthTextField(
                  label: 'Password',
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  onToggleObscure: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                  validator: _validatePassword,
                ),
                const SizedBox(height: 16),

                // Confirm password
                AuthTextField(
                  label: 'Confirm password',
                  controller: _confirmController,
                  obscureText: _obscureConfirm,
                  textInputAction: TextInputAction.done,
                  onToggleObscure: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                  onFieldSubmitted: (_) => _submit(),
                  validator: _validateConfirm,
                ),
                const SizedBox(height: 28),

                AuthPrimaryButton(
                  label: 'Register',
                  icon: Icons.login,
                  isLoading: _isLoading,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
