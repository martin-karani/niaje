export const authTypeDefs = `
  # Authentication response types
  type AuthPayload {
    user: User!
    token: String
  }

  # Organization minimal info for auth context
  type AuthOrganization {
    id: ID!
    name: String!
    slug: String!
    logo: String
  }

  # Team minimal info for auth context
  type AuthTeam {
    id: ID!
    name: String!
  }

  # User organizations
  type UserOrganizationsPayload {
    user: User!
    organizations: [AuthOrganization!]!
    activeOrganization: AuthOrganization
    activeTeam: AuthTeam
  }

  # Invitation validation payload
  type InvitationValidationPayload {
    valid: Boolean!
    message: String!
    invitation: InvitationInfo
  }

  # Basic invitation info
  type InvitationInfo {
    email: String!
    role: String!
    organizationName: String!
    inviterName: String
    expiresAt: String
  }

  # Organization context for invitation acceptance
  type InvitationAcceptPayload {
    success: Boolean!
    message: String!
    organization: AuthOrganization
    teamId: ID
  }

  # Organization creation payload
  type OrganizationCreationPayload {
    success: Boolean!
    message: String!
    organization: AuthOrganization!
  }

  # Team selection payload
  type TeamSelectionPayload {
    success: Boolean!
    message: String!
    team: AuthTeam
  }

  # Password reset payload
  type PasswordResetPayload {
    success: Boolean!
    message: String!
  }

  # Email verification payload
  type EmailVerificationPayload {
    success: Boolean!
    message: String!
  }

  # Input for user registration
  input RegisterInput {
    email: String!
    password: String!
    passwordConfirm: String!
    name: String!
  }

  # Input for user login
  input LoginInput {
    email: String!
    password: String!
    remember: Boolean
  }

  # Input for password reset request
  input ForgotPasswordInput {
    email: String!
  }

  # Input for password reset
  input ResetPasswordInput {
    token: String!
    password: String!
    confirmPassword: String!
  }

  # Input for email verification
  input VerifyEmailInput {
    token: String!
  }

  # Input for changing password
  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  # Input for changing email
  input ChangeEmailInput {
    newEmail: String!
  }

  # Input for accepting invitation (existing user)
  input AcceptInvitationInput {
    token: String!
  }

  # Input for signup from invitation (new user)
  input SignupFromInvitationInput {
    token: String!
    name: String!
    password: String!
    confirmPassword: String!
  }

  # Input for creating organization
  input CreateOrganizationInput {
    name: String!
    slug: String
    timezone: String
    currency: String
    dateFormat: String
    logo: String
    address: String
  }

  # Input for switching organization
  input SwitchOrganizationInput {
    organizationId: ID!
  }

  # Input for setting active team
  input SetActiveTeamInput {
    teamId: ID
  }

  # Auth queries
  extend type Query {
    # Get current authenticated user
    me: UserOrganizationsPayload

    # Validate invitation token
    validateInvitation(token: String!): InvitationValidationPayload!
  }

  # Auth mutations
  extend type Mutation {
    # User authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): UserOrganizationsPayload!
    logout: Boolean!

    # Password management
    requestPasswordReset(input: ForgotPasswordInput!): PasswordResetPayload!
    resetPassword(input: ResetPasswordInput!): PasswordResetPayload!
    changePassword(input: ChangePasswordInput!): PasswordResetPayload!

    # Email management
    verifyEmail(input: VerifyEmailInput!): EmailVerificationPayload!
    resendVerificationEmail(input: ForgotPasswordInput!): EmailVerificationPayload!
    requestEmailChange(input: ChangeEmailInput!): EmailVerificationPayload!
    verifyEmailChange(input: VerifyEmailInput!): EmailVerificationPayload!

    # Invitation handling
    acceptInvitation(input: AcceptInvitationInput!): InvitationAcceptPayload!
    signupFromInvitation(input: SignupFromInvitationInput!): AuthPayload!

    # Organization management
    createOrganization(input: CreateOrganizationInput!): OrganizationCreationPayload!
    switchOrganization(input: SwitchOrganizationInput!): OrganizationCreationPayload!
    setActiveTeam(input: SetActiveTeamInput!): TeamSelectionPayload!
  }
`;
