import 'package:flutter/material.dart';

Color lightenColor(Color color, [double amount = 0.2]) {
  return Color.alphaBlend(
    Color.fromRGBO(255, 255, 255, amount),
    color,
  );
}