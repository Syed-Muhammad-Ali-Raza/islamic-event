"use client";

import dynamic from "next/dynamic";

export const CityMapLazy = dynamic(() => import("./CityMap").then((m) => m.CityMap), {
  ssr: false,
  loading: () => <div className="skeleton h-[420px] sm:h-[520px] rounded-2xl" />,
});
