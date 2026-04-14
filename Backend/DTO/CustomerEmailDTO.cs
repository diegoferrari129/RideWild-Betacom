namespace RideWild.DTO
{
    public class CustomerEmailDTO
    {
        public string EmailAddress { get; set; } = null!;
        public bool IsEmailConfirmed { get; set; }

        public string PhoneNumber { get; set; } = null!;

        public bool IsMfaEnabled { get; set; } = false;

    }
}
