import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'core/app_theme.dart';
import 'core/teacher_provider.dart';
import 'ui/screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Ensure you have configured Firebase in your native android/ios folders
  // and added google-services.json / GoogleService-Info.plist.
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialisation failed: $e');
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => TeacherProvider()),
      ],
      child: const SutrasTeacherApp(),
    ),
  );
}

class SutrasTeacherApp extends StatelessWidget {
  const SutrasTeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sutras Professor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const DashboardScreen(),
    );
  }
}
