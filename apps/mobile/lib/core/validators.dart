final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final _phonePattern = RegExp(r'^[+0-9][0-9\s().-]{7,19}$');
final _hasLetterPattern = RegExp(r'[A-Za-z]');
final _hasNumberPattern = RegExp(r'\d');

String? validateRequired(String? value, {String field = 'This field'}) {
  if (value == null || value.trim().isEmpty) return '$field is required';
  return null;
}

String? validateEmail(String? value) {
  final requiredError = validateRequired(value, field: 'Email');
  if (requiredError != null) return requiredError;
  if (!_emailPattern.hasMatch(value!.trim())) return 'Enter a valid email';
  return null;
}

String? validatePassword(String? value) {
  final requiredError = validateRequired(value, field: 'Password');
  if (requiredError != null) return requiredError;
  final password = value!;
  if (password.length < 8) return 'At least 8 characters';
  if (!_hasLetterPattern.hasMatch(password) ||
      !_hasNumberPattern.hasMatch(password)) {
    return 'Use letters and numbers';
  }
  return null;
}

String? validateConfirmPassword(String? value, String password) {
  final requiredError = validateRequired(value, field: 'Confirm password');
  if (requiredError != null) return requiredError;
  if (value != password) return 'Passwords do not match';
  return null;
}

String? validateOptionalPhone(String? value) {
  final phone = value?.trim() ?? '';
  if (phone.isEmpty) return null;
  if (!_phonePattern.hasMatch(phone)) return 'Enter a valid phone number';
  return null;
}

String? validateMaintenanceDescription(String? value) {
  final requiredError = validateRequired(value, field: 'Description');
  if (requiredError != null) return requiredError;
  final text = value!.trim();
  if (text.length < 10) return 'Describe the issue in at least 10 characters';
  if (text.length > 1000) return 'Description is too long';
  return null;
}
