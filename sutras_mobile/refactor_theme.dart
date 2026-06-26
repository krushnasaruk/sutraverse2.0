import 'dart:io';

void main() async {
  final dir = Directory('lib/features');
  if (!dir.existsSync()) return;

  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = await file.readAsString();
    bool changed = false;

    if (content.contains('AppTheme.bgMainDark')) {
      content = content.replaceAll('AppTheme.bgMainDark', 'context.bgMain');
      changed = true;
    }
    if (content.contains('AppTheme.bgCardDark')) {
      content = content.replaceAll('AppTheme.bgCardDark', 'context.bgCard');
      changed = true;
    }
    if (content.contains('AppTheme.borderDark')) {
      content = content.replaceAll('AppTheme.borderDark', 'context.border');
      changed = true;
    }
    if (content.contains('AppTheme.bgInputDark')) {
      content = content.replaceAll('AppTheme.bgInputDark', 'context.bgInput'); // Need to add to extension
      changed = true;
    }

    if (changed) {
      await file.writeAsString(content);
      print('Updated ${file.path}');
    }
  }
}
