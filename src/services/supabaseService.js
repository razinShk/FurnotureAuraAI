import { supabase } from '../lib/supabase';

// Production in-memory cache (starts empty - no mock sample data)
let localCatalog = [];
let localStores = [];
let localEvents = [];
let localQuotes = [];

/**
 * 1. Fetch Catalog Items from Supabase
 */
export async function fetchCatalogItems({ category, storeId, search } = {}) {
  try {
    let query = supabase.from('catalog_items').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const formatted = data.map(item => ({
        id: item.id,
        storeId: item.store_id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        color: item.color,
        prompt: item.prompt,
        dimensions: item.dimensions,
        material: item.material,
        imageUrl: item.image_url,
        inStock: item.in_stock
      }));
      localCatalog = formatted;
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase catalog query notice:', err.message);
  }

  // Filter in-memory if query failed
  let results = [...localCatalog];
  if (category && category !== 'all') {
    results = results.filter(i => i.category === category);
  }
  if (storeId && storeId !== 'all') {
    results = results.filter(i => i.storeId === storeId);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }
  return results;
}

/**
 * 2. Add New Furniture Item to Showroom Catalog
 */
export async function addCatalogItem(newItem) {
  const itemPayload = {
    id: newItem.id || 'cat-' + Date.now(),
    store_id: newItem.storeId || 'store-1',
    name: newItem.name,
    category: newItem.category,
    price: Number(newItem.price),
    color: newItem.color || '#4f46e5',
    prompt: newItem.prompt || `a luxury modern ${newItem.name}`,
    dimensions: newItem.dimensions || 'Standard Showroom Sizing',
    material: newItem.material || 'Architectural Grade Fabric / Hardwood',
    image_url: newItem.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    in_stock: true
  };

  try {
    const { data, error } = await supabase.from('catalog_items').insert([itemPayload]).select();
    if (!error && data && data[0]) {
      const added = {
        id: data[0].id,
        storeId: data[0].store_id,
        name: data[0].name,
        category: data[0].category,
        price: Number(data[0].price),
        color: data[0].color,
        prompt: data[0].prompt,
        dimensions: data[0].dimensions,
        material: data[0].material,
        imageUrl: data[0].image_url,
        inStock: data[0].in_stock
      };
      localCatalog.unshift(added);
      return added;
    }
  } catch (err) {
    console.warn('Supabase catalog insert error:', err);
  }

  const fallbackItem = {
    ...newItem,
    id: itemPayload.id,
    storeId: itemPayload.store_id,
    price: Number(itemPayload.price),
    imageUrl: itemPayload.image_url,
    inStock: true
  };
  localCatalog.unshift(fallbackItem);
  return fallbackItem;
}

/**
 * 3. Delete Furniture Item from Catalog
 */
export async function deleteCatalogItem(id) {
  try {
    await supabase.from('catalog_items').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase catalog delete error:', err);
  }
  localCatalog = localCatalog.filter(i => i.id !== id);
  return true;
}

/**
 * 4. Fetch Retail Stores from Supabase
 */
export async function fetchStores() {
  try {
    const { data, error } = await supabase.from('stores').select('*');
    if (!error && data) {
      const formatted = data.map(s => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline,
        ownerId: s.owner_id,
        ownerEmail: s.owner_email,
        location: s.location,
        activeCatalogCount: s.active_catalog_count || 0,
        avatar: s.avatar || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
        credits: s.credits || 500
      }));
      localStores = formatted;
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase stores fetch notice:', err.message);
  }
  return localStores;
}

/**
 * 4B. Register New Retail Store
 */
export async function createStore(storeData) {
  const payload = {
    id: storeData.id || 'store-' + Date.now(),
    name: storeData.name,
    tagline: storeData.tagline || 'Modern Architecture & Showroom Collection',
    owner_id: storeData.ownerId || 'biller-user',
    owner_email: storeData.ownerEmail || 'retailer@aura.ai',
    location: storeData.location || 'New York / Milan',
    avatar: storeData.avatar || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    credits: 500,
    active_catalog_count: 0
  };

  try {
    const { data, error } = await supabase.from('stores').insert([payload]).select();
    if (!error && data && data[0]) {
      const created = {
        id: data[0].id,
        name: data[0].name,
        tagline: data[0].tagline,
        ownerId: data[0].owner_id,
        ownerEmail: data[0].owner_email,
        location: data[0].location,
        avatar: data[0].avatar,
        credits: data[0].credits,
        activeCatalogCount: 0
      };
      localStores.push(created);
      return created;
    }
  } catch (err) {
    console.warn('Store creation note:', err);
  }

  localStores.push(payload);
  return payload;
}

/**
 * 5. Record Customer Staging Event (for Retailer Staging Analytics)
 */
export async function recordStagingEvent(event) {
  const eventPayload = {
    id: 'evt-' + Date.now(),
    customer_id: event.customerId || 'guest',
    customer_name: event.customerName || 'Valued Customer',
    customer_email: event.customerEmail || 'customer@aura.ai',
    store_id: event.storeId || 'store-1',
    store_name: event.storeName || 'Aura Showroom',
    furniture_id: event.furnitureId || 'unknown',
    furniture_name: event.furnitureName || 'Custom Staged Item',
    furniture_price: Number(event.furniturePrice || 0),
    room_type: event.roomType || 'Living Room',
    action: event.action || 'staged'
  };

  try {
    await supabase.from('staging_events').insert([eventPayload]);
  } catch (err) {
    console.log('Staging event supabase write notice:', err);
  }

  localEvents.unshift({
    ...eventPayload,
    timestamp: new Date().toISOString()
  });
}

