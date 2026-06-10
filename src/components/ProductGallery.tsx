"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
}: {
  images: string[];
}) {
  const [current, setCurrent] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const visibleThumbs = images.slice(thumbStart, thumbStart + 4);

  const syncThumbs = (newIndex: number) => {
    if (newIndex < thumbStart) {
      setThumbStart(newIndex);
    }

    if (newIndex > thumbStart + 3) {
      setThumbStart(newIndex - 3);
    }
  };

  const next = () => {
    setCurrent((prevIndex) => {
      const newIndex =
        prevIndex === images.length - 1
          ? 0
          : prevIndex + 1;

      syncThumbs(newIndex);

      return newIndex;
    });
  };

  const prev = () => {
    setCurrent((prevIndex) => {
      const newIndex =
        prevIndex === 0
          ? images.length - 1
          : prevIndex - 1;

      syncThumbs(newIndex);

      return newIndex;
    });
  };

  const nextThumbs = () => {
    setThumbStart((prev) =>
      prev + 4 >= images.length ? 0 : prev + 1
    );
  };

  const prevThumbs = () => {
    setThumbStart((prev) =>
      prev === 0
        ? Math.max(images.length - 4, 0)
        : prev - 1
    );
  };

  return (
    <div>

      <div className="relative h-[600px] rounded-3xl overflow-hidden bg-white">

        <img
          src={images[current]}
          alt=""
          onClick={() => setFullscreen(true)}
          className="w-full h-full object-contain p-8 cursor-zoom-in"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-3 rounded-xl"
            >
              ←
            </button>

            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-3 rounded-xl"
            >
              →
            </button>
          </>
        )}

      </div>

      <div className="relative mt-4">

        {images.length > 4 && (
          <button
            onClick={prevThumbs}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 text-white px-3 py-2 rounded-xl"
          >
            ←
          </button>
        )}

        <div className="grid grid-cols-4 gap-4 px-12">

          {visibleThumbs.map((image, index) => {
            const realIndex = thumbStart + index;

            return (
              <button
                key={`${image}-${realIndex}`}
                onClick={() => {
                  setCurrent(realIndex);
                  syncThumbs(realIndex);
                }}
                className={`h-24 rounded-xl overflow-hidden border-2 bg-white transition ${
                  current === realIndex
                    ? "border-orange-500"
                    : "border-zinc-300"
                }`}
              >
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-contain p-2"
                />
              </button>
            );
          })}

        </div>

        {images.length > 4 && (
          <button
            onClick={nextThumbs}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 text-white px-3 py-2 rounded-xl"
          >
            →
          </button>
        )}

      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >

          <img
            src={images[current]}
            alt=""
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  prev();
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-5 py-4 rounded-2xl text-3xl"
              >
                ←
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  next();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-5 py-4 rounded-2xl text-3xl"
              >
                →
              </button>
            </>
          )}

          <button
            onClick={(event) => {
              event.stopPropagation();
              setFullscreen(false);
            }}
            className="absolute top-6 right-6 text-white text-5xl"
          >
            ×
          </button>

        </div>
      )}

    </div>
  );
}