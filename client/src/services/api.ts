import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { notifications } from "@mantine/notifications";
import { getToken } from "./auth";

// GraphQL API endpoint
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api/graphql";

// Create an HTTP link to the GraphQL API
const httpLink = createHttpLink({
  uri: API_URL,
  credentials: "include", // Important for cookie-based authentication
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Show error notification
      notifications.show({
        title: "GraphQL Error",
        message: message,
        color: "red",
      });
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    notifications.show({
      title: "Network Error",
      message:
        "Unable to connect to the server. Please check your internet connection.",
      color: "red",
    });
  }
});

// Authentication link
const authLink = setContext(async (_, { headers }) => {
  // Get auth token
  const token = await getToken();

  // Return headers
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// Re-export common Apollo hooks with proper typing
export * from "@apollo/client";
