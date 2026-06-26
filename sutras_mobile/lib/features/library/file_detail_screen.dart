import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class FileDetailScreen extends StatelessWidget {
  final String id;
  const FileDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Mock data for the file based on ID
    final file = {
      'title': 'Data Structures Unit 1 Notes',
      'subject': 'Computer Science',
      'type': 'Notes',
      'uploader': 'Alice',
      'rating': 4.8,
      'downloads': 120,
      'size': '2.4 MB',
      'date': 'Oct 12, 2024',
      'description': 'Comprehensive notes covering Arrays, Linked Lists, Stacks, and Queues with code examples in C++ and Python.',
    };

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          // Background Gradient Mesh
          Positioned(
            top: 0, left: 0, right: 0, height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color.fromRGBO(0,102,204,0.15), const Color.fromRGBO(0,102,204,0.02), Colors.transparent]
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
              padding: const EdgeInsets.only(top: 108, bottom: 120),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 80, height: 80,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0066cc).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Icon(Icons.description, color: Color(0xFF0066cc), size: 40),
                      ),
                      Text(
                        file['title'] as String,
                        style: theme.textTheme.headlineSmall?.copyWith(color: context.textPrimary, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 8),
                      Text(
                        '${file['subject']} • ${file['type']}',
                        style: theme.textTheme.titleMedium?.copyWith(color: AppTheme.primaryLight),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 24),

                // Stats Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      _buildStatBox(context, Icons.star, '${file['rating']}', 'Rating', Color(0xFFff9500)),
                      SizedBox(width: 12),
                      _buildStatBox(context, Icons.download, '${file['downloads']}', 'Downloads', Color(0xFF34c759)),
                      SizedBox(width: 12),
                      _buildStatBox(context, Icons.sd_storage, file['size'] as String, 'Size', Color(0xFFaf52de)),
                    ],
                  ),
                ),

                SizedBox(height: 24),

                // Details Card
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
                      Text('Description', style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text(file['description'] as String, style: TextStyle(color: context.textSecondary, fontSize: 14, height: 1.5)),
                      Divider(color: context.border, height: 32),
                      _buildDetailRow(context, 'Uploaded By', file['uploader'] as String),
                      SizedBox(height: 12),
                      _buildDetailRow(context, 'Date', file['date'] as String),
                    ],
                  ),
                ),

                SizedBox(height: 32),

                // Actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: () {},
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(28),
                          ),
                          alignment: Alignment.center,
                          child: Text('Read Document', style: TextStyle(color: context.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      SizedBox(height: 16),
                      GestureDetector(
                        onTap: () {},
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: context.bgCard,
                            border: Border.all(color: AppTheme.primary),
                            borderRadius: BorderRadius.circular(28),
                          ),
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.cloud_download, color: AppTheme.primary),
                              SizedBox(width: 8),
                              Text('Download Offline', style: TextStyle(color: AppTheme.primary, fontSize: 18, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Top Header
          Positioned(
            top: 0, left: 0, right: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  color: context.bgMain.withOpacity(0.7),
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
                      Text('Details', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
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

  Widget _buildStatBox(BuildContext context, IconData icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: context.bgCard,
          border: Border.all(color: context.border),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            SizedBox(height: 8),
            Text(value, style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 2),
            Text(label, style: TextStyle(color: context.textMuted, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: context.textMuted, fontSize: 14)),
        Text(value, style: TextStyle(color: context.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
