import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/teacher_provider.dart';
import '../../core/app_theme.dart';
import 'attendance_screen.dart';
import 'leave_approval_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch classes on load
    Future.microtask(() =>
      context.read<TeacherProvider>().fetchClassrooms()
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TeacherProvider>();
    final user = FirebaseAuth.instance.currentUser;
    final selectedClass = provider.selectedClassroom;

    return Scaffold(
      body: SafeArea(
        child: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchClassrooms,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(user),
                    const SizedBox(height: 30),

                    if (selectedClass != null) ...[
                      _buildClassSelector(provider),
                      const SizedBox(height: 24),
                      _buildStatsGrid(),
                      const SizedBox(height: 30),
                      _buildQuickActions(context),
                    ] else ...[
                      _buildNoClassState(),
                    ],
                  ],
                ),
              ),
            ),
      ),
    );
  }

  Widget _buildHeader(User? user) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good Day,',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.grey),
            ),
            Text(
              user?.displayName?.split(' ')[0] ?? 'Professor 🧑‍🏫',
              style: Theme.of(context).textTheme.displayLarge,
            ),
          ],
        ),
        CircleAvatar(
          radius: 26,
          backgroundColor: AppTheme.primary,
          backgroundImage: user?.photoURL != null ? NetworkImage(user!.photoURL!) : null,
          child: user?.photoURL == null
            ? Text((user?.email ?? 'P')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))
            : null,
        ),
      ],
    );
  }

  Widget _buildClassSelector(TeacherProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderDark),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: provider.selectedClassroom?.classId,
          isExpanded: true,
          dropdownColor: AppTheme.cardDark,
          items: provider.classrooms.map((c) {
            return DropdownMenuItem(
              value: c.classId,
              child: Text('${c.classId} — ${c.subject}', style: const TextStyle(fontWeight: FontWeight.bold)),
            );
          }).toList(),
          onChanged: (val) {
            final picked = provider.classrooms.firstWhere((element) => element.classId == val);
            provider.selectClassroom(picked);
          },
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.4,
      children: [
        _buildStatCard('Attendance', '84%', Colors.green, Icons.people_outline, () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceScreen()));
        }),
        _buildStatCard('Pending Leaves', '5', Colors.orange, Icons.mail_outline, () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const LeaveApprovalScreen()));
        }),
        _buildStatCard('Active Tasks', '12', Colors.blue, Icons.assignment_outlined, () {}),
        _buildStatCard('Syllabus', '70%', Colors.purple, Icons.book_outlined, () {}),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const Spacer(),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Control', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        Row(
          children: [
            _buildActionIcon(context, 'Broadcast', Icons.notifications_active, AppTheme.primary, () {}),
            _buildActionIcon(context, 'Attendance', Icons.qr_code_scanner, AppTheme.secondary, () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceScreen()));
            }),
            _buildActionIcon(context, 'Diary', Icons.edit_note, AppTheme.accent, () {}),
            _buildActionIcon(context, 'Analytics', Icons.bar_chart, Colors.pinkAccent, () {}),
          ],
        ),
      ],
    );
  }

  Widget _buildActionIcon(BuildContext context, String label, IconData icon, Color color, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            Container(
              height: 60,
              width: 60,
              decoration: BoxDecoration(
                color: AppTheme.cardDark,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildNoClassState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          const Icon(Icons.school_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 20),
          Text(
            'No Assigned Classrooms',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.grey),
          ),
          const SizedBox(height: 10),
          const Text(
            'Contact the administrator to map your subjects and student rosters.',
            textAlign: Center,
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
