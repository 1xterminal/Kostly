import 'package:freezed_annotation/freezed_annotation.dart';

part 'room.freezed.dart';
part 'room.g.dart';

@freezed
abstract class Room with _$Room {
  const factory Room({
    required String id,
    @JsonKey(name: 'owner_id') required String ownerId,
    required String number,
    required double price,
    required String status,
    @JsonKey(name: 'wifi_password') String? wifiPassword,
  }) = _Room;

  factory Room.fromJson(Map<String, dynamic> json) => _$RoomFromJson(json);
}
