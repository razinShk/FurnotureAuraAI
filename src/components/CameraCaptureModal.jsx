import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onPhotoCaptured }) {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (selfie)
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 font-serif">Live Room Camera</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Snap your real room or furniture in flight to stage instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-stone-950 flex items-center justify-center min-h-[360px] overflow-hidden">
          {cameraError ? (
            <div className="p-8 text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={26} />
              </div>
              <h4 className="font-bold text-white mb-1">Camera Permission Required</h4>
              <p className="text-xs text-stone-400 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-500/20"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img src={capturedPhoto} alt="Captured Room" className="max-h-[60vh] max-w-full object-contain" />
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <CheckCircle size={14} /> Photo Captured
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[60vh] w-full object-cover"
              />
              {/* Overlay Crosshairs */}
              <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-brand-400/40 rounded-xl" />
              </div>
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-stone-200">
                Align your room or furniture piece inside the frame
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          {!capturedPhoto ? (
            <>
              <button
                onClick={toggleFacingMode}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-2 border border-stone-200 dark:border-stone-700 shadow-sm transition-colors"
                title="Switch front/back camera"
              >
                <RefreshCw size={14} />
                <span>Switch Lens</span>
              </button>

              <button
                onClick={takeSnapshot}
                disabled={!!cameraError}
                className="px-8 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Camera size={18} />
                <span>Snap Room Photo</span>
              </button>

              <div className="w-20" />
            </>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
              >
                <RefreshCw size={14} />
                <span>Retake</span>
              </button>

              <button
                onClick={handleConfirm}
                className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <CheckCircle size={18} />
                <span>Stage This Photo in Studio</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
