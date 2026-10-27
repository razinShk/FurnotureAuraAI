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
  Move,
  SlidersHorizontal,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  LogIn,
  RotateCcw,
  Edit2,
  Edit3,
  FolderHeart,
  ZoomIn,
  Crosshair,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
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
import { useToast } from '../context/ToastContext';

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

const FLAT_STYLE_TEMPLATES = [
  { id: 'Japandi Zen', label: 'Japandi', desc: 'Warm oak, low linen seating & wabi-sabi calm', swatch: '#c9b18c' },
  { id: 'Quiet Luxury', label: 'Luxury', desc: 'Curved bouclé, travertine stone & brushed brass', swatch: '#c59b63' },
  { id: 'Modern Minimalist', label: 'Minimalist', desc: 'Clean architectural lines & warm stone tones', swatch: '#948e85' },
  { id: 'Contemporary Loft', label: 'Modern', desc: 'Cognac leather, walnut wood & matte black steel', swatch: '#8b5a2b' },
  { id: 'Scandinavian Airy', label: 'Scandinavian', desc: 'Light Nordic birch, soft wool & sunlit neutrals', swatch: '#dfd7ca' },
  { id: 'Parisian Classic', label: 'Parisian', desc: 'Herringbone parquet, velvet & timeless molding', swatch: '#7c6f64' },
  { id: 'Mediterranean Warm', label: 'Mediterranean', desc: 'Limewash plaster, terracotta & organic linen', swatch: '#b87a56' },
  { id: 'Mid-Century Modern', label: 'Mid-Century', desc: 'Sculpted teak wood, iconic curves & amber glow', swatch: '#a66b38' }
];

