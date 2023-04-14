extension ItrUtils<T> on Iterable<T> {
  T? get firstOrNull {
    for (T t in this) return t;
    return null;
  }

  T? firstWhereOrNull(bool test(T t)) {
    for (T t in this) {
      if (test(t)) return t;
    }
    return null;
  }

  int firstIndexWhere(bool test(T t)) {
    int i = 0;
    for (T t in this) {
      if (test(t)) return i;
      ++i;
    }
    return -1;
  }
}

extension NullItrUtils<T> on Iterable<T?> {
  Iterable<T> get filterNull sync* {
    for (T? t in this) {
      if (t != null) yield t;
    }
  }
}
