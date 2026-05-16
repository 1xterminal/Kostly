import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/profile_repository.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (_) => const ProfileRepository(),
);

class ProfileNotifier extends AsyncNotifier<Profile> {
  @override
  FutureOr<Profile> build() async {
    final repo = ref.watch(profileRepositoryProvider);
    return repo.fetchProfile();
  }

  Future<void> updateProfile(String name, String email, String phone) async {
    state = const AsyncValue.loading();
    try {
      final repo = ref.read(profileRepositoryProvider);
      await repo.updateProfile(name, email, phone);
      state = AsyncValue.data(await repo.fetchProfile());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    final repo = ref.read(profileRepositoryProvider);
    await repo.changePassword(oldPassword, newPassword);
  }

  Future<void> signOut() async {
    final repo = ref.read(profileRepositoryProvider);
    await repo.signOut();
  }
}

final profileNotifierProvider =
    AsyncNotifierProvider.autoDispose<ProfileNotifier, Profile>(
      () => ProfileNotifier(),
    );