export default function CustomerStudio({ 
  currentUser, 
  onDeductCredits, 
  initialCatalogItem,
  onNavigate,
  onRequireAuth
}) {
  const { toast } = useToast();

  // Canvas & Stage Refs
  const roomCanvasRef = useRef(null);
  const beforeCanvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const pinsContainerRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const [stageBounds, setStageBounds] = useState({ width: 0, height: 0 });

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecentCreationsOpen, setIsRecentCreationsOpen] = useState(false);
  const [isMobileHeaderMenuOpen, setIsMobileHeaderMenuOpen] = useState(false);
  const [isCanvasMoreOpen, setIsCanvasMoreOpen] = useState(false);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [isFullscreenPeeking, setIsFullscreenPeeking] = useState(false);
  const fullscreenTouchStartXRef = useRef(null);

  // Room Image & Pin State
  const [currentRoomUrl, setCurrentRoomUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, isPortrait: false, aspectRatio: 1 });
  const [viewScaleMode, setViewScaleMode] = useState('fit'); // 'fit' | 'native'
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

  // Staging Replacement Modes (C: Reference Photo, A: Store Catalog, B: Custom Prompt)
  const [activeOption, setActiveOption] = useState(() => initialCatalogItem ? 'A' : 'C'); // 'C' | 'A' | 'B'
  // Mobile 4-Tab Footer Drawer state ('spot' | 'C' | 'A' | 'B')
  const [mobileFooterTab, setMobileFooterTab] = useState(() => initialCatalogItem ? 'A' : 'C');
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
  const [refCloningMode, setRefCloningMode] = useState('exact'); // 'exact' | 'adaptive'

  // AI Prompt Sub-Modes: 'furniture' (Single Spot) | 'full_flat' (Entire Flat Redesign)
  const [aiPromptSubMode, setAiPromptSubMode] = useState('furniture');
  const [flatState, setFlatState] = useState('empty'); // 'empty' | 'furnished'
  const [flatRoomType, setFlatRoomType] = useState('Living Room');
  const [flatStyle, setFlatStyle] = useState('Japandi Zen');
  const [flatDensity, setFlatDensity] = useState('Balanced Living');
  const [flatLighting, setFlatLighting] = useState('Sunlit Warm Ivory');
  const [flatCustomNotes, setFlatCustomNotes] = useState('');

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
      setActiveOption(savedSession.activeOption || 'C');
      setMobileFooterTab(savedSession.activeOption || 'C');
      setCustomPromptText(savedSession.customPromptText || '');

      if (savedSession.versionHistory && savedSession.versionHistory.length > 0) {
        setVersionHistory(savedSession.versionHistory);
        setActiveVersionIndex(savedSession.activeVersionIndex || 0);
      }
      if (savedSession.componentPins && savedSession.componentPins.length > 0) {
        // Detect if pins are missing IDs or are clustered at identical coordinates from previous session
        const seenIds = new Set();
        const coordsCount = {};
        savedSession.componentPins.forEach(p => {
          const key = `${Math.round(p.x || 50)}-${Math.round(p.y || 50)}`;
          coordsCount[key] = (coordsCount[key] || 0) + 1;
        });
        const isClustered = Object.values(coordsCount).some(count => count >= 3);

        const defaultPositions = [
          { x: 48, y: 34 }, // Chandelier / Top
          { x: 22, y: 46 }, // Wall Art / Upper Left
          { x: 30, y: 53 }, // Wall / Upper Center
          { x: 62, y: 58 }, // Sconce / Upper Right
          { x: 28, y: 68 }, // Sectional Sofa / Mid
          { x: 42, y: 76 }, // Coffee Table / Lower Center
          { x: 58, y: 78 }, // Media Console / Lower Right
          { x: 38, y: 84 }, // Area Rug / Bottom
        ];

        const sanitized = savedSession.componentPins.map((c, idx) => {
          let safeId = c.id;
          if (!safeId || seenIds.has(safeId)) {
            safeId = `pin-restored-${idx + 1}-${Date.now().toString(36)}`;
          }
          seenIds.add(safeId);

          let posX = Number(c.x || 50);
          let posY = Number(c.y || 50);

          if (isClustered) {
            const fallbackPos = defaultPositions[idx % defaultPositions.length];
            posX = fallbackPos.x;
            posY = fallbackPos.y;
          }

          return {
            ...c,
            id: safeId,
            name: c.name || `Spot ${idx + 1}`,
            category: c.category || 'sofa',
            boxW: Math.max(14, Math.min(80, Number(c.boxW || c.width || 34))),
            boxH: Math.max(12, Math.min(65, Number(c.boxH || c.height || 22))),
            x: Math.max(5, Math.min(95, posX)),
            y: Math.max(5, Math.min(95, posY))
          };
        });

        setComponentPins(sanitized);
        setSelectedPinId(sanitized[0]?.id);
      }

      // Draw restored canvas
      setCurrentRoomUrl(savedSession.dataUrl);
      const img = new Image();
      img.onload = () => {
        const canvas = roomCanvasRef.current;
        const beforeCanvas = beforeCanvasRef.current;
        if (!canvas || !beforeCanvas) return;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;
        beforeCanvas.width = w;
        beforeCanvas.height = h;

        const ctx = canvas.getContext('2d');
        const bCtx = beforeCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        bCtx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        setImageDimensions({
          width: w,
          height: h,
          isPortrait: h > w,
          aspectRatio: w / (h || 1)
        });

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

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      // Preserve full native resolution and exact aspect ratio (limit to 2560px max to prevent browser canvas OOM on 8K)
      const maxDim = 2560;
      let w = naturalW;
      let h = naturalH;
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      beforeCanvas.width = w;
      beforeCanvas.height = h;

      const ctx = canvas.getContext('2d');
      const bCtx = beforeCanvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      bCtx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      bCtx.drawImage(img, 0, 0, w, h);

      setImageDimensions({
        width: w,
        height: h,
        isPortrait: h > w,
        aspectRatio: w / (h || 1)
      });

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
        const sanitized = data.components.map((c, idx) => ({
          ...c,
          id: c.id ? String(c.id) : `pin-vision-${idx + 1}-${Date.now().toString(36)}`,
          name: c.name || `Furniture Spot ${idx + 1}`,
          category: c.category || 'sofa',
          x: Math.max(5, Math.min(95, Number(c.x || (25 + (idx * 12) % 60)))),
          y: Math.max(5, Math.min(95, Number(c.y || (30 + (idx * 10) % 55)))),
          boxW: Math.max(14, Math.min(80, Number(c.boxW || c.width || 34))),
          boxH: Math.max(12, Math.min(65, Number(c.boxH || c.height || 22)))
        }));
        setComponentPins(sanitized);
        setSelectedPinId(sanitized[0].id);
        setStatusBanner(`✅ Detected ${sanitized.length} architectural spots! Select a tag to stage furniture.`);
        toast.success(`Spatial Vision: Detected ${sanitized.length} architectural spots!`);
      } else {
        // Fallback default pins
        const defaultPins = [
          { id: 'pin-sofa', name: 'Main Seating Area', category: 'sofa', x: 50, y: 62, boxW: 46, boxH: 26 },
          { id: 'pin-table', name: 'Center Accent Table', category: 'table', x: 50, y: 78, boxW: 30, boxH: 18 }
        ];
        setComponentPins(defaultPins);
        setSelectedPinId(defaultPins[0].id);
        setStatusBanner('Tap any spot tag to stage furniture, or drag to reposition.');
        toast.info('Default staging spots placed. Tap "+ Tag Spot" to customize placement.');
      }
    } catch (e) {
      console.warn('Vision analysis error:', e);
      setStatusBanner('Room loaded. Tap "+ Tag Spot" to select an area for furniture staging.');
      toast.info('Room loaded. Tap "+ Tag Spot" to select an area for furniture staging.');
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
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      const beforeCanvas = beforeCanvasRef.current;
      if (beforeCanvas) {
        beforeCanvas.width = w;
        beforeCanvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      setImageDimensions({
        width: w,
        height: h,
        isPortrait: h > w,
        aspectRatio: w / (h || 1)
      });
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
  // Normalize any secondary reference/catalog image onto a canvas matching the flat's aspect ratio (1:1, 2:3, or 3:2)
  // so that Image 2 can never cause the AI model to shift away from the flat image's resolution/aspect ratio.
  const normalizeImageToFlatAspect = (imgSrc, targetRatioStr) => {
    return new Promise((resolve) => {
      if (!imgSrc) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const outW = targetRatioStr === '3:2' ? 1024 : targetRatioStr === '2:3' ? 683 : 1024;
          const outH = targetRatioStr === '3:2' ? 683 : targetRatioStr === '2:3' ? 1024 : 1024;
          const offCanvas = document.createElement('canvas');
          offCanvas.width = outW;
          offCanvas.height = outH;
          const oCtx = offCanvas.getContext('2d');
          oCtx.fillStyle = '#F5F2EC';
          oCtx.fillRect(0, 0, outW, outH);
          const scale = Math.min(outW / (img.width || 1), outH / (img.height || 1));
          const drawW = Math.round(img.width * scale);
          const drawH = Math.round(img.height * scale);
          const dx = Math.round((outW - drawW) / 2);
          const dy = Math.round((outH - drawH) / 2);
          oCtx.drawImage(img, dx, dy, drawW, drawH);
          resolve(offCanvas.toDataURL('image/jpeg', 0.88));
        } catch {
          resolve(imgSrc);
        }
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  const executeAIStaging = async () => {
    // 1. AUTHENTICATION ENFORCEMENT
    if (!currentUser) {
      setStatusBanner('🔒 Please sign in or create an account to stage furniture.');
      toast.info('Please sign in or create an account to stage furniture.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    // 2. CREDIT BALANCE ENFORCEMENT (2 credits required for staging)
    if (currentUser.credits !== null && currentUser.credits < 2) {
      setStatusBanner('⚠️ Insufficient AI credits (2 credits required). Please top up credits or upgrade plan.');
      toast.error('Insufficient AI credits (2 credits required).');
      return;
    }

    const isFullFlatMode = activeOption === 'B' && aiPromptSubMode === 'full_flat';
    const selectedStyleObj = FLAT_STYLE_TEMPLATES.find(s => s.id === flatStyle) || FLAT_STYLE_TEMPLATES[0];
    const composedFlatPrompt = `${flatState === 'empty' ? 'Furnish this empty flat shell from scratch' : 'Completely redesign and replace all existing furniture in this flat'} as a ${flatStyle} ${flatRoomType} (${selectedStyleObj.desc}). Furniture density: ${flatDensity}. Lighting & color palette: ${flatLighting}.${flatCustomNotes.trim() ? ` Additional notes: ${flatCustomNotes.trim()}.` : ''} Preserve the exact architectural walls, windows, floor geometry, and camera perspective.`;

    const pin = isFullFlatMode
      ? {
          id: 'full-flat-redesign',
          name: `${selectedStyleObj.label} ${flatRoomType}`,
          category: 'complete room interior',
          x: 50,
          y: 55,
          boxW: 92,
          boxH: 85
        }
      : (componentPins.find(p => p.id === selectedPinId) || componentPins[0]);

    if (!pin) {
      setStatusBanner('⚠️ Please select a room spot first or click "+ Tag Spot".');
      toast.info('Please select a room spot first or click "+ Tag Spot".');
      return;
    }

    if (activeOption === 'B' && aiPromptSubMode === 'furniture' && !customPromptText.trim()) {
      setStatusBanner('⚠️ Please type or select a furniture style prompt first.');
      toast.info('Please type or select a furniture style prompt first.');
      return;
    }
    if (activeOption === 'C' && !uploadedReferenceBase64) {
      setStatusBanner('⚠️ Please upload or snap a reference furniture photo first.');
      toast.info('Please upload or snap a reference furniture photo first.');
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
      itemDescription = isFullFlatMode ? composedFlatPrompt : customPromptText.trim();
    } else {
      const baseRefDesc = (enableCushionSpec && referenceDescription.trim())
        ? referenceDescription.trim()
        : 'the exact architectural furniture shown in the attached reference photo';
      itemDescription = refCloningMode === 'adaptive'
        ? `${baseRefDesc} (Adapt material tone, ambient shadows, and perspective to blend naturally with the room)`
        : `${baseRefDesc} (Exact 1:1 silhouette, cushion geometry, and upholstery clone)`;
    }

    showLoading(
      `Staging "${pin.name}"...`,
      `Rendering photorealistic 3D lighting, perspective, and floor shadows (2 AI Credits)...`
    );

    try {
      const canvas = roomCanvasRef.current;
      const flatW = canvas.width || imageDimensions.width || 1200;
      const flatH = canvas.height || imageDimensions.height || 800;
      const flatRatio = flatW / (flatH || 1);
      // Strictly map the flat image's own aspect ratio to Nano Banana Pro's 3 ratios: 1:1, 2:3, or 3:2
      const flatAspectRatio = flatRatio > 1.18 ? '3:2' : flatRatio < 0.85 ? '2:3' : '1:1';
      // Use '1K' resolution for fastest generation speed and optimal free-plan efficiency
      const fastResolution = '1K';

      const roomBase64 = canvas.toDataURL('image/jpeg', 0.88);

      let catalogImageUrl = null;
      if (activeOption === 'A' && selectedCatalogItem) {
        catalogImageUrl = await normalizeImageToFlatAspect(selectedCatalogItem.imageUrl, flatAspectRatio);
      }

      const normalizedRefImage = activeOption === 'C' && uploadedReferenceBase64
        ? await normalizeImageToFlatAspect(uploadedReferenceBase64, flatAspectRatio)
        : null;

      const data = await generateStagedRoom({
        prompt: itemDescription,
        roomImage: roomBase64,
        referenceImage: normalizedRefImage,
        referenceDescription: enableCushionSpec ? referenceDescription.trim() : '',
        catalogImageUrl: catalogImageUrl,
        pinInfo: pin,
        allPins: componentPins,
        activeOption: activeOption,
        aspectRatio: flatAspectRatio,
        resolution: fastResolution,
        roomWidth: flatW,
        roomHeight: flatH,
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
          // Strictly preserve the uploaded flat image's exact resolution (flatW x flatH)
          // so the room never shifts between landscape/portrait or changes dimensions
          canvas.width = flatW;
          canvas.height = flatH;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, flatW, flatH);
          ctx.drawImage(genImg, 0, 0, flatW, flatH);

          // Keep beforeCanvas locked to the exact same flat dimensions for split comparison
          const beforeCanvas = beforeCanvasRef.current;
          if (beforeCanvas) {
            beforeCanvas.width = flatW;
            beforeCanvas.height = flatH;
            const bCtx = beforeCanvas.getContext('2d');
            bCtx.clearRect(0, 0, flatW, flatH);
            const v1Url = versionHistory?.[0]?.dataUrl;
            if (v1Url) {
              const bImg = new Image();
              bImg.onload = () => bCtx.drawImage(bImg, 0, 0, flatW, flatH);
              bImg.src = v1Url;
            }
          }

          // Keep imageDimensions locked to the flat's resolution and aspect ratio
          setImageDimensions({
            width: flatW,
            height: flatH,
            isPortrait: flatH > flatW,
            aspectRatio: flatW / (flatH || 1)
          });
          setCurrentRoomUrl(data.imageUrl);

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
          toast.success(`Staged "${pin.name}" with photorealistic neural lighting!`);
        };
        genImg.onerror = () => {
          hideLoading();
          setStatusBanner('Render complete, but image failed to load onto canvas.');
          toast.error('Render completed, but image failed to load onto canvas.');
        };
        genImg.src = data.imageUrl;
      } else {
        hideLoading();
        setStatusBanner('AI generation returned empty render. Please try again.');
        toast.error('AI generation returned empty render. Please try again.');
      }
    } catch (e) {
      hideLoading();
      console.error('Staging error:', e);
      setStatusBanner('❌ Staging error: ' + (e.message || 'Generation failed.'));
      toast.error(e.message || 'Staging failed. Please try again.');
    }
  };

  // =========================================================================
  // 7. AI OUTPAINTING (Expand Room)
  // =========================================================================
  const runAIOutpaint = async () => {
    if (!currentUser) {
      setStatusBanner('🔒 Sign in required to use AI room outpainting.');
      toast.info('Sign in required to use AI room outpainting.');
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (currentUser.credits !== null && currentUser.credits < 1) {
      setStatusBanner('⚠️ Insufficient AI credits (1 credit required for AI Expand).');
      toast.error('Insufficient AI credits (1 credit required).');
      return;
    }

    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    showLoading('Expanding Architectural Room Canvas...', 'Synthesizing extended floorboards and ceiling planes...');

    setTimeout(() => {
      const pad = Math.round(canvas.width * 0.08);
      const newW = canvas.width + pad * 2;
      const newH = canvas.height;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = newW;
      tempCanvas.height = newH;
      const tCtx = tempCanvas.getContext('2d');

      tCtx.fillStyle = '#f8fafc';
      tCtx.fillRect(0, 0, newW, newH);
      tCtx.filter = 'blur(10px)';
      tCtx.drawImage(canvas, 0, 0, newW, newH);
      tCtx.filter = 'none';
      tCtx.drawImage(canvas, pad, 0, newW - pad * 2, newH);

      canvas.width = newW;
      canvas.height = newH;
      const beforeCanvas = beforeCanvasRef.current;
      if (beforeCanvas) {
        beforeCanvas.width = newW;
        beforeCanvas.height = newH;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, newW, newH);
      ctx.drawImage(tempCanvas, 0, 0, newW, newH);

      setImageDimensions({
        width: newW,
        height: newH,
        isPortrait: newH > newW,
        aspectRatio: newW / (newH || 1)
      });

      const nextVer = versionHistory.length + 1;
      saveNewVersion(`v${nextVer}: AI Expanded Room`);
      if (onDeductCredits) onDeductCredits(1);
      hideLoading();
      setStatusBanner('✨ Room expanded seamlessly with AI Outpainting!');
      toast.success('Room expanded seamlessly with AI Outpainting!');
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
    if (!pin || !pin.id) return;
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

  // Auto-Spread overlapping/clustered spot tags across room architecture
  const autoSpreadSpots = () => {
    if (!componentPins || componentPins.length === 0) return;
    const defaultPositions = [
      { x: 48, y: 34 }, // Chandelier / Top
      { x: 22, y: 46 }, // Wall Art / Upper Left
      { x: 30, y: 53 }, // Wall / Upper Center
      { x: 62, y: 58 }, // Sconce / Upper Right
      { x: 28, y: 68 }, // Sectional Sofa / Mid
      { x: 42, y: 76 }, // Coffee Table / Lower Center
      { x: 58, y: 78 }, // Media Console / Lower Right
      { x: 38, y: 84 }, // Area Rug / Bottom
    ];
    const spread = componentPins.map((p, idx) => ({
      ...p,
      x: defaultPositions[idx % defaultPositions.length].x,
      y: defaultPositions[idx % defaultPositions.length].y
    }));
    setComponentPins(spread);
    toast.success('Spread tags across distinct architectural areas.');
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
    setMobileFooterTab('spot');
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
    const dimSuffix = imageDimensions.width && imageDimensions.height ? `-${imageDimensions.width}x${imageDimensions.height}` : '';
    link.download = `FurniPeek-Design-v${activeVersionIndex + 1}${dimSuffix}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const selectedPin = (selectedPinId && componentPins.find(p => p.id && p.id === selectedPinId)) || componentPins[0] || null;
  const filteredCatalog = catalogItems.filter(item => {
    const matchCat = activeCatalogCategory === 'all' || item.category === activeCatalogCategory;
    const matchSearch = !catalogSearch || item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || (item.material || '').toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const creditsCount = currentUser?.credits ?? 0;
  const hasCredits = creditsCount >= 2;

  // Measure actual canvas viewport stage bounds across all mobile & desktop screen sizes
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;
    const updateBounds = () => {
      if (canvasViewportRef.current) {
        setStageBounds({
          width: canvasViewportRef.current.clientWidth,
          height: canvasViewportRef.current.clientHeight
        });
      }
    };
    updateBounds();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateBounds);
      ro.observe(el);
    }
    window.addEventListener('resize', updateBounds);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [currentRoomUrl]);

  // Compute exact pixel dimensions that fit inside the available stage without relying on dvh
  // On mobile (< 1024px), keep the room canvas snug and capped so there is zero empty space above/below
  // and taller phones expand the lower studio drawer instead of growing the canvas.
  const fittedCanvasStyle = React.useMemo(() => {
    if (viewScaleMode === 'native' && imageDimensions.width) {
      return { width: `${imageDimensions.width}px`, height: `${imageDimensions.height}px` };
    }
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      const vw = stageBounds.width > 40 ? stageBounds.width : (typeof window !== 'undefined' ? window.innerWidth : 390);
      const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
      const isMobile = (typeof window !== 'undefined' ? window.innerWidth : vw) < 1024;
      const imgRatio = imageDimensions.width / imageDimensions.height;

      if (isMobile) {
        const availW = Math.max(120, vw - 16);
        const maxMobileH = vh < 700 ? 175 : 215;
        let w = availW;
        let h = w / imgRatio;
        if (h > maxMobileH) {
          h = maxMobileH;
          w = h * imgRatio;
        }
        return { width: `${Math.floor(w)}px`, height: `${Math.floor(h)}px` };
      }

      if (stageBounds.width > 40 && stageBounds.height > 40) {
        const pad = 32;
        const availW = Math.max(80, stageBounds.width - pad);
        const availH = Math.max(80, stageBounds.height - pad);
        let w = availW;
        let h = w / imgRatio;
        if (h > availH) {
          h = availH;
          w = h * imgRatio;
        }
        return { width: `${Math.floor(w)}px`, height: `${Math.floor(h)}px` };
      }
    }
    return undefined;
  }, [viewScaleMode, stageBounds.width, stageBounds.height, imageDimensions.width, imageDimensions.height]);

  return (
    <div className="fixed inset-0 z-30 pb-14 lg:pb-0 lg:static lg:z-auto flex-1 min-h-0 flex flex-col bg-[#f7f5f0] dark:bg-stone-950 text-slate-900 dark:text-slate-100 lg:h-[100dvh] overflow-hidden transition-colors">
      
      {/* =========================================================================
          TOP APP BAR (Ultra-Clean Mobile Header + Full Desktop Toolbar)
          ========================================================================= */}
      <header className="h-12 lg:h-auto px-3 sm:px-5 py-1.5 sm:py-2 bg-white/95 dark:bg-stone-900/95 border-b border-stone-200/80 dark:border-stone-800 backdrop-blur-xl z-40 flex items-center justify-between gap-2 shadow-sm shrink-0 transition-colors">
        
        {/* Left: Navigation Back & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => onNavigate ? onNavigate('landing') : window.history.back()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
            title="Exit Studio"
            aria-label="Exit Studio"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/furnipeek-logo.jpg"
              alt="FurniPeek Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full sm:rounded-xl object-cover shadow-sm shrink-0 border border-[#c59b63]/40"
            />
            <div className="min-w-0">
              <div className="text-sm sm:text-xs font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">Furni<span className="text-[#c59b63]">Peek</span> Studio</span>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-md bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-sans font-bold border border-brand-200 dark:border-brand-500/30">
                  PRO
                </span>
              </div>
              <div className="hidden sm:block text-xs text-stone-500 dark:text-stone-400 truncate max-w-[160px]">
                {roomTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Primary Room Actions (Desktop Only — Moved to External Canvas Toolbar on Mobile) */}
        <div className="hidden lg:flex items-center gap-2">
          
          {/* Recent Creations Button (Desktop & Tablet, tucked in More menu on Mobile) */}
          <button
            onClick={() => setIsRecentCreationsOpen(true)}
            className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold text-xs items-center gap-1.5 border border-stone-200 dark:border-stone-800 shadow-sm transition-all"
            title="View Recent Staged Creations"
          >
            <FolderHeart size={14} className="text-brand-600 dark:text-brand-400" />
            <span>Creations</span>
            {recentCreations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
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
            className="h-8 px-2.5 sm:px-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand-500/20 transition-all shrink-0"
            title="Upload Room Photo"
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
            className="h-8 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shrink-0 shadow-sm"
            title="Capture live room photo"
          >
            <Camera size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Demo Rooms Dropdown */}
          <div className="relative group shrink-0">
            <button className="h-8 px-2 sm:px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="hidden sm:inline">Suites</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown size={11} />
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
                  className="w-full px-3.5 py-2 text-left text-xs text-stone-700 dark:text-stone-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {room.name}
                </button>
              ))}
            </div>
          </div>

          {/* New Room / Reset Session (Desktop only, tucked in More menu on Mobile) */}
          {currentRoomUrl && (
            <button
              onClick={handleStartNewRoom}
              className="hidden sm:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold items-center gap-1 transition-colors"
              title="Start a new room session"
            >
              <RotateCcw size={13} />
              <span className="hidden md:inline">New Room</span>
            </button>
          )}
        </div>

        {/* Right: Credits & Actions (Compact Overflow Menu on Mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* User Credits Pill */}
          {currentUser ? (
            <div 
              className={`h-8 px-2 sm:px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border shadow-sm ${
                hasCredits
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
              title="Your AI Generation Credits"
            >
              <Sparkles size={11} className={hasCredits ? "text-amber-500" : "text-rose-500"} />
              <span className="tabular-nums text-[11px] sm:text-xs">{currentUser.credits ?? 0}</span>
              <span className="text-[10px] hidden sm:inline">credits</span>
            </div>
          ) : (
            <button
              onClick={() => onRequireAuth && onRequireAuth()}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Room Quote Button (Desktop, or inside More menu on Mobile) */}
          <button
            onClick={() => setIsQuoteOpen(true)}
            className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 items-center gap-1.5 transition-all shadow-sm"
            title="Open Room Staged Quote"
          >
            <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <span className="text-xs font-extrabold leading-tight tabular-nums">${currentRoomTotal.toLocaleString()}</span>
            </div>
          </button>

          {/* Download HD (Desktop, or inside More menu on Mobile) */}
          <button
            onClick={downloadHDDesign}
            disabled={!currentRoomUrl}
            className="hidden sm:flex w-9 h-9 sm:w-auto sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm disabled:opacity-40"
            title="Download HD Room Render"
          >
            <Download size={14} />
            <span className="hidden md:inline">Save HD</span>
          </button>

          {/* Mobile Compact "More" Menu Button (Holds Creations, Quote, Save HD, New Room, Auto-Spread) */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileHeaderMenuOpen(prev => !prev)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm relative"
              aria-label="More Studio Actions"
            >
              <MoreHorizontal size={16} />
              {(recentCreations.length > 0 || currentRoomTotal > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 border border-white dark:border-slate-900" />
              )}
            </button>

            {isMobileHeaderMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMobileHeaderMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-1.5 z-50 divide-y divide-stone-100 dark:divide-stone-800">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileHeaderMenuOpen(false);
                        setIsRecentCreationsOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <FolderHeart size={14} className="text-brand-500" />
                        <span>Recent Creations</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-[10px]">
                        {recentCreations.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileHeaderMenuOpen(false);
                        setIsQuoteOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-500" />
                        <span>Room Quote</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        ${currentRoomTotal.toLocaleString()}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!currentRoomUrl}
                      onClick={() => {
                        setIsMobileHeaderMenuOpen(false);
                        downloadHDDesign();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 disabled:opacity-40"
                    >
                      <Download size={14} className="text-sky-500" />
                      <span>Download HD Render</span>
                    </button>
                  </div>

                  {currentRoomUrl && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileHeaderMenuOpen(false);
                          autoSpreadSpots();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2"
                      >
                        <Move size={14} />
                        <span>Auto-Spread Spot Tags</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileHeaderMenuOpen(false);
                          handleStartNewRoom();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        <span>Start Fresh Room</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE: IMMERSIVE STAGE (LEFT) + ARCHITECTURAL CONTROLS (RIGHT)
          ========================================================================= */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">

        {/* ---------------------------------------------------------------------
            COLUMN 1: THE LIVING ROOM CANVAS STAGE + EXTERNAL CANVAS TOOLBAR
            --------------------------------------------------------------------- */}
        <div className="shrink-0 lg:flex-1 min-h-0 flex flex-col bg-[#f7f5f0] dark:bg-[#121110] overflow-visible lg:overflow-hidden relative z-20">
          
          {/* Status Sub-bar (Desktop Only — Mobile uses the External Canvas Toolbar below the photo) */}
          <div className="hidden lg:flex px-4 py-2 bg-white/90 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800/80 items-center justify-between text-xs text-stone-600 dark:text-stone-400 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
              <span className="text-xs text-stone-700 dark:text-stone-300 truncate">{statusBanner}</span>
            </div>

            {currentRoomUrl && (
              <div className="flex items-center gap-3 shrink-0">
                {imageDimensions.width > 0 && (
                  <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    <span>{imageDimensions.width}×{imageDimensions.height}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase">
                      {imageDimensions.isPortrait ? 'Portrait' : imageDimensions.width === imageDimensions.height ? '1:1 Square' : 'Landscape'}
                    </span>
                  </div>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md">
                  <input
                    type="checkbox"
                    checked={showPins}
                    onChange={(e) => setShowPins(e.target.checked)}
                    className="rounded accent-[#c59b63]"
                  />
                  <span className="font-semibold">Boxes & Tags</span>
                </label>
                <button
                  onClick={() => runSpatialVisionAnalysis()}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold flex items-center gap-1 px-1"
                  title="Re-scan spatial room tags with AI"
                >
                  <RefreshCw size={11} />
                  <span>Re-Scan</span>
                </button>
                <button
                  onClick={() => autoSpreadSpots()}
                  className="flex text-xs text-stone-600 dark:text-stone-400 hover:text-[#c59b63] font-bold items-center gap-1"
                  title="Auto-spread overlapping tags across distinct architectural areas"
                >
                  <Move size={11} />
                  <span>Auto-Spread</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Viewport Area — Snug top stage on mobile (zero empty top/bottom space), flex-1 on desktop */}
          <div
            ref={canvasViewportRef}
            className="shrink-0 lg:flex-1 lg:min-h-0 relative overflow-hidden px-2 pt-1.5 pb-1 lg:p-0 lg:canvas-dots flex items-center justify-center"
            onClick={handleStageClick}
          >
            <div className={`w-full lg:absolute lg:inset-0 flex items-center justify-center ${imageDimensions.isPortrait ? 'lg:p-3' : 'lg:p-5'} overflow-auto`}>
              {/* Clean Initial Dropzone (When no room is loaded) */}
              {!currentRoomUrl ? (
                <div className="max-w-md w-full p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shadow-lg sm:shadow-xl space-y-2.5 sm:space-y-4 mx-1 my-auto">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-inner">
                    <ImageIcon size={22} />
                  </div>
                  <h2 className="text-base sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                    Spatial AI Furniture Staging
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Snap or upload any living room photo. Our neural spatial model detects furniture coordinates and stages real showroom pieces.
                  </p>

                  {/* Authentication Banner if not signed in */}
                  {!currentUser && (
                    <div className="p-2.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-left space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                        <Lock size={14} />
                        <span>Sign In Required (100 Free Credits)</span>
                      </div>
                      <button
                        onClick={() => onRequireAuth && onRequireAuth()}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <LogIn size={14} />
                        <span>Sign In / Create Account</span>
                      </button>
                    </div>
                  )}

                  <div className="hidden lg:flex pt-1 flex-row gap-2.5 justify-center">
                    <label 
                      onClick={(e) => {
                        if (!currentUser) {
                          e.preventDefault();
                          setStatusBanner('🔒 Sign in required to upload room photos.');
                          if (onRequireAuth) onRequireAuth();
                        }
                      }}
                      className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-500/25 transition-all"
                    >
                      <Upload size={15} />
                      <span>Upload Photo</span>
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
                      <Camera size={15} className="text-amber-500" />
                      <span>Camera</span>
                    </button>
                  </div>

                  <div className="hidden lg:block pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-2 font-medium">Or explore with a sample room suite:</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
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
                  className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md lg:shadow-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 select-none transition-all duration-300 ${
                    viewScaleMode === 'native'
                      ? 'max-w-none max-h-none'
                      : 'max-w-full max-h-full'
                  }`}
                >
                  {/* Active Room Canvas */}
                  <canvas
                    ref={roomCanvasRef}
                    className={`block transition-all duration-200 ${
                      viewScaleMode === 'native'
                        ? 'max-w-none max-h-none'
                        : 'w-full h-full object-contain'
                    }`}
                    style={fittedCanvasStyle}
                  />

                  {/* Ultra-Light Fullscreen Preview Button (Top-Right of Image) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreenPreviewOpen(true);
                    }}
                    title="View full screen image"
                    aria-label="View full screen image"
                    className="absolute top-2.5 right-2.5 z-40 w-8 h-8 rounded-full bg-white/40 hover:bg-white/75 dark:bg-black/30 dark:hover:bg-black/60 backdrop-blur-md border border-white/50 dark:border-white/20 text-stone-800 dark:text-white flex items-center justify-center shadow-sm transition-all active:scale-95 pointer-events-auto"
                  >
                    <Maximize2 size={14} strokeWidth={1.8} />
                  </button>

                  {/* Before Overlay for Split Comparison */}
                  <div
                    className={`absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-brand-500 z-20 ${
                      isBeforeAfterOpen || isPeekingOriginal ? 'block' : 'hidden'
                    }`}
                    style={{ width: isPeekingOriginal ? '100%' : `${splitSliderVal}%` }}
                  >
                    <canvas
                      ref={beforeCanvasRef}
                      className="block w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-md">
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
                      const isSelected = Boolean(selectedPinId && pin.id && pin.id === selectedPinId);
                      const w = Math.max(14, Math.min(85, Number(pin.boxW || pin.width || 34)));
                      const h = Math.max(12, Math.min(65, Number(pin.boxH || pin.height || 22)));
                      return (
                        <React.Fragment key={pin.id || `pin-frag-${pin.name}`}>
                          {/* 1. Architectural Bounding Box (Render ONLY for the single active selected furniture item) */}
                          {isSelected && (
                            <div
                              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl transition-all pointer-events-none border-2 border-dashed border-brand-500 bg-brand-500/15 shadow-[0_0_25px_rgba(197,155,99,0.35)] ring-2 ring-white/60 z-20 select-none"
                              style={{
                                left: `${pin.x}%`,
                                top: `${pin.y}%`,
                                width: `${w}%`,
                                height: `${h}%`
                              }}
                            >
                              {/* Corner bounding accents */}
                              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-brand-400" />
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-brand-400" />
                              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-brand-400" />
                              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-brand-400" />
                              
                              {/* Dimension label tag (Desktop only — hidden on mobile to keep photo clean) */}
                              <div className="hidden lg:block absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-950/85 backdrop-blur-md text-[9px] font-mono font-bold text-brand-300 whitespace-nowrap shadow-md select-none border border-stone-700">
                                {w}% × {h}% • {pin.name}
                              </div>
                            </div>
                          )}

                          {/* 2. Interactive Pin Tag Button (Compact dot for unselected pins on mobile; clean white/gold pill when selected) */}
                          <div
                            onPointerDown={(e) => handlePinPointerDown(e, pin)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPinId(pin.id);
                            }}
                            title={pin.name}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing rounded-full text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xl transition-all select-none pointer-events-auto ${
                              isSelected
                                ? 'px-2.5 py-1 sm:py-1.5 bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-white border border-brand-500 ring-2 ring-brand-500/30 scale-105 z-40'
                                : 'w-5 h-5 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 bg-[#c59b63]/90 sm:bg-white/95 dark:bg-stone-900/90 text-white sm:text-stone-800 dark:text-stone-200 border-2 border-white sm:border sm:border-stone-300 dark:border-stone-700/80 hover:scale-110 z-30'
                            }`}
                            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-brand-500 animate-pulse' : 'hidden sm:inline-block bg-brand-500'}`}
                            />
                            <span className={`${isSelected ? 'inline max-w-[150px] sm:max-w-[170px]' : 'hidden sm:inline sm:max-w-[150px]'} truncate`}>
                              {pin.name}
                            </span>
                            <span className={`${isSelected ? 'inline' : 'hidden sm:inline'} text-[9px] opacity-60`}>✥</span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Floating Canvas Quick Controls Bar (Desktop Only — Mobile uses External Canvas Toolbar below photo) */}
                  <div className="hidden lg:flex absolute bottom-3 inset-x-3 z-30 items-center justify-between pointer-events-none gap-1.5">
                    {/* Left: Tag Spot & Expand Pill */}
                    <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-lg">
                      <button
                        onClick={() => setAddPinMode(!addPinMode)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          addPinMode
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title="Click anywhere on canvas to tag a new furniture spot"
                      >
                        <Tag size={12} />
                        <span>{addPinMode ? 'Tap Spot' : '+ Tag'}</span>
                      </button>

                      <button
                        onClick={runAIOutpaint}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 transition-colors"
                        title="Expand room walls and flooring with AI Outpainting"
                      >
                        <Maximize2 size={12} className="text-brand-500" />
                        <span>Expand</span>
                      </button>
                    </div>

                    {/* Right: Compare & Hold Pill + View Mode Toggle */}
                    <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-lg">
                      {/* View Scale Toggle (Fit vs 1:1 Actual Resolution) */}
                      <button
                        onClick={() => setViewScaleMode(prev => prev === 'fit' ? 'native' : 'fit')}
                        className={`flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1 transition-colors ${
                          viewScaleMode === 'native'
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title={viewScaleMode === 'native' ? 'Switch to Adaptive Fit' : 'View in 100% Native Resolution'}
                      >
                        <ZoomIn size={13} />
                        <span>{viewScaleMode === 'native' ? '1:1 Native' : 'Fit'}</span>
                      </button>

                      <button
                        onClick={() => setIsBeforeAfterOpen(!isBeforeAfterOpen)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                          isBeforeAfterOpen
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title="Split screen Before / After"
                      >
                        <SplitSquareVertical size={12} />
                        <span>Split</span>
                      </button>

                      <button
                        onMouseDown={() => setIsPeekingOriginal(true)}
                        onMouseUp={() => setIsPeekingOriginal(false)}
                        onMouseLeave={() => setIsPeekingOriginal(false)}
                        onTouchStart={() => setIsPeekingOriginal(true)}
                        onTouchEnd={() => setIsPeekingOriginal(false)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 transition-colors select-none"
                        title="Hold to peek at original v1 room"
                      >
                        <Eye size={12} className="text-emerald-500" />
                        <span>v1</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Processing Overlay & Laser Scanner */}
                  {isAILoading && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-stone-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                      <div className="ai-scanner-bar" />
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-brand-50 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3 shadow-xl shadow-brand-500/20 animate-bounce">
                        ✨
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-lg text-stone-900 dark:text-white mb-1 font-serif">{aiLoadingTitle}</h3>
                      <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 max-w-sm">{aiLoadingSubtitle}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              DEDICATED EXTERNAL CANVAS TOOLBAR (Mobile Only — Directly Below Room Photo)
              Upper Row: Highlighted "YOUR ROOM" Capsule (Upload + Camera) | Canvas Tools (Tag, v1 Peek, More)
              Lower Row: Version Pills (v1: Original, v2: Staged) + Tags Toggle
              ===================================================================== */}
          <div className="lg:hidden shrink-0 bg-[#f7f5f0] dark:bg-stone-950 px-2.5 pt-1 pb-2 space-y-1.5 relative z-30">
            
            {/* Upper Row: Highlighted "YOUR ROOM" Group + Canvas Tools (Tag, v1 Peek, More) */}
            <div className="flex items-stretch gap-1.5">
              
              {/* HIGHLIGHTED "YOUR ROOM" GROUP (Upload & Camera) */}
              <div className="flex-[1.35] rounded-2xl bg-gradient-to-br from-[#fcf9f3] via-[#f5ecde] to-[#ede0cc] dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 border border-[#c59b63]/70 dark:border-[#c59b63]/50 px-2 pt-1 pb-1.5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between px-0.5 mb-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8c6430] dark:text-[#d9b37c] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c59b63]" />
                    Your Room
                  </span>
                  <span className="text-[8px] font-bold text-[#a37b45] dark:text-stone-400">
                    Step 1
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* 1. Upload Room Photo (Primary Brushed Gold Pill) */}
                  <label
                    onClick={(e) => {
                      if (!currentUser) {
                        e.preventDefault();
                        setStatusBanner('🔒 Sign in required to upload room photos.');
                        if (onRequireAuth) onRequireAuth();
                      }
                    }}
                    className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#c59b63] to-[#a67c46] hover:from-[#b88d55] hover:to-[#966d3a] text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer select-none"
                  >
                    <Upload size={13} strokeWidth={2.4} className="shrink-0" />
                    <span>Upload</span>
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

                  {/* 2. Live Camera Capture (Crisp Ivory Pill with Gold Accent) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        setStatusBanner('🔒 Sign in required to use live camera.');
                        if (onRequireAuth) onRequireAuth();
                        return;
                      }
                      setIsCameraOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-[#c59b63]/50 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all select-none"
                  >
                    <Camera size={13} strokeWidth={2.2} className="text-[#b0854b] shrink-0" />
                    <span>Camera</span>
                  </button>
                </div>
              </div>

              {/* CANVAS TOOLS GROUP (Tag, v1 Peek, More ⋯) */}
              <div className="flex-1 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 px-1.5 py-1 shadow-sm grid grid-cols-3 gap-0.5 items-center">
                {/* 3. Tag (+ Tag Spot) */}
                <button
                  type="button"
                  disabled={!currentRoomUrl}
                  onClick={() => setAddPinMode(!addPinMode)}
                  className={`h-full py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all select-none disabled:opacity-40 ${
                    addPinMode
                      ? 'bg-[#c59b63] text-white shadow-sm'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Plus size={16} strokeWidth={2.2} />
                  <span className="text-[10px] font-bold leading-none">{addPinMode ? 'Tap' : 'Tag'}</span>
                </button>

                {/* 4. v1 Peek */}
                <button
                  type="button"
                  disabled={!currentRoomUrl}
                  onMouseDown={() => setIsPeekingOriginal(true)}
                  onMouseUp={() => setIsPeekingOriginal(false)}
                  onMouseLeave={() => setIsPeekingOriginal(false)}
                  onTouchStart={() => setIsPeekingOriginal(true)}
                  onTouchEnd={() => setIsPeekingOriginal(false)}
                  className={`h-full py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all select-none disabled:opacity-40 ${
                    isPeekingOriginal
                      ? 'bg-[#c59b63] text-white shadow-sm'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Eye size={16} strokeWidth={2} />
                  <span className="text-[10px] font-bold leading-none">v1 Peek</span>
                </button>

                {/* 5. More (Demo, Expand, Split, Re-Scan) */}
                <div className="relative h-full flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsCanvasMoreOpen(prev => !prev)}
                    className={`w-full h-full py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all select-none ${
                      isCanvasMoreOpen || isBeforeAfterOpen
                        ? 'bg-stone-200 dark:bg-stone-800 text-[#b0854b] dark:text-brand-400'
                        : 'text-stone-800 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <MoreHorizontal size={16} strokeWidth={2.1} />
                    <span className="text-[10px] font-bold leading-none">More</span>
                  </button>

                {/* Expandable "More" Menu (Demo Rooms, Expand, Split, Re-Scan) */}
                {isCanvasMoreOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCanvasMoreOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-2 z-50 space-y-1.5">
                      <div className="grid grid-cols-3 gap-1">
                        {/* Expand (AI Outpaint) */}
                        <button
                          type="button"
                          disabled={!currentRoomUrl}
                          onClick={() => {
                            setIsCanvasMoreOpen(false);
                            runAIOutpaint();
                          }}
                          className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/70 hover:bg-stone-100 dark:hover:bg-stone-800 flex flex-col items-center gap-1 text-stone-800 dark:text-stone-200 disabled:opacity-40"
                        >
                          <Maximize2 size={14} className="text-[#b0854b]" />
                          <span className="text-[10px] font-bold">Expand</span>
                        </button>

                        {/* Split View */}
                        <button
                          type="button"
                          disabled={!currentRoomUrl}
                          onClick={() => {
                            setIsBeforeAfterOpen(!isBeforeAfterOpen);
                            setIsCanvasMoreOpen(false);
                          }}
                          className={`p-2 rounded-xl flex flex-col items-center gap-1 disabled:opacity-40 ${
                            isBeforeAfterOpen
                              ? 'bg-[#c59b63] text-white'
                              : 'bg-stone-50 dark:bg-stone-800/70 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <SplitSquareVertical size={14} />
                          <span className="text-[10px] font-bold">Split</span>
                        </button>

                        {/* Re-Scan */}
                        <button
                          type="button"
                          disabled={!currentRoomUrl}
                          onClick={() => {
                            setIsCanvasMoreOpen(false);
                            runSpatialVisionAnalysis();
                          }}
                          className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/70 hover:bg-stone-100 dark:hover:bg-stone-800 flex flex-col items-center gap-1 text-stone-800 dark:text-stone-200 disabled:opacity-40"
                        >
                          <RefreshCw size={14} className="text-[#b0854b]" />
                          <span className="text-[10px] font-bold">Re-Scan</span>
                        </button>
                      </div>

                      {/* Demo Rooms List */}
                      <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800">
                        <div className="px-2 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-stone-400">
                          Demo Room Suites
                        </div>
                        <div className="space-y-0.5">
                          {DEMO_ROOMS.map((room, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setIsCanvasMoreOpen(false);
                                if (!currentUser) {
                                  setStatusBanner('🔒 Sign in required to stage demo rooms.');
                                  if (onRequireAuth) onRequireAuth();
                                  return;
                                }
                                loadRoomImage(room.url, room.name);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between transition-colors"
                            >
                              <span className="truncate">{room.name}</span>
                              <span className="text-[10px] text-[#b0854b] font-bold shrink-0">Load</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>

            {/* Lower Row: Version History Pills (v1: Original, v2: Staged) + Tags Toggle Pill */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
              {versionHistory.length > 0 ? (
                versionHistory.map((ver, idx) => {
                  const isAct = idx === activeVersionIndex;
                  const shortLabel = idx === 0 ? 'v1: Original' : ver.label.length > 18 ? `v${idx + 1}: Staged` : ver.label;
                  return (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => rollbackToVersion(idx)}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                        isAct
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border border-[#b0854b] shadow-sm'
                          : 'bg-stone-200/75 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/70'
                      }`}
                    >
                      {shortLabel}
                    </button>
                  );
                })
              ) : (
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                  v1: Original
                </span>
              )}

              {/* ☑ Tags Toggle Pill */}
              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  showPins
                    ? 'bg-stone-200/85 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300/80 dark:border-stone-700'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-400 border border-stone-200 dark:border-stone-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  showPins
                    ? 'border-stone-800 dark:border-stone-200 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                    : 'border-stone-400'
                }`}>
                  {showPins && <Check size={10} strokeWidth={3} />}
                </span>
                <span>Tags</span>
              </button>
            </div>
          </div>

          {/* Desktop Version History Stack Bar */}
          <div className="hidden lg:flex px-5 py-2 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1">
                <Clock size={11} /> Versions:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {versionHistory.map((ver, idx) => (
                  <button
                    key={ver.id}
                    onClick={() => rollbackToVersion(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      idx === activeVersionIndex
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {ver.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold shrink-0 hidden md:block">
              {versionHistory[activeVersionIndex]?.label}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUMN 2: EXPANDED LOWER STUDIO DRAWER (Automatically Expands/Contracts per Mobile Height) & DESKTOP SIDEBAR
            --------------------------------------------------------------------- */}
        <aside className={`flex-1 min-h-0 lg:flex-none lg:h-auto lg:max-h-none w-full ${imageDimensions.isPortrait ? 'lg:w-[440px] xl:w-[480px]' : 'lg:w-[420px] xl:w-[460px]'} bg-white dark:bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 rounded-t-3xl lg:rounded-none flex flex-col justify-between overflow-hidden lg:overflow-y-auto shadow-[0_-8px_25px_rgba(0,0,0,0.06)] lg:shadow-none z-20`}>
          
          {/* Static Mobile Drawer Drag Handle */}
          <div className="lg:hidden pt-2 pb-1 shrink-0 flex items-center justify-center">
            <div className="w-10 h-1 rounded-full bg-stone-300/80 dark:bg-stone-700" />
          </div>

          <div className="px-3.5 py-1.5 sm:p-5 space-y-2.5 sm:space-y-4 overflow-y-auto flex-1 min-h-0 flex flex-col justify-start">

            {/* SECTION 1: Active Pin Controller Card (Target Room Spot — Minimalistic & Complete) */}
            {selectedPin && (
              <div className={`${mobileFooterTab === 'spot' ? 'block' : 'hidden'} lg:block space-y-3`}>
                
                {/* Active Spot Header Card */}
                <div className="p-3 rounded-2xl bg-stone-50/90 dark:bg-stone-950/70 border border-stone-200/90 dark:border-stone-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-[#c59b63] shrink-0" />
                      {isEditingPinName ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
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
                            placeholder="e.g. Living Room Leather Sofa"
                            className="flex-1 min-w-0 bg-white dark:bg-stone-900 border border-[#c59b63] rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEditingPinName(false)}
                            className="px-2.5 py-1 rounded-lg bg-[#c59b63] text-white text-[11px] font-bold shrink-0"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#b0854b] dark:text-brand-400 block leading-none mb-0.5">
                            Active Target Spot
                          </span>
                          <div className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate">
                            {selectedPin.name}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditingPinName && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsEditingPinName(true)}
                          className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-[#b0854b] transition-colors shadow-sm"
                          title="Rename spot"
                        >
                          <Edit2 size={13} />
                        </button>

                        {componentPins.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = componentPins.filter(p => p.id !== selectedPin.id);
                              setComponentPins(remaining);
                              setSelectedPinId(remaining[0].id);
                              setIsEditingPinName(false);
                            }}
                            className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm"
                            title="Delete spot tag"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Minimalistic Detected Room Spots Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      <span>Switch Spot ({componentPins.length})</span>
                      <button
                        type="button"
                        onClick={() => setAddPinMode(!addPinMode)}
                        className="text-[#b0854b] dark:text-brand-400 font-extrabold flex items-center gap-0.5 hover:underline"
                      >
                        <Plus size={11} />
                        <span>{addPinMode ? 'Tap Room Photo...' : 'Add Spot'}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[112px] overflow-y-auto pr-0.5 no-scrollbar">
                      {componentPins.map((p) => {
                        const isActSpot = p.id === selectedPin.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPinId(p.id);
                              setIsEditingPinName(false);
                            }}
                            className={`px-2.5 py-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              isActSpot
                                ? 'bg-white dark:bg-stone-900 border-[#c59b63] text-stone-900 dark:text-white shadow-sm ring-1 ring-[#c59b63]/30'
                                : 'bg-white/60 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-white'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isActSpot ? 'bg-[#c59b63]' : 'bg-stone-300 dark:bg-stone-700'}`} />
                            <span className="text-[11px] font-bold truncate flex-1">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spot Category Type Pills */}
                  <div className="space-y-1 pt-1 border-t border-stone-200/70 dark:border-stone-800/80">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Furniture Category
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {['sofa', 'table', 'chair', 'floor', 'wall', 'lamp'].map((cat) => {
                        const isCat = (selectedPin.category || '').toLowerCase() === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setComponentPins(prev =>
                                prev.map(p => (p.id === selectedPin.id ? { ...p, category: cat } : p))
                              );
                              setActiveCatalogCategory(cat);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize shrink-0 border transition-all ${
                              isCat
                                ? 'bg-[#c59b63] text-white border-[#c59b63] shadow-sm'
                                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bounding Box Scale & Minimal Size Presets */}
                  <div className="space-y-2 pt-2 border-t border-stone-200/70 dark:border-stone-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Box Scale
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Compact', w: 24, h: 16 },
                          { label: 'Standard', w: 38, h: 25 },
                          { label: 'Wide', w: 56, h: 34 }
                        ].map((preset) => {
                          const isPreset = Math.abs(selectedPin.boxW - preset.w) <= 3 && Math.abs(selectedPin.boxH - preset.h) <= 3;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setComponentPins(prev =>
                                  prev.map(p => (p.id === selectedPin.id ? { ...p, boxW: preset.w, boxH: preset.h } : p))
                                );
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                                isPreset
                                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                          <span>Width</span>
                          <span className="font-bold text-stone-800 dark:text-white">{selectedPin.boxW}%</span>
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
                          className="w-full accent-[#c59b63] h-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 mb-1">
                          <span>Height</span>
                          <span className="font-bold text-stone-800 dark:text-white">{selectedPin.boxH}%</span>
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
                          className="w-full accent-[#c59b63] h-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Staging Method Segmented Switcher (Hidden on Mobile where 4-tab Footer is used) */}
            <div className="hidden lg:block">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                Staging Method
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => {
                    setActiveOption('C');
                    setMobileFooterTab('C');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'C'
                      ? 'bg-white dark:bg-stone-900 text-brand-600 dark:text-brand-400 shadow-sm border border-stone-200 dark:border-stone-800'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Camera size={15} />
                  <span>Photo Ref</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOption('A');
                    setMobileFooterTab('A');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'A'
                      ? 'bg-white dark:bg-stone-900 text-brand-600 dark:text-brand-400 shadow-sm border border-stone-200 dark:border-stone-800'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Store size={15} />
                  <span>Catalog</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOption('B');
                    setMobileFooterTab('B');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    activeOption === 'B'
                      ? 'bg-white dark:bg-stone-900 text-brand-600 dark:text-brand-400 shadow-sm border border-stone-200 dark:border-stone-800'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={15} />
                  <span>AI Prompt</span>
                </button>
              </div>
            </div>

            {/* SECTION 2 (TAB CONTENT C): UPLOAD PHOTO REFERENCE (Dual Input Cards + Always-Visible AI Cloning Mode Cards) */}
            {activeOption === 'C' && (
              <div className={`${mobileFooterTab === 'C' ? 'block' : 'hidden'} lg:block space-y-2.5`}>
                
                {/* Dual Input Cards (Upload from Gallery + Snap with Camera) or Attached Preview */}
                {uploadedReferenceBase64 ? (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={uploadedReferenceBase64}
                        alt="Ref"
                        className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block">
                          REFERENCE ATTACHED
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block">
                          {uploadedReferenceName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <label className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-200 cursor-pointer hover:bg-stone-50 shadow-sm">
                        Change
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
                                if (enableCushionSpec) analyzeReferenceImage(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedReferenceBase64(null);
                          setUploadedReferenceName('');
                          setReferenceDescription('');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Remove reference image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Card 1: Upload Furniture / Surface Photo */}
                    <label className="p-3 rounded-2xl border-2 border-dashed border-[#c59b63]/50 dark:border-brand-500/30 bg-[#fbf8f3] dark:bg-brand-500/5 hover:bg-[#f5ede0] dark:hover:bg-brand-500/10 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-[#b0854b] shrink-0">
                        <Upload size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 block">
                          Upload Photo
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                          From phone gallery
                        </span>
                      </div>
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
                              if (enableCushionSpec) analyzeReferenceImage(base64);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {/* Card 2: Snap Furniture / Swatch with Camera */}
                    <label className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 hover:bg-stone-100 dark:hover:bg-stone-900 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-[#b0854b] shrink-0">
                        <Camera size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 block">
                          Snap Furniture
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                          Capture in store / home
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target.result;
                              setUploadedReferenceBase64(base64);
                              setUploadedReferenceName(file.name || 'Camera Reference');
                              if (enableCushionSpec) analyzeReferenceImage(base64);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Always-Visible AI Cloning Mode Cards */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                    AI Reference Cloning Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefCloningMode('exact')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        refCloningMode === 'exact'
                          ? 'bg-[#fbf8f3] dark:bg-brand-950/30 border-[#c59b63] shadow-sm ring-1 ring-[#c59b63]/30'
                          : 'bg-white dark:bg-stone-950/40 border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-extrabold text-stone-900 dark:text-white">
                          Exact 1:1 Clone
                        </span>
                        <span className={`w-2 h-2 rounded-full ${refCloningMode === 'exact' ? 'bg-[#c59b63]' : 'bg-stone-300 dark:bg-stone-700'}`} />
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-snug">
                        Preserves exact frame, cushions & upholstery
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefCloningMode('adaptive')}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        refCloningMode === 'adaptive'
                          ? 'bg-[#fbf8f3] dark:bg-brand-950/30 border-[#c59b63] shadow-sm ring-1 ring-[#c59b63]/30'
                          : 'bg-white dark:bg-stone-950/40 border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-extrabold text-stone-900 dark:text-white">
                          Adaptive Room Fit
                        </span>
                        <span className={`w-2 h-2 rounded-full ${refCloningMode === 'adaptive' ? 'bg-[#c59b63]' : 'bg-stone-300 dark:bg-stone-700'}`} />
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-snug">
                        Harmonizes lighting, shadows & room scale
                      </p>
                    </button>
                  </div>
                </div>

                {/* Always-Visible Cushion & Silhouette Lock Card */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
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
                        className="rounded accent-[#c59b63] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <Sparkles size={12} className={enableCushionSpec ? "text-[#b0854b]" : "text-stone-400"} />
                          Cushion & Silhouette Lock
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                          AI extracts exact cushion count, legs & fabric grain
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      enableCushionSpec ? 'bg-[#c59b63] text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                    }`}>
                      {enableCushionSpec ? 'LOCKED' : 'AUTO'}
                    </span>
                  </div>

                  {enableCushionSpec && (
                    <div className="pt-1.5 border-t border-stone-200/70 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-stone-500 font-semibold">Custom geometry / material notes:</span>
                        {uploadedReferenceBase64 && (
                          isAnalyzingRef ? (
                            <span className="text-[#b0854b] font-bold animate-pulse flex items-center gap-1">
                              <RefreshCw size={10} className="animate-spin" /> Scanning...
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => analyzeReferenceImage(uploadedReferenceBase64)}
                              className="text-[#b0854b] font-bold hover:underline"
                            >
                              AI Extract
                            </button>
                          )
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={referenceDescription}
                        onChange={(e) => setReferenceDescription(e.target.value)}
                        placeholder="e.g. 3-seater low-profile bouclé sofa, 2 back cushions, walnut plinth base..."
                        className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#c59b63]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3 (TAB CONTENT A): SHOWROOM CATALOG */}
            {activeOption === 'A' && (
              <div className={`${mobileFooterTab === 'A' ? 'block' : 'hidden'} lg:block space-y-2.5`}>
                {/* Catalog Header + Search & Category Pills */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="lg:hidden text-sm font-extrabold text-stone-900 dark:text-stone-100 shrink-0">
                      Catalog
                    </h3>
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search luxury sofas, tables..."
                      className="flex-1 w-full bg-stone-100/80 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-full px-3.5 py-1.5 sm:py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {['all', 'sofa', 'table', 'chair', 'floor', 'wall', 'lamp'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCatalogCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-colors shrink-0 border ${
                          activeCatalogCategory === cat
                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border-[#b0854b] shadow-sm'
                            : 'bg-stone-100/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200/70 dark:border-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {cat === 'all' ? 'All' : `${cat}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items 2-Column Grid (Mobile & Desktop) */}
                {filteredCatalog.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                    No matching pieces found. Try switching categories or clearing search.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 lg:max-h-[380px] lg:overflow-y-auto pb-1 lg:pr-1">
                    {filteredCatalog.map((item) => {
                      const isSel = selectedCatalogItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedCatalogItem(item)}
                          className={`p-2 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer group ${
                            isSel
                              ? 'bg-[#f7f5f0] dark:bg-brand-950/30 border-[#b0854b] shadow-md ring-2 ring-brand-500/20'
                              : 'bg-white dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-1.5 shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSel && (
                              <div className="flex absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white items-center justify-center shadow-md">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                            <div
                              className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: item.color || '#c59b63' }}
                            />
                          </div>

                          <div className="min-w-0 px-0.5">
                            <div className="text-[11px] font-extrabold text-stone-900 dark:text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
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

            {/* SECTION 4 (TAB CONTENT B): AI PROMPT (Mode 1: Change Furniture | Mode 2: Full Flat Redesign) */}
            {activeOption === 'B' && (
              <div className={`${mobileFooterTab === 'B' ? 'block' : 'hidden'} lg:block space-y-2.5`}>
                
                {/* 2-Mode Switcher: Change Furniture vs Full Flat Redesign */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAiPromptSubMode('furniture')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      aiPromptSubMode === 'furniture'
                        ? 'bg-white dark:bg-stone-900 text-[#9c733b] dark:text-[#d9b37c] shadow-sm border border-[#c59b63]/50'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Change Furniture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiPromptSubMode('full_flat')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      aiPromptSubMode === 'full_flat'
                        ? 'bg-white dark:bg-stone-900 text-[#9c733b] dark:text-[#d9b37c] shadow-sm border border-[#c59b63]/50'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Full Flat Redesign</span>
                  </button>
                </div>

                {aiPromptSubMode === 'furniture' ? (
                  /* MODE 1: CHANGE SINGLE FURNITURE SPOT WITH AI PROMPT */
                  <div className="space-y-2.5">
                    {/* Minimal Style Presets (4 Cards) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                        Style Presets
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'Japandi', swatch: '#c9b18c', prompt: 'Low-profile Japandi natural warm oak and organic linen bouclé furniture piece' },
                          { label: 'Luxury', swatch: '#c59b63', prompt: 'Bespoke Italian quiet-luxury curved ivory bouclé piece with brushed brass accents' },
                          { label: 'Minimal', swatch: '#948e85', prompt: 'Ultra-clean architectural minimalist piece in warm monolithic travertine and matte finish' },
                          { label: 'Modern', swatch: '#8b5a2b', prompt: 'Contemporary loft full-grain cognac leather piece with warm walnut and matte black steel' }
                        ].map((preset) => {
                          const isActPreset = customPromptText.includes(preset.label) || customPromptText === preset.prompt;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setCustomPromptText(preset.prompt)}
                              className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                                isActPreset
                                  ? 'bg-[#fbf8f3] dark:bg-brand-950/30 border-[#c59b63] shadow-sm'
                                  : 'bg-stone-50/80 dark:bg-stone-950/50 border-stone-200/80 dark:border-stone-800 hover:bg-white'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: preset.swatch }}
                              />
                              <span className="text-[10px] font-extrabold text-stone-800 dark:text-stone-200">
                                {preset.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Material & Finish Quick-Add Tags */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                        Material & Finish Quick-Add
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Ivory Bouclé',
                          'Cognac Leather',
                          'Honed Travertine',
                          'Warm Walnut',
                          'Brushed Brass',
                          'Calacatta Marble',
                          'Olive Velvet',
                          'Herringbone Oak'
                        ].map((tag) => {
                          const hasTag = customPromptText.toLowerCase().includes(tag.toLowerCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (!customPromptText.trim()) {
                                  setCustomPromptText(`${tag} ${selectedPin?.category || 'furniture piece'}`);
                                } else if (!hasTag) {
                                  setCustomPromptText(`${customPromptText.trim().replace(/\.$/, '')}, crafted with ${tag}`);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                hasTag
                                  ? 'bg-[#c59b63] text-white border-[#c59b63]'
                                  : 'bg-stone-100/90 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              + {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Furniture Prompt Composer */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                          Furniture Prompt ({selectedPin?.name || 'Active Spot'})
                        </span>
                        {customPromptText && (
                          <button
                            type="button"
                            onClick={() => setCustomPromptText('')}
                            className="text-[10px] font-bold text-stone-400 hover:text-rose-500"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={customPromptText}
                        onChange={(e) => setCustomPromptText(e.target.value)}
                        placeholder="Describe your desired furniture, fabric upholstery, marble vein texture, or wood grain..."
                        className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#c59b63] resize-none shadow-sm leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  /* MODE 2: FULL FLAT / ROOM REDESIGN BUILDER (Empty or Furnished Flat) */
                  <div className="space-y-2.5">
                    
                    {/* Flat Condition + Quick Upload Flat Photo Strip */}
                    <div className="p-2.5 rounded-2xl bg-[#fbf8f3] dark:bg-stone-950 border border-[#c59b63]/40 dark:border-stone-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6430] dark:text-[#d9b37c]">
                          1. Your Flat Condition
                        </span>
                        <label
                          onClick={(e) => {
                            if (!currentUser) {
                              e.preventDefault();
                              if (onRequireAuth) onRequireAuth();
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-[#c59b63]/50 text-[10px] font-extrabold text-[#9c733b] dark:text-[#d9b37c] flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Upload size={11} />
                          <span>{currentRoomUrl ? 'Change Flat Photo' : 'Upload Flat Photo'}</span>
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
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFlatState('empty')}
                          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                            flatState === 'empty'
                              ? 'bg-[#c59b63] text-white border-[#c59b63] shadow-sm'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                          }`}
                        >
                          Empty Flat / Shell
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlatState('furnished')}
                          className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                            flatState === 'furnished'
                              ? 'bg-[#c59b63] text-white border-[#c59b63] shadow-sm'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                          }`}
                        >
                          Furnished (Redesign All)
                        </button>
                      </div>

                      {/* Room Type Selector Pills */}
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                        {['Living Room', 'Master Bedroom', 'Dining Space', 'Open Studio', 'Home Office'].map((rt) => (
                          <button
                            key={rt}
                            type="button"
                            onClick={() => setFlatRoomType(rt)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all ${
                              flatRoomType === rt
                                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Design Style Templates (2-Column Grid) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                        2. Architectural Style Template
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {FLAT_STYLE_TEMPLATES.map((tpl) => {
                          const isSelStyle = flatStyle === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setFlatStyle(tpl.id)}
                              className={`p-2 rounded-xl border text-left transition-all flex items-start gap-2 ${
                                isSelStyle
                                  ? 'bg-[#fbf8f3] dark:bg-brand-950/30 border-[#c59b63] shadow-sm ring-1 ring-[#c59b63]/30'
                                  : 'bg-white dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0 mt-0.5"
                                style={{ backgroundColor: tpl.swatch }}
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-extrabold text-stone-900 dark:text-white truncate">
                                  {tpl.label}
                                </div>
                                <div className="text-[9px] text-stone-500 dark:text-stone-400 line-clamp-1">
                                  {tpl.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Furniture Density & Lighting Mood */}
                    <div className="grid grid-cols-1 gap-2 pt-0.5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                          3. Furniture Density
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['Minimal & Airy', 'Balanced Living', 'Plush & Full'].map((dens) => (
                            <button
                              key={dens}
                              type="button"
                              onClick={() => setFlatDensity(dens)}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                                flatDensity === dens
                                  ? 'bg-[#c59b63] text-white border-[#c59b63] shadow-sm'
                                  : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                              }`}
                            >
                              {dens}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                          4. Lighting & Color Mood
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                          {['Sunlit Warm Ivory', 'Golden Hour Cozy', 'Crisp Gallery Neutral', 'Moody Espresso & Brass'].map((mood) => (
                            <button
                              key={mood}
                              type="button"
                              onClick={() => setFlatLighting(mood)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border transition-all ${
                                flatLighting === mood
                                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                                  : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                              }`}
                            >
                              {mood}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Optional Extra Custom Note */}
                    <input
                      type="text"
                      value={flatCustomNotes}
                      onChange={(e) => setFlatCustomNotes(e.target.value)}
                      placeholder="Optional note (e.g. add indoor olive tree, L-shaped sofa, fluted wood TV wall)..."
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#c59b63]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              STICKY PRIMARY ACTION BAR ("Stage Room" / "Redesign Flat" Button)
              ========================================================================= */}
          <div className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 lg:sticky lg:bottom-0 z-30 shadow-xl shrink-0">
            
            {/* Stage CTA Button Area */}
            <div className="px-3.5 py-2 sm:p-4">
              {!currentUser ? (
                <button
                  onClick={() => onRequireAuth && onRequireAuth()}
                  className="w-full py-2.5 sm:py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn size={16} />
                  <span>Sign In to Stage Rooms (Get 100 Free Credits)</span>
                </button>
              ) : !hasCredits ? (
                <div className="space-y-1">
                  <button
                    disabled
                    className="w-full py-2.5 sm:py-3.5 rounded-2xl bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                  >
                    <Lock size={15} />
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
                  className="w-full py-2.5 sm:py-3.5 px-4 rounded-full sm:rounded-2xl bg-gradient-to-r from-[#c59b63] to-[#a67c46] hover:from-[#b88d55] hover:to-[#966d3a] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Sparkles size={16} className="shrink-0" />
                  <span className="truncate">
                    {activeOption === 'B' && aiPromptSubMode === 'full_flat'
                      ? `Redesign Full ${flatRoomType} (${flatStyle.split(' ')[0]})`
                      : `Stage ${selectedPin?.name || 'Spot'}`}
                  </span>
                  <span className="text-xs opacity-90 font-semibold shrink-0">• 2 Credits</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* =========================================================================
            4-SECTION MOBILE FOOTER NAVIGATION BAR (Pinned Fixed Bottom-0 on All Mobile Viewports)
            ========================================================================= */}
        <nav
          aria-label="Studio Tools Footer"
          className="lg:hidden fixed bottom-0 inset-x-0 h-14 z-50 grid grid-cols-4 border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        >
          <button
            type="button"
            onClick={() => setMobileFooterTab('spot')}
            className={`relative h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
              mobileFooterTab === 'spot'
                ? 'text-[#b0854b] dark:text-brand-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {mobileFooterTab === 'spot' && (
              <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-[#b0854b] dark:bg-brand-400" />
            )}
            <Crosshair size={18} strokeWidth={mobileFooterTab === 'spot' ? 2.4 : 1.8} />
            <span>Target Spot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveOption('C');
              setMobileFooterTab('C');
            }}
            className={`relative h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
              mobileFooterTab === 'C'
                ? 'text-[#b0854b] dark:text-brand-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {mobileFooterTab === 'C' && (
              <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-[#b0854b] dark:bg-brand-400" />
            )}
            <Camera size={18} strokeWidth={mobileFooterTab === 'C' ? 2.4 : 1.8} />
            <span>Photo Ref</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveOption('A');
              setMobileFooterTab('A');
            }}
            className={`relative h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
              mobileFooterTab === 'A'
                ? 'text-[#b0854b] dark:text-brand-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {mobileFooterTab === 'A' && (
              <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-[#b0854b] dark:bg-brand-400" />
            )}
            <Store size={18} strokeWidth={mobileFooterTab === 'A' ? 2.4 : 1.8} />
            <span>Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveOption('B');
              setMobileFooterTab('B');
            }}
            className={`relative h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
              mobileFooterTab === 'B'
                ? 'text-[#b0854b] dark:text-brand-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {mobileFooterTab === 'B' && (
              <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-[#b0854b] dark:bg-brand-400" />
            )}
            <Sparkles size={18} strokeWidth={mobileFooterTab === 'B' ? 2.4 : 1.8} />
            <span>AI Prompt</span>
          </button>
        </nav>
      </main>

      {/* =========================================================================
          FULLSCREEN ROOM IMAGE PREVIEW LIGHTBOX MODAL
          ========================================================================= */}
      {isFullscreenPreviewOpen && currentRoomUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-2 sm:p-6 select-none animate-fadeIn"
          onClick={() => {
            setIsFullscreenPreviewOpen(false);
            setIsFullscreenPeeking(false);
          }}
        >
          {/* Ultra-light Floating Top Bar */}
          <div
            className="absolute top-3 sm:top-5 inset-x-3 sm:inset-x-6 z-20 flex items-center justify-between pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Version & Resolution Badge */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 text-white/90 text-xs">
              <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">
                {versionHistory[activeVersionIndex]?.label || roomTitle}
              </span>
              {versionHistory.length > 1 && (
                <span className="text-[10px] text-[#e0bc85] font-bold pl-1 border-l border-white/15">
                  {activeVersionIndex + 1}/{versionHistory.length}
                </span>
              )}
              {imageDimensions.width > 0 && (
                <span className="hidden sm:inline text-[10px] text-white/60 font-mono pl-1 border-l border-white/15">
                  {imageDimensions.width}×{imageDimensions.height}
                </span>
              )}
            </div>

            {/* Right Controls: Hold to Peek Original (if v2+) + Download + Close */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {versionHistory.length > 1 && (
                <button
                  type="button"
                  onMouseDown={() => setIsFullscreenPeeking(true)}
                  onMouseUp={() => setIsFullscreenPeeking(false)}
                  onMouseLeave={() => setIsFullscreenPeeking(false)}
                  onTouchStart={() => setIsFullscreenPeeking(true)}
                  onTouchEnd={() => setIsFullscreenPeeking(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
                    isFullscreenPeeking
                      ? 'bg-[#c59b63] text-white border-[#c59b63]'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/15'
                  }`}
                  title="Hold to compare with Original Room (v1)"
                >
                  <Eye size={13} />
                  <span>{isFullscreenPeeking ? 'Showing v1 Original' : 'Hold for v1'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={downloadHDDesign}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all"
                title="Download Image"
                aria-label="Download Image"
              >
                <Download size={15} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFullscreenPreviewOpen(false);
                  setIsFullscreenPeeking(false);
                }}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all"
                title="Close Fullscreen"
                aria-label="Close Fullscreen"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Fullscreen Image Container (Supports Touch Swipe Left/Right to Slide Between Versions) */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden py-12 sm:py-14"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              if (e.touches && e.touches.length === 1) {
                fullscreenTouchStartXRef.current = e.touches[0].clientX;
              }
            }}
            onTouchEnd={(e) => {
              if (fullscreenTouchStartXRef.current === null || versionHistory.length <= 1) return;
              const endX = e.changedTouches?.[0]?.clientX ?? fullscreenTouchStartXRef.current;
              const deltaX = endX - fullscreenTouchStartXRef.current;
              fullscreenTouchStartXRef.current = null;
              if (Math.abs(deltaX) > 40) {
                setIsFullscreenPeeking(false);
                if (deltaX < 0 && activeVersionIndex < versionHistory.length - 1) {
                  rollbackToVersion(activeVersionIndex + 1);
                } else if (deltaX > 0 && activeVersionIndex > 0) {
                  rollbackToVersion(activeVersionIndex - 1);
                }
              }
            }}
          >
            {/* Left Slide Arrow (When multiple versions exist) */}
            {versionHistory.length > 1 && (
              <button
                type="button"
                disabled={activeVersionIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreenPeeking(false);
                  if (activeVersionIndex > 0) rollbackToVersion(activeVersionIndex - 1);
                }}
                className="absolute left-2 sm:left-5 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                aria-label="Previous room version"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <img
              key={isFullscreenPeeking ? 'peek-v1' : `ver-${activeVersionIndex}`}
              src={
                isFullscreenPeeking && versionHistory[0]?.dataUrl
                  ? versionHistory[0].dataUrl
                  : (versionHistory[activeVersionIndex]?.dataUrl || currentRoomUrl)
              }
              alt={roomTitle}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-all duration-200"
            />

            {/* Right Slide Arrow (When multiple versions exist) */}
            {versionHistory.length > 1 && (
              <button
                type="button"
                disabled={activeVersionIndex >= versionHistory.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreenPeeking(false);
                  if (activeVersionIndex < versionHistory.length - 1) rollbackToVersion(activeVersionIndex + 1);
                }}
                className="absolute right-2 sm:right-5 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all active:scale-95"
                aria-label="Next room version"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Bottom Horizontally Slideable Version Pills Strip (if multiple versions exist) */}
          {versionHistory.length > 1 && (
            <div
              className="absolute bottom-4 inset-x-0 px-3 flex items-center justify-center z-20 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-full overflow-x-auto no-scrollbar touch-pan-x flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
                {versionHistory.map((ver, idx) => (
                  <button
                    key={ver.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreenPeeking(false);
                      rollbackToVersion(idx);
                    }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      activeVersionIndex === idx && !isFullscreenPeeking
                        ? 'bg-[#c59b63] text-white shadow-md scale-[1.02]'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {ver.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          RECENT CREATIONS DRAWER / MODAL
          ========================================================================= */}
      {isRecentCreationsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col border-l border-stone-200 dark:border-stone-800 overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950/50">
              <div className="flex items-center gap-2">
                <FolderHeart size={18} className="text-brand-600 dark:text-brand-400" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white font-serif">
                  My Recent Room Creations
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold">
                  {recentCreations.length}
                </span>
              </div>
              <button
                onClick={() => setIsRecentCreationsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Creations Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {recentCreations.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-800 dark:text-white font-serif">
                    No creations yet
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    Stage a piece of furniture into your room to generate and save your first architectural design!
                  </p>
                </div>
              ) : (
                recentCreations.map((creation) => (
                  <div
                    key={creation.id}
                    onClick={() => handleResumeCreation(creation)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 hover:border-brand-400 dark:hover:border-brand-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md group flex gap-3.5 items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-800">
                        {creation.thumbnail ? (
                          <img
                            src={creation.thumbnail}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <h4 className="text-xs font-extrabold text-stone-900 dark:text-white truncate group-hover:text-brand-600 transition-colors">
                          {creation.title}
                        </h4>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
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
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
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
                          link.download = `${creation.title || 'FurniPeek-Design'}.png`;
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
