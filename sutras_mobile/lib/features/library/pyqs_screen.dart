import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class PyqsScreen extends StatefulWidget {
  const PyqsScreen({super.key});

  @override
  State<PyqsScreen> createState() => _PyqsScreenState();
}

class _PyqsScreenState extends State<PyqsScreen> {
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  final List<String> _years = ['All', '2024', '2023', '2022', '2021'];
  final List<String> _exams = ['All', 'Midsem', 'Endsem', 'Unit Test'];
  
  String _selectedYear = 'All';
  String _selectedExam = 'All';

  final List<Map<String, dynamic>> _allPyqs = [
    {'title': 'OS Endsem 2024', 'subject': 'Operating Systems', 'year': '2024', 'exam': 'Endsem', 'rating': 4.8},
    {'title': 'DBMS Midsem 2023', 'subject': 'Database Systems', 'year': '2023', 'exam': 'Midsem', 'rating': 4.5},
    {'title': 'Networks Endsem 2022', 'subject': 'Computer Networks', 'year': '2022', 'exam': 'Endsem', 'rating': 4.7},
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

    final filtered = _allPyqs.where((p) {
      if (_selectedYear != 'All' && p['year'] != _selectedYear) return false;
      if (_selectedExam != 'All' && p['exam'] != _selectedExam) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: context.bgMain,
      body: Stack(
        children: [
          Positioned.fill(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(top: 108, bottom: 40),
              children: [
                // Filters
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildDropdown('Year', _years, _selectedYear, (v) => setState(() => _selectedYear = v!)),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _buildDropdown('Exam', _exams, _selectedExam, (v) => setState(() => _selectedExam = v!)),
                      ),
                    ],
                  ),
                ),
                
                SizedBox(height: 20),

                // List
                ...filtered.map((pyq) {
                  return GestureDetector(
                    onTap: () => context.push('/file/1'),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: context.bgCard,
                        border: Border.all(color: context.border),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFff9500).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(Icons.help_outline, color: Color(0xFFff9500), size: 24),
                          ),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(pyq['title'] as String, style: TextStyle(color: context.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                                SizedBox(height: 4),
                                Text('${pyq['subject']} • ${pyq['year']}', style: TextStyle(color: context.textMuted, fontSize: 13)),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right, color: context.textMuted),
                        ],
                      ),
                    ),
                  );
                }).toList(),

                if (filtered.isEmpty)
                  Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: Text('No PYQs found for these filters.', style: TextStyle(color: context.textMuted))),
                  ),
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
                      Text('PYQ Vault', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
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

  Widget _buildDropdown(String label, List<String> items, String value, void Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: context.bgCard,
        border: Border.all(color: context.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          dropdownColor: context.bgCard,
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down, color: context.textMuted),
          style: TextStyle(color: context.textPrimary, fontSize: 14),
          onChanged: onChanged,
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
        ),
      ),
    );
  }
}
