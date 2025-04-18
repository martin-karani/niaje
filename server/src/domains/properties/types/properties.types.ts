export const propertiesTypeDefs = `
  type Property {
    id: ID!
    name: String!
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String
    postalCode: String
    country: String!
    type: String!
    status: String!
    description: String
    yearBuilt: Int
    numberOfUnits: Int
    images: [String!]
    amenities: [String!]
    notes: String
    
    # Relations
    owner: User!
    caretaker: User
    units: [Unit!]!
    
    # Computed fields
    occupancyRate: Float!
    isInActiveTeam: Boolean!
    createdAt: String!
    updatedAt: String!
  }
  
  input PropertyInput {
    name: String!
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String
    postalCode: String
    country: String!
    type: String!
    description: String
    yearBuilt: Int
    ownerId: ID!
    caretakerId: ID
    images: [String!]
    amenities: [String!]
    notes: String
  }
  
  input PropertyUpdateInput {
    name: String
    addressLine1: String
    addressLine2: String
    city: String
    state: String
    postalCode: String
    country: String
    description: String
    status: String
    yearBuilt: Int
    caretakerId: ID
    images: [String!]
    amenities: [String!]
    notes: String
  }
  
  type Unit {
    id: ID!
    name: String!
    type: String!
    status: String!
    bedrooms: Int
    bathrooms: Float
    sizeSqFt: Float
    floor: Int
    marketRent: Float
    currentRent: Float
    depositAmount: Float
    features: [String!]
    images: [String!]
    notes: String
    
    # Relations
    property: Property!
    
    createdAt: String!
    updatedAt: String!
  }
  
  input UnitInput {
    propertyId: ID!
    name: String!
    type: String!
    bedrooms: Int
    bathrooms: Float
    sizeSqFt: Float
    floor: Int
    marketRent: Float
    depositAmount: Float
    features: [String!]
    images: [String!]
    notes: String
  }
  
  input UnitUpdateInput {
    name: String
    type: String
    status: String
    bedrooms: Int
    bathrooms: Float
    sizeSqFt: Float
    floor: Int
    marketRent: Float
    currentRent: Float
    depositAmount: Float
    features: [String!]
    images: [String!]
    notes: String
  }
  
  extend type Query {
    properties: [Property!]!
    property(id: ID!): Property!
    propertiesByOwner(ownerId: ID!): [Property!]!
    propertiesByCaretaker(caretakerId: ID!): [Property!]!
    propertiesByTeam(teamId: ID!): [Property!]!
    units(propertyId: ID!): [Unit!]!
    unit(id: ID!): Unit!
  }
  
  extend type Mutation {
    createProperty(data: PropertyInput!): Property!
    updateProperty(id: ID!, data: PropertyUpdateInput!): Property!
    deleteProperty(id: ID!): Boolean!
    
    createUnit(data: UnitInput!): Unit!
    updateUnit(id: ID!, data: UnitUpdateInput!): Unit!
    deleteUnit(id: ID!): Boolean!
    
    assignCaretaker(propertyId: ID!, caretakerId: ID!): Property!
    changePropertyOwner(propertyId: ID!, newOwnerId: ID!): Property!
    assignPropertyToTeam(propertyId: ID!, teamId: ID!): Property!
  }
`;
