import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { BucketListItem, BucketListCategory } from '../lib/types';
import Fireworks from '../components/Fireworks';

const CATEGORIES: { id: BucketListCategory; icon: string; color: string; colorDark: string }[] = [
  { id: 'Lugares', icon: '📍', color: '#7ba5b8', colorDark: '#1a3b4c' },
  { id: 'Restaurantes', icon: '🍝', color: '#c9956c', colorDark: '#4a2f1d' },
  { id: 'Películas', icon: '🍿', color: '#b87da8', colorDark: '#4a2340' },
  { id: 'Aventuras', icon: '⛺', color: '#7dab8e', colorDark: '#1e3827' },
  { id: 'Metas', icon: '🎯', color: '#d4878f', colorDark: '#4d2025' },
];

const SUGGESTIONS = [
  { title: 'Hacer una ruta de trekking nueva', cat: 'Aventuras' },
  { title: 'Probar ese nuevo restaurante de sushi', cat: 'Restaurantes' },
  { title: 'Maratón de películas de terror', cat: 'Películas' },
  { title: 'Viajar a un país que no conozcamos', cat: 'Lugares' },
  { title: 'Ahorrar para comprar un auto', cat: 'Metas' },
];

function IconPlus() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}

export default function BucketList() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<BucketListCategory | 'Todos'>('Todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  // Form State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<BucketListCategory>('Aventuras');
  const [saving, setSaving] = useState(false);

  // Handle hiding fireworks automatically
  useEffect(() => {
    if (showFireworks) {
      const timer = setTimeout(() => setShowFireworks(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showFireworks]);

  useEffect(() => {
    fetchItems();
  }, [couple?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!couple || isMockMode) return;

    const channel = supabase
      .channel('bucket-list-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_list_items',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => fetchItems(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, isMockMode]);

  const fetchItems = async () => {
    if (!couple) return;

    if (isMockMode) {
      setItems([]); // Start empty to show the beautiful empty state
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bucket_list_items')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error al cargar bucket list:', error);
      } else if (data) {
        setItems(data as BucketListItem[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (
    e?: React.FormEvent,
    suggestionTitle?: string,
    suggestionCat?: BucketListCategory,
  ) => {
    if (e) e.preventDefault();
    const titleToSave = suggestionTitle || newItemTitle;
    const catToSave = suggestionCat || newItemCategory;

    if (!couple || !profile || !titleToSave.trim() || saving) return;

    setSaving(true);

    if (isMockMode) {
      const newItem: BucketListItem = {
        id: Date.now().toString(),
        couple_id: couple.id,
        title: titleToSave.trim(),
        category: catToSave,
        is_completed: false,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      };
      setItems([newItem, ...items]);
      setNewItemTitle('');
      setShowAddForm(false);
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from('bucket_list_items').insert({
        couple_id: couple.id,
        title: titleToSave.trim(),
        category: catToSave,
        created_by: profile.id,
      });

      if (error) throw error;

      setNewItemTitle('');
      setShowAddForm(false);
      await fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (item: BucketListItem) => {
    if (isMockMode) {
      setItems(items.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)));
      if (!item.is_completed) setShowFireworks(true);
      return;
    }

    try {
      setItems(items.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)));

      if (!item.is_completed) setShowFireworks(true);

      const { error } = await supabase
        .from('bucket_list_items')
        .update({
          is_completed: !item.is_completed,
          completed_at: !item.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', item.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling item:', err);
      await fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este deseo de la lista?')) return;

    if (isMockMode) {
      setItems(items.filter((i) => i.id !== id));
      return;
    }

    try {
      const { error } = await supabase.from('bucket_list_items').delete().eq('id', id);
      if (error) throw error;
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === 'Todos') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (a.is_completed === b.is_completed) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.is_completed ? 1 : -1;
    });
  }, [filteredItems]);

  const getAuthorName = (userId: string) => {
    if (userId === profile?.id) return 'Ti';
    return partner?.display_name || 'Tu pareja';
  };

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.is_completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <PageTransition className="page">
      {/* Floating Action Button */}
      {!showAddForm && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="animate-slide-up"
          aria-label="Añadir meta"
          onClick={() => setShowAddForm(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--dock-bottom) + var(--dock-height) + var(--space-md))',
            right: 'var(--space-md)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg-primary)',
            boxShadow: '0 8px 24px var(--color-accent-glow)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
        >
          <IconPlus />
        </motion.button>
      )}

      <div className="container" style={{ paddingBottom: '100px' }}>
        {showFireworks && (
          <Fireworks
            intensity="high"
            colors={['#FF3B30', '#34C759', '#007AFF', '#FFCC00']}
            confetti={true}
          />
        )}

        {/* Header Section */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h2>Nuestros Deseos</h2>
          <p
            className="text-secondary"
            style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}
          >
            Metas, locuras y lugares por conquistar juntos.
          </p>

          {/* Progress Card */}
          {totalItems > 0 && (
            <div
              className="glass-card animate-fade-in"
              style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)' }}
            >
              <div className="row row--between" style={{ marginBottom: 'var(--space-sm)' }}>
                <div
                  className="row row--gap-xs"
                  style={{ color: 'var(--color-accent)', fontWeight: 600 }}
                >
                  <IconTrophy />
                  <span>Progreso</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                  {completedItems}{' '}
                  <span
                    className="text-secondary"
                    style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}
                  >
                    / {totalItems}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'var(--gradient-accent)',
                    borderRadius: '4px',
                    transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                />
              </div>
              {progressPercent === 100 && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-sm)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    animation: 'pulse 2s infinite',
                  }}
                >
                  ¡Han completado todos sus deseos! Añadan más para seguir la aventura.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters (Horizontal scroll) - Only show if there are items */}
        {totalItems > 0 && !showAddForm && (
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '8px',
              paddingBottom: 'var(--space-md)',
              margin: '0 calc(-1 * var(--space-md)) var(--space-md)',
              paddingLeft: 'var(--space-md)',
              paddingRight: 'var(--space-md)',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <button
              className="btn btn--sm"
              onClick={() => setActiveCategory('Todos')}
              style={{
                whiteSpace: 'nowrap',
                background:
                  activeCategory === 'Todos'
                    ? 'var(--color-text-primary)'
                    : 'var(--color-bg-secondary)',
                color:
                  activeCategory === 'Todos'
                    ? 'var(--color-bg-primary)'
                    : 'var(--color-text-secondary)',
                borderColor: activeCategory === 'Todos' ? 'transparent' : 'var(--color-border)',
                fontWeight: activeCategory === 'Todos' ? 700 : 500,
              }}
            >
              Todo
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="btn btn--sm"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap',
                  background:
                    activeCategory === cat.id ? `${cat.color}22` : 'var(--color-bg-secondary)',
                  color: activeCategory === cat.id ? cat.color : 'var(--color-text-secondary)',
                  borderColor: activeCategory === cat.id ? cat.color : 'var(--color-border)',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                }}
              >
                {cat.icon} {cat.id}
              </button>
            ))}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <form
            onSubmit={(e) => handleAddItem(e)}
            className="glass-card animate-slide-up"
            style={{
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-lg)',
              border: '1px solid var(--color-accent-glow)',
              boxShadow: '0 10px 30px var(--color-bg-primary)',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-md)',
                marginBottom: 'var(--space-md)',
              }}
            >
              ¿Qué aventura sigue? ✨
            </div>

            <input
              type="text"
              className="input"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Ej: Ir de camping a la montaña..."
              autoFocus
              style={{
                marginBottom: 'var(--space-md)',
                fontSize: 'var(--font-size-base)',
                padding: '12px 16px',
              }}
            />

            <div
              style={{
                marginBottom: 'var(--space-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              Categoría
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-lg)',
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="btn btn--sm"
                  onClick={() => setNewItemCategory(cat.id)}
                  style={{
                    background:
                      newItemCategory === cat.id ? `${cat.color}22` : 'var(--color-bg-primary)',
                    borderColor: newItemCategory === cat.id ? cat.color : 'var(--color-border)',
                    color: newItemCategory === cat.id ? cat.color : 'var(--color-text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {cat.icon} {cat.id}
                </button>
              ))}
            </div>

            <div className="row row--gap-sm">
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={!newItemTitle.trim() || saving}
              >
                {saving ? 'Guardando...' : 'Añadir deseo'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* List / Empty States */}
        {loading ? (
          <div className="text-center text-secondary" style={{ padding: 'var(--space-2xl) 0' }}>
            Cargando deseos...
          </div>
        ) : totalItems === 0 && !showAddForm ? (
          // Ultra Premium Empty State
          <div className="animate-fade-in stack stack--lg">
            <div
              className="glass-card text-center"
              style={{ padding: 'var(--space-2xl) var(--space-md)' }}
            >
              <div
                style={{
                  fontSize: '64px',
                  marginBottom: 'var(--space-sm)',
                  filter: 'drop-shadow(0 4px 12px rgba(229,197,115,0.3))',
                }}
              >
                🎯
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-xs)' }}>
                El lienzo está en blanco
              </h3>
              <p
                className="text-secondary"
                style={{ margin: '0 auto', maxWidth: '280px', lineHeight: 1.5 }}
              >
                Su lista de deseos aún está vacía. Es el momento perfecto para empezar a planear su
                próxima gran aventura juntos.
              </p>
              <button
                className="btn btn--primary"
                style={{ marginTop: 'var(--space-lg)' }}
                onClick={() => setShowAddForm(true)}
              >
                Añadir nuestro primer deseo
              </button>
            </div>

            <div>
              <div
                className="row row--gap-sm"
                style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }}
              >
                <span style={{ fontSize: '18px' }}>💡</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Ideas para empezar
                </span>
              </div>
              <div className="stack stack--sm">
                {SUGGESTIONS.map((sug, i) => {
                  const cat = CATEGORIES.find((c) => c.id === sug.cat)!;
                  return (
                    <div
                      key={i}
                      className="glass-card row row--between"
                      style={{ padding: 'var(--space-md)', borderLeft: `3px solid ${cat.color}` }}
                    >
                      <div
                        className="stack stack--xs"
                        style={{ flex: 1, paddingRight: 'var(--space-sm)' }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                          {sug.title}
                        </div>
                        <div style={{ fontSize: '11px', color: cat.color, fontWeight: 700 }}>
                          {cat.icon} {cat.id}
                        </div>
                      </div>
                      <button
                        className="btn btn--sm"
                        onClick={() =>
                          handleAddItem(undefined, sug.title, sug.cat as BucketListCategory)
                        }
                        style={{
                          background: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                        }}
                        disabled={saving}
                      >
                        + Añadir
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 && !showAddForm ? (
          <div
            className="text-center text-secondary glass-card"
            style={{ padding: 'var(--space-2xl) var(--space-md)', opacity: 0.8 }}
          >
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>🔍</div>
            <p>No hay deseos pendientes en esta categoría.</p>
          </div>
        ) : (
          <div className="stack stack--md">
            {sortedItems.map((item) => {
              const cat = CATEGORIES.find((c) => c.id === item.category);
              return (
                <div
                  key={item.id}
                  className="glass-card animate-slide-up"
                  style={{
                    padding: 'var(--space-md)',
                    opacity: item.is_completed ? 0.6 : 1,
                    display: 'flex',
                    gap: 'var(--space-md)',
                    alignItems: 'flex-start',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: item.is_completed
                      ? 'var(--color-bg-secondary)'
                      : 'var(--color-bg-card)',
                    border: `1px solid ${item.is_completed ? 'transparent' : 'var(--color-border)'}`,
                    boxShadow: item.is_completed ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Custom animated checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleComplete(item)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: `2px solid ${item.is_completed ? cat?.color : 'var(--color-text-secondary)'}`,
                      background: item.is_completed ? cat?.color : 'transparent',
                      color: 'var(--color-bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: item.is_completed ? 'scale(1.05)' : 'scale(1)',
                      marginTop: '2px',
                    }}
                  >
                    {item.is_completed && <IconCheck />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 'var(--font-size-md)',
                        color: item.is_completed
                          ? 'var(--color-text-secondary)'
                          : 'var(--color-text-primary)',
                        textDecoration: item.is_completed ? 'line-through' : 'none',
                        lineHeight: 1.4,
                        transition: 'all 0.3s',
                      }}
                    >
                      {item.title}
                    </div>

                    <div className="row row--gap-sm" style={{ marginTop: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: cat?.color,
                          fontWeight: 700,
                          background: `${cat?.color}15`,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {cat?.icon} {cat?.id}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        por {getAuthorName(item.created_by)}
                      </span>
                    </div>
                  </div>

                  {/* Context menu / Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-tertiary)',
                      padding: '4px',
                      cursor: 'pointer',
                      opacity: 0.5,
                    }}
                    title="Eliminar"
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '0.5')}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
