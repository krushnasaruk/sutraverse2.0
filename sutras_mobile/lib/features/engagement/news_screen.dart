import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _news = [
    {
      'title': 'Mid-Semester Examination Schedule Released',
      'date': 'Oct 15, 2024',
      'category': 'Academics',
      'content': 'The timetable for the upcoming mid-semester examinations has been published on the student portal. Exams will commence from Nov 1.',
    },
    {
      'title': 'TechFest 2024 Registrations Open!',
      'date': 'Oct 10, 2024',
      'category': 'Events',
      'content': 'Register now for the biggest technical festival of the year. Exciting prizes up to \$10,000 for hackathon winners.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() => _scrollY = _scrollController.offset);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final headerBgOpacity = (_scrollY / 50).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          Positioned.fill(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(top: 108, bottom: 40),
              children: [
                ..._news.map((item) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.bgCard,
                      border: Border.all(color: context.border),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF5856d6).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(item['category'], style: TextStyle(color: Color(0xFF5856d6), fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                            Text(item['date'], style: TextStyle(color: context.textMuted, fontSize: 12)),
                          ],
                        ),
                        SizedBox(height: 12),
                        Text(item['title'], style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 8),
                        Text(item['content'], style: TextStyle(color: context.textSecondary, fontSize: 14, height: 1.4)),
                        SizedBox(height: 16),
                        Text('Read more', style: TextStyle(color: Color(0xFF5856d6), fontWeight: FontWeight.bold)),
                      ],
                    ),
                  );
                }).toList(),
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
                      SizedBox(width: 16),
                      Text('Campus News', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
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
}
