import * as React from "react"
import { cn } from "@/lib/utils"
import { useResponsiveImage } from "./use-responsive-image"
import { buildSrcSet, buildTransformUrl, splitImageProps } from "./image-helpers"

export const ResponsiveImage = React.forwardRef(
  (
    {
      parsed,
      src,
      fittingType,
      focalPoint,
      quality,
      aspectRatio,
      onSourceChange,
      className,
      ...props
    },
    ref
  ) => {
    const { wrapperProps, imageProps } = splitImageProps(props)
    const { wrapperRef, imgRef, loaded, options, handleLoad } = useResponsiveImage(
      { parsed, fittingType, focalPoint, quality, className, onLoad: imageProps.onLoad, onSourceChange },
      ref
    )

    const isCropped = fittingType !== "fit"

    return (
      <span
        ref={wrapperRef}
        {...wrapperProps}
        className={cn("inline-block relative", className)}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          {...imageProps}
          ref={imgRef}
          src={options ? buildTransformUrl(parsed, options) : parsed.baseUrl}
          srcSet={options ? buildSrcSet(parsed, options) : undefined}
          alt={imageProps.alt ?? ""}
          onLoad={handleLoad}
          data-loaded={loaded || undefined}
          className={cn(
            "block h-full w-full",
            isCropped ? "object-cover" : "object-contain",
            loaded ? "opacity-100" : "opacity-0",
            "transition-opacity duration-300"
          )}
        />
      </span>
    )
  }
)
ResponsiveImage.displayName = "ResponsiveImage"
