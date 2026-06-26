import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  double _scrollY = 0;

  bool _loading = false;
  final List<Map<String, String>> _messages = [];

  final List<Map<String, dynamic>> _suggestions = [
    {'icon': Icons.description, 'text': 'Summarize Notes', 'query': 'Summarize my recent lecture notes on databases'},
    {'icon': Icons.science, 'text': 'Explain Physics', 'query': 'Explain the double-slit experiment in simple terms'},
    {'icon': Icons.calendar_today, 'text': 'Plan Study', 'query': 'Create a 5-day study roadmap for calculus'},
    {'icon': Icons.help_outline, 'text': 'Quiz Me', 'query': 'Create a 5-question multiple choice quiz on data structures'},
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

  void _handleSend([String? query]) {
    final text = query ?? _textController.text;
    if (text.trim().isEmpty || _loading) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text.trim()});
      _textController.clear();
      _loading = true;
    });

    _scrollToBottom();

    // Mock API Response
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      setState(() {
        _messages.add({
          'role': 'model',
          'content': 'That is a great question! Based on your syllabus, here is a quick overview:\n\n'
              '1. **Key Concept**: Always remember to define your variables.\n'
              '2. **Formula**: E = mc^2\n\n'
              'Let me know if you want a detailed flashcard generated for this!'
        });
        _loading = false;
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 100,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final headerBgOpacity = (_scrollY / 50).clamp(0.0, 1.0);
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

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

          // Chat Area
          Positioned.fill(
            child: ListView(
              controller: _scrollController,
              padding: const EdgeInsets.only(top: 108, bottom: 120, left: 20, right: 20),
              children: [
                if (_messages.isEmpty) ...[
                  // Welcome Card
                  Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: context.bgCard,
                      border: Border.all(color: context.border),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 48, height: 48,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(14)),
                          child: Icon(Icons.auto_awesome, color: context.textPrimary, size: 24),
                        ),
                        Text('Hi Krushna!', style: theme.textTheme.headlineMedium?.copyWith(color: context.textPrimary)),
                        SizedBox(height: 8),
                        Text(
                          'I\'m your AI study partner. Ask me anything about your syllabus, concepts, or exam prep.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyLarge?.copyWith(color: context.textMuted),
                        ),
                      ],
                    ),
                  ),

                  // Suggestions
                  Text('TRY ASKING', style: theme.textTheme.labelSmall?.copyWith(color: context.textMuted)),
                  SizedBox(height: 10),
                  ..._suggestions.map((sug) => GestureDetector(
                    onTap: () => _handleSend(sug['query']),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: context.bgCard,
                        border: Border.all(color: context.border),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          Icon(sug['icon'], color: AppTheme.primary, size: 18),
                          SizedBox(width: 10),
                          Expanded(child: Text(sug['text'], style: theme.textTheme.bodyLarge?.copyWith(color: context.textPrimary))),
                        ],
                      ),
                    ),
                  )).toList(),
                ] else ...[
                  // Messages
                  ..._messages.map((msg) {
                    final isUser = msg['role'] == 'user';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (!isUser) ...[
                            Container(
                              width: 24, height: 24,
                              margin: const EdgeInsets.only(right: 8, bottom: 4),
                              decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                              child: Icon(Icons.auto_awesome, color: context.textPrimary, size: 12),
                            ),
                          ],
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isUser ? AppTheme.primary : context.bgCard,
                                border: isUser ? null : Border.all(color: context.border),
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(18),
                                  topRight: const Radius.circular(18),
                                  bottomLeft: Radius.circular(isUser ? 18 : 6),
                                  bottomRight: Radius.circular(isUser ? 6 : 18),
                                ),
                              ),
                              child: Text(
                                msg['content']!,
                                style: theme.textTheme.bodyLarge?.copyWith(color: context.textPrimary, height: 1.4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  
                  if (_loading)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          width: 24, height: 24,
                          margin: const EdgeInsets.only(right: 8, bottom: 4),
                          decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                          child: Icon(Icons.auto_awesome, color: context.textPrimary, size: 12),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: context.bgCard,
                            border: Border.all(color: context.border),
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(18), topRight: Radius.circular(18),
                              bottomLeft: Radius.circular(6), bottomRight: Radius.circular(18),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 12, height: 12,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                              ),
                              SizedBox(width: 8),
                              Text('Thinking...', style: theme.textTheme.bodyMedium?.copyWith(color: context.textMuted)),
                            ],
                          ),
                        ),
                      ],
                    ),
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
                      Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                        child: Icon(Icons.auto_awesome, color: context.textPrimary, size: 14),
                      ),
                      SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Sutras AI', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: context.textPrimary)),
                          Text('Personal Study Copilot', style: theme.textTheme.bodySmall?.copyWith(color: context.textMuted)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Input Bar
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: EdgeInsets.only(left: 16, right: 16, top: 12, bottom: bottomPadding > 0 ? bottomPadding + 12 : 24),
              decoration: BoxDecoration(
                color: context.bgMain, // or AppTheme.canvas
                border: Border(top: BorderSide(color: context.border)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44, maxHeight: 120),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      decoration: BoxDecoration(
                        color: context.bgCard,
                        border: Border.all(color: context.border),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _textController,
                        maxLines: null,
                        style: theme.textTheme.bodyLarge?.copyWith(color: context.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Ask anything about your studies...',
                          hintStyle: TextStyle(color: context.textMuted),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        onChanged: (val) => setState(() {}),
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _handleSend(),
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: _textController.text.trim().isNotEmpty && !_loading ? AppTheme.primary : context.bgCard,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.arrow_upward, color: _textController.text.trim().isNotEmpty && !_loading ? Colors.white : context.textMuted, size: 20),
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
}
