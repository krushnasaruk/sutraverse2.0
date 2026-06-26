import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          // Graphic
          Positioned(
            top: 0, left: 0, right: 0, height: 400,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color.fromRGBO(41,151,255,0.2), Color.fromRGBO(0,102,204,0.02), Colors.transparent],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: const SafeArea(
                child: Center(
                  child: Icon(Icons.school, size: 100, color: AppTheme.primary),
                ),
              ),
            ),
          ),

          // Content
          Positioned.fill(
            top: 300,
            child: Container(
              decoration: BoxDecoration(
                color: context.bgCard,
                borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
                border: Border(top: BorderSide(color: context.border)),
              ),
              child: ListView(
                padding: const EdgeInsets.all(32),
                children: [
                  Text('Welcome to SutraVerse', style: TextStyle(color: context.textPrimary, fontSize: 28, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Sign in to access your notes, PYQs, and AI study copilot.', style: TextStyle(color: context.textMuted, fontSize: 16)),
                  
                  SizedBox(height: 48),

                  GestureDetector(
                    onTap: () => context.go('/home'),
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(color: context.textPrimary, borderRadius: BorderRadius.circular(28)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.g_mobiledata, color: Colors.black, size: 32),
                          SizedBox(width: 8),
                          Text('Continue with Google', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),

                  SizedBox(height: 24),

                  Row(
                    children: [
                      Expanded(child: Container(height: 1, color: context.border)),
                      Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('or', style: TextStyle(color: context.textMuted))),
                      Expanded(child: Container(height: 1, color: context.border)),
                    ],
                  ),

                  SizedBox(height: 24),

                  GestureDetector(
                    onTap: () => context.go('/signup'),
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(color: context.bgMain, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(28)),
                      alignment: Alignment.center,
                      child: Text('Create an Account', style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  
                  SizedBox(height: 32),
                  
                  // Bypass
                  GestureDetector(
                    onTap: () => context.go('/home'),
                    child: Text('Bypass Login for Testing', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
