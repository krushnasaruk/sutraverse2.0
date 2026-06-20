class Student {
  final String id;
  final String name;
  final String email;
  final String rollNo;
  final String? photoURL;
  final String classId;

  Student({
    required this.id,
    required this.name,
    required this.email,
    required this.rollNo,
    this.photoURL,
    required this.classId,
  });

  factory Student.fromMap(String id, Map<String, dynamic> map) {
    return Student(
      id: id,
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      rollNo: map['rollNo'] ?? '',
      photoURL: map['photoURL'],
      classId: map['classId'] ?? '',
    );
  }
}
