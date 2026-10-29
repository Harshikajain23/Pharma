import { Navigate, Route, Routes } from "react-router-dom";

import { env } from "../shared/config/env";

import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { CoreInputsPage } from "../features/core-inputs/pages/CoreInputsPage";
import { NewDocumentSelectorPage } from "../features/new-document/pages/NewDocumentSelectorPage";
import { CoverBomPage } from "../features/bom/pages/CoverBomPage";
import { CompanyInfoPage } from "../features/company/pages/CompanyInfoPage";
import { MasterDataPage } from "../features/master-data/pages/MasterDataPage";
import { DocumentReviewPage } from "../features/review/pages/DocumentReviewPage";
import { ReviewQueuePage } from "../features/review/pages/ReviewQueuePage";
import { StatusBoardPage } from "../features/status-board/pages/StatusBoardPage";
import { VersionHistoryPage } from "../features/version-history/pages/VersionHistoryPage";
import { NotificationsPage } from "../features/notifications/pages/NotificationsPage";
import { AuditTrailPage } from "../features/audit-trail/pages/AuditTrailPage";

import { TypePage as MdSetupTypePage } from "../features/master-data-setup/pages/TypePage";
import { StageDocumentsPage as MdStageDocsPage } from "../features/master-data-setup/pages/StageDocumentsPage";
import { EquipmentListPage as MdEquipmentPage } from "../features/master-data-setup/pages/EquipmentListPage";
import { InstrumentListPage as MdInstrumentPage } from "../features/master-data-setup/pages/InstrumentListPage";
import { BatchDocumentsPage as MdBatchDocsPage } from "../features/master-data-setup/pages/BatchDocumentsPage";
import { PreviewPage as MdPreviewPage } from "../features/master-data-setup/pages/PreviewPage";

import { PreviewPage } from "../features/preview/pages/PreviewPage";
import { GenerateSubmitPage } from "../features/generate/pages/GenerateSubmitPage";
import { StageInputPage } from "../features/stage-input/pages/StageInputPage";
import { SelectStagesPage } from "../features/stages/pages/SelectStagesPage";

import { LoginPage } from "../features/auth/pages/LoginPage";
import { SetPasswordPage } from "../features/auth/pages/SetPasswordPage";
import { LoginStatesPage } from "../features/auth/pages/LoginStatesPage";
import { EmployeesPage } from "../features/employees/pages/EmployeesPage";
import { ProtectedRoute } from "../features/auth/routing/ProtectedRoute";
import { Submit } from "../pvp/manufacturing/submit/submit";

import { Granulation } from "../pvp/manufacturing/granulation/granulation";
import { ROUTES } from "./routing/routes";

import {  Select as PvpPackingSelect } from "../pvp/packing/select/select";
import { SelectBpr } from "../pvp/packing/select/selectBpr";

import { Cpp as CppPacking } from "../pvp/packing/cpp/cpp";



/* =========================================================
   BPR PAGES
   ========================================================= */

import { CoreInputsPage as BprCoreInput } from "../bpr/core-inputs/pages/CoreInputsPage";

import { PreviewPage as BprPreviewPage } from "../bpr/preview/pages/preview";

import { CoverPage as BprCoverPage } from "../bpr/cover-page/pages/cover";

import { SelectPage as BprSelectPage } from "../bpr/select-stage/pages/select";

import { Select as PvpSelectPage } from "../pvp/manufacturing/select/select";

import { Process as PvpProcess } from "../pvp/manufacturing/process/process";

import { Procedure } from "../pvp/manufacturing/procedure/procedure";

import { Input as PvpInput } from "../pvp/manufacturing/input/input";

import { SelectBmr } from "../pvp/manufacturing/select/selectBmr";

import { Preview, Preview as PreviewBmr } from "../pvp/manufacturing/preview/preview";

import { Cpp as PvpCpp } from "../pvp/manufacturing/cpp/cpp";

import { Generate as PvpGenerate } from "../pvp/manufacturing/generate/generate";

// Pvr

import {Input as PvrInput} from "../pvr/input/input"

import Cover from "../pvr/cover/cover"

import Process from "../pvr/process/process"

import Bom from "../pvr/bom/bom"

import Introduction from "../pvr/introduction/introduction";

import PvrOverview from "../pvr/basic-cover/PvrOverview";

import { Preview as PreviewPacking } from "../pvp/packing/preview/preview";

import { Process as ProcessPacking } from "../pvp/packing/process/process";

import {Procedure as ProcedurePacking} from "../pvp/packing/procedure/procedure"

