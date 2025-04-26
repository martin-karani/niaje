import { gql } from "@apollo/client";

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($data: CreateOrganizationInput!) {
    createOrganization(data: $data) {
      organization {
        id
        name
        slug
        logo
      }
    }
  }
`;

export const GET_ORGANIZATIONS = gql`
  query GetOrganizations {
    myOrganizations {
      id
      name
      slug
      logo
      subscriptionStatus
      subscriptionPlan
    }
  }
`;
