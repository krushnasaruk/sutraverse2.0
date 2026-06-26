import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  // Mock User Data
  String _displayName = 'Krushna';
  String _email = 'krushna@university.edu';
  String _branch = 'Computer Engineering';
  String _year = 'TE';
  String _college = 'Pune Institute of Tech';
  int _points = 450;
  int _uploads = 12;
  int _saved = 4;
  String _role = 'student';

  bool _isModalVisible = false;

  final List<Map<String, dynamic>> _badges = [
    {'label': 'Novice', 'icon': Icons.school, 'unlocked': true, 'color': const Color(0xFF0066cc), 'bgLight': const Color(0x1A0066cc)},
    {'label': 'Contributor', 'icon': Icons.create, 'unlocked': true, 'color': const Color(0xFFff9500), 'bgLight': const Color(0x1Aff9500)},
    {'label': 'Scholar', 'icon': Icons.menu_book, 'unlocked': false, 'color': const Color(0xFF34c759), 'bgLight': const Color(0x1A34c759)},
    {'label': 'Expert', 'icon': Icons.lightbulb, 'unlocked': false, 'color': const Color(0xFFaf52de), 'bgLight': const Color(0x1Aaf52de)},
  ];

  final List<Map<String, dynamic>> _menuItems = [
    {'icon': Icons.cloud_download, 'label': 'My Downloads', 'color': const Color(0xFF34c759)},
    {'icon': Icons.emoji_events, 'label': 'Campus Leaderboard', 'color': const Color(0xFFffcc00)},
    {'icon': Icons.notifications, 'label': 'Notifications', 'color': const Color(0xFFff3b30)},
    {'icon': Icons.security, 'label': 'Privacy & Security', 'color': const Color(0xFF34c759)},
    {'icon': Icons.help, 'label': 'Help & Support', 'color': const Color(0xFF0066cc)},
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() => _scrollY = _scrollController.offset);
    });
  }

  void _showEditModal() {
    setState(() => _isModalVisible = true);
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
          // Background Gradient Mesh
          Positioned(
            top: 0, left: 0, right: 0, height: 260,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color.fromRGBO(41,151,255,0.15), const Color.fromRGBO(0,102,204,0.02), Colors.transparent]
                      : [const Color.fromRGBO(0,102,204,0.08), const Color.fromRGBO(0,102,204,0.01), Colors.transparent],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Content
          Positioned.fill(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(top: 108, bottom: 120),
              children: [
                // Profile Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: context.bgCard,
                    border: Border.all(color: context.border),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 76, height: 76,
                            decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                            padding: const EdgeInsets.all(2),
                            child: Container(
                              decoration: BoxDecoration(color: context.textPrimary, shape: BoxShape.circle),
                              child: Container(
                                decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                alignment: Alignment.center,
                                child: Text(
                                  _displayName.isNotEmpty ? _displayName[0].toUpperCase() : '?',
                                  style: TextStyle(color: context.textPrimary, fontSize: 24, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(child: Text(_displayName, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary), maxLines: 1)),
                                    GestureDetector(
                                      onTap: _showEditModal,
                                      child: Container(
                                        width: 26, height: 26,
                                        decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.15), shape: BoxShape.circle),
                                        child: Icon(Icons.edit, color: AppTheme.primary, size: 14),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 2),
                                Text(_email, style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                                SizedBox(height: 2),
                                Text('$_year · $_branch', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                              ],
                            ),
                          )
                        ],
                      ),
                      
                      if (_college.isNotEmpty) ...[
                        Container(
                          margin: const EdgeInsets.only(top: 16),
                          padding: const EdgeInsets.only(top: 14),
                          decoration: BoxDecoration(border: Border(top: BorderSide(color: context.border))),
                          child: Row(
                            children: [
                              Icon(Icons.business, color: context.textMuted, size: 16),
                              SizedBox(width: 6),
                              Expanded(child: Text(_college, style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted))),
                            ],
                          ),
                        ),
                      ],

                      Container(
                        margin: const EdgeInsets.only(top: 14),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                              child: Text(_role.toUpperCase(), style: TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                            ),
                            Text('MEMBER SINCE 2026', style: TextStyle(color: context.textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),

                // Stats Grid
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _buildStatCard('$_points', 'XP Points', '⚡', const Color.fromRGBO(255, 149, 0, 0.1)),
                      SizedBox(width: 8),
                      _buildStatCard('$_uploads', 'Uploads', '📂', const Color.fromRGBO(52, 199, 89, 0.1)),
                      SizedBox(width: 8),
                      _buildStatCard('$_saved', 'Saved', '💾', const Color.fromRGBO(52, 199, 89, 0.1)),
                    ],
                  ),
                ),

                // Badges
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: Text('Achievements', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                ),
                SizedBox(
                  height: 110,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: _badges.length,
                    itemBuilder: (context, index) {
                      final b = _badges[index];
                      final isUnlocked = b['unlocked'] as bool;
                      return Container(
                        width: 104,
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                        decoration: BoxDecoration(
                          color: context.bgCard.withOpacity(isUnlocked ? 1.0 : 0.45),
                          border: Border.all(color: context.border),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 42, height: 42,
                              decoration: BoxDecoration(color: isUnlocked ? b['bgLight'] : AppTheme.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(14)),
                              child: Icon(b['icon'], color: isUnlocked ? b['color'] : context.textMuted, size: 20),
                            ),
                            const Spacer(),
                            Text(b['label'], style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary)),
                            SizedBox(height: 4),
                            Container(
                              height: 3, width: double.infinity,
                              decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(2)),
                              alignment: Alignment.centerLeft,
                              child: Container(
                                width: isUnlocked ? 84 : 8.4,
                                decoration: BoxDecoration(color: isUnlocked ? b['color'] : context.textMuted, borderRadius: BorderRadius.circular(2)),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Settings Menu
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: Text('Account Settings', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                ),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    children: [
                      _buildMenuItem(Icons.person, 'Customize Profile', const Color(0xFFff9500), onTap: _showEditModal),
                      ..._menuItems.map((item) => _buildMenuItem(
                        item['icon'] as IconData,
                        item['label'] as String,
                        item['color'] as Color,
                      )).toList(),
                    ],
                  ),
                ),

                // Logout Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                  child: GestureDetector(
                    onTap: () {},
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.redAccent, width: 1.5),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.logout, color: Colors.redAccent, size: 18),
                          SizedBox(width: 8),
                          Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Top Header (Seamless Blur)
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
                      Text('Profile', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                      Row(
                        children: [
                          Container(
                            width: 38, height: 38,
                            decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), shape: BoxShape.circle),
                            child: Icon(Icons.notifications_none, color: context.textPrimary, size: 18),
                          ),
                          SizedBox(width: 8),
                          Container(
                            width: 38, height: 38,
                            decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), shape: BoxShape.circle),
                            child: Icon(Icons.dark_mode_outlined, color: context.textPrimary, size: 18),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Customization Modal
          if (_isModalVisible)
            Positioned.fill(
              child: Container(
                color: Colors.black54,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: context.bgCard,
                        borderRadius: BorderRadius.only(topLeft: Radius.circular(28), topRight: Radius.circular(28)),
                        border: Border(top: BorderSide(color: context.border), left: BorderSide(color: context.border), right: BorderSide(color: context.border)),
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Customize Profile', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                              GestureDetector(
                                onTap: () => setState(() => _isModalVisible = false),
                                child: Icon(Icons.close, color: context.textMuted, size: 24),
                              ),
                            ],
                          ),
                          SizedBox(height: 24),
                          _buildTextField('Display Name', _displayName, (v) => _displayName = v),
                          _buildTextField('Current Year', _year, (v) => _year = v),
                          _buildTextField('Branch / Department', _branch, (v) => _branch = v),
                          _buildTextField('College / University', _college, (v) => _college = v),
                          SizedBox(height: 16),
                          GestureDetector(
                            onTap: () => setState(() => _isModalVisible = false),
                            child: Container(
                              height: 48,
                              decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(24)),
                              alignment: Alignment.center,
                              child: Text('Save Changes', style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          )
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String value, Function(String) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: context.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          SizedBox(height: 6),
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(color: context.bgMain, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(10)),
            child: TextField(
              controller: TextEditingController(text: value)..selection = TextSelection.collapsed(offset: value.length),
              style: TextStyle(color: context.textPrimary),
              decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero, isDense: true),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String value, String label, String emoji, Color emojiBg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(18)),
        child: Column(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(color: emojiBg, borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              margin: const EdgeInsets.only(bottom: 8),
              child: Text(emoji, style: TextStyle(fontSize: 18)),
            ),
            Text(value, style: TextStyle(color: context.textPrimary, fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: -0.28)),
            SizedBox(height: 2),
            Text(label, style: TextStyle(color: context.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, Color color, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: context.border))),
        child: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: context.textPrimary, size: 16),
            ),
            SizedBox(width: 14),
            Expanded(child: Text(label, style: TextStyle(color: context.textPrimary, fontSize: 16))),
            Icon(Icons.chevron_right, color: context.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
