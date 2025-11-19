import { useState, useEffect, useRef } from "react";
import { Crime } from "@shared/schema";
import { getCrimeTypeColor } from "@/lib/utils";
import { CrimeLegend } from "@/components/crime-legend";
import { SpidermanStatus } from "@/components/spiderman-status";
import { useAuth } from "@/hooks/use-auth";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css";
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { getRoute, RouteInfo, calculateEstimatedTime } from '@/lib/routeService';

// Fix for Leaflet default marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface CrimeMapProps {
  crimes: Crime[];
  onCrimeSelect?: (crime: Crime) => void;
  selectedCrimeId?: number;
}

// Component to auto-recenter map
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  
  return null;
}

// Component to set up map interactions
function MapEventHandler({ onMarkerClick }: { onMarkerClick: (id: number) => void }) {
  useMapEvents({
    click: () => {
      // Close any popups if clicking on the map
    }
  });
  
  return null;
}

// Componente para capturar a referência do mapa
function MapRef({ setMapRef }: { setMapRef: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  
  return null;
}

export function CrimeMap({ crimes, onCrimeSelect, selectedCrimeId }: CrimeMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [spidermanLocation, setSpidermanLocation] = useState<[number, number]>([-23.5500, -46.6400]); // São Paulo, Brasil default
  const { user } = useAuth();
  
  // Localização atual do Homem-Aranha - Cidades brasileiras
  const spidermanBaseLocations = [
    { name: "São Paulo - Av. Paulista", lat: -23.5630, lng: -46.6543 },
    { name: "Rio de Janeiro - Copacabana", lat: -22.9699, lng: -43.1866 },
    { name: "Brasília - Esplanada", lat: -15.7942, lng: -47.8822 },
    { name: "Salvador - Pelourinho", lat: -12.9746, lng: -38.5089 },
    { name: "Curitiba - Centro", lat: -25.4284, lng: -49.2733 }
  ];
  
  // Estado de controle para a rota
  const [routeActive, setRouteActive] = useState(false);
  // Estado para armazenar se a geolocalizacao foi encontrada
  const [userLocationFound, setUserLocationFound] = useState(false);
  // Estado para feedback de localização
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  
  // Detecta a localização real do dispositivo e utiliza como posição do Spider-Man
  useEffect(() => {
    // Tenta obter a localização do dispositivo
    if (navigator.geolocation) {
      setLocationStatus("Detectando sua localização...");
      
      navigator.geolocation.getCurrentPosition(
        // Sucesso - usa a localização real
        (position) => {
          const { latitude, longitude } = position.coords;
          setSpidermanLocation([latitude, longitude]);
          setUserLocationFound(true);
          setLocationStatus("Usando sua localização atual");
          console.log("Localização encontrada:", latitude, longitude);
        },
        // Erro - usa localização padrão no Brasil
        (error) => {
          console.error("Erro ao obter localização:", error.message);
          setLocationStatus("Não foi possível acessar sua localização");
          
          // Usa uma localização aleatória no Brasil como fallback
          const randomIndex = Math.floor(Math.random() * spidermanBaseLocations.length);
          const baseLocation = spidermanBaseLocations[randomIndex];
          
          // Adiciona uma pequena variação aleatória
          const jitter = 0.01; // ~ 1km
          const randomLat = baseLocation.lat + (Math.random() - 0.5) * jitter;
          const randomLng = baseLocation.lng + (Math.random() - 0.5) * jitter;
          
          setSpidermanLocation([randomLat, randomLng]);
        },
        // Opções
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Navegador não suporta geolocalização
      setLocationStatus("Seu navegador não suporta geolocalização");
      
      // Usar localização default
      const defaultLocation = spidermanBaseLocations[0];
      setSpidermanLocation([defaultLocation.lat, defaultLocation.lng]);
    }
  }, []);
  
  // Resetar a rota quando o crime selecionado muda
  useEffect(() => {
    // Se um novo crime for selecionado, reseta o estado da rota
    setRouteActive(false);
    // Limpa a referência de pontos da rota
    routePointsRef.current = null;
  }, [selectedCrimeId]);
  
  // Função para alternar a ativação da rota
  const toggleRoute = () => {
    const newState = !routeActive;
    setRouteActive(newState);
    
    // Se estiver desativando a rota, limpa os pontos para regenerar da próxima vez
    if (!newState) {
      routePointsRef.current = null;
    }
  };
  
  // Estado para armazenar a distância, tempo e status de atualização calculados
  const [routeInfo, setRouteInfo] = useState<{distance: number, time: number, updated?: number} | null>(null);
  
  // Interface para resultado de busca que pode ter diferentes formatos
  // Estado para armazenar resultados da busca - usando any para evitar problemas de tipo
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Provedor de pesquisa do OpenStreetMap
  const provider = useRef(new OpenStreetMapProvider());

  // Referência para armazenar os pontos da rota
  const routePointsRef = useRef<Array<[number, number]> | null>(null);
  // Referência para o mapa
  const mapRef = useRef<L.Map | null>(null);

  // useEffect para calcular informações da rota quando necessário
  useEffect(() => {
    if (!selectedCrimeId || !routeActive) {
      // Limpa as informações da rota se não estiver ativa
      setRouteInfo(null);
      return;
    }
    
    const selectedCrime = crimes.find(c => c.id === selectedCrimeId);
    if (!selectedCrime) return;
    
    // Pega as coordenadas do crime
    const crimeLat = parseFloat(selectedCrime.latitude);
    const crimeLng = parseFloat(selectedCrime.longitude);
    
    // Coordenadas da rota (começa no Homem-Aranha e vai até o crime)
    const [spiderLat, spiderLng] = spidermanLocation;
    
    // Calcula a distância real entre os pontos
    const distanceKm = calculateDistance(spiderLat, spiderLng, crimeLat, crimeLng);
    // Calcula o tempo estimado com base na velocidade do Homem-Aranha
    const timeMinutes = calculateTime(distanceKm);
    
    // Atualiza o estado com as informações da rota
    setRouteInfo({
      distance: parseFloat(distanceKm.toFixed(1)),
      time: timeMinutes
    });
  }, [selectedCrimeId, routeActive, spidermanLocation, crimes]);
  
  // Função para gerar rota para um crime selecionado usando OpenRouteService
  const generateRouteToSelectedCrime = () => {
    if (!selectedCrimeId || !routeActive) return null;
    
    const selectedCrime = crimes.find(c => c.id === selectedCrimeId);
    if (!selectedCrime) return null;
    
    // Pega as coordenadas do crime
    const crimeLat = parseFloat(selectedCrime.latitude);
    const crimeLng = parseFloat(selectedCrime.longitude);
    
    // Coordenadas da rota (começa no Homem-Aranha e vai até o crime)
    const [spiderLat, spiderLng] = spidermanLocation;
    
    // Se já temos pontos de rota calculados, usamos
    if (routePointsRef.current) {
      return routePointsRef.current;
    }
    
    // Busca a rota em tempo real usando a API OpenRouteService seguindo as estradas reais
    const fetchRoute = async () => {
      try {
        console.log("Buscando rota por estradas reais de", [spiderLat, spiderLng], "para", [crimeLat, crimeLng]);
        
        // Busca a rota pelo serviço - usando 'foot-walking' para o Homem-Aranha
        // que se desloca a pé pulando entre prédios
        const routeData = await getRoute(
          [spiderLat, spiderLng],
          [crimeLat, crimeLng],
          'foot-walking' // Usa 'foot-walking' para simular o Homem-Aranha pulando entre prédios
        );
        
        if (routeData && routeData.geometry && routeData.geometry.length > 0) {
          // Log de sucesso
          console.log("Rota por estradas reais obtida com sucesso:", routeData.geometry.length, "pontos");
          
          // Atualiza as informações da rota com tipo seguro
          setRouteInfo({
            distance: parseFloat(routeData.distance.toFixed(1)),
            time: calculateEstimatedTime(routeData.duration), // Ajusta para velocidade do Homem-Aranha
            updated: Date.now() // Para forçar re-renderização
          } as {distance: number, time: number, updated: number});
          
          // Armazena os pontos para não precisar buscar novamente
          return routeData.geometry;
        } else {
          console.log("API retornou dados, mas sem geometria válida. Usando fallback.");
          return generateFallbackRoute();
        }
      } catch (error) {
        console.error("Erro ao buscar rota pelas estradas:", error);
        // Fallback - usa o método antigo se a API falhar
        return generateFallbackRoute();
      }
    };
    
    // Método alternativo caso a API falhe
    const generateFallbackRoute = () => {
      console.log("Usando rota alternativa...");
      
      // Calcula a distância real entre os pontos
      const distanceKm = calculateDistance(spiderLat, spiderLng, crimeLat, crimeLng);
      
      // Número de pontos intermediários baseado na distância
      // Mais pontos para rotas mais longas para melhor visualização
      const numPoints = Math.max(6, Math.min(12, Math.ceil(distanceKm / 5)));
      const routePoints: Array<[number, number]> = [];
      
      // Adiciona o ponto de partida
      routePoints.push([spiderLat, spiderLng]);
      
      // Gera pontos intermediários levemente aleatórios para simular ruas
      for (let i = 1; i < numPoints - 1; i++) {
        const ratio = i / (numPoints - 1);
        // Linha reta
        const lat = spiderLat + (crimeLat - spiderLat) * ratio;
        const lng = spiderLng + (crimeLng - spiderLng) * ratio;
        
        // Adiciona pequenos desvios para simular ruas
        const jitterFactor = 0.005; 
        const jitter = jitterFactor * Math.sin(i * Math.PI);
        
        // Adiciona variabilidade baseada na distância
        const variability = Math.min(0.01, distanceKm / 500);
        
        const routePoint: [number, number] = [
          lat + jitter * (i % 2 === 0 ? 1 : -1) + (Math.random() - 0.5) * variability,
          lng + jitter * (i % 3 === 0 ? -1 : 1) + (Math.random() - 0.5) * variability
        ];
        
        routePoints.push(routePoint);
      }
      
      // Adiciona o destino
      routePoints.push([crimeLat, crimeLng]);
      
      // Atualiza as informações da rota
      setRouteInfo({
        distance: parseFloat(distanceKm.toFixed(1)),
        time: calculateTime(distanceKm)
      });
      
      // Armazena os pontos para evitar recálculos desnecessários
      routePointsRef.current = routePoints;
      
      return routePoints;
    };
    
    // Exibe mensagem de carregamento para o usuário
    console.log("Calculando rota através das estradas reais...");
    
    // Usa o fallback enquanto carrega a rota real
    if (!routePointsRef.current) {
      const fallbackPoints = generateFallbackRoute();
      routePointsRef.current = fallbackPoints;
    }
    
    // Força nova requisição da API, ignorando cache anterior
    if (routeActive) {
      // Limpa o cache antigo ao iniciar nova rota
      routePointsRef.current = null;
      
      // Chama a API para obter rota pelas estradas
      fetchRoute().then(points => {
        if (points && points.length > 0) {
          console.log("Rota real carregada com sucesso (" + points.length + " pontos)");
          routePointsRef.current = points;
          
          // Força uma atualização do componente com tipo seguro
          setRouteInfo(prev => {
            if (prev) {
              return {
                distance: prev.distance,
                time: prev.time,
                updated: Date.now() // Força re-renderização
              };
            }
            return {
              distance: 0,
              time: 0,
              updated: Date.now()
            };
          });
        } else {
          console.log("API não retornou pontos válidos, usando fallback");
          routePointsRef.current = generateFallbackRoute();
        }
      }).catch(err => {
        console.error("Erro ao calcular rota pelas estradas:", err);
        routePointsRef.current = generateFallbackRoute();
      });
    }
    
    // Retorna os pontos atuais ou gera fallback para exibição imediata
    return routePointsRef.current || generateFallbackRoute();
  };
  
  // Variáveis para o comportamento antigo (remover depois)
  const spidermanRoute: any[] = [];
  const secondaryRoute: any[] = [];
  
  // Convert crimes to map markers
  const crimeMarkers = crimes.map(crime => ({
    id: crime.id,
    position: [parseFloat(crime.latitude), parseFloat(crime.longitude)] as [number, number],
    title: crime.title,
    description: crime.description,
    type: crime.crimeType,
    priority: crime.priorityLevel,
    status: crime.status
  }));
  
  // Função para calcular a distância entre dois pontos em km usando a fórmula de Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distância em km
    return distance;
  };
  
  // Calcula o tempo estimado em minutos baseado na distância (assumindo velocidade média)
  const calculateTime = (distanceKm: number): number => {
    const spidermanSpeedKmh = 80; // Velocidade do Homem-Aranha em km/h
    return Math.ceil((distanceKm / spidermanSpeedKmh) * 60); // Tempo em minutos
  };

  // Create bounds for the map to display all crimes
  const getMapBounds = () => {
    // Default to Brazil central area if no crimes
    if (crimes.length === 0) {
      return [
        [-25.0, -52.0], // SW corner of Brazil
        [-15.0, -42.0]  // NE corner of central Brazil
      ] as L.LatLngBoundsExpression;
    }
    
    // Try to include both crime markers and spider location
    const positions = [
      ...crimeMarkers.map(m => m.position),
      spidermanLocation
    ];
    
    const lats = positions.map(p => p[0]);
    const lngs = positions.map(p => p[1]);
    
    const minLat = Math.min(...lats) - 0.05;
    const maxLat = Math.max(...lats) + 0.05;
    const minLng = Math.min(...lngs) - 0.05;
    const maxLng = Math.max(...lngs) + 0.05;
    
    return [
      [minLat, minLng],
      [maxLat, maxLng]
    ] as L.LatLngBoundsExpression;
  };
  
  // Handle marker click
  const handleMarkerClick = (id: number) => {
    const crime = crimes.find(c => c.id === id);
    if (crime && onCrimeSelect) {
      onCrimeSelect(crime);
    }
  };
  
  // Count crime types for legend
  const countByType = crimes.reduce<Record<string, number>>((acc, crime) => {
    acc[crime.crimeType] = (acc[crime.crimeType] || 0) + 1;
    return acc;
  }, {});

  // Check if user is logged in and is Spiderman (with type assertion)
  const isLoggedIn = !!user;
  const isSpiderman = isLoggedIn && (user as any).username === "spiderman";

  // Create customized red marker for Spiderman route
  const spidermanIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Set up MapContainer style
  const mapStyle = {
    height: "100%",
    width: "100%",
    zIndex: 1,
  };

  // Handle map errors
  useEffect(() => {
    const handleMapError = () => {
      try {
        // Make sure Leaflet is available and working
        if (!L || !L.map) {
          setMapError("Map library failed to load properly");
        }
      } catch (err) {
        setMapError("An error occurred while initializing the map");
        console.error("Map initialization error:", err);
      }
    };
    
    handleMapError();
  }, []);

  // If there's an error, show a fallback UI
  if (mapError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background/80">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Map Loading Error</h3>
        <p className="text-center max-w-md mb-4">{mapError}</p>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
        
        {/* Display crime counts even if map fails */}
        <div className="mt-8">
          <CrimeLegend crimeTypeCounts={countByType} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full relative overflow-hidden">
      {/* Leaflet Map */}
      <MapContainer 
        center={[-23.5505, -46.6333]} // São Paulo, Brasil
        zoom={13}
        style={mapStyle}
        zoomControl={false} // We'll add our own zoom control
        whenReady={() => setMapReady(true)}
        attributionControl={true}
      >
        {/* Base map layer (dark style) */}
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Map event handler */}
        <MapEventHandler onMarkerClick={handleMarkerClick} />
        
        {/* Fit map to bounds */}
        <FitBounds bounds={getMapBounds()} />
        
        {/* Captura referência do mapa para uso nos controles de busca e navegação */}
        <MapRef setMapRef={(map) => mapRef.current = map} />
        
        {/* Crime markers */}
        {crimeMarkers.map(marker => {
          const { bg, text } = getCrimeTypeColor(marker.type);
          const isSelected = selectedCrimeId === marker.id;
          
          return (
            <CircleMarker
              key={marker.id}
              center={marker.position}
              radius={isSelected ? 12 : 8}
              pathOptions={{
                fillColor: isSelected ? bg.replace('bg-', '').replace('-500', '') : '#cccccc', 
                color: isSelected ? 'white' : '#999999',
                fillOpacity: isSelected ? 0.8 : 0.6,
                weight: isSelected ? 3 : 1
              }}
              eventHandlers={{
                click: () => handleMarkerClick(marker.id)
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold">{marker.title}</h3>
                  <p className="text-sm">{marker.description.slice(0, 80)}...</p>
                  <div className="mt-1 text-xs flex gap-2">
                    <span className={`px-1 rounded ${bg} ${text}`}>{marker.type}</span>
                    <span className={`px-1 rounded ${
                      marker.priority === 'High' ? 'bg-red-500 text-white' : 
                      marker.priority === 'Medium' ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>{marker.priority}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        
        {/* Spiderman's current location marker */}
        {isSpiderman && (
          <>
            {/* Posição atual do Homem-Aranha */}
            <Marker 
              position={spidermanLocation} 
              icon={spidermanIcon}
            >
              <Popup>
                <div className="font-bold">Você está aqui</div>
                <div className="text-sm">Posição atual do Homem-Aranha</div>
              </Popup>
            </Marker>
            
            {/* Rota dinâmica para o crime selecionado (estilo GPS) */}
            {selectedCrimeId && (
              <>
                {/* Rota gerada dinamicamente */}
                {(() => {
                  const routePoints = generateRouteToSelectedCrime();
                  if (!routePoints) return null;
                  
                  return (
                    <>
                      {/* Linha principal da rota */}
                      <Polyline 
                        positions={routePoints}
                        pathOptions={{ 
                          color: '#ff3b30',
                          weight: 5,
                          opacity: 0.8,
                          lineCap: 'round',
                          lineJoin: 'round',
                          dashArray: '10, 15',
                          className: 'animate-dash'
                        }}
                      />
                      
                      {/* Linha secundária (efeito de brilho) */}
                      <Polyline 
                        positions={routePoints}
                        pathOptions={{ 
                          color: 'white',
                          weight: 2,
                          opacity: 0.3,
                          lineCap: 'round',
                          lineJoin: 'round'
                        }}
                      />
                      
                      {/* Pontos de interesse na rota */}
                      {routePoints.map((point, index) => {
                        // Pula o primeiro (origem) e o último (destino) ponto
                        if (index === 0 || index === routePoints.length - 1) return null;
                        
                        // Só mostra alguns pontos intermediários para não poluir o mapa
                        if (index % 2 !== 0) return null;
                        
                        return (
                          <CircleMarker 
                            key={`route-point-${index}`}
                            center={point}
                            radius={3}
                            pathOptions={{
                              fillColor: 'red',
                              fillOpacity: 0.7,
                              color: 'white',
                              weight: 1
                            }}
                          />
                        );
                      })}
                      
                      {/* Seta direcional animada ao longo da rota */}
                      {routePoints.length > 2 && (
                        <CircleMarker 
                          center={routePoints[Math.floor(routePoints.length / 2)]}
                          radius={6}
                          pathOptions={{
                            fillColor: 'red',
                            fillOpacity: 1,
                            color: 'white',
                            weight: 2
                          }}
                          className="pulse-marker"
                        />
                      )}
                      
                      {/* Caixa informativa de distância/tempo */}
                      <Popup 
                        position={routePoints[Math.floor(routePoints.length / 3)]}
                        closeButton={false}
                        autoClose={false}
                        closeOnClick={false}
                      >
                        <div className="text-sm font-bold">
                          <div className="flex items-center mb-1">
                            <i className="fas fa-running mr-2 text-red-500"></i>
                            Tempo estimado: {routeInfo?.time || 0}min
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-road mr-2 text-blue-500"></i>
                            Distância: {routeInfo?.distance || 0}km
                          </div>
                        </div>
                      </Popup>
                    </>
                  );
                })()}
                
                {/* Efeito de destaque pulsante no crime selecionado */}
                {(() => {
                  const selectedCrime = crimes.find(c => c.id === selectedCrimeId);
                  if (!selectedCrime) return null;
                  
                  const lat = parseFloat(selectedCrime.latitude);
                  const lng = parseFloat(selectedCrime.longitude);
                  
                  return (
                    <CircleMarker 
                      center={[lat, lng]}
                      radius={20}
                      pathOptions={{
                        fillColor: 'transparent',
                        color: '#ff3b30',
                        weight: 3
                      }}
                      className="pulse-marker"
                    />
                  );
                })()}
              </>
            )}
          </>
        )}
        
        {/* Custom Zoom Control (lower-right corner) */}
        <ZoomControl position="bottomright" />
      </MapContainer>
      
      {/* Spiderman GPS Legend e botão de controle - só visível quando logado como spiderman */}
      {isSpiderman && (
        <div className="absolute top-4 left-4 bg-card/80 p-2 rounded-lg backdrop-blur-sm border border-foreground/10 z-[1000]">
          <div className="text-sm font-bold mb-1">Spidey-GPS</div>
          {selectedCrimeId ? (
            <>
              <div className="flex items-center mb-1">
                <div className="w-4 h-0 border-t-2 border-red-600 border-dashed mr-2"></div>
                <span className="text-xs">Rota para o crime</span>
              </div>
              
              {/* Botão para iniciar/parar a rota */}
              <button
                onClick={toggleRoute}
                className={`w-full py-1.5 px-3 mt-2 mb-2 rounded text-xs font-bold ${
                  routeActive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                } transition-colors flex items-center justify-center gap-1`}
              >
                {routeActive ? (
                  <>
                    <i className="fas fa-stop"></i>
                    Cancelar rota
                  </>
                ) : (
                  <>
                    <i className="fas fa-play"></i>
                    Iniciar rota
                  </>
                )}
              </button>
              
              {routeActive && (
                <>
                  <div className="text-xs mb-1 flex items-center">
                    <i className="fas fa-circle text-red-500 mr-2" style={{ fontSize: '6px' }}></i>
                    <span>Pontos de rota</span>
                  </div>
                  <div className="text-xs mt-2 border-t border-foreground/10 pt-2">
                    <i className="fas fa-info-circle text-blue-400 mr-1"></i>
                    <span>Rota mais rápida calculada</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-xs">
              <i className="fas fa-info-circle text-blue-400 mr-1"></i>
              <span>Selecione um crime para planejar a rota</span>
            </div>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-8 left-4 z-[1000]">
        <CrimeLegend crimeTypeCounts={countByType} />
      </div>

      {/* Spider-Man Status */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <SpidermanStatus />
      </div>
      
      {/* Google Maps style search bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-1/3 min-w-64">
        <div className="bg-white rounded-full shadow-lg flex items-center overflow-hidden">
          <div className="pl-4 pr-2">
            <i className={`fas ${isSearching ? 'fa-circle-notch fa-spin' : 'fa-search'} text-gray-500`}></i>
          </div>
          <input 
            type="text" 
            className="py-2 px-2 w-full border-none outline-none text-gray-700" 
            placeholder="Buscar locais no mundo inteiro..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                try {
                  setIsSearching(true);
                  const results = await provider.current.search({ query: searchQuery });
                  setSearchResults(results || []);
                  
                  if (results && results.length > 0 && mapRef.current) {
                    // Simplificando para evitar problemas com tipos
                    // Vamos apenas acessar as propriedades do resultado de forma segura
                    const result = results[0];
                    console.log("Resultado da busca:", result);
                    
                    if (result && result.y && result.x) {
                      mapRef.current.flyTo([result.y, result.x], 15, {
                        animate: true,
                        duration: 1.5
                      });
                    } else {
                      console.log("Formato de resultado não suportado:", result);
                    }
                  }
                } catch (error) {
                  console.error("Erro ao buscar local:", error);
                } finally {
                  setIsSearching(false);
                }
              }
            }}
          />
        </div>
        
        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div 
                key={index} 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800 border-b border-gray-200"
                onClick={() => {
                  if (mapRef.current) {
                    try {
                      // Simplificamos para apenas verificar as propriedades diretas
                      if (result && result.y && result.x) {
                        mapRef.current.flyTo([result.y, result.x], 15, {
                          animate: true,
                          duration: 1.5
                        });
                      } else {
                        console.log("Resultado com formato não suportado:", result);
                      }
                    } catch (error) {
                      console.error("Erro ao processar resultado:", error);
                    }
                    
                    // Limpa os resultados e atualiza a entrada
                    setSearchResults([]);
                    setSearchQuery(result && result.label ? result.label : "");
                  }
                }}
              >
                {result && result.label ? result.label : "Localização"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
