

import type { ReactNode } from "react";

type SecondaryPackagingProps = {
  children: ReactNode;
};

export function SecondaryPackaging({
  children,
}: SecondaryPackagingProps) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
