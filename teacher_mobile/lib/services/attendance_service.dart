import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart';

class AttendanceService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Starts a live attendance session by broadcasting the teacher's location.
  /// Students within 15m will be able to check-in.
  Future<void> startLiveSession(String classId, String subject, String teacherEmail) async {
    try {
      // 1. Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // 2. Write to Firestore 'liveSessions' collection
      await _db.collection('liveSessions').doc(classId).set({
        'active': true,
        'classId': classId,
        'subject': subject,
        'teacherEmail': teacherEmail,
        'teacherLat': position.latitude,
        'teacherLng': position.longitude,
        'date': DateTime.now().toIso8601String().split('T')[0],
        'startTime': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Stops the active live session.
  Future<void> stopLiveSession(String classId) async {
    await _db.collection('liveSessions').doc(classId).update({
      'active': false,
    });
  }

  /// Listens for real-time check-ins for the active session.
  Stream<QuerySnapshot> getLiveCheckins(String classId, String date) {
    return _db
        .collection('liveCheckins')
        .where('classId', 'isEqualTo', classId)
        .where('date', 'isEqualTo', date)
        .snapshots();
  }
}
