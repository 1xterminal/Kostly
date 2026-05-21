// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'room.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Room _$RoomFromJson(Map<String, dynamic> json) => _Room(
  id: json['id'] as String,
  ownerId: json['owner_id'] as String?,
  number: json['number'] as String,
  price: (json['price'] as num).toDouble(),
  status: json['status'] as String,
  wifiPassword: json['wifi_password'] as String?,
);

Map<String, dynamic> _$RoomToJson(_Room instance) => <String, dynamic>{
  'id': instance.id,
  'owner_id': instance.ownerId,
  'number': instance.number,
  'price': instance.price,
  'status': instance.status,
  'wifi_password': instance.wifiPassword,
};
