import React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { isMatch, useMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

export interface BreadcrumbCrumb {
  label: string;
  path: string;
  hideOnMobile?: boolean;
}

export const Breadcrumbs = () => {
  const matches = useMatches();
  const isMobile = useIsMobile();

  // If routes are still loading, don't render breadcrumbs
  if (matches.some((match) => match.status === "pending")) return null;

  // Filter matches to only include those with breadcrumb data
  const matchesWithCrumbs = matches.filter((match) =>
    isMatch(match, "loaderData.crumb")
  );

  // If no matches with breadcrumbs, don't render anything
  if (matchesWithCrumbs.length === 0) return null;

  // Flatten all breadcrumb items from all matches
  const allCrumbs: { crumb: BreadcrumbCrumb; matchId: string }[] = [];

  matchesWithCrumbs.forEach((match) => {
    const crumbData = match.loaderData.crumb;

    // Handle both single crumb objects and arrays of crumbs
    if (Array.isArray(crumbData)) {
      // If it's an array, add each item
      crumbData.forEach((crumb) => {
        allCrumbs.push({ crumb, matchId: match.id });
      });
    } else {
      // If it's a single object, add it
      allCrumbs.push({
        crumb: crumbData as BreadcrumbCrumb,
        matchId: match.id,
      });
    }
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {allCrumbs.map((item, index) => {
          const { crumb, matchId } = item;

          // Determine if this is the last item (current page)
          const isLastItem = index === allCrumbs.length - 1;

          // Determine if this item should be hidden on mobile
          const shouldHideOnMobile =
            isMobile &&
            (crumb.hideOnMobile ||
              (!isLastItem && index < allCrumbs.length - 1));

          return (
            <React.Fragment key={`${matchId}-${index}`}>
              {/* Add separator between items */}
              {index > 0 && (
                <BreadcrumbSeparator
                  className={shouldHideOnMobile ? "hidden md:block" : ""}
                />
              )}

              {/* Render the breadcrumb item */}
              <BreadcrumbItem
                className={shouldHideOnMobile ? "hidden md:block" : ""}
              >
                {isLastItem ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    // Use the path from the crumb data for navigation
                    href={crumb.path}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
