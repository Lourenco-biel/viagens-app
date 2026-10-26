"use client";

import { useState, type ReactNode } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

export function GraphQLProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new ApolloClient({
        link: new HttpLink({ uri: "/api/graphql", credentials: "same-origin" }),
        cache: new InMemoryCache({
          typePolicies: {
            Trip: { fields: { activities: { merge: false }, members: { merge: false } } },
          },
        }),
        defaultOptions: { watchQuery: { fetchPolicy: "cache-and-network" } },
      }),
  );
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
