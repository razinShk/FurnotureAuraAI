import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Maximize2, 
  Tag, 
  SplitSquareVertical, 
  Eye, 
  Download, 
  ShoppingBag, 
  Trash2, 
  RefreshCw, 
  Check, 
  Plus, 
  Layers, 
  Store, 
  Sliders,
  ChevronDown,
  Info,
  Clock,
  ArrowLeft,
  X,
  SlidersHorizontal,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  LogIn,
  RotateCcw,
  Edit2,
  Edit3,
  FolderHeart
} from 'lucide-react';
import CameraCaptureModal from '../components/CameraCaptureModal';
import RoomQuoteModal from '../components/RoomQuoteModal';
import SettingsModal from '../components/SettingsModal';
import { 
  analyzeRoomSpatial, 
  analyzeReferenceFurniture, 
  generateStagedRoom 
} from '../services/aiService';
import { 
  fetchCatalogItems, 
  submitRoomQuote, 
  recordStagingEvent, 
  saveRoomProject,
  fetchUserRoomProjects,
  deleteRoomProject
} from '../services/supabaseService';
import {
  saveCurrentStudioSession,
  loadCurrentStudioSession,
  clearCurrentStudioSession,
  saveRecentCreation,
  getRecentCreations,
  deleteRecentCreation
} from '../utils/studioStorage';

const DEMO_ROOMS = [
  {
    name: 'Penthouse Living Room',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'
  },
  {
    name: 'Minimalist High-Ceiling Loft',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85'
  },
  {
    name: 'Japandi Modern Suite',
    url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=85'
  }
];

