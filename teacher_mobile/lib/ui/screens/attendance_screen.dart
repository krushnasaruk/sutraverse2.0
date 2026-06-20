import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/teacher_provider.dart';
import '../../core/app_theme.dart';
import '../../services/attendance_service.dart';
import 'package:qr_flutter/qr_flutter.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _isLive = false;
  final AttendanceService _attendanceService = AttendanceService();
  String _activeTab = 'Roster'; // 'Roster' or 'Live'

  @override
  Widget build(BuildContext context) {
    final selectedClass = context.watch<TeacherProvider>().selectedClassroom;

    if (selectedClass == null) {
      return const Scaffold(body: Center(child: Text('No class selected')));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${selectedClass.classId} Attendance'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildTabSwitcher(),
          Expanded(
            child: _activeTab == 'Roster'
              ? _buildRosterView(selectedClass.classId)
              : _buildLiveControlView(selectedClass),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildTabBtn('Roster'),
          _buildTabBtn('Live Controls'),
        ],
      ),
    );
  }

  Widget _buildTabBtn(String label) {
    bool active = _activeTab == label;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = label),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppTheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: active ? FontWeight.bold : FontWeight.normal,
              color: active ? Colors.white : Colors.grey,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRosterView(String classId) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('roster')
          .where('classId', 'isEqualTo', classId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

        final students = snapshot.data!.docs;
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: students.length,
          itemBuilder: (context, index) {
            final data = students[index].data() as Map<String, dynamic>;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primary.withOpacity(0.2),
                  child: Text(data['rollNo'] ?? '?', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                ),
                title: Text(data['name'] ?? 'Unknown Student'),
                subtitle: Text(data['email'] ?? ''),
                trailing: Checkbox(
                  value: true, // Placeholder for today's state
                  onChanged: (val) {},
                  activeColor: AppTheme.secondary,
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildLiveControlView(selectedClass) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _buildControlCard(
            'Radar Broadcast',
            'Start a geo-fenced session. Students within 15m can auto-checkin.',
            Icons.radar,
            AppTheme.primary,
            () {
              // startLiveSession logic
              setState(() => _isLive = true);
            },
            _isLive,
          ),
          const SizedBox(height: 20),
          if (_isLive) ...[
            _buildLiveStats(selectedClass.classId),
            const SizedBox(height: 20),
            _buildQRCard(selectedClass.classId),
          ],
        ],
      ),
    );
  }

  Widget _buildControlCard(String title, String desc, IconData icon, Color color, VoidCallback onTap, bool active) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: active ? color.withOpacity(0.15) : AppTheme.cardDark,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: active ? color : AppTheme.borderDark),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 48),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(desc, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: active ? Colors.redAccent : color,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(active ? 'Stop Session' : 'Start Session'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQRCard(String classId) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          const Text('Secure Session QR', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          QrImageView(
            data: 'sutraverse-checkin-$classId-${DateTime.now().day}',
            version: QrVersions.auto,
            size: 200.0,
          ),
        ],
      ),
    );
  }

  Widget _buildLiveStats(String classId) {
    String today = DateTime.now().toIso8601String().split('T')[0];
    return StreamBuilder<QuerySnapshot>(
      stream: _attendanceService.getLiveCheckins(classId, today),
      builder: (context, snapshot) {
        int count = snapshot.hasData ? snapshot.data!.docs.length : 0;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.secondary.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.bolt, color: AppTheme.secondary),
              const SizedBox(width: 8),
              Text(
                '$count Students Checked In via Radar',
                style: const TextStyle(color: AppTheme.secondary, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}
