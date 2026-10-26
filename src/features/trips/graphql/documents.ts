import { gql, type TypedDocumentNode } from "@apollo/client";
import type { TripSummary, TripFilters } from "../model/trip";
import type { TripDetail } from "../model/trip-detail";
import type { CreateTripInput } from "../model/create-trip";
import type { ActivityInput } from "../model/activity";

const summary = gql`
  fragment TripSummaryFields on Trip {
    id
    name
    destination
    startDate
    endDate
    participantCount
    status
    isOwner
  }
`;
const detail = gql`
  fragment TripDetailFields on Trip {
    ...TripSummaryFields
    members {
      userId
      displayName
      isOwner
    }
    activities {
      id
      title
      day
      startTime
      location
      estimatedCost
      status
      createdBy
      votes
      votedByMe
    }
  }
  ${summary}
`;

export const TRIPS: TypedDocumentNode<
  { trips: { items: TripSummary[]; total: number; hasTrips: boolean } },
  { filters: TripFilters & { offset: number; limit: number } }
> = gql`
  query Trips($filters: TripFilters) {
    trips(filters: $filters) {
      items {
        ...TripSummaryFields
      }
      total
      hasTrips
    }
  }
  ${summary}
`;
export const TRIP: TypedDocumentNode<{ trip: TripDetail; viewerId: string }, { id: string }> = gql`
  query Trip($id: ID!) {
    trip(id: $id) {
      ...TripDetailFields
    }
    viewerId
  }
  ${detail}
`;
export const CREATE_TRIP: TypedDocumentNode<
  { createTrip: TripDetail },
  { input: CreateTripInput }
> = gql`
  mutation CreateTrip($input: TripInput!) {
    createTrip(input: $input) {
      ...TripDetailFields
    }
  }
  ${detail}
`;
export const UPDATE_TRIP: TypedDocumentNode<
  { updateTrip: TripDetail },
  { id: string; input: CreateTripInput }
> = gql`
  mutation UpdateTrip($id: ID!, $input: TripInput!) {
    updateTrip(id: $id, input: $input) {
      ...TripDetailFields
    }
  }
  ${detail}
`;
export const DELETE_TRIP: TypedDocumentNode<{ deleteTrip: boolean }, { id: string }> = gql`
  mutation DeleteTrip($id: ID!) {
    deleteTrip(id: $id)
  }
`;
export const ADD_ACTIVITY: TypedDocumentNode<
  { addActivity: TripDetail },
  { tripId: string; input: ActivityInput }
> = gql`
  mutation AddActivity($tripId: ID!, $input: ActivityInput!) {
    addActivity(tripId: $tripId, input: $input) {
      ...TripDetailFields
    }
  }
  ${detail}
`;
export const SET_ACTIVITY_STATUS: TypedDocumentNode<
  { setActivityStatus: TripDetail },
  { id: string; confirmed: boolean }
> = gql`
  mutation SetActivityStatus($id: ID!, $confirmed: Boolean!) {
    setActivityStatus(id: $id, confirmed: $confirmed) {
      ...TripDetailFields
    }
  }
  ${detail}
`;
export const DELETE_ACTIVITY: TypedDocumentNode<{ deleteActivity: TripDetail }, { id: string }> =
  gql`
    mutation DeleteActivity($id: ID!) {
      deleteActivity(id: $id) {
        ...TripDetailFields
      }
    }
    ${detail}
  `;
export const VOTE_ACTIVITY: TypedDocumentNode<
  { voteActivity: TripDetail },
  { id: string; voted: boolean }
> = gql`
  mutation VoteActivity($id: ID!, $voted: Boolean!) {
    voteActivity(id: $id, voted: $voted) {
      ...TripDetailFields
    }
  }
  ${detail}
`;
export const CREATE_INVITE: TypedDocumentNode<
  { createInvite: { token: string; expiresAt: string } },
  { tripId: string }
> = gql`
  mutation CreateInvite($tripId: ID!) {
    createInvite(tripId: $tripId) {
      token
      expiresAt
    }
  }
`;
export const ACCEPT_INVITE: TypedDocumentNode<{ acceptInvite: TripDetail }, { token: string }> =
  gql`
    mutation AcceptInvite($token: String!) {
      acceptInvite(token: $token) {
        ...TripDetailFields
      }
    }
    ${detail}
  `;
export const REMOVE_MEMBER: TypedDocumentNode<
  { removeMember: boolean },
  { tripId: string; userId: string }
> = gql`
  mutation RemoveMember($tripId: ID!, $userId: ID!) {
    removeMember(tripId: $tripId, userId: $userId)
  }
`;
