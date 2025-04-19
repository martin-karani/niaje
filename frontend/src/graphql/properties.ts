import { gql } from "@apollo/client";

// Fragment for consistent property fields
export const PROPERTY_FRAGMENT = gql`
  fragment PropertyFields on Property {
    id
    name
    addressLine1
    addressLine2
    city
    state
    postalCode
    country
    type
    status
    description
    yearBuilt
    numberOfUnits
    images
    amenities
    notes
    occupancyRate
    createdAt
    updatedAt
    owner {
      id
      name
      email
    }
    caretaker {
      id
      name
      email
    }
  }
`;

// Get all properties
export const GET_PROPERTIES = gql`
  query GetProperties {
    properties {
      ...PropertyFields
    }
  }
  ${PROPERTY_FRAGMENT}
`;

// Get a single property by ID
export const GET_PROPERTY = gql`
  query GetProperty($id: ID!) {
    property(id: $id) {
      ...PropertyFields
      units {
        id
        name
        type
        status
        bedrooms
        bathrooms
        sizeSqFt
        marketRent
        currentRent
        notes
      }
    }
  }
  ${PROPERTY_FRAGMENT}
`;

// Create a new property
export const CREATE_PROPERTY = gql`
  mutation CreateProperty($data: PropertyInput!) {
    createProperty(data: $data) {
      ...PropertyFields
    }
  }
  ${PROPERTY_FRAGMENT}
`;

// Update an existing property
export const UPDATE_PROPERTY = gql`
  mutation UpdateProperty($id: ID!, $data: PropertyUpdateInput!) {
    updateProperty(id: $id, data: $data) {
      ...PropertyFields
    }
  }
  ${PROPERTY_FRAGMENT}
`;

// Delete a property
export const DELETE_PROPERTY = gql`
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`;

// Get property units
export const GET_PROPERTY_UNITS = gql`
  query GetPropertyUnits($propertyId: ID!) {
    units(propertyId: $propertyId) {
      id
      name
      type
      status
      bedrooms
      bathrooms
      sizeSqFt
      floor
      marketRent
      currentRent
      depositAmount
      features
      images
      notes
      waterMeterId
      electricityMeterId
      gasMeterId
      createdAt
      updatedAt
    }
  }
`;

// Create a new unit
export const CREATE_UNIT = gql`
  mutation CreateUnit($data: UnitInput!) {
    createUnit(data: $data) {
      id
      name
      type
      status
      bedrooms
      bathrooms
      sizeSqFt
      floor
      marketRent
      depositAmount
      notes
    }
  }
`;

// Update an existing unit
export const UPDATE_UNIT = gql`
  mutation UpdateUnit($id: ID!, $data: UnitUpdateInput!) {
    updateUnit(id: $id, data: $data) {
      id
      name
      type
      status
      bedrooms
      bathrooms
      sizeSqFt
      floor
      marketRent
      currentRent
      depositAmount
      features
      notes
    }
  }
`;

// Delete a unit
export const DELETE_UNIT = gql`
  mutation DeleteUnit($id: ID!) {
    deleteUnit(id: $id)
  }
`;

// Get users (for property owners and caretakers)
export const GET_USERS = gql`
  query GetUsers($roles: [String!]) {
    users(roles: $roles) {
      id
      name
      email
      role
    }
  }
`;

// Assign a caretaker to a property
export const ASSIGN_CARETAKER = gql`
  mutation AssignCaretaker($propertyId: ID!, $caretakerId: ID!) {
    assignCaretaker(propertyId: $propertyId, caretakerId: $caretakerId) {
      id
      name
      caretaker {
        id
        name
      }
    }
  }
`;

// Change property owner
export const CHANGE_PROPERTY_OWNER = gql`
  mutation ChangePropertyOwner($propertyId: ID!, $newOwnerId: ID!) {
    changePropertyOwner(propertyId: $propertyId, newOwnerId: $newOwnerId) {
      id
      name
      owner {
        id
        name
      }
    }
  }
`;

// Assign property to team
export const ASSIGN_PROPERTY_TO_TEAM = gql`
  mutation AssignPropertyToTeam($propertyId: ID!, $teamId: ID!) {
    assignPropertyToTeam(propertyId: $propertyId, teamId: $teamId) {
      id
      name
      isInActiveTeam
    }
  }
`;
