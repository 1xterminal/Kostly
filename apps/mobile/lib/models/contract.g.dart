// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'contract.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Contract _$ContractFromJson(Map<String, dynamic> json) => _Contract(
  id: json['id'] as String,
  roomId: json['room_id'] as String,
  tenantId: json['tenant_id'] as String,
  startDate: DateTime.parse(json['start_date'] as String),
  endDate: DateTime.parse(json['end_date'] as String),
  monthlyRate: (json['monthly_rate'] as num).toDouble(),
  status: json['status'] as String,
  room: json['room'] == null
      ? null
      : Room.fromJson(json['room'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ContractToJson(_Contract instance) => <String, dynamic>{
  'id': instance.id,
  'room_id': instance.roomId,
  'tenant_id': instance.tenantId,
  'start_date': instance.startDate.toIso8601String(),
  'end_date': instance.endDate.toIso8601String(),
  'monthly_rate': instance.monthlyRate,
  'status': instance.status,
  'room': instance.room,
};
