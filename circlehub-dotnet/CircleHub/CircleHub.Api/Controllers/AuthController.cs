using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly TokenService _tokenService;
        private readonly EmailVerificationService _verification;

        public AuthController(AppDbContext db, TokenService tokenService, EmailVerificationService verification)
        {
            _db = db;
            _tokenService = tokenService;
            _verification = verification;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (dto.DateOfBirth > DateTime.UtcNow)
            {
                ModelState.AddModelError(nameof(dto.DateOfBirth), "Birthdate can't be in the future");
                return ValidationProblem(ModelState);
            }

            var username = dto.Username.ToLowerInvariant();
            var email = dto.Email.ToLowerInvariant();

            var taken = await _db.Users
                .AnyAsync(u => u.Username == username || u.Email == email);
            if (taken)
                return Conflict(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Email or username already exists"
                });

            var user = new User
            {
                Name = dto.Name,
                Username = username,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                JobTitle = dto.JobTitle,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                Location = dto.Location,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            await _verification.IssueVerificationAsync(user);

            return StatusCode(StatusCodes.Status201Created, new ApiResponse<AuthResponseDto>
            {
                Message = "User registered successfully. Please check your inbox to verify your email.",
                Data = new AuthResponseDto
                {
                    User = UserDto.FromEntity(user),
                    Token = _tokenService.CreateToken(user)
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var usernameOrEmail = dto.UsernameOrEmail.ToLowerInvariant();

            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Email == usernameOrEmail || u.Username == usernameOrEmail);

            if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Invalid username, email, or password"
                });

            if (!user.EmailVerified)
                return StatusCode(StatusCodes.Status403Forbidden, new ApiErrorResponse
                {
                    Success = false,
                    Message = "Your email has not been verified yet. Check your inbox for the verification link we sent you."
                });

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Message = "Signed in successfully",
                Data = new AuthResponseDto
                {
                    User = UserDto.FromEntity(user),
                    Token = _tokenService.CreateToken(user)
                }
            });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        {
            var result = await _verification.VerifyAsync(dto.UserId, dto.Token);

            return result switch
            {
                VerifyEmailResult.Verified => Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Email verified successfully"
                }),
                VerifyEmailResult.AlreadyVerified => Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Your email is already verified"
                }),
                _ => BadRequest(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Invalid or expired verification link"
                })
            };
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(ResendVerificationDto dto)
        {
            await _verification.ResendAsync(dto.Email);

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "If your email is registered with CircleHub and not verified yet, we emailed you a new verification link."
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue("sub");
            if (userId is null || !Guid.TryParse(userId, out var id))
                return Unauthorized(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Not authorized, no token"
                });

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user is null)
                return Unauthorized(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Not authorized, user not found"
                });

            return Ok(new ApiResponse<UserDto> { Data = UserDto.FromEntity(user) });
        }
    }
}
