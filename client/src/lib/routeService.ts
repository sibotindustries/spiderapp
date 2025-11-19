import axios from 'axios';

const OPENROUTE_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY;
const API_URL = 'https://api.openrouteservice.org/v2/directions/';

/**
 * Interface para informações da rota
 */
export interface RouteInfo {
  distance: number; // em km
  duration: number; // em segundos
  geometry: [number, number][]; // coordenadas da rota [latitude, longitude]
}

/**
 * Obtém uma rota entre dois pontos usando a API do OpenRouteService
 * @param start Ponto de partida [latitude, longitude]
 * @param end Ponto de chegada [latitude, longitude]
 * @param profile Perfil da rota (driving-car, foot-walking, cycling-regular)
 * @returns Informações detalhadas da rota
 */
export async function getRoute(
  start: [number, number], 
  end: [number, number], 
  profile: 'driving-car' | 'foot-walking' | 'cycling-regular' = 'driving-car'
): Promise<RouteInfo | null> {
  try {
    if (!OPENROUTE_API_KEY) {
      console.error('API key não encontrada para OpenRouteService. Verifique as variáveis de ambiente.');
      return null;
    }
    
    // OpenRouteService requer coordenadas como [longitude, latitude]
    const startCoord = [start[1], start[0]];
    const endCoord = [end[1], end[0]];
    
    console.log(`Calculando rota de [${start[0]}, ${start[1]}] para [${end[0]}, ${end[1]}] usando perfil "${profile}"`);
    
    // A API do OpenRouteService espera um objeto JSON com um array de coordenadas
    // Adicionando mais opções para melhorar a precisão da rota
    const requestData = {
      coordinates: [startCoord, endCoord],
      radiuses: [-1, -1],
      format: 'geojson',        // Retorna em formato GeoJSON padrão
      units: 'km',              // Distância em quilômetros
      language: 'pt-br',        // Instruções em português
      geometry_simplify: false, // Não simplifique a geometria para ter rotas mais precisas
      instructions: false,      // Não precisamos de instruções textuais
      elevation: false          // Sem dados de elevação para melhor performance
    };
    
    // Definindo headers e realizando a requisição
    const response = await axios.post(`${API_URL}${profile}/json`, requestData, {
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Authorization': OPENROUTE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Log de resposta bem-sucedida
    console.log('Resposta da API recebida com sucesso');
    
    // Verifica se recebemos dados válidos
    if (!response.data || !response.data.features || response.data.features.length === 0) {
      console.error('API retornou dados inválidos:', response.data);
      return null;
    }
    
    const route = response.data.features[0];
    
    // Verifica se a rota tem a geometria esperada
    if (!route.geometry || !route.geometry.coordinates || !route.properties || !route.properties.summary) {
      console.error('Dados de rota incompletos:', route);
      return null;
    }
    
    // Converte coordenadas de volta para [latitude, longitude] para o Leaflet
    const coordinates = route.geometry.coordinates.map((coord: number[]) => 
      [coord[1], coord[0]] as [number, number]
    );

    console.log(`Rota calculada: ${coordinates.length} pontos, ${route.properties.summary.distance / 1000}km, ${route.properties.summary.duration}s`);
    
    return {
      distance: route.properties.summary.distance / 1000, // converter para km
      duration: route.properties.summary.duration, // em segundos
      geometry: coordinates
    };
  } catch (error) {
    console.error('Erro ao obter rota:', error);
    
    // Exibe mais detalhes do erro para debugging
    if (axios.isAxiosError(error)) {
      // Verifica o código de status HTTP para dar mensagens mais específicas
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error('Detalhes da requisição:', {
        url: `${API_URL}${profile}/json`,
        requestData: {
          start: start, // Original coords
          end: end,
          startCoord: [start[1], start[0]], // Transformed coords
          endCoord: [end[1], end[0]]
        },
        apiKey: OPENROUTE_API_KEY ? 'Presente' : 'Ausente',
        status,
        errorData
      });
      
      // Mensagens específicas para ajudar a diagnosticar o problema
      if (status === 401 || status === 403) {
        console.error('Erro de autenticação: verifique se a API key é válida e está configurada corretamente.');
      } else if (status === 404) {
        console.error('Endpoint não encontrado: verifique a URL da API e o perfil solicitado.');
      } else if (status === 413) {
        console.error('Rota muito longa: tente pontos mais próximos ou outro modo de transporte.');
      } else if (status === 429) {
        console.error('Limite de requisições excedido: reduza o número de chamadas à API.');
      } else if (status === 500) {
        console.error('Erro interno do servidor: o serviço pode estar temporariamente indisponível.');
      } else if (errorData && errorData.error) {
        console.error('Erro retornado pela API:', errorData.error);
      }
    } else {
      // Erros não relacionados a HTTP (como falhas de rede ou CORS)
      console.error('Erro não associado à resposta HTTP:', error);
    }
    
    return null;
  }
}

/**
 * Calcula o tempo estimado em minutos baseado na velocidade
 * @param duration Duração da rota em segundos
 * @param multiplier Multiplicador para ajustar o tempo (1 = normal, < 1 = mais rápido)
 * @returns Tempo estimado em minutos
 */
export function calculateEstimatedTime(duration: number, multiplier = 0.5): number {
  // Para o Homem-Aranha, consideramos que ele é mais rápido
  const minutes = (duration * multiplier) / 60;
  return Math.round(minutes);
}