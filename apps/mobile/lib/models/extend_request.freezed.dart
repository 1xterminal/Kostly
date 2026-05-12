// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'extend_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ExtendRequest {

 String get id;@JsonKey(name: 'contract_id') String get contractId;@JsonKey(name: 'tenant_id') String get tenantId;@JsonKey(name: 'requested_end_date') DateTime get requestedEndDate; String? get note; String get status;@JsonKey(name: 'reviewed_by') String? get reviewedBy;@JsonKey(name: 'reviewed_at') DateTime? get reviewedAt;@JsonKey(name: 'created_at') DateTime? get createdAt;
/// Create a copy of ExtendRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExtendRequestCopyWith<ExtendRequest> get copyWith => _$ExtendRequestCopyWithImpl<ExtendRequest>(this as ExtendRequest, _$identity);

  /// Serializes this ExtendRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExtendRequest&&(identical(other.id, id) || other.id == id)&&(identical(other.contractId, contractId) || other.contractId == contractId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.requestedEndDate, requestedEndDate) || other.requestedEndDate == requestedEndDate)&&(identical(other.note, note) || other.note == note)&&(identical(other.status, status) || other.status == status)&&(identical(other.reviewedBy, reviewedBy) || other.reviewedBy == reviewedBy)&&(identical(other.reviewedAt, reviewedAt) || other.reviewedAt == reviewedAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contractId,tenantId,requestedEndDate,note,status,reviewedBy,reviewedAt,createdAt);

