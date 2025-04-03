import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Patch, // Use Patch for partial updates often
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth-guard'; // Corrected path

import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';

// --- DTOs ---
// Define DTOs here or in separate files (e.g., src/users/dto/)

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

// --- Controller ---

@ApiTags('Users') // Optional: For Swagger documentation
@ApiBearerAuth() // Optional: Indicates bearer token auth (JWT/Session)
@Controller('users')
@UseGuards(AuthGuard) // Apply AuthGuard globally to this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get the authenticated user's own profile
  @Get('me')
  async getOwnProfile(@CurrentUser() user: User) {
    // User object from AuthGuard is attached by CurrentUser decorator
    if (!user) {
      throw new UnauthorizedException(); // Should be caught by AuthGuard ideally
    }
    return this.usersService.getUserProfile(user.id);
  }

  // Update the authenticated user's own profile
  @Patch('me') // Use PATCH for partial updates
  async updateOwnProfile(
    @CurrentUser() user: User,
    @Body() updateData: UpdateUserProfileDto, // Use the DTO
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }
    // Pass only the DTO data to the service
    return this.usersService.updateUserProfile(user.id, updateData);
  }

  // --- Admin Routes ---

  // Get all users (admin only)
  @Get()
  @Roles(UserRole.ADMIN) // Apply role check
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // Get a specific user by ID (admin, or landlord accessing related user)
  @Get(':id')
  async getUserById(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Check if requesting self
    if (id === currentUser.id) {
      return this.usersService.getUserProfile(id);
    }

    // Allow admin access
    if (currentUser.role === UserRole.ADMIN) {
      return this.usersService.getUserProfile(id);
    }

    // Allow landlord to access their linked agents/caretakers
    if (currentUser.role === UserRole.LANDLORD) {
      const canAccess = await this.usersService.canLandlordAccessUser(
        currentUser.id,
        id,
      );
      if (canAccess) {
        return this.usersService.getUserProfile(id);
      }
    }

    // If none of the above, forbid access
    throw new ForbiddenException(
      'You do not have permission to access this user profile',
    );
  }

  // Create a new user (admin only) - Note: This only creates the User record
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., email exists).',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createUser(@Body() userData: AdminCreateUserDto) {
    // Use the DTO
    // Service method is now adminCreateUser and doesn't handle password
    return this.usersService.adminCreateUser(userData);
  }
}
