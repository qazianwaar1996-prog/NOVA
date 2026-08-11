export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const path = url.pathname;

    const corsHeaders = {

      'Access-Control-Allow-Origin': '*',

      'Access-Control-Allow-Methods': 'POST, OPTIONS',

      'Access-Control-Allow-Headers': 'Content-Type',

      'Content-Type': 'application/json'

    };

    if (request.method === 'OPTIONS') {

      return new Response(null, { headers: corsHeaders });

    }

    const body = await request.json();

    if (path === '/gemini') {

      const res = await fetch(

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_KEY}`,

        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }

      );

      const data = await res.json();

      return new Response(JSON.stringify(data), { headers: corsHeaders });

    }

    if (path === '/groq') {

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.GROQ_KEY}` },

        body: JSON.stringify(body)

      });

      const data = await res.json();

      return new Response(JSON.stringify(data), { headers: corsHeaders });

    }

    if (path === '/mistral') {

      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MISTRAL_KEY}` },

        body: JSON.stringify(body)

      });

      const data = await res.json();

      return new Response(JSON.stringify(data), { headers: corsHeaders });

    }

    if (path === '/deepseek') {

      const res = await fetch('https://api.deepseek.com/chat/completions', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_KEY}` },

        body: JSON.stringify(body)

      });

      const data = await res.json();

      return new Response(JSON.stringify(data), { headers: corsHeaders });

    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  }

}
