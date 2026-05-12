// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'contract.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Contract {

 String get id;@JsonKey(name: 'room_id') String get roomId;@JsonKey(name: 'tenant_id') String get tenantId;@JsonKey(name: 'start_date') DateTime get startDate;@JsonKey(name: 'end_date') DateTime get endDate;@JsonKey(name: 'monthly_rate') double get monthlyRate; String get status; Room? get room;
/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContractCopyWith<Contract> get copyWith => _$ContractCopyWithImpl<Contract>(this as Contract, _$identity);

  /// Serializes this Contract to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Contract&&(identical(other.id, id) || other.id == id)&&(identical(other.roomId, roomId) || other.roomId == roomId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.monthlyRate, monthlyRate) || other.monthlyRate == monthlyRate)&&(identical(other.status, status) || other.status == status)&&(identical(other.room, room) || other.room == room));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,roomId,tenantId,startDate,endDate,monthlyRate,status,room);

@override
String toString() {
  return 'Contract(id: $id, roomId: $roomId, tenantId: $tenantId, startDate: $startDate, endDate: $endDate, monthlyRate: $monthlyRate, status: $status, room: $room)';
}


}

/// @nodoc
abstract mixin class $ContractCopyWith<$Res>  {
  factory $ContractCopyWith(Contract value, $Res Function(Contract) _then) = _$ContractCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'room_id') String roomId,@JsonKey(name: 'tenant_id') String tenantId,@JsonKey(name: 'start_date') DateTime startDate,@JsonKey(name: 'end_date') DateTime endDate,@JsonKey(name: 'monthly_rate') double monthlyRate, String status, Room? room
});


$RoomCopyWith<$Res>? get room;

}
/// @nodoc
class _$ContractCopyWithImpl<$Res>
    implements $ContractCopyWith<$Res> {
  _$ContractCopyWithImpl(this._self, this._then);

  final Contract _self;
  final $Res Function(Contract) _then;

/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? roomId = null,Object? tenantId = null,Object? startDate = null,Object? endDate = null,Object? monthlyRate = null,Object? status = null,Object? room = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,roomId: null == roomId ? _self.roomId : roomId // ignore: cast_nullable_to_non_nullable
as String,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: null == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime,monthlyRate: null == monthlyRate ? _self.monthlyRate : monthlyRate // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,room: freezed == room ? _self.room : room // ignore: cast_nullable_to_non_nullable
as Room?,
  ));
}
/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoomCopyWith<$Res>? get room {
    if (_self.room == null) {
    return null;
  }

  return $RoomCopyWith<$Res>(_self.room!, (value) {
    return _then(_self.copyWith(room: value));
  });
}
}


/// Adds pattern-matching-related methods to [Contract].
extension ContractPatterns on Contract {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Contract value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Contract() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Contract value)  $default,){
final _that = this;
switch (_that) {
case _Contract():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Contract value)?  $default,){
final _that = this;
switch (_that) {
case _Contract() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'room_id')  String roomId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'start_date')  DateTime startDate, @JsonKey(name: 'end_date')  DateTime endDate, @JsonKey(name: 'monthly_rate')  double monthlyRate,  String status,  Room? room)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Contract() when $default != null:
return $default(_that.id,_that.roomId,_that.tenantId,_that.startDate,_that.endDate,_that.monthlyRate,_that.status,_that.room);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'room_id')  String roomId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'start_date')  DateTime startDate, @JsonKey(name: 'end_date')  DateTime endDate, @JsonKey(name: 'monthly_rate')  double monthlyRate,  String status,  Room? room)  $default,) {final _that = this;
switch (_that) {
case _Contract():
return $default(_that.id,_that.roomId,_that.tenantId,_that.startDate,_that.endDate,_that.monthlyRate,_that.status,_that.room);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'room_id')  String roomId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'start_date')  DateTime startDate, @JsonKey(name: 'end_date')  DateTime endDate, @JsonKey(name: 'monthly_rate')  double monthlyRate,  String status,  Room? room)?  $default,) {final _that = this;
switch (_that) {
case _Contract() when $default != null:
return $default(_that.id,_that.roomId,_that.tenantId,_that.startDate,_that.endDate,_that.monthlyRate,_that.status,_that.room);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Contract implements Contract {
  const _Contract({required this.id, @JsonKey(name: 'room_id') required this.roomId, @JsonKey(name: 'tenant_id') required this.tenantId, @JsonKey(name: 'start_date') required this.startDate, @JsonKey(name: 'end_date') required this.endDate, @JsonKey(name: 'monthly_rate') required this.monthlyRate, required this.status, this.room});
  factory _Contract.fromJson(Map<String, dynamic> json) => _$ContractFromJson(json);

@override final  String id;
@override@JsonKey(name: 'room_id') final  String roomId;
@override@JsonKey(name: 'tenant_id') final  String tenantId;
@override@JsonKey(name: 'start_date') final  DateTime startDate;
@override@JsonKey(name: 'end_date') final  DateTime endDate;
@override@JsonKey(name: 'monthly_rate') final  double monthlyRate;
@override final  String status;
@override final  Room? room;

/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContractCopyWith<_Contract> get copyWith => __$ContractCopyWithImpl<_Contract>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContractToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Contract&&(identical(other.id, id) || other.id == id)&&(identical(other.roomId, roomId) || other.roomId == roomId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.monthlyRate, monthlyRate) || other.monthlyRate == monthlyRate)&&(identical(other.status, status) || other.status == status)&&(identical(other.room, room) || other.room == room));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,roomId,tenantId,startDate,endDate,monthlyRate,status,room);

@override
String toString() {
  return 'Contract(id: $id, roomId: $roomId, tenantId: $tenantId, startDate: $startDate, endDate: $endDate, monthlyRate: $monthlyRate, status: $status, room: $room)';
}


}

/// @nodoc
abstract mixin class _$ContractCopyWith<$Res> implements $ContractCopyWith<$Res> {
  factory _$ContractCopyWith(_Contract value, $Res Function(_Contract) _then) = __$ContractCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'room_id') String roomId,@JsonKey(name: 'tenant_id') String tenantId,@JsonKey(name: 'start_date') DateTime startDate,@JsonKey(name: 'end_date') DateTime endDate,@JsonKey(name: 'monthly_rate') double monthlyRate, String status, Room? room
});


@override $RoomCopyWith<$Res>? get room;

}
/// @nodoc
class __$ContractCopyWithImpl<$Res>
    implements _$ContractCopyWith<$Res> {
  __$ContractCopyWithImpl(this._self, this._then);

  final _Contract _self;
  final $Res Function(_Contract) _then;

/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? roomId = null,Object? tenantId = null,Object? startDate = null,Object? endDate = null,Object? monthlyRate = null,Object? status = null,Object? room = freezed,}) {
  return _then(_Contract(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,roomId: null == roomId ? _self.roomId : roomId // ignore: cast_nullable_to_non_nullable
as String,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: null == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime,monthlyRate: null == monthlyRate ? _self.monthlyRate : monthlyRate // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,room: freezed == room ? _self.room : room // ignore: cast_nullable_to_non_nullable
as Room?,
  ));
}

/// Create a copy of Contract
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$RoomCopyWith<$Res>? get room {
    if (_self.room == null) {
    return null;
  }

  return $RoomCopyWith<$Res>(_self.room!, (value) {
    return _then(_self.copyWith(room: value));
  });
}
}

// dart format on
