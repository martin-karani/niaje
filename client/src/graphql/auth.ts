import { gql } from "@apollo/client";

// Login mutation
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        name
        email
        emailVerified
        image
      }
      organizations {
        id
        name
        slug
        logo
      }
      activeOrganization {
        id
        name
        slug
        logo
      }
      activeTeam {
        id
        name
      }
    }
  }
`;

// Logout mutation
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// Register mutation
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        name
        email
        image
        emailVerified
      }
      token
    }
  }
`;

// Password reset request
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: ForgotPasswordInput!) {
    requestPasswordReset(input: $input) {
      success
      message
    }
  }
`;

// Reset password
export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

// Get user's organizations
export const GET_MY_ORGANIZATIONS = gql`
  query MyOrganizations {
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

// Switch active organization
export const SWITCH_ORGANIZATION = gql`
  mutation SwitchOrganization($input: SwitchOrganizationInput!) {
    switchOrganization(input: $input) {
      success
      message
      organization {
        id
        name
        slug
        logo
      }
    }
  }
`;

// Get current user
export const GET_CURRENT_USER = gql`
  query Me {
    me {
      user {
        id
        name
        email
        role
        image
      }
      organizations {
        id
        name
        slug
        logo
      }
      activeOrganization {
        id
        name
        slug
        logo
      }
      activeTeam {
        id
        name
      }
    }
  }
`;
