import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<User?> get user => _auth.authStateChanges();

  Future<UserCredential> signIn(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
          email: email, password: password);

      // Verify if they are a teacher
      DocumentSnapshot userDoc = await _db.collection('users').doc(result.user!.uid).get();
      if (!userDoc.exists || userDoc.get('role') != 'teacher') {
        await _auth.signOut();
        throw Exception('Access Denied: Only teacher accounts can use this app.');
      }

      return result;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() => _auth.signOut();
}