@override
String toString() {
  return 'ExtendRequest(id: $id, contractId: $contractId, tenantId: $tenantId, requestedEndDate: $requestedEndDate, note: $note, status: $status, reviewedBy: $reviewedBy, reviewedAt: $reviewedAt, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $ExtendRequestCopyWith<$Res>  {
  factory $ExtendRequestCopyWith(ExtendRequest value, $Res Function(ExtendRequest) _then) = _$ExtendRequestCopyWithImpl;
@useResult
$Res call({
 String id,@JsonKey(name: 'contract_id') String contractId,@JsonKey(name: 'tenant_id') String tenantId,@JsonKey(name: 'requested_end_date') DateTime requestedEndDate, String? note, String status,@JsonKey(name: 'reviewed_by') String? reviewedBy,@JsonKey(name: 'reviewed_at') DateTime? reviewedAt,@JsonKey(name: 'created_at') DateTime? createdAt
});




}
/// @nodoc
class _$ExtendRequestCopyWithImpl<$Res>
    implements $ExtendRequestCopyWith<$Res> {
  _$ExtendRequestCopyWithImpl(this._self, this._then);

  final ExtendRequest _self;
  final $Res Function(ExtendRequest) _then;

/// Create a copy of ExtendRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? contractId = null,Object? tenantId = null,Object? requestedEndDate = null,Object? note = freezed,Object? status = null,Object? reviewedBy = freezed,Object? reviewedAt = freezed,Object? createdAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contractId: null == contractId ? _self.contractId : contractId // ignore: cast_nullable_to_non_nullable
as String,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as String,requestedEndDate: null == requestedEndDate ? _self.requestedEndDate : requestedEndDate // ignore: cast_nullable_to_non_nullable
as DateTime,note: freezed == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,reviewedBy: freezed == reviewedBy ? _self.reviewedBy : reviewedBy // ignore: cast_nullable_to_non_nullable
as String?,reviewedAt: freezed == reviewedAt ? _self.reviewedAt : reviewedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [ExtendRequest].
extension ExtendRequestPatterns on ExtendRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExtendRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExtendRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExtendRequest value)  $default,){
final _that = this;
switch (_that) {
case _ExtendRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExtendRequest value)?  $default,){
final _that = this;
switch (_that) {
case _ExtendRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'contract_id')  String contractId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'requested_end_date')  DateTime requestedEndDate,  String? note,  String status, @JsonKey(name: 'reviewed_by')  String? reviewedBy, @JsonKey(name: 'reviewed_at')  DateTime? reviewedAt, @JsonKey(name: 'created_at')  DateTime? createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExtendRequest() when $default != null:
return $default(_that.id,_that.contractId,_that.tenantId,_that.requestedEndDate,_that.note,_that.status,_that.reviewedBy,_that.reviewedAt,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id, @JsonKey(name: 'contract_id')  String contractId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'requested_end_date')  DateTime requestedEndDate,  String? note,  String status, @JsonKey(name: 'reviewed_by')  String? reviewedBy, @JsonKey(name: 'reviewed_at')  DateTime? reviewedAt, @JsonKey(name: 'created_at')  DateTime? createdAt)  $default,) {final _that = this;
switch (_that) {
case _ExtendRequest():
return $default(_that.id,_that.contractId,_that.tenantId,_that.requestedEndDate,_that.note,_that.status,_that.reviewedBy,_that.reviewedAt,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id, @JsonKey(name: 'contract_id')  String contractId, @JsonKey(name: 'tenant_id')  String tenantId, @JsonKey(name: 'requested_end_date')  DateTime requestedEndDate,  String? note,  String status, @JsonKey(name: 'reviewed_by')  String? reviewedBy, @JsonKey(name: 'reviewed_at')  DateTime? reviewedAt, @JsonKey(name: 'created_at')  DateTime? createdAt)?  $default,) {final _that = this;
switch (_that) {
case _ExtendRequest() when $default != null:
return $default(_that.id,_that.contractId,_that.tenantId,_that.requestedEndDate,_that.note,_that.status,_that.reviewedBy,_that.reviewedAt,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ExtendRequest implements ExtendRequest {
  const _ExtendRequest({required this.id, @JsonKey(name: 'contract_id') required this.contractId, @JsonKey(name: 'tenant_id') required this.tenantId, @JsonKey(name: 'requested_end_date') required this.requestedEndDate, this.note, required this.status, @JsonKey(name: 'reviewed_by') this.reviewedBy, @JsonKey(name: 'reviewed_at') this.reviewedAt, @JsonKey(name: 'created_at') this.createdAt});
  factory _ExtendRequest.fromJson(Map<String, dynamic> json) => _$ExtendRequestFromJson(json);

@override final  String id;
@override@JsonKey(name: 'contract_id') final  String contractId;
@override@JsonKey(name: 'tenant_id') final  String tenantId;
@override@JsonKey(name: 'requested_end_date') final  DateTime requestedEndDate;
@override final  String? note;
@override final  String status;
@override@JsonKey(name: 'reviewed_by') final  String? reviewedBy;
@override@JsonKey(name: 'reviewed_at') final  DateTime? reviewedAt;
@override@JsonKey(name: 'created_at') final  DateTime? createdAt;

/// Create a copy of ExtendRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExtendRequestCopyWith<_ExtendRequest> get copyWith => __$ExtendRequestCopyWithImpl<_ExtendRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExtendRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExtendRequest&&(identical(other.id, id) || other.id == id)&&(identical(other.contractId, contractId) || other.contractId == contractId)&&(identical(other.tenantId, tenantId) || other.tenantId == tenantId)&&(identical(other.requestedEndDate, requestedEndDate) || other.requestedEndDate == requestedEndDate)&&(identical(other.note, note) || other.note == note)&&(identical(other.status, status) || other.status == status)&&(identical(other.reviewedBy, reviewedBy) || other.reviewedBy == reviewedBy)&&(identical(other.reviewedAt, reviewedAt) || other.reviewedAt == reviewedAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contractId,tenantId,requestedEndDate,note,status,reviewedBy,reviewedAt,createdAt);

@override
String toString() {
  return 'ExtendRequest(id: $id, contractId: $contractId, tenantId: $tenantId, requestedEndDate: $requestedEndDate, note: $note, status: $status, reviewedBy: $reviewedBy, reviewedAt: $reviewedAt, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$ExtendRequestCopyWith<$Res> implements $ExtendRequestCopyWith<$Res> {
  factory _$ExtendRequestCopyWith(_ExtendRequest value, $Res Function(_ExtendRequest) _then) = __$ExtendRequestCopyWithImpl;
@override @useResult
$Res call({
 String id,@JsonKey(name: 'contract_id') String contractId,@JsonKey(name: 'tenant_id') String tenantId,@JsonKey(name: 'requested_end_date') DateTime requestedEndDate, String? note, String status,@JsonKey(name: 'reviewed_by') String? reviewedBy,@JsonKey(name: 'reviewed_at') DateTime? reviewedAt,@JsonKey(name: 'created_at') DateTime? createdAt
});




}
/// @nodoc
class __$ExtendRequestCopyWithImpl<$Res>
    implements _$ExtendRequestCopyWith<$Res> {
  __$ExtendRequestCopyWithImpl(this._self, this._then);

  final _ExtendRequest _self;
  final $Res Function(_ExtendRequest) _then;

/// Create a copy of ExtendRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? contractId = null,Object? tenantId = null,Object? requestedEndDate = null,Object? note = freezed,Object? status = null,Object? reviewedBy = freezed,Object? reviewedAt = freezed,Object? createdAt = freezed,}) {
  return _then(_ExtendRequest(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contractId: null == contractId ? _self.contractId : contractId // ignore: cast_nullable_to_non_nullable
as String,tenantId: null == tenantId ? _self.tenantId : tenantId // ignore: cast_nullable_to_non_nullable
as String,requestedEndDate: null == requestedEndDate ? _self.requestedEndDate : requestedEndDate // ignore: cast_nullable_to_non_nullable
as DateTime,note: freezed == note ? _self.note : note // ignore: cast_nullable_to_non_nullable
as String?,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,reviewedBy: freezed == reviewedBy ? _self.reviewedBy : reviewedBy // ignore: cast_nullable_to_non_nullable
as String?,reviewedAt: freezed == reviewedAt ? _self.reviewedAt : reviewedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

// dart format on
