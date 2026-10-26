type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type TripRow = {
  id: string; owner_id: string; name: string; destination: string;
  start_date: string; end_date: string; created_at: string;
};
export type MemberRow = {
  trip_id: string; user_id: string; display_name: string; created_at: string;
};
export type ActivityRow = {
  id: string; trip_id: string; created_by: string; title: string; day: string;
  start_time: string | null; location: string; estimated_cost: number;
  status: "proposed" | "confirmed"; created_at: string;
};
type InviteRow = { trip_id: string; token: string; expires_at: string };
type VoteRow = { activity_id: string; user_id: string };

export type Database = {
  public: {
    Tables: {
      trips: Table<TripRow, Omit<TripRow, "id" | "created_at"> & { id?: string; created_at?: string }>;
      trip_members: Table<MemberRow, Omit<MemberRow, "created_at"> & { created_at?: string }>;
      activities: Table<ActivityRow, Omit<ActivityRow, "id" | "created_at"> & { id?: string; created_at?: string }>;
      activity_votes: Table<VoteRow, VoteRow>;
      trip_invites: Table<InviteRow, InviteRow>;
    };
    Views: Record<string, never>;
    Functions: {
      accept_trip_invite: { Args: { invite_token: string }; Returns: string };
      is_trip_member: { Args: { target_trip: string }; Returns: boolean };
      is_trip_owner: { Args: { target_trip: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

