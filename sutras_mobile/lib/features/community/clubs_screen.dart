import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class ClubsScreen extends StatefulWidget {
  const ClubsScreen({super.key});

  @override
  State<ClubsScreen> createState() => _ClubsScreenState();
}

class _ClubsScreenState extends State<ClubsScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _clubs = [
    {
      'name': 'Google Developer Student Club',
      'members': 450,
      'status': 'Active',
      'description': 'Learn to build solutions for local businesses and your community with Google technology.',
      'color': const Color(0xFF4285F4),
    },
    {
      'name': 'Robotics Club',
      'members': 120,
      'status': 'Recruiting',
      'description': 'Design, build, and program robots for national competitions. No prior experience needed!',
      'color': const Color(0xFFff2d55),
    },
    {
      'name': 'Finance & Investment Cell',
      'members': 300,
      'status': 'Active',
      'description': 'Master the stock market, personal finance, and corporate valuation through hands-on trading.',
      'color': const Color(0xFF34c759),
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
                ..._clubs.map((club) {
                  final Color c = club['color'];
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.bgCard,
                      border: Border.all(color: context.border),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(height: 80, width: double.infinity, color: c.withOpacity(0.2)),
                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(club['name'], style: TextStyle(color: context.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: c.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(club['status'], style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              SizedBox(height: 8),
                              Text('${club['members']} Members', style: TextStyle(color: context.textMuted, fontSize: 13)),
                              SizedBox(height: 16),
                              Text(club['description'], style: TextStyle(color: context.textSecondary, fontSize: 14, height: 1.4)),
                              SizedBox(height: 20),
                              Container(
                                width: double.infinity,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: context.bgMain,
                                  border: Border.all(color: c.withOpacity(0.5)),
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                alignment: Alignment.center,
                                child: Text('View Details', style: TextStyle(color: c, fontSize: 15, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
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
                      Text('Campus Clubs', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
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