/**
 * 6. Fetch Staging Events for Retail Biller
 */
export async function fetchStagingEvents(storeId) {
  try {
    let query = supabase.from('staging_events').select('*').order('created_at', { ascending: false });
    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data.map(e => ({
        id: e.id,
        customerId: e.customer_id,
        customerName: e.customer_name,
        customerEmail: e.customer_email,
        storeId: e.store_id,
        storeName: e.store_name,
        furnitureId: e.furniture_id,
        furnitureName: e.furniture_name,
        furniturePrice: Number(e.furniture_price),
        roomType: e.room_type,
        action: e.action,
        timestamp: e.created_at
      }));
    }
  } catch (err) {
    console.log('Staging events fetch notice:', err);
  }

  if (storeId && storeId !== 'all') {
    return localEvents.filter(e => e.store_id === storeId);
  }
  return localEvents;
}

/**
 * 7. Submit Room Quotation Request
 */
export async function submitRoomQuote(quote) {
  const quotePayload = {
    id: 'quote-' + Date.now(),
    customer_name: quote.customerName || 'Aura Customer',
    customer_email: quote.customerEmail || 'customer@aura.ai',
    customer_phone: quote.customerPhone || '',
    store_id: quote.storeId || 'store-1',
    items: quote.items || [],
    total_estimate: Number(quote.total || 0),
    status: 'pending'
  };

  try {
    await supabase.from('quotes').insert([quotePayload]);
  } catch (err) {
    console.warn('Quote submission note:', err);
  }

  localQuotes.unshift(quotePayload);

  await recordStagingEvent({
    customerId: 'cust-quote',
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    storeId: quote.storeId || 'store-1',
    action: 'inquired_quote'
  });

  return { success: true, quote: quotePayload };
}

/**
 * 8. User Projects / Saved Room Designs
 */
export async function saveRoomProject(project) {
  const payload = {
    id: project.id || 'proj_' + Date.now(),
    user_id: project.userId || 'guest_user',
    name: project.name || 'My Luxury Room Design',
    thumbnail_url: project.thumbnailUrl || '',
    pins: project.pins || [],
    versions: project.versions || [],
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('auraroom_projects').upsert([payload]).select();
    if (!error && data) {
      return data[0];
    }
  } catch (err) {
    console.warn('Project save note:', err);
  }
  return payload;
}

export async function fetchRoomProject(projectId) {
  try {
    const { data, error } = await supabase.from('auraroom_projects').select('*').eq('id', projectId).single();
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.log('Project fetch notice:', err);
  }
  return null;
}

export async function fetchUserRoomProjects(userId) {
  if (!userId || userId === 'guest_user' || userId === 'guest-user') return [];
  try {
    const { data, error } = await supabase
      .from('auraroom_projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Fetch user projects error:', err);
  }
  return [];
}

export async function deleteRoomProject(projectId) {
  try {
    await supabase.from('auraroom_projects').delete().eq('id', projectId);
    return true;
  } catch (err) {
    console.warn('Delete project error:', err);
    return false;
  }
}

/**
 * 9. Synchronize Clerk User with Supabase Profiles Table
 */
export async function syncClerkUserWithSupabase(clerkUser, role = 'customer') {
  if (!clerkUser) return null;

  const email = (clerkUser.primaryEmailAddress?.emailAddress || 'user@aura.ai').toLowerCase();
  const name = clerkUser.fullName || clerkUser.firstName || email.split('@')[0];
  const avatarUrl = clerkUser.imageUrl || '';

  // Explicit Super Admin Designation
  const isSuperAdmin = email === 'razinshaikh3133@gmail.com';
  const effectiveRole = isSuperAdmin ? 'admin' : (role || 'customer');

  const identity = {
    id: clerkUser.id,
    email,
    name,
    avatar_url: avatarUrl,
    role: effectiveRole,
    updated_at: new Date().toISOString()
  };

  try {
    // 1. Query by email to prevent Postgres UUID parse error for Clerk IDs (e.g. user_...)
    const { data: existing, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      const updatePayload = {
        name,
        avatar_url: avatarUrl,
        role: effectiveRole,
        credits: isSuperAdmin ? Math.max(existing.credits || 0, 5000) : (existing.credits ?? 100),
        plan: isSuperAdmin ? 'Super Admin Unlimited' : (existing.plan || 'Free Explorer'),
        updated_at: new Date().toISOString()
      };
      const { data: updated } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      return updated || { ...existing, ...updatePayload, id: clerkUser.id };
    }

    // First sign-in: create the profile with the starter allowance for the role.
    const fresh = {
      email,
      name,
      avatar_url: avatarUrl,
      role: effectiveRole,
      credits: isSuperAdmin ? 5000 : (effectiveRole === 'admin' ? 5000 : effectiveRole === 'biller' ? 850 : 100),
      plan: isSuperAdmin ? 'Super Admin Unlimited' : (effectiveRole === 'admin' ? 'Super Admin Unlimited' : effectiveRole === 'biller' ? 'Retailer Enterprise' : 'Free Explorer'),
      updated_at: new Date().toISOString()
    };

    // If clerkUser.id happens to be a valid UUID, include it; otherwise omit id to let Supabase generate a valid UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clerkUser.id)) {
      fresh.id = clerkUser.id;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert([fresh])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;
    return inserted || { ...fresh, id: clerkUser.id };
  } catch (err) {
    console.log('Supabase profile sync note:', err.message);
    return {
      ...identity,
      credits: isSuperAdmin ? 5000 : 100,
      plan: isSuperAdmin ? 'Super Admin Unlimited' : 'Free Explorer'
    };
  }
}
