import '../../../core/supabase_client.dart';

// Models

class ActiveContract {
  final String id;
  final String roomNumber;
  final String? wifiPassword;
  final DateTime startDate;
  final DateTime endDate;
  final double monthlyRate;

  const ActiveContract({
    required this.id,
    required this.roomNumber,
    this.wifiPassword,
    required this.startDate,
    required this.endDate,
    required this.monthlyRate,
  });

  /// months remaining from today (rounded up, min 0).
  int get monthsRemaining {
    final now = DateTime.now();
    if (endDate.isBefore(now)) return 0;
    final diff = endDate.difference(now);
    return (diff.inDays / 30).ceil();
  }

  factory ActiveContract.fromJson(Map<String, dynamic> json) {
    // Supabase PostgREST can return the join as a Map or a List
    final rawRoom = json['room'];
    final Map<String, dynamic> room;
    if (rawRoom is Map<String, dynamic>) {
      room = rawRoom;
    } else if (rawRoom is List && rawRoom.isNotEmpty) {
      room = rawRoom.first as Map<String, dynamic>;
    } else {
      throw Exception('Contract is missing room data');
    }
    return ActiveContract(
      id: json['id'] as String,
      roomNumber: room['number'] as String,
      wifiPassword: room['wifi_password'] as String?,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      monthlyRate: (json['monthly_rate'] as num).toDouble(),
    );
  }
}


class PendingInvoice {
  final String id;
  final double totalAmount;
  final DateTime dueDate;
  final String status;

  const PendingInvoice({
    required this.id,
    required this.totalAmount,
    required this.dueDate,
    required this.status,
  });

  factory PendingInvoice.fromJson(Map<String, dynamic> json) {
    return PendingInvoice(
      id: json['id'] as String,
      totalAmount: (json['total_amount'] as num).toDouble(),
      dueDate: DateTime.parse(json['due_date'] as String),
      status: json['status'] as String,
    );
  }
}

class ActiveTicket {
  final String id;
  final String description;
  final String ticketStatus;
  final DateTime createdAt;

  const ActiveTicket({
    required this.id,
    required this.description,
    required this.ticketStatus,
    required this.createdAt,
  });

  factory ActiveTicket.fromJson(Map<String, dynamic> json) {
    return ActiveTicket(
      id: json['id'] as String,
      description: json['description'] as String,
      ticketStatus: json['ticket_status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

// Repository 

class HomeRepository {
  const HomeRepository();

  /// Returns the tenant's active contract (with room info), or null if none.
  Future<ActiveContract?> fetchActiveContract() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return null;

    final data = await supabase
        .from('contracts')
        .select('id, start_date, end_date, monthly_rate, room:rooms(number, wifi_password)')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    if (data == null) return null;
    return ActiveContract.fromJson(data);
  }

  /// Returns the tenant's earliest unpaid/pending invoice, or null if none.
  Future<PendingInvoice?> fetchPendingInvoice() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return null;

    final data = await supabase
        .from('invoices')
        .select('id, total_amount, due_date, status')
        .eq('tenant_id', userId)
        .inFilter('status', ['unpaid', 'pending'])
        .order('due_date')
        .limit(1)
        .maybeSingle();

    if (data == null) return null;
    return PendingInvoice.fromJson(data);
  }

  /// Returns the tenant's most recent non-closed maintenance ticket, or null if none.
  Future<ActiveTicket?> fetchActiveTicket() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return null;

    final data = await supabase
        .from('maintenance_tickets')
        .select('id, description, ticket_status, created_at')
        .eq('reported_by_user_id', userId)
        .not('ticket_status', 'in', '("resolved","closed")')
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    if (data == null) return null;
    return ActiveTicket.fromJson(data);
  }
}
