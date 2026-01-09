import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's crops and recent activities for context
    const { data: crops } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', user.id);

    const { data: recentActivities } = await supabase
      .from('farmer_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: irrigationLogs } = await supabase
      .from('irrigation_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('irrigation_date', { ascending: false })
      .limit(5);

    // Build context for the AI
    const contextInfo = {
      crops: crops || [],
      recentActivities: recentActivities || [],
      irrigationLogs: irrigationLogs || []
    };

    const systemPrompt = `You are an expert agricultural advisor AI assistant specializing in smart farming practices. 
    
Your role is to provide actionable advice on:
- Crop management and health monitoring
- Irrigation scheduling and water management
- Fertilization timing and nutrient management
- Pest and disease prevention
- Weather-based farming decisions
- Yield optimization strategies

Current farmer's context:
${JSON.stringify(contextInfo, null, 2)}

Provide specific, actionable recommendations based on:
1. The farmer's current crops and their growth stages
2. Recent activities and patterns
3. Local weather conditions (ask if needed)
4. Best agricultural practices

Keep responses concise, practical, and focused on immediate actionable steps. Use simple language suitable for farmers of all experience levels.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save chat messages to database
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: messages[messages.length - 1].content },
      { user_id: user.id, role: 'assistant', content: assistantMessage }
    ]);

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in agricultural-advisor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
