import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer les variables d'environnement
    const MEILISEARCH_HOST = Deno.env.get('EXPO_PUBLIC_MEILISEARCH_HOST');
    const MEILISEARCH_ADMIN_KEY = Deno.env.get('MEILISEARCH_ADMIN_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
      return new Response(
        JSON.stringify({ error: 'Configuration Meilisearch manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le body
    const { action, index, data } = await req.json();

    if (!action || !index) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants: action, index' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si action est 'sync_all', récupérer toutes les données depuis Supabase
    if (action === 'sync_all') {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      let documents: any[] = [];

      if (index === 'products') {
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            category_id,
            shop_id,
            images,
            rating,
            stock,
            is_featured,
            created_at,
            categories(name),
            shops(name)
          `)
          .eq('is_active', true);

        if (error) throw error;

        documents = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category_id: p.category_id,
          category_name: p.categories?.name || '',
          shop_id: p.shop_id,
          shop_name: p.shops?.name || '',
          images: p.images,
          rating: p.rating,
          stock: p.stock,
          is_featured: p.is_featured,
          created_at: p.created_at,
        }));
      } else if (index === 'shops') {
        const { data: shops, error } = await supabase
          .from('shops')
          .select('*');

        if (error) throw error;
        documents = shops;
      } else if (index === 'users') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_seller');

        if (error) throw error;
        documents = users;
      }

      // Envoyer à Meilisearch
      const response = await fetch(`${MEILISEARCH_HOST}/indexes/${index}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(documents),
      });

      const result = await response.json();

      return new Response(
        JSON.stringify({
          success: true,
          taskUid: result.taskUid,
          documentsCount: documents.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actions individuelles
    if (action === 'add' || action === 'update') {
      const response = await fetch(`${MEILISEARCH_HOST}/indexes/${index}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(Array.isArray(data) ? data : [data]),
      });

      const result = await response.json();
      return new Response(
        JSON.stringify({ success: true, taskUid: result.taskUid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      const response = await fetch(`${MEILISEARCH_HOST}/indexes/${index}/documents/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
      });

      const result = await response.json();
      return new Response(
        JSON.stringify({ success: true, taskUid: result.taskUid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la synchronisation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
