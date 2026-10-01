import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { MapPin } from '../lib/types';
import Map, { Marker, Popup as MapboxPopup, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW1hcm9jcGRpdGEiLCJhIjoiY211b3BpODA5MDFhZTJ4cHlidmxpZnJrYiJ9.UdCQhPOXT4aZuh25adhymA';

function IconMap() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 12 12 17 22 12" />
      <polyline points="2 17 12 22 22 17" />
    </svg>
  );
}

function IconGps() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function CoupleMap() {
  const { couple, profile, isMockMode } = useAuth();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapRef>(null);
  
  // Add Pin Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('📍');
  const [saving, setSaving] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number, name?: string, address: string, loading: boolean} | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Geolocation
  const [isLocating, setIsLocating] = useState(false);
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  // Map Styles
  const MAP_STYLES = useMemo(() => [
    { id: 'streets', name: 'Estándar', url: 'mapbox://styles/mapbox/streets-v12' },
    { id: 'satellite', name: 'Satelital', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { id: 'light', name: 'Claro', url: 'mapbox://styles/mapbox/light-v11' },
    { id: 'dark', name: 'Oscuro', url: 'mapbox://styles/mapbox/dark-v11' },
  ], []);
  const [mapStyleIndex, setMapStyleIndex] = useState(0);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  useEffect(() => {
    fetchPins();
  }, [couple?.id]);

  useEffect(() => {
    if (!couple || isMockMode) return;
    const channel = supabase
      .channel('map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_pins', filter: `couple_id=eq.${couple.id}` }, () => fetchPins())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [couple?.id, isMockMode]);

  const fetchPins = async () => {
    if (!couple) return;
    if (isMockMode) {
      setPins([
        { id: '1', couple_id: 'mock', lat: -33.4489, lng: -70.6693, title: 'Nuestra primera cita', icon_emoji: '☕', created_by: 'me', created_at: new Date().toISOString() },
        { id: '2', couple_id: 'mock', lat: -33.0472, lng: -71.6127, title: 'Viaje a Valparaíso', icon_emoji: '🏖️', created_by: 'partner', created_at: new Date().toISOString() }
      ]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('map_pins')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPins(data);
    }
    setLoading(false);
  };

  const handleMapClick = useCallback(async (e: any) => {
    const coords = e.lngLat;
    if (!coords) return;
    const lat = coords.lat;
    const lng = coords.lng;

    setClickedLocation({ lat, lng, address: '', loading: true });
    setSelectedPinId(null); // Deselect custom pins
    
    // Check if they clicked a Mapbox POI (Point of Interest)
    const feature = e.features && e.features[0];
    if (feature && feature.properties && feature.properties.name) {
      setClickedLocation({
        lat,
        lng,
        name: feature.properties.name,
        address: feature.properties.name_en || feature.properties.name,
        loading: false
      });
      return;
    }

    // Otherwise, reverse geocode using Mapbox Search API
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,address`);
      const data = await res.json();
      
      const place = data.features?.[0];
      if (place) {
        setClickedLocation({ 
          lat, 
          lng, 
          name: place.text,
          address: place.place_name || 'Ubicación seleccionada', 
          loading: false 
        });
      } else {
        setClickedLocation({ lat, lng, address: 'Coordenadas seleccionadas', loading: false });
      }
    } catch (err) {
      setClickedLocation({ lat, lng, address: 'Coordenadas seleccionadas', loading: false });
    }
  }, []);

  const openAddForm = (lat: number, lng: number, prefillTitle: string = '') => {
    setClickedLocation(null);
    setSelectedCoords({ lat, lng });
    setNewTitle(prefillTitle);
    setShowAddForm(true);
  };

  const handleAddPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !profile || !selectedCoords || !newTitle.trim()) return;

    setSaving(true);
    try {
      if (!isMockMode) {
        await supabase.from('map_pins').insert({
          couple_id: couple.id,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          title: newTitle.trim(),
          icon_emoji: newEmoji,
          created_by: profile.id
        });
      }
      await fetchPins();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Borrar este recuerdo?')) return;
    if (isMockMode) {
      setPins(pins.filter(p => p.id !== id));
      return;
    }
    await supabase.from('map_pins').delete().eq('id', id);
    await fetchPins();
  };

  const closeForm = () => {
    setShowAddForm(false);
    setSelectedCoords(null);
    setNewTitle('');
    setNewEmoji('📍');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = searchQuery.trim();
      
      if (query.length > 2) {
        setIsSearching(true);
        
        // 1. Check if user pasted exact GPS coordinates from Google Maps (e.g. "-33.45, -70.66")
        const coordMatch = query.match(/^(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)$/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          setSearchResults([{
            id: 'coords',
            text: 'Coordenadas GPS Exactas',
            place_name: `Ubicación manual: ${lat}, ${lng}`,
            center: [lng, lat]
          }]);
          setIsSearching(false);
          return;
        }

        // 1.5 Check if user pasted a full Google Maps Link containing coordinates (e.g. "@-33.45,-70.66")
        const gmapsMatch = query.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (gmapsMatch) {
          const lat = parseFloat(gmapsMatch[1]);
          const lng = parseFloat(gmapsMatch[2]);
          setSearchResults([{
            id: 'gmaps',
            text: 'Link de Google Maps',
            place_name: `Coordenadas extraídas del link`,
            center: [lng, lat]
          }]);
          setIsSearching(false);
          return;
        }

        // 2. Clean up Google Maps specific copy-paste artifacts for better Nominatim results
        let cleanQuery = query
          .replace(/P\.º\s*/gi, '') // Remove Paseo abbreviation
          .replace(/\b\d{7}\b/g, '') // Remove 7-digit Chilean zip codes (e.g. 8320224)
          .replace(/,\s*Región Metropolitana/gi, '') // Nominatim handles cities better without regions
          .replace(/,\s*Chile/gi, '')
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/,\s*,/g, ',') // Remove empty comma sections
          .trim();

        // 3. Regular Address Search via Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&countrycodes=cl&limit=5`);
          const data = await res.json();
          
          const mappedData = data.map((item: any) => ({
            id: item.place_id.toString(),
            text: item.display_name.split(',')[0],
            place_name: item.display_name,
            center: [parseFloat(item.lon), parseFloat(item.lat)]
          }));
          
          // Deduplicate by text name to hide multiple street segments from OpenStreetMap
          const uniqueData = mappedData.filter((v: any, i: number, a: any[]) => 
            a.findIndex(v2 => (v2.text === v.text)) === i
          );
          
          setSearchResults(uniqueData);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectResult = (result: any, autoAdd: boolean = false) => {
    const lng = result.center[0];
    const lat = result.center[1];
    const placeName = result.text;
    
    // Fly to location
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 });
    setSearchResults([]);
    setSearchQuery('');
    
    if (autoAdd) {
      setTimeout(() => {
        openAddForm(lat, lng, placeName);
      }, 500);
    } else {
      // Open bottom sheet and drop a temporary pin
      setClickedLocation({
        lat,
        lng,
        name: placeName,
        address: result.place_name,
        loading: false
      });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMyLocation([lat, lng]);
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert('No pudimos acceder a tu ubicación. Verifica los permisos.');
        setIsLocating(false);
      }
    );
  };

  const defaultCenter = { lat: -33.4489, lng: -70.6693 };

  return (
    <div className="page" style={{ padding: 0, margin: 0, height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <style>
        {`
          .mapboxgl-control-container {
            display: none !important;
          }
        `}
      </style>
      
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: '64px', left: '0', right: '0', zIndex: 90, padding: 'var(--space-md)', pointerEvents: 'none' }}>
        <div className="glass-card" style={{ pointerEvents: 'auto', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', borderRadius: '20px' }}>
          <IconMap />
          <h2 style={{ fontSize: 'var(--font-size-sm)', margin: 0, letterSpacing: '0.5px' }}>Nuestro Mapa</h2>
        </div>
        
        {/* Search Bar */}
        <div style={{ pointerEvents: 'auto', position: 'relative', maxWidth: '400px' }}>
          <div className="row row--gap-xs" style={{ background: 'var(--color-bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <input 
              type="text" 
              className="input" 
              style={{ flex: 1, border: 'none', background: 'transparent' }} 
              placeholder="Buscar ciudad, restaurante..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div style={{ padding: '8px 12px', color: 'var(--color-text-tertiary)' }}>
              {isSearching ? '...' : <IconSearch />}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="glass-card animate-slide-up" style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', 
              maxHeight: '250px', overflowY: 'auto', padding: 'var(--space-sm)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <button onClick={() => setSearchResults([])} style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>Cerrar ✕</button>
              </div>
              {searchResults.map((result, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: '100%', textAlign: 'left', padding: 'var(--space-sm)',
                    background: 'transparent', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <div 
                    style={{ flex: 1, cursor: 'pointer' }} 
                    onClick={() => handleSelectResult(result, false)}
                  >
                    <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--color-accent)', fontSize: '13px' }}>{result.text}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', lineHeight: 1.2 }}>{result.place_name}</span>
                  </div>
                  <button 
                    onClick={() => handleSelectResult(result, true)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: defaultCenter.lng,
            latitude: defaultCenter.lat,
            zoom: 11
          }}
          mapStyle={MAP_STYLES[mapStyleIndex].url}
          interactiveLayerIds={['poi-label']}
          onClick={handleMapClick}
        >
          {/* User Location */}
          {myLocation && (
            <Marker longitude={myLocation[1]} latitude={myLocation[0]}>
              <div style={{ width: '16px', height: '16px', background: 'var(--color-primary)', border: '3px solid white', borderRadius: '50%', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}></div>
            </Marker>
          )}

          {/* Custom Pins */}
          {pins.map(pin => (
            <Marker 
              key={pin.id} 
              longitude={pin.lng} 
              latitude={pin.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedPinId(pin.id === selectedPinId ? null : pin.id);
              }}
            >
              <div style={{ fontSize: '28px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', cursor: 'pointer' }}>
                {pin.icon_emoji}
              </div>
            </Marker>
          ))}
          
          {/* Popups for Custom Pins */}
          {pins.map(pin => (
            selectedPinId === pin.id && (
              <MapboxPopup
                key={`popup-${pin.id}`}
                longitude={pin.lng}
                latitude={pin.lat}
                closeButton={true}
                closeOnClick={false}
                onClose={() => setSelectedPinId(null)}
                anchor="bottom"
                offset={20}
              >
                <div style={{ padding: '4px', textAlign: 'center', minWidth: '100px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#333' }}>{pin.title}</strong>
                  <button 
                    onClick={() => handleDelete(pin.id)}
                    style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Eliminar
                  </button>
                </div>
              </MapboxPopup>
            )
          ))}

          {/* Temporary Pin (Search Result or Map Click) */}
          {clickedLocation && !clickedLocation.loading && (
            <Marker longitude={clickedLocation.lng} latitude={clickedLocation.lat} anchor="bottom">
              <div className="animate-scale-in" style={{
                width: '32px', height: '32px',
                background: 'var(--color-accent)',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '2px solid white',
                cursor: 'pointer'
              }}>
                <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%' }} />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Google Maps Style Bottom Sheet for Selected Location */}
      {clickedLocation && (
        <div className="animate-slide-up" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
          padding: '20px 24px 32px 24px', overflow: 'hidden',
          background: 'var(--color-bg-primary)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderTop: '1px solid var(--color-border)'
        }}>
          {/* Visual Drag Handle */}
          <div style={{ width: '48px', height: '5px', background: 'var(--color-border)', borderRadius: '10px', margin: '0 auto 24px auto' }} />

          {/* Close button */}
          <button 
            onClick={() => setClickedLocation(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}
          >
            ✕
          </button>
          
          <div>
            {clickedLocation.loading ? (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-bg-secondary)', animation: 'pulse 1.5s infinite' }} />
                <div>
                  <div style={{ width: '140px', height: '20px', background: 'var(--color-bg-secondary)', marginBottom: '10px', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '220px', height: '14px', background: 'var(--color-bg-secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ paddingRight: '40px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
                    {clickedLocation.name || clickedLocation.address.split(',')[0]}
                  </h3>
                  {clickedLocation.address !== clickedLocation.name && (
                    <p style={{ 
                      margin: '0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {clickedLocation.address}
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => openAddForm(clickedLocation.lat, clickedLocation.lng, clickedLocation.name || clickedLocation.address.split(',')[0])}
                  className="btn btn--primary"
                  style={{ 
                    width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                    fontSize: '16px', fontWeight: '700', letterSpacing: '0.3px',
                    borderRadius: '16px'
                  }}
                >
                  <IconLocation /> 
                  <span>Guardar como Recuerdo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Controls (Right Side) */}
      <div style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 90, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Style Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          {showStyleMenu && (
            <div className="glass-card animate-scale-in" style={{
              position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px',
              padding: '6px', minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '2px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              borderRadius: '12px'
            }}>
              {MAP_STYLES.map((style, index) => (
                <button
                  key={style.id}
                  onClick={() => { setMapStyleIndex(index); setShowStyleMenu(false); }}
                  style={{
                    padding: '10px 12px', textAlign: 'left', 
                    background: mapStyleIndex === index ? 'var(--color-primary-light)' : 'transparent',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: mapStyleIndex === index ? '600' : '500',
                    color: mapStyleIndex === index ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-bg-primary)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              color: 'var(--color-text-secondary)',
              transition: 'var(--transition-fast)'
            }}
          >
            <IconLayers />
          </button>
        </div>

        {/* Locate Me FAB */}
        <button 
          onClick={handleLocateMe}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
            background: 'var(--color-bg-primary)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            color: isLocating ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
            transition: 'var(--transition-fast)'
          }}
        >
          {isLocating ? '...' : <IconGps />}
        </button>
      </div>

      {/* Add Pin Modal */}
      {showAddForm && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-lg)' }}>
            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Nuevo Recuerdo</h3>
            <form onSubmit={handleAddPin} className="col col--gap-md">
              <div>
                <label className="label">¿Qué lugar es?</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Nuestra primera cita..."
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Elige un Emoji</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                  {['📍', '☕', '🍷', '🍽️', '🌲', '🏖️', '⛰️', '🍿', '🍦', '❤️', '🏡'].map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      onClick={() => setNewEmoji(emoji)}
                      style={{ 
                        fontSize: '24px', background: newEmoji === emoji ? 'var(--color-border-hover)' : 'transparent',
                        border: newEmoji === emoji ? '1px solid var(--color-accent)' : '1px solid transparent', 
                        borderRadius: '8px', padding: '8px', cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '8px' }}>
                    <input
                      type="text"
                      maxLength={2}
                      value={!['📍', '☕', '🍷', '🍽️', '🌲', '🏖️', '⛰️', '🍿', '🍦', '❤️', '🏡'].includes(newEmoji) ? newEmoji : ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val) setNewEmoji(val);
                      }}
                      placeholder="+"
                      style={{
                        width: '44px', height: '44px', fontSize: '20px', textAlign: 'center',
                        background: !['📍', '☕', '🍷', '🍽️', '🌲', '🏖️', '⛰️', '🍿', '🍦', '❤️', '🏡'].includes(newEmoji) && newEmoji ? 'var(--color-border-hover)' : 'transparent',
                        border: !['📍', '☕', '🍷', '🍽️', '🌲', '🏖️', '⛰️', '🍿', '🍦', '❤️', '🏡'].includes(newEmoji) && newEmoji ? '1px solid var(--color-accent)' : '1px dashed var(--color-border)',
                        borderRadius: '8px', color: 'var(--color-text-primary)'
                      }}
                      title="Escribe tu propio emoji"
                    />
                  </div>
                </div>
              </div>
              <div className="row row--gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                <button type="button" onClick={closeForm} className="btn btn--secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
