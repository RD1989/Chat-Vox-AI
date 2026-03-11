import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or Service Role Key missing');
    }

    // Criar o client admin (ignora RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Remover se existir e Recriar para garantir limpeza
    console.log("Creating/Recreating admin user...");

    const { data: listUser, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUser?.users) {
      for (const u of listUser.users) {
         if (u.email === 'admin@chatvox.com.br') {
           console.log("Admin exists, updating password...");
           const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
             u.id,
             { password: 'admin123', email_confirm: true }
           );
           if (updateError) throw updateError;
           
           return new Response(
             JSON.stringify({ success: true, message: 'Admin user updated', user: u.id }),
             { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
           )
         }
      }
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@chatvox.com.br',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'Admin Chat Vox' }
    });

    if (createError) throw createError;

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user created successfully', user: createdUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