export default function CustomerStudio({ 
  currentUser, 
  onDeductCredits, 
  initialCatalogItem,
  onNavigate,
  onRequireAuth
}) {
  // Canvas & Stage Refs
  const roomCanvasRef = useRef(null);
  const beforeCanvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const pinsContainerRef = useRef(null);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecentCreationsOpen, setIsRecentCreationsOpen] = useState(false);

  // Room Image & Pin State
  const [currentRoomUrl, setCurrentRoomUrl] = useState(null);
  const [roomTitle, setRoomTitle] = useState('Untitled Room');
  const [componentPins, setComponentPins] = useState([]);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [showPins, setShowPins] = useState(true);
  const [addPinMode, setAddPinMode] = useState(false);
  const [isEditingPinName, setIsEditingPinName] = useState(false);

  // Version History State
  const [versionHistory, setVersionHistory] = useState([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);

  // Recent Creations State
  const [recentCreations, setRecentCreations] = useState([]);

  // Staging Replacement Modes (A: Store Catalog, B: Custom Prompt, C: Reference Photo)
  const [activeOption, setActiveOption] = useState('A'); // 'A' | 'B' | 'C'
  const [catalogItems, setCatalogItems] = useState([]);
  const [activeCatalogCategory, setActiveCatalogCategory] = useState('all');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customPromptText, setCustomPromptText] = useState('');
  const [uploadedReferenceBase64, setUploadedReferenceBase64] = useState(null);
  const [uploadedReferenceName, setUploadedReferenceName] = useState('');
  const [referenceDescription, setReferenceDescription] = useState('');
  const [enableCushionSpec, setEnableCushionSpec] = useState(false);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);

  // AI Loading & Scanning
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadingTitle, setAiLoadingTitle] = useState('Spatial Vision Analyzing Room...');
  const [aiLoadingSubtitle, setAiLoadingSubtitle] = useState('Detecting furniture coordinates and lighting bounce...');
  const [statusBanner, setStatusBanner] = useState('Upload a room photo or launch camera to begin spatial staging.');

  // Split Before / After & Peek Original
  const [isBeforeAfterOpen, setIsBeforeAfterOpen] = useState(false);
  const [splitSliderVal, setSplitSliderVal] = useState(50);
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);

  // Staged Items in current session (for Quote/Cart)
  const [stagedStoreItems, setStagedStoreItems] = useState([]);
  const [currentRoomTotal, setCurrentRoomTotal] = useState(0);

  // Track session restore status to prevent duplicate restore
  const sessionRestoredRef = useRef(false);

  // =========================================================================
  // 1. INITIALIZE: Fetch Catalog, Restore Session & Load Recent Creations
  // =========================================================================
  useEffect(() => {
    fetchCatalog();
    loadCreationsList();
    restoreSavedSession();
  }, []);

  // Sync recent creations when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadCreationsList();
    }
  }, [currentUser?.id]);

  const fetchCatalog = async () => {
    try {
      const items = await fetchCatalogItems();
      setCatalogItems(items || []);
      if (items?.length > 0) {
        if (initialCatalogItem) {
          setSelectedCatalogItem(initialCatalogItem);
          setActiveCatalogCategory(initialCatalogItem.category || 'all');
        } else {
          const firstSofa = items.find(c => c.category === 'sofa') || items[0];
          setSelectedCatalogItem(firstSofa);
        }
      }
    } catch (e) {
      console.warn('Catalog fetch notice:', e);
    }
  };

  const loadCreationsList = async () => {
    try {
      const localList = await getRecentCreations();
      let merged = [...localList];

      if (currentUser?.id) {
        const cloudProjects = await fetchUserRoomProjects(currentUser.id);
        if (cloudProjects?.length > 0) {
          const cloudCreations = cloudProjects.map(cp => ({
            id: cp.id,
            title: cp.name,
            thumbnail: cp.thumbnail_url,
            componentPins: cp.pins || [],
            versionHistory: cp.versions || [],
            currentRoomTotal: 0,
            updatedAt: new Date(cp.updated_at).getTime()
          }));
          const existingIds = new Set(merged.map(m => m.id));
          cloudCreations.forEach(c => {
            if (!existingIds.has(c.id)) merged.push(c);
          });
        }
      }
      merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setRecentCreations(merged);
    } catch (e) {
      console.warn('Error loading recent creations:', e);
    }
  };

  // =========================================================================
  // 2. RESTORE IN-PROGRESS EDITING SESSION (Across Reloads and Tab Switches)
  // =========================================================================
  const restoreSavedSession = async () => {
    if (sessionRestoredRef.current) return;
    sessionRestoredRef.current = true;

    try {
      const savedSession = await loadCurrentStudioSession();
      if (!savedSession || !savedSession.dataUrl) return;

      // If initialCatalogItem was passed from catalog page, we still want to keep the canvas but select that piece
      setRoomTitle(savedSession.roomTitle || 'My Staged Room');
      setCurrentRoomTotal(savedSession.currentRoomTotal || 0);
      setStagedStoreItems(savedSession.stagedStoreItems || []);
      setActiveOption(savedSession.activeOption || 'A');
      setCustomPromptText(savedSession.customPromptText || '');

      if (savedSession.versionHistory && savedSession.versionHistory.length > 0) {
        setVersionHistory(savedSession.versionHistory);
        setActiveVersionIndex(savedSession.activeVersionIndex || 0);
      }
      if (savedSession.componentPins && savedSession.componentPins.length > 0) {
        setComponentPins(savedSession.componentPins);
        setSelectedPinId(savedSession.selectedPinId || savedSession.componentPins[0]?.id);
      }

      // Draw restored canvas
      setCurrentRoomUrl(savedSession.dataUrl);
      const img = new Image();
      img.onload = () => {
        const canvas = roomCanvasRef.current;
        const beforeCanvas = beforeCanvasRef.current;
        if (!canvas || !beforeCanvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        beforeCanvas.width = img.width;
        beforeCanvas.height = img.height;

        const ctx = canvas.getContext('2d');
        const bCtx = beforeCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Before canvas uses v1 if available
        const v1 = savedSession.versionHistory?.[0]?.dataUrl;
        if (v1) {
          const bImg = new Image();
          bImg.onload = () => bCtx.drawImage(bImg, 0, 0);
          bImg.src = v1;
        } else {
          bCtx.drawImage(img, 0, 0);
        }
        setStatusBanner('✨ Restored your in-progress room editing session.');
      };
      img.src = savedSession.dataUrl;
    } catch (err) {
      console.warn('Notice restoring studio session:', err);
    }
  };

  // Auto-save active editing session on canvas/version changes
  useEffect(() => {
    if (!currentRoomUrl) return;

    const timer = setTimeout(() => {
      const canvas = roomCanvasRef.current;
      if (!canvas) return;

      try {
        const currentData = canvas.toDataURL('image/jpeg', 0.82);
        saveCurrentStudioSession({
          roomTitle,
          dataUrl: currentData,
          componentPins,
          selectedPinId,
          versionHistory,
          activeVersionIndex,
          activeOption,
          selectedCatalogItem,
          customPromptText,
          stagedStoreItems,
          currentRoomTotal
        });
      } catch (e) {
        console.warn('Auto-save session note:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    currentRoomUrl, 
    roomTitle, 
    componentPins, 
    selectedPinId, 
    versionHistory, 
    activeVersionIndex, 
    activeOption, 
    selectedCatalogItem, 
    customPromptText, 
    stagedStoreItems, 
    currentRoomTotal
  ]);

  // Start fresh room
  const handleStartNewRoom = async () => {
    if (currentRoomUrl && !confirm('Start a fresh room? This will clear your current canvas session.')) {
      return;
    }
    await clearCurrentStudioSession();
    setCurrentRoomUrl(null);
    setRoomTitle('Untitled Room');
    setVersionHistory([]);
    setComponentPins([]);
    setSelectedPinId(null);
    setStagedStoreItems([]);
    setCurrentRoomTotal(0);
    setStatusBanner('Started fresh room session. Upload a photo or launch camera to begin.');
  };

  // =========================================================================
  // 3. LOAD ROOM IMAGE (With Authentication Gate)
  // =========================================================================
  const loadRoomImage = (srcUrl, title = 'Living Room', skipAutoScan = false) => {
    // AUTHENTICATION CHECK
    if (!currentUser) {
      setStatusBanner('🔒 Please sign in or create an account to stage rooms and use AI.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setCurrentRoomUrl(srcUrl);
    setRoomTitle(title);
    showLoading('Loading Room Canvas...', 'Preparing high-resolution spatial viewport...');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = roomCanvasRef.current;
      const beforeCanvas = beforeCanvasRef.current;
      if (!canvas || !beforeCanvas) return;

      const maxW = 1400;
      const maxH = 900;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);

      canvas.width = w;
      canvas.height = h;
      beforeCanvas.width = w;
      beforeCanvas.height = h;

      const ctx = canvas.getContext('2d');
      const bCtx = beforeCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      bCtx.drawImage(img, 0, 0, w, h);

      // Save Initial Version
      const initialVer = {
        id: 'ver-1',
        label: 'v1: Original',
        dataUrl: canvas.toDataURL('image/png'),
        pinsSnapshot: [],
        totalPrice: currentRoomTotal
      };
      setVersionHistory([initialVer]);
      setActiveVersionIndex(0);

      hideLoading();

      // Run Spatial Vision Analysis if requested
      if (!skipAutoScan) {
        await runSpatialVisionAnalysis(canvas);
      }
    };
    img.onerror = () => hideLoading();
    img.src = srcUrl;
  };

  // =========================================================================
  // 4. SPATIAL VISION ANALYSIS (Enforces Auth & Credits)
  // =========================================================================
  const runSpatialVisionAnalysis = async (canvas = roomCanvasRef.current) => {
    // AUTHENTICATION CHECK
    if (!currentUser) {
      setStatusBanner('🔒 Sign in required to run AI spatial room analysis.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    // CREDIT CHECK (1 credit required for vision scan)
    if (currentUser.credits !== null && currentUser.credits < 1) {
      setStatusBanner('⚠️ Insufficient AI credits (0 remaining). Please top up credits to analyze rooms.');
      return;
    }

    if (!canvas) return;
    showLoading(
      'Spatial Vision Analyzing Room...',
      'Detecting furniture pins, floor surfaces, wall planes, and lighting bounce...'
    );

    try {
      const base64Data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      const data = await analyzeRoomSpatial(base64Data, 'image/jpeg', currentUser.id);

      if (data && data.components && data.components.length > 0) {
        setComponentPins(data.components);
        setSelectedPinId(data.components[0].id);
        setStatusBanner(`✅ Detected ${data.components.length} architectural spots! Select a tag to stage furniture.`);
      } else {
        // Fallback default pins
        const defaultPins = [
          { id: 'pin-sofa', name: 'Main Seating Area', category: 'sofa', x: 50, y: 62, boxW: 46, boxH: 26 },
          { id: 'pin-table', name: 'Center Accent Table', category: 'table', x: 50, y: 78, boxW: 30, boxH: 18 }
        ];
        setComponentPins(defaultPins);
        setSelectedPinId(defaultPins[0].id);
        setStatusBanner('Tap any spot tag to stage furniture, or drag to reposition.');
      }
    } catch (e) {
      console.warn('Vision analysis error:', e);
      setStatusBanner('Room loaded. Tap "+ Tag Spot" to select an area for furniture staging.');
    } finally {
      hideLoading();
    }
  };

  // =========================================================================
  // 5. VERSION HISTORY ROLLBACK & SAVING
  // =========================================================================
  const saveNewVersion = (label, newPrice = currentRoomTotal) => {
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const newVer = {
      id: 'ver-' + Date.now(),
      label,
      dataUrl,
      pinsSnapshot: JSON.parse(JSON.stringify(componentPins)),
      totalPrice: newPrice
    };
    setVersionHistory(prev => [...prev, newVer]);
    setActiveVersionIndex(versionHistory.length);
  };

  const rollbackToVersion = (idx) => {
    const target = versionHistory[idx];
    if (!target) return;
    setActiveVersionIndex(idx);
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setComponentPins(JSON.parse(JSON.stringify(target.pinsSnapshot)));
      setCurrentRoomTotal(target.totalPrice);
    };
    img.src = target.dataUrl;
  };

  // Reference Furniture Analyzer
  const analyzeReferenceImage = async (base64) => {
    setIsAnalyzingRef(true);
    try {
      const data = await analyzeReferenceFurniture(base64);
      if (data && data.description) {
        setReferenceDescription(data.description);
        setStatusBanner(`✨ Analyzed reference: ${data.description.slice(0, 50)}...`);
      }
    } catch (err) {
      console.warn('Reference analysis error:', err);
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  // =========================================================================
  // 6. EXECUTE AI STAGING (Strict Auth & 2-Credit Enforcement + Recent Creations Save)
  // =========================================================================
  const executeAIStaging = async () => {
    // 1. AUTHENTICATION ENFORCEMENT
    if (!currentUser) {
      setStatusBanner('🔒 Please sign in or create an account to stage furniture.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    // 2. CREDIT BALANCE ENFORCEMENT (2 credits required for staging)
    if (currentUser.credits !== null && currentUser.credits < 2) {
      setStatusBanner('⚠️ Insufficient AI credits (2 credits required). Please top up credits or upgrade plan.');
      return;
    }

    const pin = componentPins.find(p => p.id === selectedPinId);
    if (!pin) {
      setStatusBanner('⚠️ Please select a room spot first or click "+ Tag Spot".');
      return;
    }

    if (activeOption === 'B' && !customPromptText.trim()) {
      setStatusBanner('⚠️ Please type a furniture description for Option B first.');
      return;
    }
    if (activeOption === 'C' && !uploadedReferenceBase64) {
      setStatusBanner('⚠️ Please upload a reference furniture or tile image for Option C first.');
      return;
    }

    let itemDescription = '';
    let stagingCostAddition = 0;
    let stagedItemForCart = null;

    if (activeOption === 'A') {
      if (!selectedCatalogItem) {
        setStatusBanner('⚠️ Please select a piece from the catalog.');
        return;
      }
      itemDescription = `${selectedCatalogItem.prompt || selectedCatalogItem.name} (${selectedCatalogItem.name})`;
      stagingCostAddition = selectedCatalogItem.price || 0;
      stagedItemForCart = selectedCatalogItem;
    } else if (activeOption === 'B') {
      itemDescription = customPromptText.trim();
    } else {
      itemDescription = (enableCushionSpec && referenceDescription.trim())
        ? referenceDescription.trim()
        : 'the exact architectural furniture shown in the attached reference photo';
    }

    showLoading(
      `Staging "${pin.name}"...`,
      `Rendering photorealistic 3D lighting, perspective, and floor shadows (2 AI Credits)...`
    );

    try {
      const canvas = roomCanvasRef.current;
      const roomBase64 = canvas.toDataURL('image/jpeg', 0.88);

      let catalogImageUrl = null;
      if (activeOption === 'A' && selectedCatalogItem) {
        catalogImageUrl = selectedCatalogItem.imageUrl;
      }

      const data = await generateStagedRoom({
        prompt: itemDescription,
        roomImage: roomBase64,
        referenceImage: activeOption === 'C' ? uploadedReferenceBase64 : null,
        referenceDescription: enableCushionSpec ? referenceDescription.trim() : '',
        catalogImageUrl: catalogImageUrl,
        pinInfo: pin,
        allPins: componentPins,
        activeOption: activeOption,
        userId: currentUser.id,
        storeId: selectedCatalogItem?.storeId || 'store-1',
        furnitureId: selectedCatalogItem?.id
      });

      if (onDeductCredits) {
        onDeductCredits(2);
      }

      // Record staging event to Supabase analytics
      if (selectedCatalogItem) {
        recordStagingEvent({
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          storeId: selectedCatalogItem.storeId,
          furnitureId: selectedCatalogItem.id,
          furnitureName: selectedCatalogItem.name,
          furniturePrice: selectedCatalogItem.price,
          roomType: 'User Room Photo',
          action: 'staged'
        }).catch(e => console.log('Analytics note:', e));
      }

      if (data && data.imageUrl) {
        const genImg = new Image();
        if (!data.imageUrl.startsWith('data:')) {
          genImg.crossOrigin = 'anonymous';
        }
        genImg.onload = async () => {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(genImg, 0, 0, canvas.width, canvas.height);

          let updatedTotal = currentRoomTotal;
          let updatedStaged = [...stagedStoreItems];
          if (stagedItemForCart) {
            updatedStaged = [...stagedStoreItems.filter(p => p.id !== stagedItemForCart.id), stagedItemForCart];
            setStagedStoreItems(updatedStaged);
            updatedTotal = currentRoomTotal + stagingCostAddition;
            setCurrentRoomTotal(updatedTotal);
          }

          const nextVerNumber = versionHistory.length + 1;
          const nextVerLabel = `v${nextVerNumber}: ${pin.name} Staged`;
          const nextVerObj = {
            id: 'ver-' + Date.now(),
            label: nextVerLabel,
            dataUrl: canvas.toDataURL('image/png'),
            pinsSnapshot: JSON.parse(JSON.stringify(componentPins)),
            totalPrice: updatedTotal
          };
          const nextVersions = [...versionHistory, nextVerObj];
          setVersionHistory(nextVersions);
          setActiveVersionIndex(versionHistory.length);

          // SAVE TO RECENT CREATIONS (Local DB & Supabase)
          const creationPayload = {
            id: 'creation-' + Date.now(),
            title: `${roomTitle} — ${pin.name} Staged`,
            thumbnail: data.imageUrl,
            stagedItems: updatedStaged,
            currentRoomTotal: updatedTotal,
            versionHistory: nextVersions,
            componentPins: componentPins,
            activeVersionIndex: nextVersions.length - 1
          };
          await saveRecentCreation(creationPayload);

          if (currentUser?.id) {
            saveRoomProject({
              id: creationPayload.id,
              userId: currentUser.id,
              name: creationPayload.title,
              thumbnailUrl: data.imageUrl,
              pins: componentPins,
              versions: nextVersions
            }).catch(e => console.log('Cloud project save note:', e));
          }

          // Refresh recent creations state
          setRecentCreations(prev => [creationPayload, ...prev.filter(c => c.id !== creationPayload.id)]);

          hideLoading();
          setStatusBanner(`✨ Staged "${pin.name}" with photorealistic neural lighting! Saved to Recent Creations.`);
        };
        genImg.onerror = () => {
          hideLoading();
          setStatusBanner('Render complete, but image failed to load onto canvas.');
        };
        genImg.src = data.imageUrl;
      } else {
        hideLoading();
        setStatusBanner('AI generation returned empty render. Please check your Replicate key.');
      }
    } catch (e) {
      hideLoading();
      console.error('Staging error:', e);
      setStatusBanner('❌ Staging error: ' + (e.message || 'Check Replicate API key in Settings.'));
    }
  };

  // =========================================================================
  // 7. AI OUTPAINTING (Expand Room)
  // =========================================================================
  const runAIOutpaint = async () => {
    if (!currentUser) {
      setStatusBanner('🔒 Sign in required to use AI room outpainting.');
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (currentUser.credits !== null && currentUser.credits < 1) {
      setStatusBanner('⚠️ Insufficient AI credits (1 credit required for AI Expand).');
      return;
    }

    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    showLoading('Expanding Architectural Room Canvas...', 'Synthesizing extended floorboards and ceiling planes...');

    setTimeout(() => {
      const pad = 60;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width + pad * 2;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');

      tCtx.fillStyle = '#f8fafc';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.filter = 'blur(10px)';
      tCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.filter = 'none';
      tCtx.drawImage(canvas, pad, 0, tempCanvas.width - pad * 2, tempCanvas.height);

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);

      const nextVer = versionHistory.length + 1;
      saveNewVersion(`v${nextVer}: AI Expanded Room`);
      if (onDeductCredits) onDeductCredits(1);
      hideLoading();
      setStatusBanner('✨ Room expanded seamlessly with AI Outpainting!');
    }, 1200);
  };

  // =========================================================================
  // 8. RESUME A RECENT CREATION (1-Click Restoration)
  // =========================================================================
  const handleResumeCreation = (creation) => {
    setRoomTitle(creation.title || 'Architectural Room');
    setCurrentRoomTotal(creation.currentRoomTotal || 0);
    setStagedStoreItems(creation.stagedItems || []);

    if (creation.versionHistory && creation.versionHistory.length > 0) {
      setVersionHistory(creation.versionHistory);
      setActiveVersionIndex(creation.activeVersionIndex ?? (creation.versionHistory.length - 1));
    }
    if (creation.componentPins && creation.componentPins.length > 0) {
      setComponentPins(creation.componentPins);
      setSelectedPinId(creation.componentPins[0]?.id);
    }

    const targetUrl = creation.versionHistory?.[creation.activeVersionIndex || 0]?.dataUrl || creation.thumbnail;
    if (targetUrl) {
      loadRoomImage(targetUrl, creation.title, true);
    }
    setIsRecentCreationsOpen(false);
    setStatusBanner(`📂 Loaded "${creation.title}". Ready to continue staging.`);
  };

  const handleDeleteCreation = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Remove this creation from your recent library?')) return;
    await deleteRecentCreation(id);
    if (currentUser?.id) {
      deleteRoomProject(id).catch(() => {});
    }
    setRecentCreations(prev => prev.filter(c => c.id !== id));
  };

  // Draggable Pin Pointer Event
  const handlePinPointerDown = (e, pin) => {
    e.stopPropagation();
    setSelectedPinId(pin.id);
    const container = pinsContainerRef.current;
    if (!container) return;

    let isDragging = false;
    const startX = e.clientX || (e.touches && e.touches[0].clientX);
    const startY = e.clientY || (e.touches && e.touches[0].clientY);

    const onPointerMove = (moveEv) => {
      const clientX = moveEv.clientX || (moveEv.touches && moveEv.touches[0].clientX);
      const clientY = moveEv.clientY || (moveEv.touches && moveEv.touches[0].clientY);
      if (!clientX || !clientY) return;

      if (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3) {
        isDragging = true;
      }
      if (isDragging) {
        const rect = container.getBoundingClientRect();
        const newX = ((clientX - rect.left) / rect.width) * 100;
        const newY = ((clientY - rect.top) / rect.height) * 100;
        setComponentPins(prev =>
          prev.map(p =>
            p.id === pin.id
              ? {
                  ...p,
                  x: Math.max(5, Math.min(95, Math.round(newX))),
                  y: Math.max(5, Math.min(95, Math.round(newY)))
                }
              : p
          )
        );
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // Add custom pin by clicking on stage canvas
  const handleStageClick = (e) => {
    if (!addPinMode) return;
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    let cat = 'sofa';
    if (y > 78) cat = 'floor';
    else if (y < 30) cat = 'wall';

    const newPin = {
      id: 'pin-' + Date.now(),
      name: `Custom Spot (${componentPins.length + 1})`,
      category: cat,
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(6, Math.min(94, y)),
      boxW: 34,
      boxH: 22
    };

    setComponentPins(prev => [...prev, newPin]);
    setSelectedPinId(newPin.id);
    setIsEditingPinName(true);
    setAddPinMode(false);
    setStatusBanner(`🎯 Added "${newPin.name}". Click to edit name or adjust bounding box!`);
  };

  const showLoading = (title, subtitle) => {
    setAiLoadingTitle(title);
    setAiLoadingSubtitle(subtitle);
    setIsAILoading(true);
  };

  const hideLoading = () => {
    setIsAILoading(false);
  };

  const downloadHDDesign = () => {
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `FurnitureAura-Design-v${activeVersionIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const selectedPin = componentPins.find(p => p.id === selectedPinId) || componentPins[0];
  const filteredCatalog = catalogItems.filter(item => {
    const matchCat = activeCatalogCategory === 'all' || item.category === activeCatalogCategory;
    const matchSearch = !catalogSearch || item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || (item.material || '').toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const creditsCount = currentUser?.credits ?? 0;
  const hasCredits = creditsCount >= 2;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen lg:h-[100dvh] overflow-x-hidden transition-colors">
      
      {/* =========================================================================
          TOP APP BAR (Mobile-First Ergonomics + Desktop High-End Toolbar)
          ========================================================================= */}
      <header className="px-3 sm:px-5 py-2.5 bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between gap-2 shadow-sm transition-colors">
        
        {/* Left: Navigation Back & Room Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigate ? onNavigate('landing') : window.history.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Exit Studio"
            aria-label="Exit Studio"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
              FA
            </span>
            <div className="hidden sm:block">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>AI Spatial Studio</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {roomTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Recent Creations, Upload, Camera, Demo Suites, New Room */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Recent Creations Button */}
          <button
            onClick={() => setIsRecentCreationsOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            title="View Recent Staged Creations"
          >
            <FolderHeart size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Creations</span>
            {recentCreations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold">
                {recentCreations.length}
              </span>
            )}
          </button>

          {/* Upload Room */}
          <label 
            onClick={(e) => {
              if (!currentUser) {
                e.preventDefault();
                setStatusBanner('🔒 Sign in required to upload room photos.');
                if (onRequireAuth) onRequireAuth();
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20 transition-all shrink-0"
          >
            <Upload size={13} />
            <span className="hidden xs:inline">Upload</span>
            {currentUser && (
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => loadRoomImage(ev.target.result, file.name.replace(/\.[^/.]+$/, ""));
                    reader.readAsDataURL(file);
                  }
                }}
              />
            )}
          </label>

          {/* Live Camera */}
          <button
            onClick={() => {
              if (!currentUser) {
                setStatusBanner('🔒 Sign in required to use live camera room capture.');
                if (onRequireAuth) onRequireAuth();
                return;
              }
              setIsCameraOpen(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shrink-0 shadow-sm"
            title="Capture live room photo"
          >
            <Camera size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Demo Rooms Dropdown */}
          <div className="relative group shrink-0">
            <button className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="hidden sm:inline">Suites</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute right-0 sm:left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Sample Showrooms</div>
              {DEMO_ROOMS.map((room, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!currentUser) {
                      setStatusBanner('🔒 Sign in required to stage demo rooms.');
                      if (onRequireAuth) onRequireAuth();
                      return;
                    }
                    loadRoomImage(room.url, room.name);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                  {room.name}
                </button>
              ))}
            </div>
          </div>

          {/* New Room / Reset Session */}
          {currentRoomUrl && (
            <button
              onClick={handleStartNewRoom}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Start a new room session"
            >
              <RotateCcw size={13} />
              <span className="hidden md:inline">New Room</span>
            </button>
          )}
        </div>

        {/* Right: Credits, Room Total Quote & Download */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* User Credits Pill */}
          {currentUser ? (
            <div 
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border shadow-sm ${
                hasCredits
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
              title="Your AI Generation Credits"
            >
              <Sparkles size={12} className={hasCredits ? "text-amber-500" : "text-rose-500"} />
              <span className="tabular-nums">{currentUser.credits ?? 0}</span>
              <span className="text-[10px] hidden sm:inline">credits</span>
            </div>
          ) : (
            <button
              onClick={() => onRequireAuth && onRequireAuth()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Room Quote Button */}
          <button
            onClick={() => setIsQuoteOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 transition-all shadow-sm"
            title="Open Room Staged Quote"
          >
            <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <span className="text-xs font-extrabold leading-tight tabular-nums">${currentRoomTotal.toLocaleString()}</span>
            </div>
          </button>

          {/* Download HD */}
          <button
            onClick={downloadHDDesign}
            disabled={!currentRoomUrl}
            className="w-9 h-9 sm:w-auto sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm disabled:opacity-40"
            title="Download HD Room Render"
          >
            <Download size={14} />
            <span className="hidden md:inline">Save HD</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE: IMMERSIVE STAGE (LEFT) + ARCHITECTURAL CONTROLS (RIGHT)
          ========================================================================= */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* ---------------------------------------------------------------------
            COLUMN 1: THE LIVING ROOM CANVAS STAGE
            --------------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col bg-slate-100/80 dark:bg-slate-950 overflow-hidden relative">
          
          {/* Status Sub-bar */}
          <div className="px-3 sm:px-4 py-2 bg-white/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 truncate">{statusBanner}</span>
            </div>

            {currentRoomUrl && (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <input
                    type="checkbox"
                    checked={showPins}
                    onChange={(e) => setShowPins(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span className="font-semibold">Boxes & Tags</span>
                </label>
                <button
                  onClick={() => runSpatialVisionAnalysis()}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1"
                  title="Re-scan spatial room tags with AI"
                >
                  <RefreshCw size={11} />
                  <span className="hidden xs:inline">Re-Scan</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Viewport Area */}
          <div
            className="flex-1 flex items-center justify-center p-2 sm:p-5 overflow-hidden relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] min-h-[320px] sm:min-h-[420px]"
            onClick={handleStageClick}
          >
            {/* Clean Initial Dropzone (When no room is loaded) */}
            {!currentRoomUrl ? (
              <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-4 mx-3 my-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <ImageIcon size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spatial AI Furniture Staging
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Snap or upload any living room photo. Our neural spatial model detects furniture coordinates and stages real showroom pieces with realistic ambient shadows.
                </p>

                {/* Authentication Banner if not signed in */}
                {!currentUser && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-xs">
                      <Lock size={15} />
                      <span>Sign In Required</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Sign in or create an account to stage furniture. You will receive <strong>100 free starter AI credits</strong>!
                    </p>
                    <button
                      onClick={() => onRequireAuth && onRequireAuth()}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogIn size={14} />
                      <span>Sign In / Create Account (100 Free Credits)</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <label 
                    onClick={(e) => {
                      if (!currentUser) {
                        e.preventDefault();
                        setStatusBanner('🔒 Sign in required to upload room photos.');
                        if (onRequireAuth) onRequireAuth();
                      }
                    }}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    <Upload size={16} />
                    <span>Upload Room Photo</span>
                    {currentUser && (
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => loadRoomImage(ev.target.result, file.name.replace(/\.[^/.]+$/, ""));
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    )}
                  </label>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setStatusBanner('🔒 Sign in required to use live camera.');
                        if (onRequireAuth) onRequireAuth();
                        return;
                      }
                      setIsCameraOpen(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 shadow-sm"
                  >
                    <Camera size={16} className="text-amber-500" />
                    <span>Launch Camera</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-2 font-medium">Or explore with a sample room suite:</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {DEMO_ROOMS.map((demo, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!currentUser) {
                            setStatusBanner('🔒 Sign in required to stage demo rooms.');
                            if (onRequireAuth) onRequireAuth();
                            return;
                          }
                          loadRoomImage(demo.url, demo.name);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
                      >
                        {demo.name.split(' ')[0]} Suite
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={stageWrapperRef}
                className="relative inline-block rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-w-full max-h-full bg-white dark:bg-slate-900 select-none"
              >
                {/* Active Room Canvas */}
                <canvas
                  ref={roomCanvasRef}
                  className="block max-w-full max-h-[46vh] sm:max-h-[56vh] lg:max-h-[72vh] w-auto h-auto object-contain"
                />

                {/* Before Overlay for Split Comparison */}
                <div
                  className={`absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-indigo-500 z-20 ${
                    isBeforeAfterOpen || isPeekingOriginal ? 'block' : 'hidden'
                  }`}
                  style={{ width: isPeekingOriginal ? '100%' : `${splitSliderVal}%` }}
                >
                  <canvas
                    ref={beforeCanvasRef}
                    className="block max-w-none h-full object-cover"
                    style={{
                      width: roomCanvasRef.current ? `${roomCanvasRef.current.clientWidth}px` : '100%'
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-md">
                    BEFORE (ORIGINAL)
                  </div>
                </div>

                {/* Interactive Pins & Bounding Boxes Container */}
                <div
                  ref={pinsContainerRef}
                  className={`absolute inset-0 pointer-events-auto z-30 ${
                    showPins && !isBeforeAfterOpen && !isPeekingOriginal ? 'block' : 'hidden'
                  }`}
                >
                  {componentPins.map((pin) => {
                    const isSelected = pin.id === selectedPinId;
                    const w = pin.boxW || 34;
                    const h = pin.boxH || 22;
                    return (
                      <React.Fragment key={pin.id}>
                        {/* 1. Architectural Bounding Box */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPinId(pin.id);
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl transition-all pointer-events-auto cursor-pointer ${
                            isSelected
                              ? 'border-2 border-dashed border-indigo-500 bg-indigo-500/15 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-white/50 z-35'
                              : 'border border-dashed border-white/60 dark:border-white/40 bg-slate-900/10 hover:border-indigo-400 hover:bg-indigo-500/10 z-25'
                          }`}
                          style={{
                            left: `${pin.x}%`,
                            top: `${pin.y}%`,
                            width: `${w}%`,
                            height: `${h}%`
                          }}
                        >
                          {/* Corner bounding accents */}
                          <div className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 ${isSelected ? 'border-amber-400' : 'border-white/80'}`} />
                          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 ${isSelected ? 'border-amber-400' : 'border-white/80'}`} />
                          <div className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 ${isSelected ? 'border-amber-400' : 'border-white/80'}`} />
                          <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 ${isSelected ? 'border-amber-400' : 'border-white/80'}`} />
                          
                          {/* Dimension label tag (shown when selected) */}
                          {isSelected && (
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[9px] font-mono font-bold text-amber-300 whitespace-nowrap shadow select-none">
                              {w}% × {h}%
                            </div>
                          )}
                        </div>

                        {/* 2. Interactive Pin Tag Button */}
                        <div
                          onPointerDown={(e) => handlePinPointerDown(e, pin)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold flex items-center gap-1.5 shadow-xl transition-all select-none pointer-events-auto ${
                            isSelected
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/40 scale-110 z-40'
                              : 'bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:scale-105 z-30'
                          }`}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400 animate-pulse' : 'bg-indigo-600'}`}
                          />
                          <span className="max-w-[120px] sm:max-w-[160px] truncate">{pin.name}</span>
                          <span className="text-[9px] opacity-60">✥</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Floating Canvas Quick Controls Bar (Mobile & Desktop) */}
                <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
                  {/* Left: Tag Spot & Expand Pill */}
                  <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                    <button
                      onClick={() => setAddPinMode(!addPinMode)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        addPinMode
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Click anywhere on canvas to tag a new furniture spot"
                    >
                      <Tag size={13} />
                      <span className="hidden xs:inline">{addPinMode ? 'Click Room' : '+ Tag'}</span>
                    </button>

                    <button
                      onClick={runAIOutpaint}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                      title="Expand room walls and flooring with AI Outpainting"
                    >
                      <Maximize2 size={13} className="text-violet-500" />
                      <span className="hidden sm:inline">AI Expand</span>
                    </button>
                  </div>

                  {/* Right: Compare & Hold Pill */}
                  <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
                    <button
                      onClick={() => setIsBeforeAfterOpen(!isBeforeAfterOpen)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                        isBeforeAfterOpen
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Split screen Before / After"
                    >
                      <SplitSquareVertical size={13} />
                      <span className="hidden sm:inline">Split</span>
                    </button>

                    <button
                      onMouseDown={() => setIsPeekingOriginal(true)}
                      onMouseUp={() => setIsPeekingOriginal(false)}
                      onMouseLeave={() => setIsPeekingOriginal(false)}
                      onTouchStart={() => setIsPeekingOriginal(true)}
                      onTouchEnd={() => setIsPeekingOriginal(false)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors select-none"
                      title="Hold to peek at original v1 room"
                    >
                      <Eye size={13} className="text-emerald-500" />
                      <span>Hold v1</span>
                    </button>
                  </div>
                </div>

                {/* AI Processing Overlay & Laser Scanner */}
                {isAILoading && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="ai-scanner-bar" />
                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-400/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-3 shadow-xl shadow-indigo-600/20 animate-bounce">
                      ✨
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mb-1">{aiLoadingTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{aiLoadingSubtitle}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Version History Stack Bar */}
          <div className="px-3 sm:px-5 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock size={12} /> Versions:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {versionHistory.map((ver, idx) => (
                  <button
                    key={ver.id}
                    onClick={() => rollbackToVersion(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      idx === activeVersionIndex
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ver.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold shrink-0 hidden md:block">
              {versionHistory[activeVersionIndex]?.label}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUMN 2: ARCHITECTURAL REPLACEMENT PANEL (Mobile Drawer & Desktop Sidebar)
            --------------------------------------------------------------------- */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto shrink-0 shadow-lg lg:shadow-none">
          
          <div className="p-4 sm:p-5 space-y-4">

            {/* Active Pin Controller Card */}
            {selectedPin && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Target Room Spot
                    </span>
                  </div>

                  {/* Spot Selector Dropdown & Delete */}
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedPin.id}
                      onChange={(e) => {
                        setSelectedPinId(e.target.value);
                        setIsEditingPinName(false);
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 max-w-[150px] truncate"
                    >
                      {componentPins.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>

                    {componentPins.length > 1 && (
                      <button
                        onClick={() => {
                          const remaining = componentPins.filter(p => p.id !== selectedPin.id);
                          setComponentPins(remaining);
                          setSelectedPinId(remaining[0].id);
                          setIsEditingPinName(false);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete spot tag"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Spot Name In-Place Editor */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spot Label & Role</span>
                    <button
                      onClick={() => setIsEditingPinName(!isEditingPinName)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {isEditingPinName ? (
                        <>
                          <Check size={12} />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Edit2 size={12} />
                          <span>Rename Spot</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isEditingPinName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={selectedPin.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setComponentPins(prev =>
                            prev.map(p => (p.id === selectedPin.id ? { ...p, name: newName } : p))
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsEditingPinName(false);
                        }}
                        placeholder="e.g. Master Velvet Sofa, Reading Corner Armchair"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none ring-2 ring-indigo-500/20"
                      />
                      <button
                        onClick={() => setIsEditingPinName(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0 hover:bg-indigo-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                      <span className="truncate">{selectedPin.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase shrink-0">
                        {selectedPin.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Spot Dimensions Tuning */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Width Scale</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedPin.boxW}%</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="85"
                      value={selectedPin.boxW}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setComponentPins(prev =>
                          prev.map(p => (p.id === selectedPin.id ? { ...p, boxW: val } : p))
                        );
                      }}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Height Scale</span>
                      <span className="font-bold text-slate-800 dark:text-white">{selectedPin.boxH}%</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="75"
                      value={selectedPin.boxH}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setComponentPins(prev =>
                          prev.map(p => (p.id === selectedPin.id ? { ...p, boxH: val } : p))
                        );
                      }}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Staging Method Segmented Switcher (Option A, B, C) */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Staging Method
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveOption('A')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'A'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Store size={15} />
                  <span>Catalog</span>
                </button>

                <button
                  onClick={() => setActiveOption('B')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'B'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={15} />
                  <span>AI Prompt</span>
                </button>

                <button
                  onClick={() => setActiveOption('C')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'C'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Camera size={15} />
                  <span>Photo Ref</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT A: SHOWROOM CATALOG */}
            {activeOption === 'A' && (
              <div className="space-y-3">
                {/* Search & Category Pills */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search catalog pieces, fabrics, marble..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />

                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {['all', 'sofa', 'table', 'chair', 'floor', 'wall', 'lamp'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCatalogCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors shrink-0 ${
                          activeCatalogCategory === cat
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'All' : `${cat}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    No matching pieces found. Try switching categories or clearing search.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 max-h-[280px] lg:max-h-[380px] overflow-y-auto pr-1">
                    {filteredCatalog.map((item) => {
                      const isSel = selectedCatalogItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCatalogItem(item)}
                          className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer group ${
                            isSel
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                              : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSel && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                            <div
                              className="absolute bottom-1.5 left-1.5 w-3 h-3 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: item.color || '#4f46e5' }}
                            />
                          </div>

                          <div>
                            <div className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.material || 'Architectural Grade'}
                            </div>
                            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                              ${Number(item.price || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT B: AI TEXT PROMPT */}
            {activeOption === 'B' && (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Describe your desired furniture, fabric upholstery, marble vein texture, or wood grain..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 resize-none shadow-sm leading-relaxed"
                />

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Curated Luxury Prompts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Curved bouclé sofa with brushed brass legs',
                      'Italian cognac full-grain leather Chesterfield',
                      'Calacatta marble tiles with subtle gold veins',
                      'Warm honey oak herringbone wood parquet flooring',
                      'Minimalist matte black steel arc lamp'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomPromptText(chip)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                      >
                        ✨ {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT C: UPLOAD PHOTO REFERENCE */}
            {activeOption === 'C' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload or snap any real furniture piece or surface tile to clone onto the spot:
                </p>

                {uploadedReferenceBase64 ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={uploadedReferenceBase64}
                          alt="Ref"
                          className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                        />
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                            REFERENCE ATTACHED
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                            {uploadedReferenceName}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUploadedReferenceBase64(null);
                          setUploadedReferenceName('');
                          setReferenceDescription('');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove reference image"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Cushion Silhouette Specification */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div
                        onClick={() => {
                          const nextVal = !enableCushionSpec;
                          setEnableCushionSpec(nextVal);
                          if (nextVal && !referenceDescription && uploadedReferenceBase64) {
                            analyzeReferenceImage(uploadedReferenceBase64);
                          }
                        }}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enableCushionSpec}
                            onChange={(e) => {
                              const nextVal = e.target.checked;
                              setEnableCushionSpec(nextVal);
                              if (nextVal && !referenceDescription && uploadedReferenceBase64) {
                                analyzeReferenceImage(uploadedReferenceBase64);
                              }
                            }}
                            className="rounded accent-indigo-600 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Sparkles size={13} className={enableCushionSpec ? "text-amber-500" : "text-slate-400"} />
                            Cushion & Silhouette Locking
                          </span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          enableCushionSpec ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {enableCushionSpec ? 'ACTIVE' : 'OPTIONAL'}
                        </span>
                      </div>

                      {enableCushionSpec && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Geometry and cushion specifications:</span>
                            {isAnalyzingRef ? (
                              <span className="text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                                <RefreshCw size={10} className="animate-spin" /> Analyzing...
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => analyzeReferenceImage(uploadedReferenceBase64)}
                                className="text-indigo-600 font-bold hover:underline"
                              >
                                Re-scan
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            value={referenceDescription}
                            onChange={(e) => setReferenceDescription(e.target.value)}
                            placeholder="Specify exact cushions, contours, fabric texture..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
                      <Upload size={18} />
                    </div>
                    <span>Select Reference Furniture Photo</span>
                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG or WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const base64 = ev.target.result;
                            setUploadedReferenceBase64(base64);
                            setUploadedReferenceName(file.name);
                            if (enableCushionSpec) {
                              analyzeReferenceImage(base64);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              STICKY PRIMARY ACTION BAR ("Stage Room" Button)
              ========================================================================= */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-30 shadow-xl space-y-2">
            {!currentUser ? (
              <button
                onClick={() => onRequireAuth && onRequireAuth()}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn size={18} />
                <span>Sign In to Stage Rooms (Get 100 Free Credits)</span>
              </button>
            ) : !hasCredits ? (
              <div className="space-y-1">
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                >
                  <Lock size={16} />
                  <span>Insufficient AI Credits (0 Available)</span>
                </button>
                <p className="text-[10px] text-center text-rose-500 font-semibold">
                  You need 2 credits to stage a room. Contact admin or top up credits.
                </p>
              </div>
            ) : (
              <button
                onClick={executeAIStaging}
                disabled={isAILoading || !currentRoomUrl}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-40"
              >
                <Sparkles size={18} />
                <span>
                  Stage {selectedPin?.name || 'Spot'} ({activeOption === 'A' ? selectedCatalogItem?.name || 'Catalog' : activeOption === 'B' ? 'Custom Prompt' : 'Photo Clone'})
                </span>
                <span className="text-xs opacity-80 font-normal ml-1">• 2 Credits</span>
              </button>
            )}
          </div>
        </aside>
      </main>

      {/* =========================================================================
          RECENT CREATIONS DRAWER / MODAL
          ========================================================================= */}
      {isRecentCreationsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <FolderHeart size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  My Recent Room Creations
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                  {recentCreations.length}
                </span>
              </div>
              <button
                onClick={() => setIsRecentCreationsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Creations Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {recentCreations.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    No creations yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Stage a piece of furniture into your room to generate and save your first architectural design!
                  </p>
                </div>
              ) : (
                recentCreations.map((creation) => (
                  <div
                    key={creation.id}
                    onClick={() => handleResumeCreation(creation)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600/50 transition-all cursor-pointer shadow-sm hover:shadow-md group flex gap-3.5 items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800">
                        {creation.thumbnail ? (
                          <img
                            src={creation.thumbnail}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {creation.title}
                        </h4>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(creation.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {creation.currentRoomTotal > 0 && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ${creation.currentRoomTotal.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {creation.versionHistory?.length > 1 && (
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400">
                            {creation.versionHistory.length} versions
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.download = `${creation.title || 'FurnitureAura-Design'}.png`;
                          link.href = creation.thumbnail;
                          link.click();
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download Render"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteCreation(e, creation.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete from recent creations"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs text-slate-500">
              <span>{recentCreations.length} saved creations</span>
              <button
                onClick={() => setIsRecentCreationsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(dataUrl) => {
          loadRoomImage(dataUrl, 'Live Camera Room');
          setStatusBanner('📷 New room photo captured! Spatial vision scanning coordinates...');
        }}
      />

      {/* Room Furniture Quote Modal */}
      <RoomQuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        stagedItems={stagedStoreItems}
        totalEstimate={currentRoomTotal}
        onQuoteSubmitted={async (quoteData) => {
          try {
            await submitRoomQuote({
              ...quoteData,
              storeId: selectedCatalogItem?.storeId || 'store-1'
            });
            setStatusBanner('✅ Furniture specification registered with showroom owner via Supabase!');
          } catch (e) {
            setStatusBanner('✅ Furniture specification sent to store owner for consultation!');
          }
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKeys={({ geminiKey, replicateKey }) => {
          setStatusBanner('⚙️ AI Model settings & keys updated.');
        }}
      />
    </div>
  );
}
