class Grade {
  final String studentEmail;
  final String studentName;
  final String subject;
  final String examType; // In-Sem, End-Sem, TW, PR, OR, Assignment
  final double marksObtained;
  final double maxMarks;
  final DateTime timestamp;

  Grade({
    required this.studentEmail,
    required this.studentName,
    required this.subject,
    required this.examType,
    required this.marksObtained,
    required this.maxMarks,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'studentEmail': studentEmail,
      'studentName': studentName,
      'subject': subject,
      'examType': examType,
      'marksObtained': marksObtained,
      'maxMarks': maxMarks,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory Grade.fromMap(Map<String, dynamic> map) {
    return Grade(
      studentEmail: map['studentEmail'] ?? '',
      studentName: map['studentName'] ?? '',
      subject: map['subject'] ?? '',
      examType: map['examType'] ?? '',
      marksObtained: (map['marksObtained'] ?? 0).toDouble(),
      maxMarks: (map['maxMarks'] ?? 100).toDouble(),
      timestamp: DateTime.parse(map['timestamp'] ?? DateTime.now().toIso8601String()),
    );
  }
}
