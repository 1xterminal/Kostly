// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extend_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ExtendRequest _$ExtendRequestFromJson(Map<String, dynamic> json) =>
    _ExtendRequest(
      id: json['id'] as String,
      contractId: json['contract_id'] as String,
      tenantId: json['tenant_id'] as String,
      requestedEndDate: DateTime.parse(json['requested_end_date'] as String),
      note: json['note'] as String?,
      status: json['status'] as String,
      reviewedBy: json['reviewed_by'] as String?,
      reviewedAt: json['reviewed_at'] == null
          ? null
          : DateTime.parse(json['reviewed_at'] as String),
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
    );

Map<String, dynamic> _$ExtendRequestToJson(_ExtendRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'contract_id': instance.contractId,
      'tenant_id': instance.tenantId,
      'requested_end_date': instance.requestedEndDate.toIso8601String(),
      'note': instance.note,
      'status': instance.status,
      'reviewed_by': instance.reviewedBy,
      'reviewed_at': instance.reviewedAt?.toIso8601String(),
      'created_at': instance.createdAt?.toIso8601String(),
    };
