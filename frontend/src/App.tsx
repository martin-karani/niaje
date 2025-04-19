import { ApolloProvider } from "@apollo/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { BrowserRouter } from "react-router";

import AppRoutes from "./routes/app-routes";
import { apolloClient } from "./services/api";

import theme from "./styles/theme";

export default function App() {
  return (
    <BrowserRouter>
      <ApolloProvider client={apolloClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" />
          <AppRoutes />
        </MantineProvider>
      </ApolloProvider>
    </BrowserRouter>
  );
}
