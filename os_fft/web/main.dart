import 'dart:html';

import 'package:fftea/fftea.dart';

void onDragOver(MouseEvent e) {
  e.preventDefault();
}

void onDrop(MouseEvent e) {
  e.preventDefault();
  final dt = e.dataTransfer;
  final files = [];
  for (final item in dt.items) {
    if (item.kind == "file") {
      files.add(item);
    }
  }
}

void onFile(Event e) {
  setInputFiles(querySelector('input')?.files);
}

void main() {
  final body = querySelector('body');
  body?.onDragOver.listen(onDragOver);
  body?.onDrop.listen(onDrop);
  querySelector('input')?.onChange.listen(onFile);
}
