import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _topThree = [
    {'name': 'Sarah', 'points': 4200, 'rank': 2},
    {'name': 'Krushna', 'points': 5800, 'rank': 1},
    {'name': 'David', 'points': 3900, 'rank': 3},
  ];

  final List<Map<String, dynamic>> _others = [
    {'name': 'Emily', 'points': 3100, 'rank': 4},
    {'name': 'Alex', 'points': 2850, 'rank': 5},
    {'name': 'Michael', 'points': 2400, 'rank': 6},
    {'name': 'Jessica', 'points': 2100, 'rank': 7},
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
    final isDark = theme.brightness == Brightness.dark;
    final headerBgOpacity = (_scrollY / 50).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          Positioned(
            top: 0, left: 0, right: 0, height: 350,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color.fromRGBO(255,204,0,0.15), const Color.fromRGBO(255,204,0,0.02), Colors.transparent]
                      : [const Color.fromRGBO(255,204,0,0.08), const Color.fromRGBO(255,204,0,0.01), Colors.transparent],
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
                // Podium
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: SizedBox(
                    height: 220,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _buildPodiumSpot(_topThree[0], 120, const Color(0xFFC0C0C0)), // 2nd
                        _buildPodiumSpot(_topThree[1], 160, const Color(0xFFFFD700)), // 1st
                        _buildPodiumSpot(_topThree[2], 90, const Color(0xFFCD7F32)),  // 3rd
                      ],
                    ),
                  ),
                ),

                SizedBox(height: 32),
                
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Text('Other Ranks', style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                ),

                // List
                ..._others.map((user) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: context.bgCard,
                      border: Border.all(color: context.border),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Text('#${user['rank']}', style: TextStyle(color: context.textMuted, fontSize: 16, fontWeight: FontWeight.bold)),
                        SizedBox(width: 16),
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(color: Color(0xFFffcc00), shape: BoxShape.circle),
                          alignment: Alignment.center,
                          child: Text(user['name'][0], style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold)),
                        ),
                        SizedBox(width: 14),
                        Expanded(child: Text(user['name'], style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold))),
                        Text('${user['points']} XP', style: TextStyle(color: Color(0xFFffcc00), fontSize: 14, fontWeight: FontWeight.bold)),
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
                      Text('Leaderboard', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
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

  Widget _buildPodiumSpot(Map<String, dynamic> user, double height, Color medalColor) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: medalColor, shape: BoxShape.circle, border: Border.all(color: context.bgMain, width: 4)),
            alignment: Alignment.center,
            child: Text(user['name'][0], style: TextStyle(color: context.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
          ),
          SizedBox(height: 8),
          Text(user['name'], style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text('${user['points']} XP', style: TextStyle(color: context.textMuted, fontSize: 12)),
          SizedBox(height: 12),
          Container(
            height: height,
            decoration: BoxDecoration(
              color: medalColor.withOpacity(0.2),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
              border: Border.all(color: medalColor.withOpacity(0.5)),
            ),
            alignment: Alignment.center,
            child: Text('${user['rank']}', style: TextStyle(color: medalColor, fontSize: 32, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
