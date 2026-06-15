import '../../../core/supabase_client.dart';

class MaintenanceRoom {
  final String id;
  final String number;

  const MaintenanceRoom({required this.id, required this.number});

  factory MaintenanceRoom.fromJson(Map<String, dynamic> json) {
    return MaintenanceRoom(
      id: json['id'] as String,
      number: json['number'] as String,
    );
  }
}

class TicketSender {
  final String id;
  final String name;
  final String role;

  const TicketSender({
    required this.id,
    required this.name,
    required this.role,
  });

  factory TicketSender.fromJson(Map<String, dynamic> json) {
    final role = json['role'] as String? ?? 'user';
    return TicketSender(
      id: json['id'] as String,
      name: json['name'] as String? ?? (role == 'owner' ? 'Owner' : 'Tenant'),
      role: role,
    );
  }
}

class TicketReply {
  final String id;
  final String senderId;
  final String message;
  final DateTime createdAt;
  final TicketSender? sender;

  const TicketReply({
    required this.id,
    required this.senderId,
    required this.message,
    required this.createdAt,
    this.sender,
  });

  factory TicketReply.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] as Map<String, dynamic>?;
    return TicketReply(
      id: json['id'] as String,
      senderId: json['sender_id'] as String,
      message: json['message'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      sender: sender == null ? null : TicketSender.fromJson(sender),
    );
  }
}

class MaintenanceTicket {
  final String id;
  final String description;
  final String ticketCategory;
  final String? paymentId;
  final String ticketStatus;
  final DateTime dateCreated;
  final DateTime createdAt;
  final String? resolvedMessage;
  final DateTime? resolvedAt;
  final MaintenanceRoom? room;
  final List<TicketReply> replies;

  const MaintenanceTicket({
    required this.id,
    required this.description,
    required this.ticketCategory,
    this.paymentId,
    required this.ticketStatus,
    required this.dateCreated,
    required this.createdAt,
    this.resolvedMessage,
    this.resolvedAt,
    this.room,
    this.replies = const [],
  });

  factory MaintenanceTicket.fromJson(Map<String, dynamic> json) {
    final room = json['room'] as Map<String, dynamic>?;
    final replies = ((json['replies'] as List<dynamic>?) ?? [])
        .map((reply) => TicketReply.fromJson(reply as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

    return MaintenanceTicket(
      id: json['id'] as String,
      description: json['description'] as String,
      ticketCategory: json['ticket_category'] as String? ?? 'maintenance',
      paymentId: json['payment_id'] as String?,
      ticketStatus: json['ticket_status'] as String,
      dateCreated: DateTime.parse(json['date_created'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      resolvedMessage: json['resolved_message'] as String?,
      resolvedAt: json['resolved_at'] == null ? null : DateTime.parse(json['resolved_at'] as String),
      room: room == null ? null : MaintenanceRoom.fromJson(room),
      replies: replies,
    );
  }
}

class MaintenanceRepository {
  const MaintenanceRepository();

  Future<List<MaintenanceTicket>> fetchTickets() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final data = await supabase
        .from('maintenance_tickets')
        .select('''
          id, description, ticket_category, payment_id, ticket_status, date_created, created_at, resolved_message, resolved_at,
          room:rooms(id, number)
        ''')
        .eq('reported_by_user_id', userId)
        .order('created_at', ascending: false);

    return (data as List<dynamic>)
        .map((ticket) => MaintenanceTicket.fromJson(ticket as Map<String, dynamic>))
        .toList();
  }

  Future<MaintenanceTicket?> fetchTicketById(String id) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final data = await supabase
        .from('maintenance_tickets')
        .select('''
          id, description, ticket_category, payment_id, ticket_status, date_created, created_at, resolved_message, resolved_at,
          room:rooms(id, number),
          replies:ticket_replies(
            id, sender_id, message, created_at,
            sender:users!ticket_replies_sender_id_fkey(id, name, role)
          )
        ''')
        .eq('id', id)
        .eq('reported_by_user_id', userId)
        .maybeSingle();

    if (data == null) return null;
    return MaintenanceTicket.fromJson(data);
  }

  Future<MaintenanceRoom?> fetchActiveRoom() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final data = await supabase
        .from('contracts')
        .select('room:rooms(id, number)')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    final room = data?['room'] as Map<String, dynamic>?;
    return room == null ? null : MaintenanceRoom.fromJson(room);
  }

  Future<void> createTicket({
    required String roomId,
    required String description,
  }) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    await supabase.from('maintenance_tickets').insert({
      'reported_by_user_id': userId,
      'room_id': roomId,
      'description': description,
      'ticket_category': 'maintenance',
      'ticket_status': 'reported',
    });
  }

  Future<MaintenanceTicket?> findPaymentDispute(String paymentId) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final data = await supabase
        .from('maintenance_tickets')
        .select('''
          id, description, ticket_category, payment_id, ticket_status, date_created, created_at, resolved_message, resolved_at,
          room:rooms(id, number)
        ''')
        .eq('reported_by_user_id', userId)
        .eq('ticket_category', 'payment_dispute')
        .eq('payment_id', paymentId)
        .maybeSingle();

    return data == null ? null : MaintenanceTicket.fromJson(data);
  }

  Future<String> createPaymentDispute({
    required String paymentId,
    required String message,
  }) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    final existing = await findPaymentDispute(paymentId);
    if (existing != null) return existing.id;

    final payment = await supabase
        .from('payments')
        .select('''
          id, invoice_id, rejection_reason,
          invoices(
            id,
            contracts(room_id)
          )
        ''')
        .eq('id', paymentId)
        .eq('tenant_id', userId)
        .eq('status', 'rejected')
        .maybeSingle();

    if (payment == null) {
      throw Exception('Rejected payment not found.');
    }

    final invoice = payment['invoices'] as Map<String, dynamic>?;
    final contract = invoice?['contracts'] as Map<String, dynamic>?;
    final roomId = contract?['room_id'] as String?;
    if (roomId == null) throw Exception('Active room not found for payment.');

    try {
      final inserted = await supabase
          .from('maintenance_tickets')
          .insert({
            'reported_by_user_id': userId,
            'room_id': roomId,
            'description': message.trim(),
            'ticket_category': 'payment_dispute',
            'payment_id': paymentId,
            'ticket_status': 'reported',
          })
          .select('id')
          .single();

      return inserted['id'] as String;
    } catch (_) {
      final duplicate = await findPaymentDispute(paymentId);
      if (duplicate != null) return duplicate.id;
      rethrow;
    }
  }

  Future<void> addReply({
    required String ticketId,
    required String message,
  }) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not logged in');

    await supabase.from('ticket_replies').insert({
      'ticket_id': ticketId,
      'sender_id': userId,
      'message': message,
    });
  }
}
