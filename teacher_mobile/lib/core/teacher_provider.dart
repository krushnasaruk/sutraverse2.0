import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/classroom.dart';

class TeacherProvider with ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  List<Classroom> _classrooms = [];
  Classroom? _selectedClassroom;
  bool _isLoading = false;

  List<Classroom> get classrooms => _classrooms;
  Classroom? get selectedClassroom => _selectedClassroom;
  bool get isLoading => _isLoading;

  void selectClassroom(Classroom classroom) {
    _selectedClassroom = classroom;
    notifyListeners();
  }

  Future<void> fetchClassrooms() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      // Teachers are mapped to classes via assignments in the 'users' collection
      // or directly if they are the admin of a club/class.
      // Based on web logic, we check user's 'assignments' array or a query.
      final userDoc = await _db.collection('users').doc(user.uid).get();
      final List<dynamic> assignments = userDoc.data()?['assignments'] ?? [];

      _classrooms = assignments.map((a) {
        return Classroom(
          id: a['classId'] ?? '', // Using classId as ID for simplicity
          classId: a['classId'] ?? '',
          subject: a['subject'] ?? '',
          teacherEmail: user.email ?? '',
        );
      }).toList();

      if (_classrooms.isNotEmpty && _selectedClassroom == null) {
        _selectedClassroom = _classrooms.first;
      }
    } catch (e) {
      debugPrint('Error fetching classrooms: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
