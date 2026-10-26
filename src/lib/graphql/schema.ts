import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context";
import * as trips from "@/features/trips/server/trip-service";

function authenticated(ctx: GraphQLContext) {
  if (!ctx.userId) throw new GraphQLError("Entre na sua conta para continuar.", { extensions: { code: "UNAUTHENTICATED" } });
  return ctx;
}

export const schema = createSchema<GraphQLContext>({
  typeDefs: `
    enum TripStatus { upcoming ongoing completed }
    enum ActivityStatus { proposed confirmed }
    type Trip {
      id: ID!, name: String!, destination: String!, startDate: String!, endDate: String!,
      participantCount: Int!, status: TripStatus!, isOwner: Boolean!,
      members: [Member!]!, activities: [Activity!]!
    }
    type Member { userId: ID!, displayName: String!, isOwner: Boolean! }
    type Activity {
      id: ID!, title: String!, day: String!, startTime: String, location: String!,
      estimatedCost: Float!, status: ActivityStatus!, createdBy: ID!, votes: Int!, votedByMe: Boolean!
    }
    type TripPage { items: [Trip!]!, total: Int!, hasTrips: Boolean! }
    type Invite { token: String!, expiresAt: String! }
    input TripFilters { query: String, status: String, offset: Int, limit: Int }
    input TripInput { name: String!, destination: String!, startDate: String!, endDate: String! }
    input ActivityInput { title: String!, day: String!, startTime: String, location: String!, estimatedCost: Float! }
    type Query {
      viewerId: ID!
      trips(filters: TripFilters): TripPage!
      trip(id: ID!): Trip!
    }
    type Mutation {
      createTrip(input: TripInput!): Trip!
      updateTrip(id: ID!, input: TripInput!): Trip!
      deleteTrip(id: ID!): Boolean!
      addActivity(tripId: ID!, input: ActivityInput!): Trip!
      setActivityStatus(id: ID!, confirmed: Boolean!): Trip!
      deleteActivity(id: ID!): Trip!
      voteActivity(id: ID!, voted: Boolean!): Trip!
      createInvite(tripId: ID!): Invite!
      acceptInvite(token: String!): Trip!
      removeMember(tripId: ID!, userId: ID!): Boolean!
    }
  `,
  resolvers: {
    Query: {
      viewerId: (_, __, ctx) => authenticated(ctx).userId,
      trips: (_, { filters }, ctx) => trips.listTrips(authenticated(ctx), filters),
      trip: (_, { id }, ctx) => trips.tripDetail(authenticated(ctx), id),
    },
    Trip: {
      members: (parent, _, ctx) => parent.members ?? trips.tripDetail(authenticated(ctx), parent.id).then((t) => t.members),
      activities: (parent, _, ctx) => parent.activities ?? trips.tripDetail(authenticated(ctx), parent.id).then((t) => t.activities),
    },
    Mutation: {
      createTrip: (_, { input }, ctx) => trips.saveTrip(authenticated(ctx), input),
      updateTrip: (_, { id, input }, ctx) => trips.saveTrip(authenticated(ctx), input, id),
      deleteTrip: (_, { id }, ctx) => trips.deleteTrip(authenticated(ctx), id),
      addActivity: (_, { tripId, input }, ctx) => trips.addActivity(authenticated(ctx), tripId, input),
      setActivityStatus: (_, { id, confirmed }, ctx) => trips.setActivityStatus(authenticated(ctx), id, confirmed),
      deleteActivity: (_, { id }, ctx) => trips.deleteActivity(authenticated(ctx), id),
      voteActivity: (_, { id, voted }, ctx) => trips.voteActivity(authenticated(ctx), id, voted),
      createInvite: (_, { tripId }, ctx) => trips.createInvite(authenticated(ctx), tripId),
      acceptInvite: (_, { token }, ctx) => trips.acceptInvite(authenticated(ctx), token),
      removeMember: (_, { tripId, userId }, ctx) => trips.removeMember(authenticated(ctx), tripId, userId),
    },
  },
});

