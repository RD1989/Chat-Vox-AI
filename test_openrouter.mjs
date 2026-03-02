// Node.js v18+ possui fetch nativo

const API_KEY = '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';
const MODEL = 'google/gemini-3.1-flash-image-preview';

async function testApiKey() {
    console.log('--- Iniciando Teste de Conexão (OpenRouter) ---');
    console.log(`Modelo: ${MODEL}`);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Oi, responda apenas com "CONEXÃO OK"' }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro na API (${response.status}):`, errorText);
            return;
        }

        const data = await response.json();
        console.log('Resposta da IA:', data.choices[0].message.content);
        console.log('Teste concluído com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar na API:', error.message);
    }
}

testApiKey();
