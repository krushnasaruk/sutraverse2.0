import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  // Mock Stats
  final Map<String, dynamic> stats = {
    'notes': 1250,
    'pyqs': 430,
    'students': 850,
  };

  // Mock Categories
  final List<Map<String, dynamic>> categories = [
    {'icon': Icons.menu_book, 'label': 'Study', 'route': '/exam-mode', 'color': const Color(0xFF0066cc), 'bgLight': const Color(0x1A0066cc)},
    {'icon': Icons.description, 'label': 'PYQs', 'route': '/pyqs', 'color': const Color(0xFFff9500), 'bgLight': const Color(0x1Aff9500)},
    {'icon': Icons.forum, 'label': 'Community', 'route': '/community', 'color': const Color(0xFFaf52de), 'bgLight': const Color(0x1Aaf52de)},
    {'icon': Icons.groups, 'label': 'Clubs', 'route': '/clubs', 'color': const Color(0xFFff2d55), 'bgLight': const Color(0x1Aff2d55)},
  ];

  // Mock Quick Actions
  final List<Map<String, dynamic>> quickActions = [
    {'icon': Icons.emoji_events, 'label': 'Leaderboard', 'route': '/leaderboard', 'color': const Color(0xFFffcc00), 'bgLight': const Color(0x1Fffcc00)},
    {'icon': Icons.newspaper, 'label': 'News', 'route': '/news', 'color': const Color(0xFF5856d6), 'bgLight': const Color(0x1A5856d6)},
    {'icon': Icons.cloud_download, 'label': 'Downloads', 'route': '/downloads', 'color': const Color(0xFF34c759), 'bgLight': const Color(0x1A34c759)},
  ];

  // Mock Recent Files
  final List<Map<String, dynamic>> recentFiles = [
    {'id': '1', 'title': 'Data Structures Unit 1 Notes', 'subject': 'Computer Science', 'type': 'Notes', 'uploader': 'Alice', 'rating': 4.8},
    {'id': '2', 'title': 'OS Endsem PYQ 2024', 'subject': 'Computer Science', 'type': 'PYQ', 'uploader': 'Admin', 'rating': 4.5},
    {'id': '3', 'title': 'Physics Lab Assignment', 'subject': 'Physics', 'type': 'Assignment', 'uploader': 'Bob', 'rating': 4.2},
    {'id': '4', 'title': 'Calculus III Summary', 'subject': 'Mathematics', 'type': 'Notes', 'uploader': 'Charlie', 'rating': 4.9},
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Color getTypeColor(String type) {
    if (type == 'Notes') return const Color(0xFF0066cc);
    if (type == 'PYQ') return const Color(0xFFff9500);
    return const Color(0xFF34c759);
  }

  IconData getTypeIcon(String type) {
    if (type == 'Notes') return Icons.description;
    if (type == 'PYQ') return Icons.help_outline;
    return Icons.assignment;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: context.bgMain,
      body: FadeTransition(
        opacity: _fadeAnim,
        child: SlideTransition(
          position: _slideAnim,
          child: CustomScrollView(
            slivers: [
              // Hero Banner
              SliverToBoxAdapter(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark 
                          ? [const Color.fromRGBO(41,151,255,0.15), const Color.fromRGBO(0,102,204,0.05), Colors.transparent]
                          : [const Color.fromRGBO(0,102,204,0.08), const Color.fromRGBO(0,102,204,0.02), Colors.transparent],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  padding: const EdgeInsets.only(top: 56, left: 20, right: 20, bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Nav
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.school, color: AppTheme.primary, size: 30),
                              SizedBox(width: 8),
                              Text('SutraVerse', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                            ],
                          ),
                          Row(
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: context.bgCard,
                                  border: Border.all(color: context.border),
                                  shape: BoxShape.circle,
                                ),
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: Icon(Icons.notifications_none, size: 20, color: context.textPrimary),
                                  onPressed: () {},
                                ),
                              ),
                              SizedBox(width: 12),
                              GestureDetector(
                                onTap: () => context.go('/profile'),
                                child: Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Text('K', style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      SizedBox(height: 24),
                      Text('Good evening', style: theme.textTheme.bodyLarge?.copyWith(color: context.textMuted)),
                      Text('Krushna 👋', style: theme.textTheme.displayLarge?.copyWith(fontSize: 32)),
                      
                      // Platform Stats
                      Container(
                        margin: const EdgeInsets.only(top: 24),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Row(
                          children: [
                            Expanded(child: _buildStatItem('${stats['notes']}+', 'Notes', AppTheme.primary)),
                            Container(width: 1, height: 30, color: Colors.white.withOpacity(0.1)),
                            Expanded(child: _buildStatItem('${stats['pyqs']}+', 'PYQs', const Color(0xFF34c759))),
                            Container(width: 1, height: 30, color: Colors.white.withOpacity(0.1)),
                            Expanded(child: _buildStatItem('${stats['students']}+', 'Students', const Color(0xFFff9500))),
                          ],
                        ),
                      ),
                      
                      SizedBox(height: 20),
                      Text('What would you like to study today?', style: theme.textTheme.bodyLarge?.copyWith(color: context.textMuted)),
                      
                      SizedBox(height: 16),
                      // Search Bar
                      GestureDetector(
                        onTap: () => context.go('/search'),
                        child: Container(
                          height: 48,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: context.bgCard,
                            border: Border.all(color: context.border),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.search, color: context.textMuted, size: 20),
                              SizedBox(width: 10),
                              Text('Search notes, PYQs, assignments...', style: theme.textTheme.bodyLarge?.copyWith(color: context.textMuted)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Category Grid
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 2.2,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = categories[index];
                      return GestureDetector(
                        onTap: () {},
                        child: Container(
                          decoration: BoxDecoration(
                            color: context.bgCard,
                            border: Border.all(color: context.border),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: item['bgLight'] as Color,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                              ),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(item['label'] as String, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary)),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: categories.length,
                  ),
                ),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 32, bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text('Quick Access', style: theme.textTheme.titleLarge?.copyWith(fontSize: 20)),
                      ),
                      SizedBox(height: 16),
                      SizedBox(
                        height: 120,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          scrollDirection: Axis.horizontal,
                          itemCount: quickActions.length,
                          separatorBuilder: (context, index) => SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            final action = quickActions[index];
                            return GestureDetector(
                              onTap: () => context.go(action['route']),
                              child: Container(
                                width: 100,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: context.bgCard,
                                  border: Border.all(color: context.border),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: action['bgLight'] as Color,
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Icon(action['icon'] as IconData, color: action['color'] as Color, size: 22),
                                    ),
                                    SizedBox(height: 10),
                                    Text(
                                      action['label'] as String,
                                      style: theme.textTheme.bodyMedium?.copyWith(color: context.textPrimary),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // AI Study Prep CTA
              SliverToBoxAdapter(
                child: GestureDetector(
                  onTap: () => context.go('/assistant'),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1a1a2e), Color(0xFF16213e), Color(0xFF0f3460)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(Icons.auto_awesome, color: context.textPrimary),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('AI Study Prep', style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                              SizedBox(height: 4),
                              Text('Flashcards, summaries & practice Q\'s', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
                            ],
                          ),
                        ),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.arrow_forward, color: context.textPrimary, size: 20),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Recent Files
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 24, left: 20, right: 20, bottom: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent files', style: theme.textTheme.titleLarge?.copyWith(fontSize: 20)),
                      GestureDetector(
                        onTap: () => context.go('/search'),
                        child: Text('View all →', style: theme.textTheme.bodyLarge?.copyWith(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final file = recentFiles[index];
                      final tc = getTypeColor(file['type'] as String);
                      return GestureDetector(
                        onTap: () {},
                        child: Container(
                          decoration: BoxDecoration(
                            color: context.bgCard,
                            border: Border.all(color: context.border),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(height: 4, width: double.infinity, color: tc),
                              Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        color: tc.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(getTypeIcon(file['type'] as String), color: tc, size: 22),
                                    ),
                                    SizedBox(height: 12),
                                    Text(
                                      file['title'] as String,
                                      style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary, height: 1.3),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    SizedBox(height: 6),
                                    Text(
                                      file['subject'] as String,
                                      style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    SizedBox(height: 14),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: tc.withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            file['type'] as String,
                                            style: TextStyle(color: tc, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        Text('★ ${file['rating']}', style: TextStyle(color: context.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: recentFiles.length,
                  ),
                ),
              ),

              const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800)),
        SizedBox(height: 4),
        Text(label.toUpperCase(), style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
      ],
    );
  }
}