export function App() {
  return (
    <Routes>
      {/* =====================================================
          AUTH / DEV
          ===================================================== */}

      {env.isDev ? (
        <Route path="/login/states" element={<LoginStatesPage />} />
      ) : null}

      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route path={ROUTES.setPassword} element={<SetPasswordPage />} />

      {/* =====================================================
          BMR APPLICATION
          ===================================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />

        <Route
          path={ROUTES.newDocument}
          element={<NewDocumentSelectorPage />}
        />

        <Route path={ROUTES.documentInputs} element={<CoreInputsPage />} />

        <Route path={ROUTES.documentPreview} element={<PreviewPage />} />

        <Route path={ROUTES.documentCoverBom} element={<CoverBomPage />} />

        <Route path={ROUTES.documentStages} element={<SelectStagesPage />} />

        <Route
          path="/bpr/:documentId/stage-input"
          element={<StageInputPage />}
        />

        {/* =================================================
            COMMON STAGE INPUT PAGE

            Both BMR and BPR use this page.

            BMR:
            /documents/:documentId/stage-input?type=bmr

            BPR:
            /documents/:documentId/stage-input?type=bpr
            ================================================= */}

        <Route path={ROUTES.documentStageInput} element={<StageInputPage />} />

        <Route
          path={ROUTES.documentGenerate}
          element={<GenerateSubmitPage />}
        />

        <Route path={ROUTES.companyInfo} element={<CompanyInfoPage />} />

        <Route path={ROUTES.masterData} element={<MasterDataPage />} />

        <Route path={ROUTES.queue} element={<ReviewQueuePage />} />

        <Route path={ROUTES.employees} element={<EmployeesPage />} />

        <Route path={ROUTES.documentReview} element={<DocumentReviewPage />} />

        <Route path={ROUTES.statusBoard} element={<StatusBoardPage />} />

        <Route path={ROUTES.versionHistory} element={<VersionHistoryPage />} />

        <Route path={ROUTES.notifications} element={<NotificationsPage />} />

        <Route path={ROUTES.auditTrail} element={<AuditTrailPage />} />

        {/* Master Data Setup */}

        <Route path={ROUTES.masterDataSetup} element={<MdSetupTypePage />} />

        <Route path="/master-data-setup/stages" element={<MdStageDocsPage />} />

        <Route
          path="/master-data-setup/equipment"
          element={<MdEquipmentPage />}
        />

        <Route
          path="/master-data-setup/instruments"
          element={<MdInstrumentPage />}
        />

        <Route
          path="/master-data-setup/batch-docs"
          element={<MdBatchDocsPage />}
        />

        <Route path="/master-data-setup/preview" element={<MdPreviewPage />} />
      </Route>

      {/* =====================================================
          BPR APPLICATION
          ===================================================== */}

      {/* BPR Inputs */}

      <Route
        path="/bpr-documents/:documentId/inputs"
        element={<BprCoreInput />}
      />

      {/* BPR Preview */}

      <Route path="/bpr/:documentId/preview" element={<BprPreviewPage />} />

      {/* BPR Cover */}

      <Route path="/bpr/:documentId/cover" element={<BprCoverPage />} />

      {/* BPR Select Stage */}

      <Route path="/bpr/:documentId/select" element={<BprSelectPage />} />

      {/* =====================================================
          PVP APPLICATION  - Manufacturing
          ===================================================== */}

      <Route path="/pvp/:documentId/select" element={<PvpSelectPage />} />

      <Route path="/pvp/:documentId/selectbmr" element={<SelectBmr />} />

      <Route path="/pvp/:documentId/preview" element={<PreviewBmr />} />

      <Route path="/pvp/:documentId/process" element={<PvpProcess />} />

      <Route path="/pvp/:documentId/input" element={<PvpInput />} />

      <Route path="/pvp/:documentId/submit" element={<Submit />} />

      <Route path="/pvp/:documentId/cpp" element={<PvpCpp />} />

      <Route path="/pvp/:documentId/granulation" element={<Granulation />} />

      <Route path="/pvp/:documentId/procedure" element={<Procedure />} />

      <Route path="/pvp/:documentId/generate" element={<PvpGenerate/>}
 

/>

 {/*     =====================================================
          PVP APPLICATION  - Packing
         ===================================================== */}

       <Route path="/pvp/:documentId/selectpacking" element={<PvpPackingSelect />} />
       <Route path="/pvp/:documentId/selectbpr" element={<SelectBpr />} />
       <Route path="/pvp/:documentId/previewpacking" element={<PreviewPacking />} />
       <Route path="/pvp/:documentId/processpacking" element={<ProcessPacking />} />
       <Route path="/pvp/:documentId/cpppacking" element={<CppPacking />} />
       <Route path="/pvp/:documentId/procedurepacking" element={<ProcedurePacking/>} />
       

 {/* ---------------- PVR ---------------------- */}

        <Route path="/pvr/:documentId/input" element={<PvrInput/>}/>
        <Route path="/pvr/:documentId/cover" element={<Cover/>}/>
        <Route path="/pvr/:documentId/process" element={<Process/>}/>
        <Route path="/pvr/:documentId/BOM" element={<Bom/>}/>
        <Route path="/pvr/:documentId/introduction" element={<Introduction/>}/>
        <Route path="/pvr/:documentId/basic-cover" element={<PvrOverview/>}/>
        


      {/* =====================================================
          WILDCARD
          MUST BE LAST
          ===================================================== */}

      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  );
}
