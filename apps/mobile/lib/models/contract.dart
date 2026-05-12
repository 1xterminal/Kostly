import 'package:freezed_annotation/freezed_annotation.dart';
import 'room.dart';

part 'contract.freezed.dart';
part 'contract.g.dart';

@freezed
abstract class Contract with _$Contract {
  const factory Contract({
    required String id,
    @JsonKey(name: 'room_id') required String roomId,
    @JsonKey(name: 'tenant_id') required String tenantId,
    @JsonKey(name: 'start_date') required DateTime startDate,
    @JsonKey(name: 'end_date') required DateTime endDate,
    @JsonKey(name: 'monthly_rate') required double monthlyRate,
    required String status,
    Room? room,
  }) = _Contract;

  factory Contract.fromJson(Map<String, dynamic> json) => _$ContractFromJson(json);
}
