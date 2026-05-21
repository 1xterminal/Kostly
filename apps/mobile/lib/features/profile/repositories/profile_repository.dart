import '../../../core/supabase_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class Profile {
  final String id;
  final String name;
  final String email;
  final String phone;

  const Profile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'No Name',
      email: json['email'] as String? ?? '',
      phone: json['phone_number'] as String? ?? '',
    );
  }
}

class ProfileRepository {
  const ProfileRepository();

  Future<Profile> fetchProfile() async {
    final user = supabase.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final response = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .maybeSingle();

    if (response == null) {
      return Profile(
        id: user.id,
        name: 'New Tenant',
        email: user.email ?? '',
        phone: '',
      );
    }

    return Profile.fromJson(response);
  }

  Future<void> updateProfile(String name, String email, String phone) async {
    final user = supabase.auth.currentUser;
    if (user == null) throw Exception('User not logged in');
    final cleanName = name.trim();
    final cleanPhone = phone.trim();

    final existing = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .maybeSingle();

    if (existing == null) {
      await supabase.from('users').insert({
        'id': user.id,
        'email': user.email ?? email,
        'name': cleanName,
        'phone_number': cleanPhone,
        'role': 'tenant',
      });
    } else {
      await supabase
          .from('users')
          .update({'name': cleanName, 'phone_number': cleanPhone})
          .eq('id', user.id);
    }
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    final user = supabase.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final email = user.email;
    if (email == null) throw Exception('No email associated with this user');

    try {
      // Verify the old password
      await supabase.auth.signInWithPassword(
        email: email,
        password: oldPassword,
      );
    } catch (e) {
      throw Exception('Incorrect old password');
    }

    // Update to the new password
    await supabase.auth.updateUser(UserAttributes(password: newPassword));
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }
}
