import 'dart:io';
import '../../../core/supabase_client.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class Profile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String? avatarUrl;

  const Profile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.avatarUrl,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'No Name',
      email: json['email'] as String? ?? '',
      phone: json['phone_number'] as String? ?? '',
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

class ProfileRepository {
  const ProfileRepository();

  static const _maxAvatarBytes = 2 * 1024 * 1024;
  static const _allowedAvatarExtensions = {
    'jpg',
    'jpeg',
    'png',
    'webp',
    'heic',
    'heif',
  };

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

    final data = Map<String, dynamic>.from(response);

    final path = data['avatar_path'] as String?;

    if (path != null && path.isNotEmpty) {
      final signedUrl = await supabase.storage
          .from('profile-pictures')
          .createSignedUrl(path, 60 * 60 * 24 * 365);

      data['avatar_url'] = signedUrl;
    }

    return Profile.fromJson(data);
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
      await supabase.auth.signInWithPassword(
        email: email,
        password: oldPassword,
      );
    } catch (e) {
      throw Exception('Incorrect old password');
    }

    await supabase.auth.updateUser(UserAttributes(password: newPassword));
  }

  Future<void> uploadProfilePicture(File imageFile) async {
    final user = supabase.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final fileExtension = imageFile.path.split('.').last.toLowerCase();
    if (!_allowedAvatarExtensions.contains(fileExtension)) {
      throw Exception('Upload JPG, PNG, WEBP, HEIC, or HEIF image only.');
    }

    final fileSize = await imageFile.length();
    if (fileSize > _maxAvatarBytes) {
      throw Exception('Profile picture must be 2 MB or smaller.');
    }

    final contentType = switch (fileExtension) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      'heic' => 'image/heic',
      'heif' => 'image/heif',
      _ => 'image/jpeg',
    };

    final fileName =
        '${user.id}_${DateTime.now().millisecondsSinceEpoch}.$fileExtension';

    final filePath = 'profiles/${user.id}/$fileName';

    await supabase.storage
        .from('profile-pictures')
        .upload(
          filePath,
          imageFile,
          fileOptions: FileOptions(
            cacheControl: '3600',
            contentType: contentType,
            upsert: true,
          ),
        );

    await supabase
        .from('users')
        .update({'avatar_path': filePath})
        .eq('id', user.id);
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }
}
