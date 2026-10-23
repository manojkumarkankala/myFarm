import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mobile, password, ownerName } = await req.json();

    if (!mobile || !password) {
      return new Response(
        JSON.stringify({ error: "Mobile number and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SETUP_MOBILE = (Deno.env.get("ADMIN_SETUP_MOBILE") || "8555895018").trim();

    if (String(mobile).trim() !== SETUP_MOBILE) {
      return new Response(
        JSON.stringify({ error: "Setup mobile number does not match the authorized initial value." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = `admin@agrirent.local`;

    // Check if admin user already exists by listing users with this email
    const { data: existingList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      return new Response(
        JSON.stringify({ error: "Could not verify existing admin: " + listError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existing = existingList.users.find((u) => u.email === email);

    let userId: string;

    if (existing) {
      // Update password
      const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true }
      );
      if (updErr) {
        return new Response(
          JSON.stringify({ error: "Failed to update admin password: " + updErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = updated.user.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
        user_metadata: { full_name: ownerName || "Admin" },
      });
      if (createErr) {
        return new Response(
          JSON.stringify({ error: "Failed to create admin account: " + createErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = created.user.id;
    }

    // Ensure app_metadata role is admin
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "admin" },
    });

    // Upsert profile
    await admin.from("profiles").upsert({
      id: userId,
      email,
      role: "admin",
      owner_name: ownerName || "Equipment Owner",
      mobile_number: SETUP_MOBILE,
      whatsapp_number: SETUP_MOBILE,
      updated_at: new Date().toISOString(),
    });

    // Ensure website_settings singleton exists
    const { data: settings } = await admin.from("website_settings").select("id").limit(1).maybeSingle();
    if (!settings) {
      await admin.from("website_settings").insert({
        site_name: "శ్రీ రేణుక ఎల్లమ్మ హార్వెస్టర్ & డోజర్",
        hero_title: "Book Agricultural Equipment for Your Farming Needs",
        hero_description: "Affordable and convenient agricultural equipment rental services for modern farmers.",
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin account is ready. You can now sign in." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
