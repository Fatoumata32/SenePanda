import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, newPin } = await req.json()

    // Validation
    if (!phoneNumber || !newPin) {
      return new Response(
        JSON.stringify({ error: 'Numéro de téléphone et nouveau PIN requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Nettoyer le numéro de téléphone
    const cleanedPhone = phoneNumber.replace(/[\s-]/g, '')

    // Valider le format
    if (!/^\+221[0-9]{9}$/.test(cleanedPhone)) {
      return new Response(
        JSON.stringify({ error: 'Format de numéro invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Valider le PIN (4-6 chiffres)
    if (!/^[0-9]{4,6}$/.test(newPin)) {
      return new Response(
        JSON.stringify({ error: 'Le PIN doit contenir entre 4 et 6 chiffres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec la clé admin
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

    // Générer l'email à partir du numéro
    const email = `${cleanedPhone}@senepanda.app`

    // Chercher l'utilisateur par email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Trouver l'utilisateur avec cet email
    const user = userData.users.find(u => u.email === email)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Aucun compte trouvé avec ce numéro' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Padding du PIN si nécessaire (minimum 6 caractères requis par Supabase)
    const paddedPin = newPin.length < 6 ? newPin.padStart(6, '0') : newPin

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: paddedPin }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du PIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Code PIN réinitialisé avec succès'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
