import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _posts = [
    {
      'author': 'Alex Chen',
      'avatar': 'A',
      'time': '2h ago',
      'title': 'Tips for passing OS Endsem?',
      'content': 'I am really struggling with the memory management unit. Does anyone have good concise notes or analogies to understand paging and segmentation?',
      'upvotes': 42,
      'comments': 12,
      'tags': ['OS', 'Help'],
    },
    {
      'author': 'Prof. Smith',
      'avatar': 'S',
      'time': '5h ago',
      'title': 'Guest Lecture: AI in Healthcare',
      'content': 'Join us tomorrow in the main auditorium for a guest lecture by Dr. Alan from Google Health. Attendance is mandatory for third-year CS students.',
      'upvotes': 156,
      'comments': 45,
      'tags': ['Announcement', 'Event'],
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
                ..._posts.map((post) {
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
                        // Author Row
                        Row(
                          children: [
                            Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(color: Color(0xFFaf52de), shape: BoxShape.circle),
                              alignment: Alignment.center,
                              child: Text(post['avatar'], style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(post['author'], style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                                  Text(post['time'], style: TextStyle(color: context.textMuted, fontSize: 12)),
                                ],
                              ),
                            ),
                            Icon(Icons.more_horiz, color: context.textMuted),
                          ],
                        ),
                        
                        SizedBox(height: 16),
                        
                        // Content
                        Text(post['title'], style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 8),
                        Text(post['content'], style: TextStyle(color: context.textSecondary, fontSize: 14, height: 1.4)),
                        
                        SizedBox(height: 16),
                        
                        // Tags
                        Row(
                          children: (post['tags'] as List<String>).map((tag) {
                            return Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFaf52de).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(tag, style: TextStyle(color: Color(0xFFaf52de), fontSize: 11, fontWeight: FontWeight.bold)),
                            );
                          }).toList(),
                        ),

                        SizedBox(height: 16),
                        Divider(color: context.border),
                        SizedBox(height: 12),

                        // Actions
                        Row(
                          children: [
                            _buildActionBtn(Icons.arrow_upward, '${post['upvotes']}'),
                            SizedBox(width: 24),
                            _buildActionBtn(Icons.chat_bubble_outline, '${post['comments']}'),
                            const Spacer(),
                            Icon(Icons.share_outlined, color: context.textMuted, size: 20),
                          ],
                        ),
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
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
                          Text('Community', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                        ],
                      ),
                      Container(
                        width: 34, height: 34,
                        decoration: BoxDecoration(color: const Color(0xFFaf52de), borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.add, color: context.textPrimary, size: 20),
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

  Widget _buildActionBtn(IconData icon, String count) {
    return Row(
      children: [
        Icon(icon, color: context.textMuted, size: 20),
        SizedBox(width: 6),
        Text(count, style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
