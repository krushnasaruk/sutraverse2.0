import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<Map<String, dynamic>> _downloads = [
    {'id': '1', 'title': 'Data Structures Unit 1 Notes', 'subject': 'Computer Science', 'type': 'Notes', 'size': '2.4 MB'},
    {'id': '2', 'title': 'OS Endsem PYQ 2024', 'subject': 'Computer Science', 'type': 'PYQ', 'size': '1.1 MB'},
    {'id': '3', 'title': 'Physics Lab Assignment', 'subject': 'Physics', 'type': 'Assignment', 'size': '4.8 MB'},
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() => _scrollY = _scrollController.offset);
    });
  }

  Color _getTypeColor(String type) {
    if (type == 'Notes') return const Color(0xFF0066cc);
    if (type == 'PYQ') return const Color(0xFFff9500);
    return const Color(0xFF34c759);
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
          // Background
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
                if (_downloads.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                    child: Column(
                      children: [
                        Container(
                          width: 80, height: 80,
                          decoration: BoxDecoration(color: context.bgCard, shape: BoxShape.circle, border: Border.all(color: context.border)),
                          child: Icon(Icons.cloud_off, color: context.textMuted, size: 36),
                        ),
                        SizedBox(height: 20),
                        Text('No Downloads Yet', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                        SizedBox(height: 8),
                        Text('Save files for offline reading and they will appear here.', textAlign: TextAlign.center, style: TextStyle(color: context.textMuted)),
                      ],
                    ),
                  )
                else
                  ..._downloads.map((file) {
                    final tc = _getTypeColor(file['type']);
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(18)),
                      child: Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(color: tc.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
                            child: Icon(Icons.description, color: tc, size: 24),
                          ),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(file['title'], style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: tc.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                                      child: Text(file['type'], style: TextStyle(color: tc, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                    SizedBox(width: 8),
                                    Text('${file['subject']} · ${file['size']}', style: theme.textTheme.bodySmall?.copyWith(color: context.textMuted)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          SizedBox(width: 10),
                          GestureDetector(
                            onTap: () {},
                            child: Icon(Icons.delete_outline, color: Colors.redAccent, size: 24),
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
                      Text('Downloads', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                      Text('${_downloads.length} items', style: TextStyle(color: context.textMuted, fontWeight: FontWeight.w600)),
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
