import React, { useCallback, useRef, useEffect } from 'react'

function fileToImageObject(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    file,
    url: URL.createObjectURL(file),
  }
}

export default function ImageUploader({ images, setImages, selectedId, setSelectedId }) {
  const inputRef = useRef()

  useEffect(() => {
    const h = () => inputRef.current && inputRef.current.click()
    window.addEventListener('open-uploader', h)
    return () => window.removeEventListener('open-uploader', h)
  }, [])

  const onFiles = useCallback(
    (fileList) => {
      const arr = Array.from(fileList).filter((f) => /image\/(png|jpe?g|bmp)/i.test(f.type))
      if (arr.length === 0) return
      const mapped = arr.map(fileToImageObject)
      setImages((prev) => [...mapped, ...prev])
      if (!selectedId) setSelectedId(mapped[0].id)
    },
    [setImages, selectedId, setSelectedId]
  )

  const onDrop = (e) => { e.preventDefault(); onFiles(e.dataTransfer.files) }
  const onSelectFile = (e) => onFiles(e.target.files)

  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((p) => p.id !== id)
      setSelectedId((cur) => (cur === id ? next[0]?.id || null : cur))
      return next
    })
  }

  return (
    <div>
      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {images.map((img) => {
            const active = selectedId === img.id
            return (
              <div
                key={img.id}
                onClick={() => setSelectedId(img.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                  active
                    ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-20 w-full object-cover"
                />
                {/* Selected checkmark */}
                {active && (
                  <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1E3A8A] text-[9px] text-white">
                    ✓
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                  className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] text-slate-500 opacity-0 shadow transition group-hover:opacity-100 hover:text-red-500"
                >
                  ×
                </button>
                <p className="truncate bg-white px-1.5 py-0.5 text-[10px] text-slate-600">{img.name}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[#1E3A8A]/50 hover:bg-blue-50/30"
      >
        {/* Cloud upload icon */}
        <svg className="h-9 w-9 text-[#1E3A8A]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-slate-700">Kéo thả/Tải ảnh</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Hỗ trợ PNG, BMP, JPG — tải nhiều ảnh cùng lúc.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/bmp"
          onChange={onSelectFile}
          className="hidden"
          multiple
        />
      </div>
    </div>
  )
}
