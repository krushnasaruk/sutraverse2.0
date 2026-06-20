class Classroom {
  final String id;
  final String classId; // e.g. "1st Year-Computer-A"
  final String subject;
  final String teacherEmail;
  final int studentsCount;

  Classroom({
    required this.id,
    required this.classId,
    required this.subject,
    required this.teacherEmail,
    this.studentsCount = 0,
  });

  factory Classroom.fromMap(String id, Map<String, dynamic> map) {
    return Classroom(
      id: id,
      classId: map['classId'] ?? '',
      subject: map['subject'] ?? '',
      teacherEmail: map['teacherEmail'] ?? '',
      studentsCount: map['studentsCount'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'classId': classId,
      'subject': subject,
      'teacherEmail': teacherEmail,
      'studentsCount': studentsCount,
    };
  }
}
