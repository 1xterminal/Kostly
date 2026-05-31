import 'package:flutter/material.dart';
import 'package:mobile/themeUtil.dart';

class KostlyTheme {
  // 1. Your Fixed Brand Colors
  static const Color accentColor = Color(0xFF9A13D9);
  static const Color backgroundColor = Color(0xFFEBEBEB);

  static ThemeData get lightTheme {
    // Generate base tokens from your fixed seed color
    final ColorScheme customColorScheme = ColorScheme.fromSeed(
      seedColor: accentColor,
      brightness: Brightness.light,
      primary: accentColor,       // Enforces your exact hex color
      secondary: accentColor,
      surface: backgroundColor,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: customColorScheme,
      scaffoldBackgroundColor: customColorScheme.surface,

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: customColorScheme.primary,
        foregroundColor: Colors.white,
        shape: StadiumBorder()
      ),

      // 2. Global Button Styles
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundBuilder: (BuildContext context, Set<WidgetState> states, Widget? child) {
            return Ink(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: states.contains(WidgetState.disabled)
                    ? [Colors.grey.shade400, Colors.grey.shade300]
                    : [customColorScheme.primary, lightenColor(customColorScheme.primary, 0.2)]
                ),
                border: Border.all(
                  color: Colors.black.withValues(alpha: states.contains(WidgetState.disabled) ? 0.1: 0.25), 
                  width: 1.0
                ),
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: child,
            );
          },
          foregroundColor: Colors.white,
          // side: const BorderSide(
          //   color: Color.fromRGBO(0, 0, 0, 0.25), 
          //   width: 8.0,
          // ),
          // border
          // backgroundColor: customColorScheme.primary,
          elevation: 1,
          minimumSize: Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom()
      ),

      // 3. Global Input / TextField Styles
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: customColorScheme.surfaceContainerHighest, // Native M3 container shade
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: TextStyle(color: customColorScheme.onSurfaceVariant),
        hintStyle: TextStyle(color: customColorScheme.onSurfaceVariant.withOpacity(0.6)),
        
        // Border styles depending on state
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: customColorScheme.outlineVariant, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: customColorScheme.primary, width: 2), // Highlights your fixed accent
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: customColorScheme.error, width: 1),
        ),
      ),
    );
  }
}