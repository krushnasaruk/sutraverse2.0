import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'dart:ui';
import 'core/theme.dart';
import 'core/routing.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // TODO: Add firebase configuration once google-services.json is added
  // await Firebase.initializeApp();
  
  runApp(
    const ProviderScope(
      child: SutrasApp(),
    ),
  );
}

class AppScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
      };
}

class SutrasApp extends StatelessWidget {
  const SutrasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Sutras Mobile',
      scrollBehavior: AppScrollBehavior(),
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light, // Forcing light mode so you can see it!
      routerConfig: appRouter,
    );
  }
}
