import { notFound, RegisteredRouter, RouteIds } from "@tanstack/react-router";

export function propertyNotFound(propertyId?: string) {
  throw notFound({
    routeId: "/_authenticated/properties/",
    data: { propertyId },
  });
}

export function resourceNotFound({
  routeId,
  resourceType,
  resourceId,
}: {
  routeId: RouteIds<RegisteredRouter["routeTree"]>;
  resourceType: string;
  resourceId?: string;
}) {
  throw notFound({
    routeId,
    data: { resourceType, resourceId },
  });
}
