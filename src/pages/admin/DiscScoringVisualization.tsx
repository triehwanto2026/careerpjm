import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ArrowRight, Info, Save, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Instrument {
  id: string;
  name: string;
  scoring_method: string;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: string;
}

interface Option {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  category_target: string | null;
  is_correct: boolean | null;
}

const DiscScoringVisualization = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-xl font-bold">DISC Scoring Visualization - DEBUG 2</h1>
        <p>Component is rendering (test 2)</p>
      </div>
    </AdminLayout>
  );
};

export default DiscScoringVisualization;
