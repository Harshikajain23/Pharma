

import type { ReactNode } from "react";

type PackingMaterialDispensingProps = {
  children: ReactNode;
};

export function PackingMaterialDispensing({
  children,
}: PackingMaterialDispensingProps) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
