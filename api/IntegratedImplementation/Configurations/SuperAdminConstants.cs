namespace IntegratedImplementation.Configurations
{
    public static class SuperAdminConstants
    {
        // These are baked into the binary and not visible in config files
        public const string Username = "Jo";
        
        // This is a BCrypt/Identity hashed password for "SuperAdmin@1999"
        // Storing the hash is safer than plain text even in source code.
        public const string PasswordHash = "AQAAAAEAACcQAAAAED9n9StuzrHRDoYp2tMDMzxPkcCpQYn1Vt5LLsX0C2XJ9yHtlMWvs1sBYE3KADXi4w=="; 
        // NOTE: The above is a placeholder format. In a real scenario, you'd generate this once.
    }
}
