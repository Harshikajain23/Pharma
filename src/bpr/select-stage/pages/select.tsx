import { useParams } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/state/auth.store";
import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";
import { SelectForm } from "./selectform";

export function SelectPage() {
  const { documentId = "preview-demo" } = useParams();
  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { goToStep } = useStepNavigation(documentId, "bpr");

  return (
    <div className="h-screen fixed bg-background text-text">
      {/* Header */}
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* Below header */}
      <div className="flex h-[calc(100vh-var(--topbar-h))] overflow-hidden">
        {/* Sidebar - no scrolling */}
        <aside className="h-full shrink-0 overflow-hidden">
          <AppSidebar user={user} />
        </aside>

        {/* ONLY this area scrolls */}
        <main className="min-w-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto space-y-5">
            <WizardHeader
              activeStepId="select-stage"
              completedStepIds={[]}
              onStepClick={(id) => {
              console.log("clicked:", id);
              goToStep(id);
            }}
             title="Select Stage"
              description="Choose which packaging stages this BPR includes, then set each stage's inputs. Limit ranges come from the Master Packing Card; parameters without limits are captured as 'to be recorded'. The process order is fixed and can't be changed."
              identifier={documentId}
              status="DRAFT"
              isBpr
            />

            <div className="px-8">
              <SelectForm documentId={documentId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}