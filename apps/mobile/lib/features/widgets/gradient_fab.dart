import 'package:flutter/material.dart';
import 'package:mobile/themeUtil.dart';

class GradientFAB extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget icon;
  final Text? label; // Supports both regular and extended FAB styles

  const GradientFAB({
    super.key,
    required this.onPressed,
    required this.icon,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    var disabled = onPressed == null;

    return Container(
      height: 48,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: disabled
          ? [Colors.grey.shade400, Colors.grey.shade300]
          : [colorScheme.primary, lightenColor(colorScheme.primary, 0.2)],
        ),
        borderRadius: BorderRadius.circular(999.0), // M3 default FAB curve radius
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: disabled ? 0.0: 0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: Colors.black.withValues(alpha: disabled ? 0.1: 0.25), 
          width: 1.0
        ),
      ),
      child: Material(
        color: Colors.transparent,
        textStyle: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(999.0),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 20
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconTheme(
                  data: IconThemeData(color: Colors.white),
                  child: icon,
                ),
                if (label != null) ...[
                  const SizedBox(width: 8),
                  label!
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}