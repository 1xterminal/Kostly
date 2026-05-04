import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Load .env from assets — must run before anything reads from it
  await dotenv.load(fileName: 'assets/.env');

  // 2. Init Supabase using values from .env
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_PUBLISHABLE_KEY']!,
  );

  runApp(
    const ProviderScope(  // Riverpod root
      child: KostlyApp(),
    ),
  );
}

class KostlyApp extends ConsumerWidget {
  const KostlyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Kostly',
      theme: ThemeData(
        fontFamily: 'Inter',
        colorSchemeSeed: const Color(0xFF2563EB),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
