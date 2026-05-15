import httpx
from app.core.config import settings


async def send_invite_email(to_email: str, inviter_name: str, invite_token: str) -> bool:
    invite_url = f"{settings.FRONTEND_URL}/register?invite={invite_token}"

    if not settings.RESEND_API_KEY:
        print(f"[DEV] Invite link for {to_email}: {invite_url}")
        return True

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Wildr</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:2rem;font-style:italic;color:#1a2024;letter-spacing:-0.01em;">Wildr</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#1a4035;border-radius:20px;overflow:hidden;">
              <!-- Dark forest top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 36px 28px;text-align:center;">
                    <!-- Pine tree SVG -->
                    <div style="margin:0 auto 20px;width:72px;">
                      <svg width="72" height="52" viewBox="0 0 72 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="36,2 50,20 22,20" fill="#8bba2e" opacity="0.7"/>
                        <polygon points="36,10 54,30 18,30" fill="#8bba2e" opacity="0.85"/>
                        <polygon points="36,18 58,42 14,42" fill="#8bba2e"/>
                        <rect x="33" y="42" width="6" height="8" rx="1" fill="#2c6e5a"/>
                      </svg>
                    </div>
                    <p style="margin:0 0 8px;font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.55);">You've been invited</p>
                    <h1 style="margin:0 0 12px;font-size:1.6rem;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.02em;">
                      {inviter_name} wants you<br>to explore with them
                    </h1>
                    <p style="margin:0;font-size:0.95rem;color:rgba(255,255,255,0.62);line-height:1.55;">
                      Discover the wildlife living right outside<br>your door — together.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:0 36px 36px;text-align:center;">
                    <a href="{invite_url}"
                       style="display:inline-block;padding:14px 40px;background:#8bba2e;color:#0f2a1c;font-weight:700;font-size:0.95rem;border-radius:999px;text-decoration:none;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(139,186,46,0.35);">
                      Accept invite &amp; join Wildr
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:24px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px;background:#eaeee9;border-radius:14px;text-align:center;" width="31%">
                    <div style="font-size:1.3rem;margin-bottom:6px;">🔍</div>
                    <div style="font-size:0.78rem;font-weight:600;color:#1a2024;">Identify species</div>
                    <div style="font-size:0.72rem;color:#3d4a4e;margin-top:2px;">Photo &amp; sound ID</div>
                  </td>
                  <td width="3%"></td>
                  <td style="padding:16px;background:#eaeee9;border-radius:14px;text-align:center;" width="31%">
                    <div style="font-size:1.3rem;margin-bottom:6px;">🗺️</div>
                    <div style="font-size:0.78rem;font-weight:600;color:#1a2024;">Explore green spaces</div>
                    <div style="font-size:0.72rem;color:#3d4a4e;margin-top:2px;">Parks, rivers, wildlife</div>
                  </td>
                  <td width="3%"></td>
                  <td style="padding:16px;background:#eaeee9;border-radius:14px;text-align:center;" width="31%">
                    <div style="font-size:1.3rem;margin-bottom:6px;">🏅</div>
                    <div style="font-size:0.78rem;font-weight:600;color:#1a2024;">Earn badges</div>
                    <div style="font-size:0.72rem;color:#3d4a4e;margin-top:2px;">Grow your life list</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:0.75rem;color:#3d4a4e;">
                This invite was sent by <strong>{inviter_name}</strong> on Wildr.
              </p>
              <p style="margin:0;font-size:0.72rem;color:rgba(26,32,36,0.40);">
                If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"Wildr <invites@{settings.EMAIL_FROM_DOMAIN}>",
                    "to": [to_email],
                    "subject": f"{inviter_name} invited you to Wildr 🌿",
                    "html": html,
                },
            )
        return r.status_code in (200, 201)
    except Exception as exc:
        print(f"[email] Failed to send invite to {to_email}: {exc}")
        return False
