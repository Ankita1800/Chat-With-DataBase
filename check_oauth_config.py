import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("\n" + "="*60)
print("🔐 OAuth Configuration Check")
print("="*60 + "\n")

# Check backend configuration
print("📦 Backend Configuration (.env):")
print("-" * 60)

groq_key = os.getenv("GROQ_API_KEY", "")
google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
github_client_id = os.getenv("GITHUB_CLIENT_ID", "")
github_client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")
secret_key = os.getenv("SECRET_KEY", "")

print(f"✓ GROQ_API_KEY: {'✅ Set' if groq_key else '❌ Missing'}")
print(f"✓ SECRET_KEY: {'✅ Set' if secret_key else '❌ Missing'}")
print(f"✓ GOOGLE_CLIENT_ID: {'✅ Set' if google_client_id else '❌ Missing'}")
print(f"✓ GOOGLE_CLIENT_SECRET: {'✅ Set' if google_client_secret else '❌ Missing'}")
print(f"✓ GITHUB_CLIENT_ID: {'✅ Set' if github_client_id else '❌ Missing'}")
print(f"✓ GITHUB_CLIENT_SECRET: {'✅ Set' if github_client_secret else '❌ Missing'}")

print("\n" + "-" * 60)

# Check if OAuth is configured
oauth_configured = all([
    google_client_id,
    google_client_secret,
    github_client_id,
    github_client_secret
])

if oauth_configured:
    print("\n✅ OAuth is properly configured!")
    print("\n📝 Next steps:")
    print("   1. Make sure frontend/.env.local has the Client IDs")
    print("   2. Restart backend: python main.py")
    print("   3. Restart frontend: cd frontend && npm run dev")
    print("   4. Test sign-in at http://localhost:3000")
else:
    print("\n❌ OAuth is NOT configured!")
    print("\n📖 Please follow the setup guide:")
    print("   Open: OAUTH_SETUP_GUIDE.md")
    print("\n💡 Quick links:")
    print("   Google: https://console.cloud.google.com/apis/credentials")
    print("   GitHub: https://github.com/settings/developers")

print("\n" + "="*60 + "\n")
