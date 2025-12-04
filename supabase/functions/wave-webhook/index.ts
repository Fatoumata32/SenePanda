// Supabase Edge Function pour gérer les webhooks Wave
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wave-signature',
};

interface WaveWebhookPayload {
  id: string;
  type: 'payment.succeeded' | 'payment.failed' | 'payment.cancelled';
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    metadata?: {
      order_id?: string;
      [key: string]: any;
    };
    created_at: string;
    updated_at: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier que c'est une requête POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la signature Wave
    const signature = req.headers.get('x-wave-signature');
    if (!signature) {
      console.error('❌ Missing Wave signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le payload
    const payload: WaveWebhookPayload = await req.json();
    console.log('📥 Wave webhook reçu:', {
      type: payload.type,
      transactionId: payload.data.id,
      orderId: payload.data.metadata?.order_id,
    });

    // TODO: Vérifier la signature (implémenter crypto.subtle pour Deno)
    // const isValid = await verifySignature(signature, JSON.stringify(payload));
    // if (!isValid) {
    //   return new Response(
    //     JSON.stringify({ error: 'Invalid signature' }),
    //     { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extraire les données
    const { type, data } = payload;
    const orderId = data.metadata?.order_id;

    if (!orderId) {
      console.error('❌ Missing order_id in metadata');
      return new Response(
        JSON.stringify({ error: 'Missing order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enregistrer la transaction Wave
    const { error: transactionError } = await supabase
      .from('wave_transactions')
      .insert({
        wave_transaction_id: data.id,
        order_id: orderId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        customer_phone: data.customer.phone,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        metadata: data.metadata,
        webhook_type: type,
        created_at: data.created_at,
      });

    if (transactionError) {
      console.error('❌ Erreur enregistrement transaction:', transactionError);
    }

    // Traiter selon le type d'événement
    switch (type) {
      case 'payment.succeeded': {
        console.log('✅ Paiement réussi pour commande:', orderId);

        // Mettre à jour le statut de la commande
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_method: 'wave',
            wave_transaction_id: data.id,
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (orderError) {
          console.error('❌ Erreur mise à jour commande:', orderError);
          throw orderError;
        }

        // Créer une notification pour le vendeur
        const { data: order } = await supabase
          .from('orders')
          .select('seller_id, buyer_id, total_amount')
          .eq('id', orderId)
          .single();

        if (order) {
          // Notification vendeur
          await supabase.from('notifications').insert({
            user_id: order.seller_id,
            type: 'order_paid',
            title: 'Paiement reçu ! 💰',
            message: `Vous avez reçu un paiement de ${data.amount} FCFA via Wave`,
            data: { order_id: orderId, transaction_id: data.id },
          });

          // Notification acheteur
          await supabase.from('notifications').insert({
            user_id: order.buyer_id,
            type: 'payment_confirmed',
            title: 'Paiement confirmé ✅',
            message: `Votre paiement de ${data.amount} FCFA a été confirmé`,
            data: { order_id: orderId, transaction_id: data.id },
          });
        }

        console.log('✅ Commande mise à jour:', orderId);
        break;
      }

      case 'payment.failed': {
        console.log('❌ Paiement échoué pour commande:', orderId);

        // Mettre à jour le statut
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            payment_method: 'wave',
            wave_transaction_id: data.id,
          })
          .eq('id', orderId);

        // Notification acheteur
        const { data: order } = await supabase
          .from('orders')
          .select('buyer_id')
          .eq('id', orderId)
          .single();

        if (order) {
          await supabase.from('notifications').insert({
            user_id: order.buyer_id,
            type: 'payment_failed',
            title: 'Paiement échoué ❌',
            message: 'Votre paiement Wave n\'a pas pu être traité',
            data: { order_id: orderId, transaction_id: data.id },
          });
        }

        break;
      }

      case 'payment.cancelled': {
        console.log('🚫 Paiement annulé pour commande:', orderId);

        await supabase
          .from('orders')
          .update({
            payment_status: 'cancelled',
            payment_method: 'wave',
            wave_transaction_id: data.id,
          })
          .eq('id', orderId);

        break;
      }
    }

    // Réponse success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook traité avec succès',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Erreur webhook:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors du traitement du webhook',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
