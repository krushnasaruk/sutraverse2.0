import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primary = Color(0xFF6366f1);
  static const Color primaryLight = Color(0xFF818cf8);
  static const Color primaryDark = Color(0xFF4f46e5);

  static const Color streakGold = Color(0xFFfbbf24);
  static const Color successGreen = Color(0xFF10b981);
  static const Color deadlineOrange = Color(0xFFf97316);
  static const Color alertRed = Color(0xFFef4444);
  static const Color premiumPurple = Color(0xFFa855f7);

  // Dark Colors
  static const Color bgMainDark = Color(0xFF0a0a0f);
  static const Color bgCardDark = Color(0xFF13131a);
  static const Color bgCardElevatedDark = Color(0xFF1a1a24);
  static const Color bgInputDark = Color(0xFF1e1e2a);
  static const Color borderDark = Color(0xFF27273a);

  // Light Colors
  static const Color bgMainLight = Color(0xFFF2F2F7);
  static const Color bgCardLight = Colors.white;
  static const Color bgCardElevatedLight = Colors.white;
  static const Color bgInputLight = Color(0xFFF2F2F7);
  static const Color borderLight = Color(0xFFE5E5EA);

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgMainLight,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryLight,
        surface: bgCardLight,
        error: alertRed,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme,
      ).copyWith(
        displayLarge: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.black87),
        titleLarge: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.black87),
        headlineMedium: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black87),
        headlineSmall: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.black87),
        bodyLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black54),
        bodyMedium: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
        labelSmall: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black38),
      ),
      cardTheme: CardThemeData(
        color: bgCardLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: bgInputLight,
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primary),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bgCardLight,
        indicatorColor: primary.withOpacity(0.15),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const IconThemeData(color: primary);
          return const IconThemeData(color: Colors.black54);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 12);
          return const TextStyle(color: Colors.black54, fontSize: 12);
        }),
      ),
      dividerTheme: const DividerThemeData(color: borderLight, thickness: 1),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgMainDark,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: primaryLight,
        surface: bgCardDark,
        error: alertRed,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ).copyWith(
        displayLarge: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
        titleLarge: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
        headlineMedium: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
        headlineSmall: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
        bodyLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white70),
        bodyMedium: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white60),
        labelSmall: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white54),
      ),
      cardTheme: CardThemeData(
        color: bgCardDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: bgInputDark,
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primary),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bgCardDark,
        indicatorColor: primary.withOpacity(0.15),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const IconThemeData(color: primary);
          return const IconThemeData(color: Colors.white54);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const TextStyle(color: primary, fontWeight: FontWeight.bold, fontSize: 12);
          return const TextStyle(color: Colors.white54, fontSize: 12);
        }),
      ),
      dividerTheme: const DividerThemeData(color: borderDark, thickness: 1),
    );
  }
}

extension ThemeColors on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get bgMain => isDark ? AppTheme.bgMainDark : AppTheme.bgMainLight;
  Color get bgCard => isDark ? AppTheme.bgCardDark : AppTheme.bgCardLight;
  Color get bgInput => isDark ? AppTheme.bgInputDark : AppTheme.bgInputLight;
  Color get border => isDark ? AppTheme.borderDark : AppTheme.borderLight;
  Color get textPrimary => isDark ? Colors.white : Colors.black87;
  Color get textSecondary => isDark ? Colors.white70 : Colors.black54;
  Color get textMuted => isDark ? Colors.white54 : Colors.black38;
}
