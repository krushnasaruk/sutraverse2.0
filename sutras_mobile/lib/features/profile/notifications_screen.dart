import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _notifs = [
    {
      'icon': Icons.thumb_up,
      'color': const Color(0xFF34c759),
      'title': 'Alex liked your post',
      'time': '10m ago',
      'unread': true,
    },
    {
      'icon': Icons.emoji_events,
      'color': const Color(0xFFffcc00),
      'title': 'You earned 50 XP!',
      'time': '2h ago',
      'unread': false,
    },
    {
      'icon': Icons.chat_bubble,
      'color': const Color(0xFFaf52de),
      'title': 'Prof. Smith replied to your comment',
      'time': '1d ago',
      'unread': false,
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
                ..._notifs.map((item) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: item['unread'] ? context.bgCard : context.bgMain,
                      border: Border.all(color: item['unread'] ? context.border : Colors.transparent),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: (item['color'] as Color).withOpacity(0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(item['icon'], color: item['color'], size: 20),
                        ),
                        SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item['title'], style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                              SizedBox(height: 2),
                              Text(item['time'], style: TextStyle(color: context.textMuted, fontSize: 13)),
                            ],
                          ),
                        ),
                        if (item['unread'])
                          Container(width: 10, height: 10, decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
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
                          Text('Notifications', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                        ],
                      ),
                      Text('Mark all read', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
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
