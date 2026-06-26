import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bgMain,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            GestureDetector(
              onTap: () => context.pop(),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Icon(Icons.arrow_back, color: context.textPrimary, size: 28),
              ),
            ),
            SizedBox(height: 32),
            Text('Complete Profile', style: TextStyle(color: context.textPrimary, fontSize: 32, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Tell us about your studies to get personalized content.', style: TextStyle(color: context.textMuted, fontSize: 16)),
            
            SizedBox(height: 40),

            _buildInput('Full Name', 'e.g. Krushna'),
            _buildInput('College / University', 'e.g. MIT'),
            _buildInput('Branch / Department', 'e.g. Computer Science'),
            _buildInput('Current Year', 'e.g. FE, SE, TE, BE'),

            SizedBox(height: 32),

            GestureDetector(
              onTap: () => context.go('/home'),
              child: Container(
                height: 56,
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(28)),
                alignment: Alignment.center,
                child: Text('Complete Sign Up', style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInput(String label, String hint) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: context.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(16)),
            child: TextField(
              style: TextStyle(color: context.textPrimary),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: hint,
                hintStyle: TextStyle(color: context.textMuted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
