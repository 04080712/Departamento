/// <reference types="vite/client" />
/**
 * Serviço de integração com a nova API do Google Gen AI (@google/genai) v1.42.0+.
 */
import { GoogleGenAI } from "@google/genai";

let client: any = null;

const getClient = () => {
  if (client) return client;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') return null;

  try {
    client = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta'
    });
    return client;
  } catch (error) {
    console.error("Erro na inicialização:", error);
    return null;
  }
};

/**
 * Tenta gerar conteúdo em loop testando diferentes nomes de modelos se ocorrer 404.
 */
export const generateTechnicalSummary = async (demand: any) => {
  const genAI = getClient();
  if (!genAI) return "Configuração de IA ausente.";

  // Lista de modelos para tentar (começando pelo solicitado pelo usuário)
  const modelsToTry = [
    'gemini-3-flash-preview',

  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      if (!modelName) continue;
      console.log(`Tentando Gemini com modelo: ${modelName}...`);

      const prompt = `
Você é um analista técnico responsável por registrar a conclusão de uma demanda técnica em ambiente corporativo.

INSTRUÇÕES OBRIGATÓRIAS:

- Gere um texto técnico conclusivo, como se tivesse sido escrito por um técnico experiente.
- O texto deve ser coeso, coerente e objetivo.
- O texto deve estar em Português Técnico Corporativo.
- NÃO utilize listas, tópicos ou títulos.
- NÃO utilize Introdução, Escopo, Riscos ou Conclusão.
- Gere apenas UM parágrafo.

O TEXTO DEVE INICIAR OBRIGATORIAMENTE COM:

"Na conclusão da demanda Título: ${demand.title}, foi realizado o procedimento de: "

Após essa frase, descreva um procedimento técnico plausível e coerente com o título e a descrição da demanda, incluindo:

- análise técnica realizada
- ações executadas
- validações aplicadas
- plano de ação adotado para resolução
- resultado obtido

O texto deve ser sucinto, técnico e profissional.

DADOS DA DEMANDA:

Título: ${demand.title}
Descrição: ${demand.description}
`;

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      const output = response.text;
      console.log(`Sucesso com o modelo: ${modelName}`);
      return output;
    } catch (error: any) {
      lastError = error;
      console.error(`Erro com modelo ${modelName}:`, error);

      // Se não for erro de "modelo não encontrado", interrompe para não gastar cota desnecessária se estiver bloqueado
      if (error.status !== 404 && !error.message?.includes('404')) {
        break;
      }
    }
  }

  // Se chegou aqui, falhou
  if (lastError?.status === 429 || lastError?.message?.includes('429')) {
    return "Cota de IA excedida. Tente novamente mais tarde.";
  }

  return `Erro na API: Não foi possível gerar o resumo com os modelos disponíveis. Verifique o console para detalhes técnicos.`;
};
