import 'dart:io';

void main() async {
  final dir = Directory('lib/features');
  if (!dir.existsSync()) return;

  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));

  for (final file in files) {
    String content = await file.readAsString();
    bool changed = false;

    final targets = [
      'const Text(',
      'const TextStyle(',
      'const Icon(',
      'const BoxDecoration(',
      'const Border(',
      'const BorderSide(',
      'const Padding(',
      'const Divider(',
      'const Center(',
      'const Align(',
      'const Row(',
      'const Column(',
      'const SizedBox(',
      'const Expanded(',
      'const Container(',
    ];

    for (final target in targets) {
      if (content.contains(target)) {
        content = content.replaceAll(target, target.replaceFirst('const ', ''));
        changed = true;
      }
    }

    if (changed) {
      await file.writeAsString(content);
      print('Removed const from ${file.path}');
    }
  }
}
