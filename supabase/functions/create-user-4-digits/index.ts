// Edge Function pour créer des utilisateurs avec codes PIN de 4 chiffres
// Deploy: supabase functions deploy create-user-4-digits

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer les données de la requête
    const { phone, firstName, lastName, password } = await req.json()

    // Validation
    if (!phone || !firstName || !lastName || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone, firstName, lastName, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Valider le code PIN (exactement 4 chiffres)
    if (!/^\d{4}$/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'Password must be exactly 4 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer l'email à partir du téléphone
    const cleanedPhone = phone.replace(/[\s-]/g, '')
    const email = `${cleanedPhone}@senepanda.app`

    // Créer l'utilisateur avec l'API Admin (bypass la validation de longueur)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password, // 4 chiffres directement
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        phone: cleanedPhone,
        first_name: firstName,
        last_name: lastName,
      }
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        phone: cleanedPhone,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        username: `user_${userData.user.id.substring(0, 8)}`,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Ne pas échouer si le profil existe déjà
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          phone: cleanedPhone,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
