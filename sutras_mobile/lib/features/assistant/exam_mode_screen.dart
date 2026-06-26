import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class ExamModeScreen extends StatefulWidget {
  const ExamModeScreen({super.key});

  @override
  State<ExamModeScreen> createState() => _ExamModeScreenState();
}

class _ExamModeScreenState extends State<ExamModeScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() => _scrollY = _scrollController.offset);
    });
  }

  void _generateQuiz() {
    setState(() => _isGenerating = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isGenerating = false);
      // In a real app, this would route to the actual active quiz view
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final headerBgOpacity = (_scrollY / 50).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          Positioned(
            top: 0, left: 0, right: 0, height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color.fromRGBO(255,45,85,0.15), const Color.fromRGBO(255,45,85,0.02), Colors.transparent]
                      : [const Color.fromRGBO(255,45,85,0.08), const Color.fromRGBO(255,45,85,0.01), Colors.transparent],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          Positioned.fill(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(top: 108, bottom: 40),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      Container(
                        width: 80, height: 80,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFff2d55).withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.psychology, color: Color(0xFFff2d55), size: 40),
                      ),
                      Text('AI Exam Prep', style: theme.textTheme.headlineSmall?.copyWith(color: context.textPrimary, fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text(
                        'Generate dynamic flashcards and practice quizzes based on your syllabus.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: context.textMuted, fontSize: 14),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 32),

                // Settings
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: context.bgCard,
                    border: Border.all(color: context.border),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Select Topic', style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                      SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: context.bgMain,
                          border: Border.all(color: context.border),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: 'Computer Networks',
                            dropdownColor: context.bgCard,
                            isExpanded: true,
                            icon: Icon(Icons.keyboard_arrow_down, color: context.textMuted),
                            style: TextStyle(color: context.textPrimary, fontSize: 14),
                            onChanged: (v) {},
                            items: ['Computer Networks', 'Operating Systems', 'Database Systems']
                                .map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          ),
                        ),
                      ),

                      SizedBox(height: 24),
                      Text('Difficulty', style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                      SizedBox(height: 12),
                      Row(
                        children: [
                          _buildDiffBox('Easy', false),
                          SizedBox(width: 8),
                          _buildDiffBox('Medium', true),
                          SizedBox(width: 8),
                          _buildDiffBox('Hard', false),
                        ],
                      ),
                      
                      SizedBox(height: 24),
                      Text('Mode', style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                      SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: _buildModeBox(Icons.style, 'Flashcards', true)),
                          SizedBox(width: 12),
                          Expanded(child: _buildModeBox(Icons.quiz, 'MCQ Quiz', false)),
                        ],
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 32),

                // CTA
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: GestureDetector(
                    onTap: _isGenerating ? null : _generateQuiz,
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFFff2d55),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      alignment: Alignment.center,
                      child: _isGenerating 
                          ? SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: context.textPrimary, strokeWidth: 3))
                          : Text('Start Practice', style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Header
          Positioned(
            top: 0, left: 0, right: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10 * headerBgOpacity, sigmaY: 10 * headerBgOpacity),
                child: Container(
                  color: context.bgMain.withOpacity(0.7 * headerBgOpacity),
                  padding: const EdgeInsets.only(top: 56, bottom: 12, left: 20, right: 20),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          width: 34, height: 34,
                          decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), shape: BoxShape.circle),
                          child: Icon(Icons.chevron_left, color: AppTheme.primary, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDiffBox(String label, bool active) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFff2d55).withOpacity(0.15) : context.bgMain,
          border: Border.all(color: active ? const Color(0xFFff2d55) : context.border),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(color: active ? const Color(0xFFff2d55) : context.textMuted, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildModeBox(IconData icon, String label, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFff2d55).withOpacity(0.15) : context.bgMain,
        border: Border.all(color: active ? const Color(0xFFff2d55) : context.border),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: active ? const Color(0xFFff2d55) : context.textMuted, size: 28),
          SizedBox(height: 8),
          Text(label, style: TextStyle(color: active ? const Color(0xFFff2d55) : context.textMuted, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
