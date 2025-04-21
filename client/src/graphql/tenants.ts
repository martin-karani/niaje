import { gql } from "@apollo/client";

// Fragment for consistent tenant fields
export const TENANT_FRAGMENT = gql`
  fragment TenantFields on Tenant {
    id
    organizationId
    firstName
    lastName
    email
    phone
    status
    dateOfBirth
    occupation
    employer
    income
    emergencyContactName
    emergencyContactRelation
    emergencyContactPhone
    emergencyContactEmail
    expectedMoveInDate
    actualMoveInDate
    expectedMoveOutDate
    actualMoveOutDate
    notes
    createdAt
    updatedAt
  }
`;

// Get all tenants
export const GET_TENANTS = gql`
  query GetTenants {
    tenants {
      ...TenantFields
      leases {
        id
        startDate
        endDate
        status
        unit {
          id
          name
          property {
            id
            name
          }
        }
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

// Get tenants by status
export const GET_TENANTS_BY_STATUS = gql`
  query GetTenantsByStatus($status: String!) {
    tenantsByStatus(status: $status) {
      ...TenantFields
    }
  }
  ${TENANT_FRAGMENT}
`;

// Get a single tenant by ID
export const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      ...TenantFields
      leases {
        id
        startDate
        endDate
        status
        rentAmount
        depositAmount
        paymentDay
        unit {
          id
          name
          property {
            id
            name
          }
        }
      }
      documents {
        id
        fileName
        fileType
        url
        createdAt
      }
      payments {
        id
        type
        status
        amount
        transactionDate
        paidDate
        description
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

// Get tenants for a specific lease
export const GET_TENANTS_BY_LEASE = gql`
  query GetTenantsByLease($leaseId: ID!) {
    tenantsByLease(leaseId: $leaseId) {
      ...TenantFields
    }
  }
  ${TENANT_FRAGMENT}
`;

// Create a new tenant
export const CREATE_TENANT = gql`
  mutation CreateTenant($data: CreateTenantInput!) {
    createTenant(data: $data) {
      ...TenantFields
    }
  }
  ${TENANT_FRAGMENT}
`;

// Update an existing tenant
export const UPDATE_TENANT = gql`
  mutation UpdateTenant($data: UpdateTenantInput!) {
    updateTenant(data: $data) {
      ...TenantFields
    }
  }
  ${TENANT_FRAGMENT}
`;

// Delete a tenant
export const DELETE_TENANT = gql`
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id)
  }
`;

// Assign tenant to lease
export const ASSIGN_TENANT_TO_LEASE = gql`
  mutation AssignTenantToLease($data: AssignTenantToLeaseInput!) {
    assignTenantToLease(data: $data) {
      id
      leaseId
      tenantId
      isPrimary
      createdAt
      lease {
        id
        startDate
        endDate
        status
      }
      tenant {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

// Remove tenant from lease
export const REMOVE_TENANT_FROM_LEASE = gql`
  mutation RemoveTenantFromLease($leaseId: ID!, $tenantId: ID!) {
    removeTenantFromLease(leaseId: $leaseId, tenantId: $tenantId)
  }
`;

// Create tenant user for portal access
export const CREATE_TENANT_USER = gql`
  mutation CreateTenantUser($data: CreateTenantUserInput!) {
    createTenantUser(data: $data) {
      id
      name
      email
      role
    }
  }
`;
