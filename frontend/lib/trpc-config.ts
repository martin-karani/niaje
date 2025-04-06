import { httpBatchLink, loggerLink } from "@trpc/client";
// import superjson from "superjson";

export function getBaseUrl() {
  return `http://localhost:3001`;
}

export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

export function getConfig() {
  return {
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
      }),
      httpBatchLink({
        url: getUrl(),
        // Include credentials to send cookies with the request
        // This is crucial for auth to work properly
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
    // transformer: superjson,
  };
}
