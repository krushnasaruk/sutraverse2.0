import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  String _searchQuery = '';
  bool _searchFocused = false;
  
  String? _activeSection;
  String? _activeSubject;

  // Mock data
  final List<Map<String, dynamic>> _sections = [
    {'key': 'notes', 'label': 'Notes', 'desc': 'Lecture notes & summaries', 'icon': Icons.description, 'filter': 'Notes', 'color': const Color(0xFF0066cc), 'bgLight': const Color(0x1A0066cc)},
    {'key': 'pyq', 'label': 'PYQ Vault', 'desc': 'Past year questions', 'icon': Icons.help_outline, 'filter': 'PYQ', 'color': const Color(0xFFff9500), 'bgLight': const Color(0x1Aff9500)},
    {'key': 'assignment', 'label': 'Assignments', 'desc': 'Solutions & lab manuals', 'icon': Icons.assignment, 'filter': 'Assignment', 'color': const Color(0xFF34c759), 'bgLight': const Color(0x1A34c759)},
  ];

  final List<Map<String, dynamic>> _allFiles = [
    {'id': '1', 'title': 'Data Structures Unit 1 Notes', 'subject': 'Computer Science', 'type': 'Notes', 'uploader': 'Alice', 'rating': 4.8, 'downloads': 120},
    {'id': '2', 'title': 'OS Endsem PYQ 2024', 'subject': 'Computer Science', 'type': 'PYQ', 'uploader': 'Admin', 'rating': 4.5, 'downloads': 300},
    {'id': '3', 'title': 'Physics Lab Assignment', 'subject': 'Physics', 'type': 'Assignment', 'uploader': 'Bob', 'rating': 4.2, 'downloads': 45},
    {'id': '4', 'title': 'Calculus III Summary', 'subject': 'Mathematics', 'type': 'Notes', 'uploader': 'Charlie', 'rating': 4.9, 'downloads': 210},
    {'id': '5', 'title': 'Mechanics Question Bank', 'subject': 'Physics', 'type': 'PYQ', 'uploader': 'Admin', 'rating': 4.7, 'downloads': 400},
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      setState(() {
        _scrollY = _scrollController.offset;
      });
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _goBack() {
    if (_activeSubject != null) {
      setState(() {
        _activeSubject = null;
        _searchQuery = '';
      });
    } else if (_activeSection != null) {
      setState(() {
        _activeSection = null;
      });
    }
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

    // Filter Logic
    Map<String, dynamic>? secMeta;
    if (_activeSection != null) {
      secMeta = _sections.firstWhere((s) => s['key'] == _activeSection);
    }

    final sectionFiles = _activeSection == null 
        ? _allFiles 
        : _allFiles.where((f) => f['type'] == secMeta!['filter']).toList();

    // Subject Aggregation
    final Map<String, Map<String, dynamic>> subjectMap = {};
    for (var f in sectionFiles) {
      final s = f['subject'] as String;
      if (!subjectMap.containsKey(s)) {
        subjectMap[s] = {'count': 0, 'downloads': 0};
      }
      subjectMap[s]!['count']++;
      subjectMap[s]!['downloads'] += (f['downloads'] as int);
    }
    final subjectsList = subjectMap.entries.map((e) => {'name': e.key, ...e.value}).toList();
    subjectsList.sort((a, b) => (b['count'] as int).compareTo(a['count'] as int));

    // Drill Down Files
    List<Map<String, dynamic>> drillFiles = [];
    if (_activeSubject != null) {
      drillFiles = sectionFiles.where((f) => f['subject'] == _activeSubject).toList();
      if (_searchQuery.isNotEmpty) {
        drillFiles = drillFiles.where((f) => (f['title'] as String).toLowerCase().contains(_searchQuery.toLowerCase())).toList();
      }
    }

    // Page Title
    String pageTitle = 'Library';
    if (_activeSubject != null) pageTitle = _activeSubject!;
    else if (_activeSection != null) pageTitle = secMeta!['label'];

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          // Hero Background
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
              padding: const EdgeInsets.only(top: 108, bottom: 100),
              children: [
                // LEVEL 1: Landing
                if (_activeSection == null && _activeSubject == null) ...[
                  // Apple Pill Search
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: _searchFocused ? context.bgMain : context.bgCard,
                        border: Border.all(color: _searchFocused ? AppTheme.primary : context.border),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.search, color: context.textMuted, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'Search all files...',
                                hintStyle: TextStyle(color: context.textMuted),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: EdgeInsets.zero,
                                isDense: true,
                              ),
                              style: theme.textTheme.bodyLarge?.copyWith(color: context.textPrimary),
                              onChanged: (val) => setState(() => _searchQuery = val),
                              onTap: () => setState(() => _searchFocused = true),
                              onTapOutside: (_) => setState(() {
                                _searchFocused = false;
                                FocusScope.of(context).unfocus();
                              }),
                            ),
                          ),
                          if (_searchQuery.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                setState(() => _searchQuery = '');
                              },
                              child: Icon(Icons.cancel, color: context.textMuted, size: 20),
                            ),
                        ],
                      ),
                    ),
                  ),

                  if (_searchQuery.trim().isNotEmpty) ...[
                    // Search Results
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        '${_allFiles.where((f) => (f['title'] as String).toLowerCase().contains(_searchQuery.toLowerCase())).length} results',
                        style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted),
                      ),
                    ),
                    SizedBox(height: 12),
                    ..._allFiles.where((f) => (f['title'] as String).toLowerCase().contains(_searchQuery.toLowerCase())).map((file) {
                      final tc = _getTypeColor(file['type']);
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: context.bgCard,
                          border: Border.all(color: context.border),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(color: tc.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                              child: Icon(Icons.description, color: tc, size: 20),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(file['title'], style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  SizedBox(height: 2),
                                  Text('${file['subject']} · ${file['uploader']}', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                                ],
                              ),
                            ),
                            Icon(Icons.chevron_right, color: context.textMuted, size: 20),
                          ],
                        ),
                      );
                    }).toList(),
                  ] else ...[
                    // Sections
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: _sections.map((sec) {
                          final count = _allFiles.where((f) => f['type'] == sec['filter']).length;
                          return GestureDetector(
                            onTap: () => setState(() => _activeSection = sec['key']),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: context.bgCard,
                                border: Border.all(color: context.border),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(color: sec['bgLight'], borderRadius: BorderRadius.circular(12)),
                                    child: Icon(sec['icon'], color: sec['color'], size: 24),
                                  ),
                                  SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(sec['label'], style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary)),
                                        SizedBox(height: 2),
                                        Text(sec['desc'], style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(color: sec['bgLight'], borderRadius: BorderRadius.circular(10)),
                                    child: Text(count.toString(), style: TextStyle(color: sec['color'], fontWeight: FontWeight.bold)),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.chevron_right, color: context.textMuted, size: 20),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    
                    // Stats
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                      child: Row(
                        children: [
                          _buildStatCard('${_allFiles.length}', 'Files', theme),
                          SizedBox(width: 8),
                          _buildStatCard('${subjectMap.length}', 'Subjects', theme),
                          SizedBox(width: 8),
                          _buildStatCard('${_allFiles.fold<int>(0, (p, c) => p + (c['downloads'] as int))}', 'Downloads', theme),
                        ],
                      ),
                    ),
                  ],
                ],

                // LEVEL 2: Subject Grid
                if (_activeSection != null && _activeSubject == null) ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(18)),
                    child: Row(
                      children: [
                        Container(
                          width: 48, height: 48,
                          decoration: BoxDecoration(color: context.bgMain, borderRadius: BorderRadius.circular(12)),
                          child: Icon(secMeta!['icon'], color: AppTheme.primary, size: 24),
                        ),
                        SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(secMeta['label'], style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary)),
                            SizedBox(height: 4),
                            Text('${sectionFiles.length} files · ${subjectsList.length} subjects', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                          ],
                        )
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: subjectsList.map((subj) {
                        return GestureDetector(
                          onTap: () => setState(() => _activeSubject = subj['name']),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(18)),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(subj['name'], style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary)),
                                      SizedBox(height: 3),
                                      Text('${subj['count']} files · ${subj['downloads']} downloads', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                                    ],
                                  ),
                                ),
                                Icon(Icons.chevron_right, color: context.textMuted, size: 20),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],

                // LEVEL 3: File List
                if (_activeSubject != null) ...[
                  // Breadcrumb
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() { _activeSection = null; _activeSubject = null; }),
                          child: Text('Library', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w500)),
                        ),
                        Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Icon(Icons.chevron_right, color: context.textMuted, size: 14)),
                        GestureDetector(
                          onTap: () => setState(() => _activeSubject = null),
                          child: Text(secMeta!['label'], style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w500)),
                        ),
                        Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Icon(Icons.chevron_right, color: context.textMuted, size: 14)),
                        Expanded(child: Text(_activeSubject!, style: TextStyle(color: context.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  ),

                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: _searchFocused ? context.bgMain : context.bgCard,
                        border: Border.all(color: _searchFocused ? AppTheme.primary : context.border),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.search, color: context.textMuted, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'Search files in $_activeSubject...',
                                hintStyle: TextStyle(color: context.textMuted),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: EdgeInsets.zero,
                                isDense: true,
                              ),
                              style: theme.textTheme.bodyLarge?.copyWith(color: context.textPrimary),
                              onChanged: (val) => setState(() => _searchQuery = val),
                              onTap: () => setState(() => _searchFocused = true),
                              onTapOutside: (_) => setState(() { _searchFocused = false; FocusScope.of(context).unfocus(); }),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    child: Text('${drillFiles.length} files', style: TextStyle(color: context.textMuted)),
                  ),

                  ...drillFiles.map((file) {
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), borderRadius: BorderRadius.circular(16)),
                      child: Row(
                        children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(color: context.bgMain, borderRadius: BorderRadius.circular(12)),
                            child: Icon(Icons.description, color: context.textMuted, size: 20),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(file['title'], style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600, color: context.textPrimary), maxLines: 1),
                                SizedBox(height: 2),
                                Text('${file['uploader']} · 2024', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('★ ${file['rating']}', style: TextStyle(color: AppTheme.primaryLight, fontSize: 12)),
                              Text('↓ ${file['downloads']}', style: TextStyle(color: context.textMuted, fontSize: 12)),
                            ],
                          )
                        ],
                      ),
                    );
                  }).toList(),
                ],
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
                    children: [
                      if (_activeSection != null || _activeSubject != null)
                        GestureDetector(
                          onTap: _goBack,
                          child: Container(
                            width: 34, height: 34,
                            decoration: BoxDecoration(color: context.bgCard, border: Border.all(color: context.border), shape: BoxShape.circle),
                            child: Icon(Icons.chevron_left, color: AppTheme.primary, size: 20),
                          ),
                        )
                      else
                        SizedBox(width: 34),
                      Expanded(
                        child: Text(
                          pageTitle,
                          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(width: 34),
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

  Widget _buildStatCard(String val, String lbl, ThemeData theme) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: context.bgCard,
          border: Border.all(color: context.border),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: [
            Text(val, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
            SizedBox(height: 4),
            Text(lbl, style: TextStyle(color: context.textMuted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
