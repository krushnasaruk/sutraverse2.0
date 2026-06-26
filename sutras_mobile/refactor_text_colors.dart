import 'dart:io';

void main() async {
  final dir = Directory('lib/features');
  if (!dir.existsSync()) return;

  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = await file.readAsString();
    bool changed = false;

    if (content.contains('Colors.white54')) {
      content = content.replaceAll('Colors.white54', 'context.textMuted');
      changed = true;
    }
    if (content.contains('Colors.white60')) {
      content = content.replaceAll('Colors.white60', 'context.textMuted');
      changed = true;
    }
    if (content.contains('Colors.white70')) {
      content = content.replaceAll('Colors.white70', 'context.textSecondary');
      changed = true;
    }
    if (content.contains('Colors.white38')) {
      content = content.replaceAll('Colors.white38', 'context.textMuted');
      changed = true;
    }
    // Only replace Colors.white if it's explicitly styling text or general text
    // We'll replace `color: Colors.white` with `color: context.textPrimary` but it's risky.
    // Instead of doing it everywhere, let's just do it for TextStyle:
    if (content.contains('color: Colors.white,')) {
      content = content.replaceAll('color: Colors.white,', 'color: context.textPrimary,');
      changed = true;
    }
    if (content.contains('color: Colors.white)')) {
      content = content.replaceAll('color: Colors.white)', 'color: context.textPrimary)');
      changed = true;
    }

    if (changed) {
      await file.writeAsString(content);
      print('Updated text colors ${file.path}');
    }
  }
}
