"use client"

import Image from "next/image"
import { useState } from "react"

export function Thumb({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary font-heading text-sm">
        {name.slice(0, 1).toUpperCase()}
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-md bg-secondary object-cover"
      onError={() => setFailed(true)}
    />
  )
}
