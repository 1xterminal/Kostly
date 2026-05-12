import 'package:freezed_annotation/freezed_annotation.dart';

part 'extend_request.freezed.dart';
part 'extend_request.g.dart';

@freezed
abstract class ExtendRequest with _$ExtendRequest {
  const factory ExtendRequest({
    required String id,
    @JsonKey(name: 'contract_id') required String contractId,
    @JsonKey(name: 'tenant_id') required String tenantId,
    @JsonKey(name: 'requested_end_date') required DateTime requestedEndDate,
    String? note,
    required String status,
    @JsonKey(name: 'reviewed_by') String? reviewedBy,
    @JsonKey(name: 'reviewed_at') DateTime? reviewedAt,
    @JsonKey(name: 'created_at') DateTime? createdAt,
  }) = _ExtendRequest;

  factory ExtendRequest.fromJson(Map<String, dynamic> json) => _$ExtendRequestFromJson(json);
}
