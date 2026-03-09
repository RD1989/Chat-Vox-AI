import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://nyxysqxqayhsxnqqoazd.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbG... (preciso da anon key do .env)";

// Vou ler o .env local
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env") });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

const testPix = async () => {
    // 1. Pegar um usuario real
    const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
    if (!profiles || !profiles.length) return console.error("No profiles");
    const userId = profiles[0].id;

    console.log("Testing with user:", userId);

    const res = await fetch(process.env.VITE_SUPABASE_URL + "/functions/v1/vox-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_slug: "pro", user_id: userId, method: "pix" })
    });

    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}

testPix();
