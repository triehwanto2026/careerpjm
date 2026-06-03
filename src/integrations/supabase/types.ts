export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activation_codes: {
        Row: {
          assigned_tests: string[] | null
          auto_submitted: boolean
          candidate_email: string
          candidate_name: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          password: string
          position: string
          status: string
          test_completed_at: string | null
          test_started_at: string | null
          updated_at: string
          used_at: string | null
        }
        Insert: {
          assigned_tests?: string[] | null
          auto_submitted?: boolean
          candidate_email: string
          candidate_name: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password: string
          position?: string
          status?: string
          test_completed_at?: string | null
          test_started_at?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          assigned_tests?: string[] | null
          auto_submitted?: boolean
          candidate_email?: string
          candidate_name?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          password?: string
          position?: string
          status?: string
          test_completed_at?: string | null
          test_started_at?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          role_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          role_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          role_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: string
          value_type: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
          value_type?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      candidate_certifications: {
        Row: {
          certificate_name: string
          certificate_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_name?: string
          certificate_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_name?: string
          certificate_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_education_detail: {
        Row: {
          city: string | null
          created_at: string
          end_year: number | null
          gpa: number | null
          id: string
          institution_name: string
          is_graduated: boolean | null
          level: string
          major: string | null
          start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          end_year?: number | null
          gpa?: number | null
          id?: string
          institution_name?: string
          is_graduated?: boolean | null
          level?: string
          major?: string | null
          start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          end_year?: number | null
          gpa?: number | null
          id?: string
          institution_name?: string
          is_graduated?: boolean | null
          level?: string
          major?: string | null
          start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_education_history: {
        Row: {
          created_at: string
          end_year: number | null
          grade: string | null
          id: string
          level: string
          major: string | null
          school: string
          start_year: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_year?: number | null
          grade?: string | null
          id?: string
          level?: string
          major?: string | null
          school?: string
          start_year?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_year?: number | null
          grade?: string | null
          id?: string
          level?: string
          major?: string | null
          school?: string
          start_year?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_family_members: {
        Row: {
          age: number | null
          company: string | null
          created_at: string
          education: string | null
          gender: string | null
          id: string
          name: string
          occupation: string | null
          relation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          company?: string | null
          created_at?: string
          education?: string | null
          gender?: string | null
          id?: string
          name?: string
          occupation?: string | null
          relation?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          company?: string | null
          created_at?: string
          education?: string | null
          gender?: string | null
          id?: string
          name?: string
          occupation?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_informal_education: {
        Row: {
          certificate: string | null
          created_at: string
          id: string
          institution: string | null
          name: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          certificate?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          certificate?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      candidate_languages: {
        Row: {
          created_at: string
          id: string
          language: string
          spoken_level: string | null
          user_id: string
          written_level: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          spoken_level?: string | null
          user_id: string
          written_level?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          spoken_level?: string | null
          user_id?: string
          written_level?: string | null
        }
        Relationships: []
      }
      candidate_profiles: {
        Row: {
          absenteeism_diversity: boolean | null
          academic_interests: string | null
          accessibility_standard_diversity: boolean | null
          accountability_diversity: boolean | null
          accountability_standard_diversity: boolean | null
          accounting_standard_diversity: boolean | null
          achievement_diversity: boolean | null
          achievements: string | null
          action_diversity: boolean | null
          adaptability_diversity: boolean | null
          adaptability_skills: string | null
          adaptability_standard_diversity: boolean | null
          additional_info: string | null
          address: string | null
          advising: boolean | null
          age_diversity: boolean | null
          agile_thinking_experience: boolean | null
          aim_diversity: boolean | null
          alamat_domisili: string | null
          alliance_diversity: boolean | null
          ambiguity_diversity: boolean | null
          ambition_diversity: boolean | null
          analytical_experience: boolean | null
          analytical_skills: string | null
          approach_diversity: boolean | null
          artificial_intelligence_experience: boolean | null
          artistic_rights_standard_diversity: boolean | null
          aspiration_diversity: boolean | null
          asylum_rights_standard_diversity: boolean | null
          atmosphere_diversity: boolean | null
          attribute_diversity: boolean | null
          audit_experience: boolean | null
          auditing_standard_diversity: boolean | null
          augmented_reality_experience: boolean | null
          availability_standard_diversity: boolean | null
          available_from: string | null
          awards: string | null
          background_diversity: boolean | null
          basic_rights_standard_diversity: boolean | null
          behavior_diversity: boolean | null
          benchmark_diversity: boolean | null
          benefits_preferences: string | null
          benefits_requirements: string | null
          best_practice_diversity: boolean | null
          bio: string | null
          birth_date: string | null
          birth_place: string | null
          blockchain_experience: boolean | null
          blood_type: string | null
          bpjs_kesehatan: string | null
          bpjs_ketenagakerjaan: string | null
          budget_management_experience: boolean | null
          business_analysis_experience: boolean | null
          business_continuity_standard_diversity: boolean | null
          business_rights_standard_diversity: boolean | null
          calling_diversity: boolean | null
          candidate_references: string | null
          capacity_management_experience: boolean | null
          career_objective: string | null
          certification_diversity: boolean | null
          certifications: string | null
          challenge_diversity: boolean | null
          change_leadership_experience: boolean | null
          change_management_experience: boolean | null
          characteristic_diversity: boolean | null
          children_rights_standard_diversity: boolean | null
          circumstance_diversity: boolean | null
          citizenship_rights_standard_diversity: boolean | null
          city: string | null
          civic_rights_standard_diversity: boolean | null
          civil_rights_standard_diversity: boolean | null
          client_management_experience: boolean | null
          climate_diversity: boolean | null
          cloud_computing_experience: boolean | null
          coaching: boolean | null
          collaboration_diversity: boolean | null
          commercial_rights_standard_diversity: boolean | null
          communication_diversity: boolean | null
          communication_rights_standard_diversity: boolean | null
          communication_skills: string | null
          community_diversity: boolean | null
          community_leadership: boolean | null
          community_leadership_experience: boolean | null
          company_culture_preferences: string | null
          company_preferences: string | null
          competency_diversity: boolean | null
          complexity_diversity: boolean | null
          compliance_diversity: boolean | null
          compliance_experience: boolean | null
          compliance_standard_diversity: boolean | null
          component_diversity: boolean | null
          computer_skills: string | null
          condition_diversity: boolean | null
          conferences_attended: string | null
          confidentiality_standard_diversity: boolean | null
          conflict_resolution_experience: boolean | null
          consequence_diversity: boolean | null
          constitutional_rights_standard_diversity: boolean | null
          consulting: boolean | null
          consumer_rights_standard_diversity: boolean | null
          context_diversity: boolean | null
          contract_negotiation_experience: boolean | null
          contract_rights_standard_diversity: boolean | null
          contribution_diversity: boolean | null
          cooperation_diversity: boolean | null
          coordination_diversity: boolean | null
          copyright_standard_diversity: boolean | null
          core_rights_standard_diversity: boolean | null
          corporate_social_responsibility_standard_diversity: boolean | null
          created_at: string
          creative_rights_standard_diversity: boolean | null
          creative_thinking_experience: boolean | null
          creativity_diversity: boolean | null
          creativity_skills: string | null
          crisis_management_experience: boolean | null
          critical_thinking_experience: boolean | null
          cross_functional_experience: boolean | null
          cultural_diversity: boolean | null
          cultural_rights_standard_diversity: boolean | null
          culture_diversity: boolean | null
          culture_requirements: string | null
          curiosity_diversity: boolean | null
          current_company: string | null
          current_position: string | null
          current_salary: number | null
          customer_experience_experience: boolean | null
          cyber_rights_standard_diversity: boolean | null
          cybersecurity_experience: boolean | null
          data_protection_standard_diversity: boolean | null
          data_rights_standard_diversity: boolean | null
          data_science_experience: boolean | null
          database_experience: boolean | null
          decision_making_diversity: boolean | null
          decision_making_experience: boolean | null
          democratic_rights_standard_diversity: boolean | null
          denary_rights_standard_diversity: boolean | null
          dependency_diversity: boolean | null
          deployment_experience: boolean | null
          design_thinking_experience: boolean | null
          desktop_development_experience: boolean | null
          development_diversity: boolean | null
          development_experience: boolean | null
          differentiation_diversity: boolean | null
          difficulty_diversity: boolean | null
          digital_rights_standard_diversity: boolean | null
          digital_transformation_experience: boolean | null
          disability_inclusion: boolean | null
          disability_rights_standard_diversity: boolean | null
          disaster_recovery_standard_diversity: boolean | null
          disclosure_standard_diversity: boolean | null
          discovery_diversity: boolean | null
          distinction_diversity: boolean | null
          diversity_equity_inclusion_standard_diversity: boolean | null
          diversity_inclusion: boolean | null
          documentation_experience: boolean | null
          domain_expertise: string | null
          dream_diversity: boolean | null
          drive_diversity: boolean | null
          driving_license_a: boolean | null
          driving_license_b: boolean | null
          driving_license_c: boolean | null
          driving_license_sim: boolean | null
          economic_standard_diversity: boolean | null
          ecosystem_diversity: boolean | null
          education_diversity: boolean | null
          education_history: string | null
          education_institution: string | null
          education_level: string | null
          education_major: string | null
          education_rights_standard_diversity: boolean | null
          education_year: number | null
          educational_diversity: boolean | null
          effect_diversity: boolean | null
          effectiveness_diversity: boolean | null
          effectiveness_standard_diversity: boolean | null
          efficiency_diversity: boolean | null
          efficiency_standard_diversity: boolean | null
          elderly_rights_standard_diversity: boolean | null
          element_diversity: boolean | null
          email: string
          embedded_systems_experience: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_experience_experience: boolean | null
          employment_rights_standard_diversity: boolean | null
          employment_standard_diversity: boolean | null
          engagement_diversity: boolean | null
          enhancement_diversity: boolean | null
          entrepreneurial_rights_standard_diversity: boolean | null
          entrepreneurship: boolean | null
          environment_diversity: boolean | null
          environmental_social_governance_standard_diversity: boolean | null
          environmental_standard_diversity: boolean | null
          environmental_sustainability: boolean | null
          essential_rights_standard_diversity: boolean | null
          ethical_leadership: boolean | null
          ethical_standard_diversity: boolean | null
          ethics_diversity: boolean | null
          ethics_standard_diversity: boolean | null
          ethnicity: string | null
          excellence_diversity: boolean | null
          expected_salary: number | null
          expected_salary_range: string | null
          experience_diversity: boolean | null
          experience_years: number | null
          expertise_diversity: boolean | null
          exploration_diversity: boolean | null
          expression_rights_standard_diversity: boolean | null
          extensibility_standard_diversity: boolean | null
          factor_diversity: boolean | null
          family_data: Json | null
          family_members: string | null
          father_name: string | null
          fault_tolerance_standard_diversity: boolean | null
          feature_diversity: boolean | null
          financial_standard_diversity: boolean | null
          flexibility_standard_diversity: boolean | null
          flexible_hours_experience: boolean | null
          flexible_hours_willingness: boolean | null
          freelancing: boolean | null
          full_name: string
          function_diversity: boolean | null
          fundamental_rights_standard_diversity: boolean | null
          gaming_experience: boolean | null
          gender: string | null
          gender_equality: boolean | null
          geographic_diversity: boolean | null
          goal_diversity: boolean | null
          governance_diversity: boolean | null
          governance_experience: boolean | null
          governance_standard_diversity: boolean | null
          gpa: number | null
          growth_diversity: boolean | null
          growth_opportunities_preferences: string | null
          growth_requirements: string | null
          has_vehicle: boolean | null
          health_safety_standard_diversity: boolean | null
          healthcare_rights_standard_diversity: boolean | null
          height_cm: number | null
          hobbies: string | null
          holiday_work_experience: boolean | null
          holiday_work_willingness: boolean | null
          home_ownership: string | null
          home_phone: string | null
          housing_rights_standard_diversity: boolean | null
          human_rights_standard_diversity: boolean | null
          id: string
          ideological_rights_standard_diversity: boolean | null
          immediate_family_data: Json | null
          immigrant_rights_standard_diversity: boolean | null
          impact_diversity: boolean | null
          implication_diversity: boolean | null
          importance_diversity: boolean | null
          improvement_diversity: boolean | null
          indigenous_rights_standard_diversity: boolean | null
          industry_diversity: boolean | null
          industry_interests: string | null
          industry_knowledge: string | null
          industry_leadership: boolean | null
          industry_leadership_experience: boolean | null
          industry_standard_diversity: boolean | null
          influence_diversity: boolean | null
          informal_education: string | null
          information_rights_standard_diversity: boolean | null
          information_security_standard_diversity: boolean | null
          inheritance_rights_standard_diversity: boolean | null
          innovation_diversity: boolean | null
          innovation_experience: boolean | null
          innovation_opportunities_preferences: string | null
          innovation_requirements: string | null
          innovation_rights_standard_diversity: boolean | null
          integration_diversity: boolean | null
          integrity_diversity: boolean | null
          integrity_standard_diversity: boolean | null
          intellectual_property_rights_standard_diversity: boolean | null
          intellectual_property_standard_diversity: boolean | null
          intention_diversity: boolean | null
          interest_diversity: boolean | null
          international_experience: boolean | null
          internet_rights_standard_diversity: boolean | null
          intrapreneurship: boolean | null
          iot_experience: boolean | null
          is_complete: boolean
          labor_rights_standard_diversity: boolean | null
          labor_standard_diversity: boolean | null
          language_diversity: boolean | null
          languages: string | null
          leadership_diversity: boolean | null
          leadership_experience: string | null
          leadership_opportunities_preferences: string | null
          leadership_requirements: string | null
          leadership_skills: string | null
          lean_thinking_experience: boolean | null
          learning_diversity: boolean | null
          learning_opportunities_preferences: string | null
          learning_requirements: string | null
          legal_rights_standard_diversity: boolean | null
          legal_standard_diversity: boolean | null
          level_diversity: boolean | null
          lgbtq_equality: boolean | null
          linkedin_url: string | null
          location_preferences: string | null
          long_term_goals: string | null
          machine_learning_experience: boolean | null
          maintainability_standard_diversity: boolean | null
          maintenance_experience: boolean | null
          management_experience: boolean | null
          management_style_preferences: string | null
          marital_status: string | null
          mastery_diversity: boolean | null
          meaning_diversity: boolean | null
          medical_history: string | null
          mentorship: string | null
          methodology_diversity: boolean | null
          migrant_rights_standard_diversity: boolean | null
          minority_rights_standard_diversity: boolean | null
          mission_diversity: boolean | null
          mobile_development_experience: boolean | null
          mobility_rights_standard_diversity: boolean | null
          mother_name: string | null
          motivation_diversity: boolean | null
          multicultural_experience: boolean | null
          nationality: string | null
          nationality_rights_standard_diversity: boolean | null
          natural_rights_standard_diversity: boolean | null
          negotiation_skills: string | null
          network_diversity: boolean | null
          networking: string | null
          networking_experience: boolean | null
          nickname: string | null
          night_shift_experience: boolean | null
          night_shift_willingness: boolean | null
          nik: string | null
          non_compete_standard_diversity: boolean | null
          non_disclosure_standard_diversity: boolean | null
          non_solicitation_standard_diversity: boolean | null
          nonary_rights_standard_diversity: boolean | null
          notice_period: number | null
          npwp: string | null
          number_of_children: number | null
          objective_diversity: boolean | null
          octonary_rights_standard_diversity: boolean | null
          online_courses: string | null
          opportunity_diversity: boolean | null
          optimization_diversity: boolean | null
          organization_diversity: boolean | null
          organizations: string | null
          originality_diversity: boolean | null
          other_skills: string | null
          outcome_diversity: boolean | null
          overtime_experience: boolean | null
          overtime_willingness: boolean | null
          ownership_rights_standard_diversity: boolean | null
          pants_size: string | null
          partnership_diversity: boolean | null
          partnership_management_experience: boolean | null
          passion_diversity: boolean | null
          passport_rights_standard_diversity: boolean | null
          patent_standard_diversity: boolean | null
          patents: string | null
          pension_rights_standard_diversity: boolean | null
          perfection_diversity: boolean | null
          performance_diversity: boolean | null
          performance_management_experience: boolean | null
          performance_standard_diversity: boolean | null
          personal_development: string | null
          personal_interests: string | null
          personality_diversity: boolean | null
          perspective_diversity: boolean | null
          philosophical_rights_standard_diversity: boolean | null
          phone: string | null
          photo_url: string | null
          policy_diversity: boolean | null
          political_diversity: boolean | null
          political_rights_standard_diversity: boolean | null
          portfolio_management_experience: boolean | null
          postal_code: string | null
          presentation_experience: boolean | null
          presentation_skills: string | null
          press_rights_standard_diversity: boolean | null
          primary_rights_standard_diversity: boolean | null
          priority_diversity: boolean | null
          privacy_protection_standard_diversity: boolean | null
          privacy_rights_standard_diversity: boolean | null
          privacy_standard_diversity: boolean | null
          problem_solving_diversity: boolean | null
          problem_solving_experience: boolean | null
          problem_solving_skills: string | null
          procedure_diversity: boolean | null
          process_diversity: boolean | null
          process_improvement_experience: boolean | null
          product_management_experience: boolean | null
          productivity_diversity: boolean | null
          professional_development: string | null
          professional_interests: string | null
          professional_standard_diversity: boolean | null
          program_management_experience: boolean | null
          project_experience: string | null
          project_management_experience: boolean | null
          property_diversity: boolean | null
          property_rights_standard_diversity: boolean | null
          province: string | null
          public_speaking_experience: boolean | null
          publications: string | null
          purpose_diversity: boolean | null
          quality_diversity: boolean | null
          quality_management_experience: boolean | null
          quality_standard_diversity: boolean | null
          quaternary_rights_standard_diversity: boolean | null
          quinary_rights_standard_diversity: boolean | null
          racial_equality: boolean | null
          reach_diversity: boolean | null
          reaction_diversity: boolean | null
          recognition_diversity: boolean | null
          refugee_rights_standard_diversity: boolean | null
          regulation_diversity: boolean | null
          regulatory_standard_diversity: boolean | null
          reliability_standard_diversity: boolean | null
          religion: string | null
          religious_diversity: boolean | null
          religious_rights_standard_diversity: boolean | null
          relocation_distance: number | null
          relocation_requirements: string | null
          relocation_willingness: boolean | null
          remote_work_experience: boolean | null
          remote_work_willingness: boolean | null
          reporting_standard_diversity: boolean | null
          requirements_analysis_experience: boolean | null
          research_experience: string | null
          research_interests: string | null
          residence_rights_standard_diversity: boolean | null
          residency_rights_standard_diversity: boolean | null
          resilience_diversity: boolean | null
          resilience_standard_diversity: boolean | null
          resource_management_experience: boolean | null
          response_diversity: boolean | null
          responsibility_diversity: boolean | null
          responsibility_standard_diversity: boolean | null
          result_diversity: boolean | null
          retention_diversity: boolean | null
          reward_diversity: boolean | null
          risk_assessment_experience: boolean | null
          risk_diversity: boolean | null
          risk_management_experience: boolean | null
          risk_management_standard_diversity: boolean | null
          risk_taking_diversity: boolean | null
          robotics_experience: boolean | null
          robustness_standard_diversity: boolean | null
          role_diversity: boolean | null
          role_preferences: string | null
          safety_standard_diversity: boolean | null
          salary_currency: string | null
          salary_exp_allowances: string | null
          salary_exp_base: string | null
          salary_exp_benefits: string | null
          salary_expectation: string | null
          salary_negotiable: boolean | null
          salary_requirements: string | null
          satisfaction_diversity: boolean | null
          scalability_standard_diversity: boolean | null
          scale_diversity: boolean | null
          scope_diversity: boolean | null
          secondary_rights_standard_diversity: boolean | null
          security_experience: boolean | null
          security_standard_diversity: boolean | null
          self_study: string | null
          seminars_attended: string | null
          senary_rights_standard_diversity: boolean | null
          seniority_diversity: boolean | null
          septenary_rights_standard_diversity: boolean | null
          service_design_experience: boolean | null
          shirt_size: string | null
          shoe_size: string | null
          short_term_goals: string | null
          significance_diversity: boolean | null
          situation_diversity: boolean | null
          skill_diversity: boolean | null
          skills: string | null
          social_activities: string | null
          social_entrepreneurship: boolean | null
          social_media: string | null
          social_media_experience: boolean | null
          social_media_rights_standard_diversity: boolean | null
          social_responsibility: boolean | null
          social_security_rights_standard_diversity: boolean | null
          social_standard_diversity: boolean | null
          society_diversity: boolean | null
          socioeconomic_diversity: boolean | null
          soft_skills: string | null
          source_info: string | null
          specialization_diversity: boolean | null
          speech_rights_standard_diversity: boolean | null
          spiritual_rights_standard_diversity: boolean | null
          spouse_name: string | null
          stakeholder_management_experience: boolean | null
          standard_diversity: boolean | null
          stateless_rights_standard_diversity: boolean | null
          strategic_thinking_experience: boolean | null
          strength_diversity: boolean | null
          strengths: string | null
          structure_diversity: boolean | null
          support_experience: boolean | null
          sustainability_diversity: boolean | null
          sustainability_standard_diversity: boolean | null
          system_diversity: boolean | null
          systems_thinking_experience: boolean | null
          target_diversity: boolean | null
          teaching_experience: string | null
          team_management_experience: boolean | null
          team_size_preferences: string | null
          teamwork_diversity: boolean | null
          teamwork_skills: string | null
          technical_skills: string | null
          technology_diversity: boolean | null
          tenure_diversity: boolean | null
          tertiary_rights_standard_diversity: boolean | null
          testing_experience: boolean | null
          thought_diversity: boolean | null
          thought_leadership: boolean | null
          thought_leadership_experience: boolean | null
          threat_diversity: boolean | null
          time_management_skills: string | null
          tool_diversity: boolean | null
          trade_rights_standard_diversity: boolean | null
          trade_secret_standard_diversity: boolean | null
          trademark_standard_diversity: boolean | null
          training_certifications: string | null
          training_diversity: boolean | null
          training_experience: boolean | null
          trait_diversity: boolean | null
          transparency_diversity: boolean | null
          transparency_standard_diversity: boolean | null
          travel_frequency: string | null
          travel_requirements: string | null
          travel_rights_standard_diversity: boolean | null
          travel_willingness: boolean | null
          turnover_diversity: boolean | null
          uncertainty_diversity: boolean | null
          uniqueness_diversity: boolean | null
          updated_at: string
          urgency_diversity: boolean | null
          usability_standard_diversity: boolean | null
          user_experience_experience: boolean | null
          user_id: string | null
          user_interface_experience: boolean | null
          value_diversity: boolean | null
          vehicle_brand: string | null
          vehicle_license: string | null
          vehicle_type: string | null
          vendor_management_experience: boolean | null
          virtual_reality_experience: boolean | null
          visa_rights_standard_diversity: boolean | null
          vision_diversity: boolean | null
          volatility_diversity: boolean | null
          volunteer_experience: string | null
          weakness_diversity: boolean | null
          weaknesses: string | null
          web_development_experience: boolean | null
          webinars_attended: string | null
          weekend_work_experience: boolean | null
          weekend_work_willingness: boolean | null
          weight_kg: number | null
          willing_overtime: boolean | null
          willing_relocate: boolean | null
          willing_shift: boolean | null
          women_rights_standard_diversity: boolean | null
          work_environment_preferences: string | null
          work_experience: string | null
          work_life_balance_preferences: string | null
          work_schedule_requirements: string | null
          workplace_standard_diversity: boolean | null
          workshops_attended: string | null
          writing_experience: boolean | null
        }
        Insert: {
          absenteeism_diversity?: boolean | null
          academic_interests?: string | null
          accessibility_standard_diversity?: boolean | null
          accountability_diversity?: boolean | null
          accountability_standard_diversity?: boolean | null
          accounting_standard_diversity?: boolean | null
          achievement_diversity?: boolean | null
          achievements?: string | null
          action_diversity?: boolean | null
          adaptability_diversity?: boolean | null
          adaptability_skills?: string | null
          adaptability_standard_diversity?: boolean | null
          additional_info?: string | null
          address?: string | null
          advising?: boolean | null
          age_diversity?: boolean | null
          agile_thinking_experience?: boolean | null
          aim_diversity?: boolean | null
          alamat_domisili?: string | null
          alliance_diversity?: boolean | null
          ambiguity_diversity?: boolean | null
          ambition_diversity?: boolean | null
          analytical_experience?: boolean | null
          analytical_skills?: string | null
          approach_diversity?: boolean | null
          artificial_intelligence_experience?: boolean | null
          artistic_rights_standard_diversity?: boolean | null
          aspiration_diversity?: boolean | null
          asylum_rights_standard_diversity?: boolean | null
          atmosphere_diversity?: boolean | null
          attribute_diversity?: boolean | null
          audit_experience?: boolean | null
          auditing_standard_diversity?: boolean | null
          augmented_reality_experience?: boolean | null
          availability_standard_diversity?: boolean | null
          available_from?: string | null
          awards?: string | null
          background_diversity?: boolean | null
          basic_rights_standard_diversity?: boolean | null
          behavior_diversity?: boolean | null
          benchmark_diversity?: boolean | null
          benefits_preferences?: string | null
          benefits_requirements?: string | null
          best_practice_diversity?: boolean | null
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blockchain_experience?: boolean | null
          blood_type?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          budget_management_experience?: boolean | null
          business_analysis_experience?: boolean | null
          business_continuity_standard_diversity?: boolean | null
          business_rights_standard_diversity?: boolean | null
          calling_diversity?: boolean | null
          candidate_references?: string | null
          capacity_management_experience?: boolean | null
          career_objective?: string | null
          certification_diversity?: boolean | null
          certifications?: string | null
          challenge_diversity?: boolean | null
          change_leadership_experience?: boolean | null
          change_management_experience?: boolean | null
          characteristic_diversity?: boolean | null
          children_rights_standard_diversity?: boolean | null
          circumstance_diversity?: boolean | null
          citizenship_rights_standard_diversity?: boolean | null
          city?: string | null
          civic_rights_standard_diversity?: boolean | null
          civil_rights_standard_diversity?: boolean | null
          client_management_experience?: boolean | null
          climate_diversity?: boolean | null
          cloud_computing_experience?: boolean | null
          coaching?: boolean | null
          collaboration_diversity?: boolean | null
          commercial_rights_standard_diversity?: boolean | null
          communication_diversity?: boolean | null
          communication_rights_standard_diversity?: boolean | null
          communication_skills?: string | null
          community_diversity?: boolean | null
          community_leadership?: boolean | null
          community_leadership_experience?: boolean | null
          company_culture_preferences?: string | null
          company_preferences?: string | null
          competency_diversity?: boolean | null
          complexity_diversity?: boolean | null
          compliance_diversity?: boolean | null
          compliance_experience?: boolean | null
          compliance_standard_diversity?: boolean | null
          component_diversity?: boolean | null
          computer_skills?: string | null
          condition_diversity?: boolean | null
          conferences_attended?: string | null
          confidentiality_standard_diversity?: boolean | null
          conflict_resolution_experience?: boolean | null
          consequence_diversity?: boolean | null
          constitutional_rights_standard_diversity?: boolean | null
          consulting?: boolean | null
          consumer_rights_standard_diversity?: boolean | null
          context_diversity?: boolean | null
          contract_negotiation_experience?: boolean | null
          contract_rights_standard_diversity?: boolean | null
          contribution_diversity?: boolean | null
          cooperation_diversity?: boolean | null
          coordination_diversity?: boolean | null
          copyright_standard_diversity?: boolean | null
          core_rights_standard_diversity?: boolean | null
          corporate_social_responsibility_standard_diversity?: boolean | null
          created_at?: string
          creative_rights_standard_diversity?: boolean | null
          creative_thinking_experience?: boolean | null
          creativity_diversity?: boolean | null
          creativity_skills?: string | null
          crisis_management_experience?: boolean | null
          critical_thinking_experience?: boolean | null
          cross_functional_experience?: boolean | null
          cultural_diversity?: boolean | null
          cultural_rights_standard_diversity?: boolean | null
          culture_diversity?: boolean | null
          culture_requirements?: string | null
          curiosity_diversity?: boolean | null
          current_company?: string | null
          current_position?: string | null
          current_salary?: number | null
          customer_experience_experience?: boolean | null
          cyber_rights_standard_diversity?: boolean | null
          cybersecurity_experience?: boolean | null
          data_protection_standard_diversity?: boolean | null
          data_rights_standard_diversity?: boolean | null
          data_science_experience?: boolean | null
          database_experience?: boolean | null
          decision_making_diversity?: boolean | null
          decision_making_experience?: boolean | null
          democratic_rights_standard_diversity?: boolean | null
          denary_rights_standard_diversity?: boolean | null
          dependency_diversity?: boolean | null
          deployment_experience?: boolean | null
          design_thinking_experience?: boolean | null
          desktop_development_experience?: boolean | null
          development_diversity?: boolean | null
          development_experience?: boolean | null
          differentiation_diversity?: boolean | null
          difficulty_diversity?: boolean | null
          digital_rights_standard_diversity?: boolean | null
          digital_transformation_experience?: boolean | null
          disability_inclusion?: boolean | null
          disability_rights_standard_diversity?: boolean | null
          disaster_recovery_standard_diversity?: boolean | null
          disclosure_standard_diversity?: boolean | null
          discovery_diversity?: boolean | null
          distinction_diversity?: boolean | null
          diversity_equity_inclusion_standard_diversity?: boolean | null
          diversity_inclusion?: boolean | null
          documentation_experience?: boolean | null
          domain_expertise?: string | null
          dream_diversity?: boolean | null
          drive_diversity?: boolean | null
          driving_license_a?: boolean | null
          driving_license_b?: boolean | null
          driving_license_c?: boolean | null
          driving_license_sim?: boolean | null
          economic_standard_diversity?: boolean | null
          ecosystem_diversity?: boolean | null
          education_diversity?: boolean | null
          education_history?: string | null
          education_institution?: string | null
          education_level?: string | null
          education_major?: string | null
          education_rights_standard_diversity?: boolean | null
          education_year?: number | null
          educational_diversity?: boolean | null
          effect_diversity?: boolean | null
          effectiveness_diversity?: boolean | null
          effectiveness_standard_diversity?: boolean | null
          efficiency_diversity?: boolean | null
          efficiency_standard_diversity?: boolean | null
          elderly_rights_standard_diversity?: boolean | null
          element_diversity?: boolean | null
          email?: string
          embedded_systems_experience?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_experience_experience?: boolean | null
          employment_rights_standard_diversity?: boolean | null
          employment_standard_diversity?: boolean | null
          engagement_diversity?: boolean | null
          enhancement_diversity?: boolean | null
          entrepreneurial_rights_standard_diversity?: boolean | null
          entrepreneurship?: boolean | null
          environment_diversity?: boolean | null
          environmental_social_governance_standard_diversity?: boolean | null
          environmental_standard_diversity?: boolean | null
          environmental_sustainability?: boolean | null
          essential_rights_standard_diversity?: boolean | null
          ethical_leadership?: boolean | null
          ethical_standard_diversity?: boolean | null
          ethics_diversity?: boolean | null
          ethics_standard_diversity?: boolean | null
          ethnicity?: string | null
          excellence_diversity?: boolean | null
          expected_salary?: number | null
          expected_salary_range?: string | null
          experience_diversity?: boolean | null
          experience_years?: number | null
          expertise_diversity?: boolean | null
          exploration_diversity?: boolean | null
          expression_rights_standard_diversity?: boolean | null
          extensibility_standard_diversity?: boolean | null
          factor_diversity?: boolean | null
          family_data?: Json | null
          family_members?: string | null
          father_name?: string | null
          fault_tolerance_standard_diversity?: boolean | null
          feature_diversity?: boolean | null
          financial_standard_diversity?: boolean | null
          flexibility_standard_diversity?: boolean | null
          flexible_hours_experience?: boolean | null
          flexible_hours_willingness?: boolean | null
          freelancing?: boolean | null
          full_name?: string
          function_diversity?: boolean | null
          fundamental_rights_standard_diversity?: boolean | null
          gaming_experience?: boolean | null
          gender?: string | null
          gender_equality?: boolean | null
          geographic_diversity?: boolean | null
          goal_diversity?: boolean | null
          governance_diversity?: boolean | null
          governance_experience?: boolean | null
          governance_standard_diversity?: boolean | null
          gpa?: number | null
          growth_diversity?: boolean | null
          growth_opportunities_preferences?: string | null
          growth_requirements?: string | null
          has_vehicle?: boolean | null
          health_safety_standard_diversity?: boolean | null
          healthcare_rights_standard_diversity?: boolean | null
          height_cm?: number | null
          hobbies?: string | null
          holiday_work_experience?: boolean | null
          holiday_work_willingness?: boolean | null
          home_ownership?: string | null
          home_phone?: string | null
          housing_rights_standard_diversity?: boolean | null
          human_rights_standard_diversity?: boolean | null
          id?: string
          ideological_rights_standard_diversity?: boolean | null
          immediate_family_data?: Json | null
          immigrant_rights_standard_diversity?: boolean | null
          impact_diversity?: boolean | null
          implication_diversity?: boolean | null
          importance_diversity?: boolean | null
          improvement_diversity?: boolean | null
          indigenous_rights_standard_diversity?: boolean | null
          industry_diversity?: boolean | null
          industry_interests?: string | null
          industry_knowledge?: string | null
          industry_leadership?: boolean | null
          industry_leadership_experience?: boolean | null
          industry_standard_diversity?: boolean | null
          influence_diversity?: boolean | null
          informal_education?: string | null
          information_rights_standard_diversity?: boolean | null
          information_security_standard_diversity?: boolean | null
          inheritance_rights_standard_diversity?: boolean | null
          innovation_diversity?: boolean | null
          innovation_experience?: boolean | null
          innovation_opportunities_preferences?: string | null
          innovation_requirements?: string | null
          innovation_rights_standard_diversity?: boolean | null
          integration_diversity?: boolean | null
          integrity_diversity?: boolean | null
          integrity_standard_diversity?: boolean | null
          intellectual_property_rights_standard_diversity?: boolean | null
          intellectual_property_standard_diversity?: boolean | null
          intention_diversity?: boolean | null
          interest_diversity?: boolean | null
          international_experience?: boolean | null
          internet_rights_standard_diversity?: boolean | null
          intrapreneurship?: boolean | null
          iot_experience?: boolean | null
          is_complete?: boolean
          labor_rights_standard_diversity?: boolean | null
          labor_standard_diversity?: boolean | null
          language_diversity?: boolean | null
          languages?: string | null
          leadership_diversity?: boolean | null
          leadership_experience?: string | null
          leadership_opportunities_preferences?: string | null
          leadership_requirements?: string | null
          leadership_skills?: string | null
          lean_thinking_experience?: boolean | null
          learning_diversity?: boolean | null
          learning_opportunities_preferences?: string | null
          learning_requirements?: string | null
          legal_rights_standard_diversity?: boolean | null
          legal_standard_diversity?: boolean | null
          level_diversity?: boolean | null
          lgbtq_equality?: boolean | null
          linkedin_url?: string | null
          location_preferences?: string | null
          long_term_goals?: string | null
          machine_learning_experience?: boolean | null
          maintainability_standard_diversity?: boolean | null
          maintenance_experience?: boolean | null
          management_experience?: boolean | null
          management_style_preferences?: string | null
          marital_status?: string | null
          mastery_diversity?: boolean | null
          meaning_diversity?: boolean | null
          medical_history?: string | null
          mentorship?: string | null
          methodology_diversity?: boolean | null
          migrant_rights_standard_diversity?: boolean | null
          minority_rights_standard_diversity?: boolean | null
          mission_diversity?: boolean | null
          mobile_development_experience?: boolean | null
          mobility_rights_standard_diversity?: boolean | null
          mother_name?: string | null
          motivation_diversity?: boolean | null
          multicultural_experience?: boolean | null
          nationality?: string | null
          nationality_rights_standard_diversity?: boolean | null
          natural_rights_standard_diversity?: boolean | null
          negotiation_skills?: string | null
          network_diversity?: boolean | null
          networking?: string | null
          networking_experience?: boolean | null
          nickname?: string | null
          night_shift_experience?: boolean | null
          night_shift_willingness?: boolean | null
          nik?: string | null
          non_compete_standard_diversity?: boolean | null
          non_disclosure_standard_diversity?: boolean | null
          non_solicitation_standard_diversity?: boolean | null
          nonary_rights_standard_diversity?: boolean | null
          notice_period?: number | null
          npwp?: string | null
          number_of_children?: number | null
          objective_diversity?: boolean | null
          octonary_rights_standard_diversity?: boolean | null
          online_courses?: string | null
          opportunity_diversity?: boolean | null
          optimization_diversity?: boolean | null
          organization_diversity?: boolean | null
          organizations?: string | null
          originality_diversity?: boolean | null
          other_skills?: string | null
          outcome_diversity?: boolean | null
          overtime_experience?: boolean | null
          overtime_willingness?: boolean | null
          ownership_rights_standard_diversity?: boolean | null
          pants_size?: string | null
          partnership_diversity?: boolean | null
          partnership_management_experience?: boolean | null
          passion_diversity?: boolean | null
          passport_rights_standard_diversity?: boolean | null
          patent_standard_diversity?: boolean | null
          patents?: string | null
          pension_rights_standard_diversity?: boolean | null
          perfection_diversity?: boolean | null
          performance_diversity?: boolean | null
          performance_management_experience?: boolean | null
          performance_standard_diversity?: boolean | null
          personal_development?: string | null
          personal_interests?: string | null
          personality_diversity?: boolean | null
          perspective_diversity?: boolean | null
          philosophical_rights_standard_diversity?: boolean | null
          phone?: string | null
          photo_url?: string | null
          policy_diversity?: boolean | null
          political_diversity?: boolean | null
          political_rights_standard_diversity?: boolean | null
          portfolio_management_experience?: boolean | null
          postal_code?: string | null
          presentation_experience?: boolean | null
          presentation_skills?: string | null
          press_rights_standard_diversity?: boolean | null
          primary_rights_standard_diversity?: boolean | null
          priority_diversity?: boolean | null
          privacy_protection_standard_diversity?: boolean | null
          privacy_rights_standard_diversity?: boolean | null
          privacy_standard_diversity?: boolean | null
          problem_solving_diversity?: boolean | null
          problem_solving_experience?: boolean | null
          problem_solving_skills?: string | null
          procedure_diversity?: boolean | null
          process_diversity?: boolean | null
          process_improvement_experience?: boolean | null
          product_management_experience?: boolean | null
          productivity_diversity?: boolean | null
          professional_development?: string | null
          professional_interests?: string | null
          professional_standard_diversity?: boolean | null
          program_management_experience?: boolean | null
          project_experience?: string | null
          project_management_experience?: boolean | null
          property_diversity?: boolean | null
          property_rights_standard_diversity?: boolean | null
          province?: string | null
          public_speaking_experience?: boolean | null
          publications?: string | null
          purpose_diversity?: boolean | null
          quality_diversity?: boolean | null
          quality_management_experience?: boolean | null
          quality_standard_diversity?: boolean | null
          quaternary_rights_standard_diversity?: boolean | null
          quinary_rights_standard_diversity?: boolean | null
          racial_equality?: boolean | null
          reach_diversity?: boolean | null
          reaction_diversity?: boolean | null
          recognition_diversity?: boolean | null
          refugee_rights_standard_diversity?: boolean | null
          regulation_diversity?: boolean | null
          regulatory_standard_diversity?: boolean | null
          reliability_standard_diversity?: boolean | null
          religion?: string | null
          religious_diversity?: boolean | null
          religious_rights_standard_diversity?: boolean | null
          relocation_distance?: number | null
          relocation_requirements?: string | null
          relocation_willingness?: boolean | null
          remote_work_experience?: boolean | null
          remote_work_willingness?: boolean | null
          reporting_standard_diversity?: boolean | null
          requirements_analysis_experience?: boolean | null
          research_experience?: string | null
          research_interests?: string | null
          residence_rights_standard_diversity?: boolean | null
          residency_rights_standard_diversity?: boolean | null
          resilience_diversity?: boolean | null
          resilience_standard_diversity?: boolean | null
          resource_management_experience?: boolean | null
          response_diversity?: boolean | null
          responsibility_diversity?: boolean | null
          responsibility_standard_diversity?: boolean | null
          result_diversity?: boolean | null
          retention_diversity?: boolean | null
          reward_diversity?: boolean | null
          risk_assessment_experience?: boolean | null
          risk_diversity?: boolean | null
          risk_management_experience?: boolean | null
          risk_management_standard_diversity?: boolean | null
          risk_taking_diversity?: boolean | null
          robotics_experience?: boolean | null
          robustness_standard_diversity?: boolean | null
          role_diversity?: boolean | null
          role_preferences?: string | null
          safety_standard_diversity?: boolean | null
          salary_currency?: string | null
          salary_exp_allowances?: string | null
          salary_exp_base?: string | null
          salary_exp_benefits?: string | null
          salary_expectation?: string | null
          salary_negotiable?: boolean | null
          salary_requirements?: string | null
          satisfaction_diversity?: boolean | null
          scalability_standard_diversity?: boolean | null
          scale_diversity?: boolean | null
          scope_diversity?: boolean | null
          secondary_rights_standard_diversity?: boolean | null
          security_experience?: boolean | null
          security_standard_diversity?: boolean | null
          self_study?: string | null
          seminars_attended?: string | null
          senary_rights_standard_diversity?: boolean | null
          seniority_diversity?: boolean | null
          septenary_rights_standard_diversity?: boolean | null
          service_design_experience?: boolean | null
          shirt_size?: string | null
          shoe_size?: string | null
          short_term_goals?: string | null
          significance_diversity?: boolean | null
          situation_diversity?: boolean | null
          skill_diversity?: boolean | null
          skills?: string | null
          social_activities?: string | null
          social_entrepreneurship?: boolean | null
          social_media?: string | null
          social_media_experience?: boolean | null
          social_media_rights_standard_diversity?: boolean | null
          social_responsibility?: boolean | null
          social_security_rights_standard_diversity?: boolean | null
          social_standard_diversity?: boolean | null
          society_diversity?: boolean | null
          socioeconomic_diversity?: boolean | null
          soft_skills?: string | null
          source_info?: string | null
          specialization_diversity?: boolean | null
          speech_rights_standard_diversity?: boolean | null
          spiritual_rights_standard_diversity?: boolean | null
          spouse_name?: string | null
          stakeholder_management_experience?: boolean | null
          standard_diversity?: boolean | null
          stateless_rights_standard_diversity?: boolean | null
          strategic_thinking_experience?: boolean | null
          strength_diversity?: boolean | null
          strengths?: string | null
          structure_diversity?: boolean | null
          support_experience?: boolean | null
          sustainability_diversity?: boolean | null
          sustainability_standard_diversity?: boolean | null
          system_diversity?: boolean | null
          systems_thinking_experience?: boolean | null
          target_diversity?: boolean | null
          teaching_experience?: string | null
          team_management_experience?: boolean | null
          team_size_preferences?: string | null
          teamwork_diversity?: boolean | null
          teamwork_skills?: string | null
          technical_skills?: string | null
          technology_diversity?: boolean | null
          tenure_diversity?: boolean | null
          tertiary_rights_standard_diversity?: boolean | null
          testing_experience?: boolean | null
          thought_diversity?: boolean | null
          thought_leadership?: boolean | null
          thought_leadership_experience?: boolean | null
          threat_diversity?: boolean | null
          time_management_skills?: string | null
          tool_diversity?: boolean | null
          trade_rights_standard_diversity?: boolean | null
          trade_secret_standard_diversity?: boolean | null
          trademark_standard_diversity?: boolean | null
          training_certifications?: string | null
          training_diversity?: boolean | null
          training_experience?: boolean | null
          trait_diversity?: boolean | null
          transparency_diversity?: boolean | null
          transparency_standard_diversity?: boolean | null
          travel_frequency?: string | null
          travel_requirements?: string | null
          travel_rights_standard_diversity?: boolean | null
          travel_willingness?: boolean | null
          turnover_diversity?: boolean | null
          uncertainty_diversity?: boolean | null
          uniqueness_diversity?: boolean | null
          updated_at?: string
          urgency_diversity?: boolean | null
          usability_standard_diversity?: boolean | null
          user_experience_experience?: boolean | null
          user_id?: string | null
          user_interface_experience?: boolean | null
          value_diversity?: boolean | null
          vehicle_brand?: string | null
          vehicle_license?: string | null
          vehicle_type?: string | null
          vendor_management_experience?: boolean | null
          virtual_reality_experience?: boolean | null
          visa_rights_standard_diversity?: boolean | null
          vision_diversity?: boolean | null
          volatility_diversity?: boolean | null
          volunteer_experience?: string | null
          weakness_diversity?: boolean | null
          weaknesses?: string | null
          web_development_experience?: boolean | null
          webinars_attended?: string | null
          weekend_work_experience?: boolean | null
          weekend_work_willingness?: boolean | null
          weight_kg?: number | null
          willing_overtime?: boolean | null
          willing_relocate?: boolean | null
          willing_shift?: boolean | null
          women_rights_standard_diversity?: boolean | null
          work_environment_preferences?: string | null
          work_experience?: string | null
          work_life_balance_preferences?: string | null
          work_schedule_requirements?: string | null
          workplace_standard_diversity?: boolean | null
          workshops_attended?: string | null
          writing_experience?: boolean | null
        }
        Update: {
          absenteeism_diversity?: boolean | null
          academic_interests?: string | null
          accessibility_standard_diversity?: boolean | null
          accountability_diversity?: boolean | null
          accountability_standard_diversity?: boolean | null
          accounting_standard_diversity?: boolean | null
          achievement_diversity?: boolean | null
          achievements?: string | null
          action_diversity?: boolean | null
          adaptability_diversity?: boolean | null
          adaptability_skills?: string | null
          adaptability_standard_diversity?: boolean | null
          additional_info?: string | null
          address?: string | null
          advising?: boolean | null
          age_diversity?: boolean | null
          agile_thinking_experience?: boolean | null
          aim_diversity?: boolean | null
          alamat_domisili?: string | null
          alliance_diversity?: boolean | null
          ambiguity_diversity?: boolean | null
          ambition_diversity?: boolean | null
          analytical_experience?: boolean | null
          analytical_skills?: string | null
          approach_diversity?: boolean | null
          artificial_intelligence_experience?: boolean | null
          artistic_rights_standard_diversity?: boolean | null
          aspiration_diversity?: boolean | null
          asylum_rights_standard_diversity?: boolean | null
          atmosphere_diversity?: boolean | null
          attribute_diversity?: boolean | null
          audit_experience?: boolean | null
          auditing_standard_diversity?: boolean | null
          augmented_reality_experience?: boolean | null
          availability_standard_diversity?: boolean | null
          available_from?: string | null
          awards?: string | null
          background_diversity?: boolean | null
          basic_rights_standard_diversity?: boolean | null
          behavior_diversity?: boolean | null
          benchmark_diversity?: boolean | null
          benefits_preferences?: string | null
          benefits_requirements?: string | null
          best_practice_diversity?: boolean | null
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          blockchain_experience?: boolean | null
          blood_type?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          budget_management_experience?: boolean | null
          business_analysis_experience?: boolean | null
          business_continuity_standard_diversity?: boolean | null
          business_rights_standard_diversity?: boolean | null
          calling_diversity?: boolean | null
          candidate_references?: string | null
          capacity_management_experience?: boolean | null
          career_objective?: string | null
          certification_diversity?: boolean | null
          certifications?: string | null
          challenge_diversity?: boolean | null
          change_leadership_experience?: boolean | null
          change_management_experience?: boolean | null
          characteristic_diversity?: boolean | null
          children_rights_standard_diversity?: boolean | null
          circumstance_diversity?: boolean | null
          citizenship_rights_standard_diversity?: boolean | null
          city?: string | null
          civic_rights_standard_diversity?: boolean | null
          civil_rights_standard_diversity?: boolean | null
          client_management_experience?: boolean | null
          climate_diversity?: boolean | null
          cloud_computing_experience?: boolean | null
          coaching?: boolean | null
          collaboration_diversity?: boolean | null
          commercial_rights_standard_diversity?: boolean | null
          communication_diversity?: boolean | null
          communication_rights_standard_diversity?: boolean | null
          communication_skills?: string | null
          community_diversity?: boolean | null
          community_leadership?: boolean | null
          community_leadership_experience?: boolean | null
          company_culture_preferences?: string | null
          company_preferences?: string | null
          competency_diversity?: boolean | null
          complexity_diversity?: boolean | null
          compliance_diversity?: boolean | null
          compliance_experience?: boolean | null
          compliance_standard_diversity?: boolean | null
          component_diversity?: boolean | null
          computer_skills?: string | null
          condition_diversity?: boolean | null
          conferences_attended?: string | null
          confidentiality_standard_diversity?: boolean | null
          conflict_resolution_experience?: boolean | null
          consequence_diversity?: boolean | null
          constitutional_rights_standard_diversity?: boolean | null
          consulting?: boolean | null
          consumer_rights_standard_diversity?: boolean | null
          context_diversity?: boolean | null
          contract_negotiation_experience?: boolean | null
          contract_rights_standard_diversity?: boolean | null
          contribution_diversity?: boolean | null
          cooperation_diversity?: boolean | null
          coordination_diversity?: boolean | null
          copyright_standard_diversity?: boolean | null
          core_rights_standard_diversity?: boolean | null
          corporate_social_responsibility_standard_diversity?: boolean | null
          created_at?: string
          creative_rights_standard_diversity?: boolean | null
          creative_thinking_experience?: boolean | null
          creativity_diversity?: boolean | null
          creativity_skills?: string | null
          crisis_management_experience?: boolean | null
          critical_thinking_experience?: boolean | null
          cross_functional_experience?: boolean | null
          cultural_diversity?: boolean | null
          cultural_rights_standard_diversity?: boolean | null
          culture_diversity?: boolean | null
          culture_requirements?: string | null
          curiosity_diversity?: boolean | null
          current_company?: string | null
          current_position?: string | null
          current_salary?: number | null
          customer_experience_experience?: boolean | null
          cyber_rights_standard_diversity?: boolean | null
          cybersecurity_experience?: boolean | null
          data_protection_standard_diversity?: boolean | null
          data_rights_standard_diversity?: boolean | null
          data_science_experience?: boolean | null
          database_experience?: boolean | null
          decision_making_diversity?: boolean | null
          decision_making_experience?: boolean | null
          democratic_rights_standard_diversity?: boolean | null
          denary_rights_standard_diversity?: boolean | null
          dependency_diversity?: boolean | null
          deployment_experience?: boolean | null
          design_thinking_experience?: boolean | null
          desktop_development_experience?: boolean | null
          development_diversity?: boolean | null
          development_experience?: boolean | null
          differentiation_diversity?: boolean | null
          difficulty_diversity?: boolean | null
          digital_rights_standard_diversity?: boolean | null
          digital_transformation_experience?: boolean | null
          disability_inclusion?: boolean | null
          disability_rights_standard_diversity?: boolean | null
          disaster_recovery_standard_diversity?: boolean | null
          disclosure_standard_diversity?: boolean | null
          discovery_diversity?: boolean | null
          distinction_diversity?: boolean | null
          diversity_equity_inclusion_standard_diversity?: boolean | null
          diversity_inclusion?: boolean | null
          documentation_experience?: boolean | null
          domain_expertise?: string | null
          dream_diversity?: boolean | null
          drive_diversity?: boolean | null
          driving_license_a?: boolean | null
          driving_license_b?: boolean | null
          driving_license_c?: boolean | null
          driving_license_sim?: boolean | null
          economic_standard_diversity?: boolean | null
          ecosystem_diversity?: boolean | null
          education_diversity?: boolean | null
          education_history?: string | null
          education_institution?: string | null
          education_level?: string | null
          education_major?: string | null
          education_rights_standard_diversity?: boolean | null
          education_year?: number | null
          educational_diversity?: boolean | null
          effect_diversity?: boolean | null
          effectiveness_diversity?: boolean | null
          effectiveness_standard_diversity?: boolean | null
          efficiency_diversity?: boolean | null
          efficiency_standard_diversity?: boolean | null
          elderly_rights_standard_diversity?: boolean | null
          element_diversity?: boolean | null
          email?: string
          embedded_systems_experience?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_experience_experience?: boolean | null
          employment_rights_standard_diversity?: boolean | null
          employment_standard_diversity?: boolean | null
          engagement_diversity?: boolean | null
          enhancement_diversity?: boolean | null
          entrepreneurial_rights_standard_diversity?: boolean | null
          entrepreneurship?: boolean | null
          environment_diversity?: boolean | null
          environmental_social_governance_standard_diversity?: boolean | null
          environmental_standard_diversity?: boolean | null
          environmental_sustainability?: boolean | null
          essential_rights_standard_diversity?: boolean | null
          ethical_leadership?: boolean | null
          ethical_standard_diversity?: boolean | null
          ethics_diversity?: boolean | null
          ethics_standard_diversity?: boolean | null
          ethnicity?: string | null
          excellence_diversity?: boolean | null
          expected_salary?: number | null
          expected_salary_range?: string | null
          experience_diversity?: boolean | null
          experience_years?: number | null
          expertise_diversity?: boolean | null
          exploration_diversity?: boolean | null
          expression_rights_standard_diversity?: boolean | null
          extensibility_standard_diversity?: boolean | null
          factor_diversity?: boolean | null
          family_data?: Json | null
          family_members?: string | null
          father_name?: string | null
          fault_tolerance_standard_diversity?: boolean | null
          feature_diversity?: boolean | null
          financial_standard_diversity?: boolean | null
          flexibility_standard_diversity?: boolean | null
          flexible_hours_experience?: boolean | null
          flexible_hours_willingness?: boolean | null
          freelancing?: boolean | null
          full_name?: string
          function_diversity?: boolean | null
          fundamental_rights_standard_diversity?: boolean | null
          gaming_experience?: boolean | null
          gender?: string | null
          gender_equality?: boolean | null
          geographic_diversity?: boolean | null
          goal_diversity?: boolean | null
          governance_diversity?: boolean | null
          governance_experience?: boolean | null
          governance_standard_diversity?: boolean | null
          gpa?: number | null
          growth_diversity?: boolean | null
          growth_opportunities_preferences?: string | null
          growth_requirements?: string | null
          has_vehicle?: boolean | null
          health_safety_standard_diversity?: boolean | null
          healthcare_rights_standard_diversity?: boolean | null
          height_cm?: number | null
          hobbies?: string | null
          holiday_work_experience?: boolean | null
          holiday_work_willingness?: boolean | null
          home_ownership?: string | null
          home_phone?: string | null
          housing_rights_standard_diversity?: boolean | null
          human_rights_standard_diversity?: boolean | null
          id?: string
          ideological_rights_standard_diversity?: boolean | null
          immediate_family_data?: Json | null
          immigrant_rights_standard_diversity?: boolean | null
          impact_diversity?: boolean | null
          implication_diversity?: boolean | null
          importance_diversity?: boolean | null
          improvement_diversity?: boolean | null
          indigenous_rights_standard_diversity?: boolean | null
          industry_diversity?: boolean | null
          industry_interests?: string | null
          industry_knowledge?: string | null
          industry_leadership?: boolean | null
          industry_leadership_experience?: boolean | null
          industry_standard_diversity?: boolean | null
          influence_diversity?: boolean | null
          informal_education?: string | null
          information_rights_standard_diversity?: boolean | null
          information_security_standard_diversity?: boolean | null
          inheritance_rights_standard_diversity?: boolean | null
          innovation_diversity?: boolean | null
          innovation_experience?: boolean | null
          innovation_opportunities_preferences?: string | null
          innovation_requirements?: string | null
          innovation_rights_standard_diversity?: boolean | null
          integration_diversity?: boolean | null
          integrity_diversity?: boolean | null
          integrity_standard_diversity?: boolean | null
          intellectual_property_rights_standard_diversity?: boolean | null
          intellectual_property_standard_diversity?: boolean | null
          intention_diversity?: boolean | null
          interest_diversity?: boolean | null
          international_experience?: boolean | null
          internet_rights_standard_diversity?: boolean | null
          intrapreneurship?: boolean | null
          iot_experience?: boolean | null
          is_complete?: boolean
          labor_rights_standard_diversity?: boolean | null
          labor_standard_diversity?: boolean | null
          language_diversity?: boolean | null
          languages?: string | null
          leadership_diversity?: boolean | null
          leadership_experience?: string | null
          leadership_opportunities_preferences?: string | null
          leadership_requirements?: string | null
          leadership_skills?: string | null
          lean_thinking_experience?: boolean | null
          learning_diversity?: boolean | null
          learning_opportunities_preferences?: string | null
          learning_requirements?: string | null
          legal_rights_standard_diversity?: boolean | null
          legal_standard_diversity?: boolean | null
          level_diversity?: boolean | null
          lgbtq_equality?: boolean | null
          linkedin_url?: string | null
          location_preferences?: string | null
          long_term_goals?: string | null
          machine_learning_experience?: boolean | null
          maintainability_standard_diversity?: boolean | null
          maintenance_experience?: boolean | null
          management_experience?: boolean | null
          management_style_preferences?: string | null
          marital_status?: string | null
          mastery_diversity?: boolean | null
          meaning_diversity?: boolean | null
          medical_history?: string | null
          mentorship?: string | null
          methodology_diversity?: boolean | null
          migrant_rights_standard_diversity?: boolean | null
          minority_rights_standard_diversity?: boolean | null
          mission_diversity?: boolean | null
          mobile_development_experience?: boolean | null
          mobility_rights_standard_diversity?: boolean | null
          mother_name?: string | null
          motivation_diversity?: boolean | null
          multicultural_experience?: boolean | null
          nationality?: string | null
          nationality_rights_standard_diversity?: boolean | null
          natural_rights_standard_diversity?: boolean | null
          negotiation_skills?: string | null
          network_diversity?: boolean | null
          networking?: string | null
          networking_experience?: boolean | null
          nickname?: string | null
          night_shift_experience?: boolean | null
          night_shift_willingness?: boolean | null
          nik?: string | null
          non_compete_standard_diversity?: boolean | null
          non_disclosure_standard_diversity?: boolean | null
          non_solicitation_standard_diversity?: boolean | null
          nonary_rights_standard_diversity?: boolean | null
          notice_period?: number | null
          npwp?: string | null
          number_of_children?: number | null
          objective_diversity?: boolean | null
          octonary_rights_standard_diversity?: boolean | null
          online_courses?: string | null
          opportunity_diversity?: boolean | null
          optimization_diversity?: boolean | null
          organization_diversity?: boolean | null
          organizations?: string | null
          originality_diversity?: boolean | null
          other_skills?: string | null
          outcome_diversity?: boolean | null
          overtime_experience?: boolean | null
          overtime_willingness?: boolean | null
          ownership_rights_standard_diversity?: boolean | null
          pants_size?: string | null
          partnership_diversity?: boolean | null
          partnership_management_experience?: boolean | null
          passion_diversity?: boolean | null
          passport_rights_standard_diversity?: boolean | null
          patent_standard_diversity?: boolean | null
          patents?: string | null
          pension_rights_standard_diversity?: boolean | null
          perfection_diversity?: boolean | null
          performance_diversity?: boolean | null
          performance_management_experience?: boolean | null
          performance_standard_diversity?: boolean | null
          personal_development?: string | null
          personal_interests?: string | null
          personality_diversity?: boolean | null
          perspective_diversity?: boolean | null
          philosophical_rights_standard_diversity?: boolean | null
          phone?: string | null
          photo_url?: string | null
          policy_diversity?: boolean | null
          political_diversity?: boolean | null
          political_rights_standard_diversity?: boolean | null
          portfolio_management_experience?: boolean | null
          postal_code?: string | null
          presentation_experience?: boolean | null
          presentation_skills?: string | null
          press_rights_standard_diversity?: boolean | null
          primary_rights_standard_diversity?: boolean | null
          priority_diversity?: boolean | null
          privacy_protection_standard_diversity?: boolean | null
          privacy_rights_standard_diversity?: boolean | null
          privacy_standard_diversity?: boolean | null
          problem_solving_diversity?: boolean | null
          problem_solving_experience?: boolean | null
          problem_solving_skills?: string | null
          procedure_diversity?: boolean | null
          process_diversity?: boolean | null
          process_improvement_experience?: boolean | null
          product_management_experience?: boolean | null
          productivity_diversity?: boolean | null
          professional_development?: string | null
          professional_interests?: string | null
          professional_standard_diversity?: boolean | null
          program_management_experience?: boolean | null
          project_experience?: string | null
          project_management_experience?: boolean | null
          property_diversity?: boolean | null
          property_rights_standard_diversity?: boolean | null
          province?: string | null
          public_speaking_experience?: boolean | null
          publications?: string | null
          purpose_diversity?: boolean | null
          quality_diversity?: boolean | null
          quality_management_experience?: boolean | null
          quality_standard_diversity?: boolean | null
          quaternary_rights_standard_diversity?: boolean | null
          quinary_rights_standard_diversity?: boolean | null
          racial_equality?: boolean | null
          reach_diversity?: boolean | null
          reaction_diversity?: boolean | null
          recognition_diversity?: boolean | null
          refugee_rights_standard_diversity?: boolean | null
          regulation_diversity?: boolean | null
          regulatory_standard_diversity?: boolean | null
          reliability_standard_diversity?: boolean | null
          religion?: string | null
          religious_diversity?: boolean | null
          religious_rights_standard_diversity?: boolean | null
          relocation_distance?: number | null
          relocation_requirements?: string | null
          relocation_willingness?: boolean | null
          remote_work_experience?: boolean | null
          remote_work_willingness?: boolean | null
          reporting_standard_diversity?: boolean | null
          requirements_analysis_experience?: boolean | null
          research_experience?: string | null
          research_interests?: string | null
          residence_rights_standard_diversity?: boolean | null
          residency_rights_standard_diversity?: boolean | null
          resilience_diversity?: boolean | null
          resilience_standard_diversity?: boolean | null
          resource_management_experience?: boolean | null
          response_diversity?: boolean | null
          responsibility_diversity?: boolean | null
          responsibility_standard_diversity?: boolean | null
          result_diversity?: boolean | null
          retention_diversity?: boolean | null
          reward_diversity?: boolean | null
          risk_assessment_experience?: boolean | null
          risk_diversity?: boolean | null
          risk_management_experience?: boolean | null
          risk_management_standard_diversity?: boolean | null
          risk_taking_diversity?: boolean | null
          robotics_experience?: boolean | null
          robustness_standard_diversity?: boolean | null
          role_diversity?: boolean | null
          role_preferences?: string | null
          safety_standard_diversity?: boolean | null
          salary_currency?: string | null
          salary_exp_allowances?: string | null
          salary_exp_base?: string | null
          salary_exp_benefits?: string | null
          salary_expectation?: string | null
          salary_negotiable?: boolean | null
          salary_requirements?: string | null
          satisfaction_diversity?: boolean | null
          scalability_standard_diversity?: boolean | null
          scale_diversity?: boolean | null
          scope_diversity?: boolean | null
          secondary_rights_standard_diversity?: boolean | null
          security_experience?: boolean | null
          security_standard_diversity?: boolean | null
          self_study?: string | null
          seminars_attended?: string | null
          senary_rights_standard_diversity?: boolean | null
          seniority_diversity?: boolean | null
          septenary_rights_standard_diversity?: boolean | null
          service_design_experience?: boolean | null
          shirt_size?: string | null
          shoe_size?: string | null
          short_term_goals?: string | null
          significance_diversity?: boolean | null
          situation_diversity?: boolean | null
          skill_diversity?: boolean | null
          skills?: string | null
          social_activities?: string | null
          social_entrepreneurship?: boolean | null
          social_media?: string | null
          social_media_experience?: boolean | null
          social_media_rights_standard_diversity?: boolean | null
          social_responsibility?: boolean | null
          social_security_rights_standard_diversity?: boolean | null
          social_standard_diversity?: boolean | null
          society_diversity?: boolean | null
          socioeconomic_diversity?: boolean | null
          soft_skills?: string | null
          source_info?: string | null
          specialization_diversity?: boolean | null
          speech_rights_standard_diversity?: boolean | null
          spiritual_rights_standard_diversity?: boolean | null
          spouse_name?: string | null
          stakeholder_management_experience?: boolean | null
          standard_diversity?: boolean | null
          stateless_rights_standard_diversity?: boolean | null
          strategic_thinking_experience?: boolean | null
          strength_diversity?: boolean | null
          strengths?: string | null
          structure_diversity?: boolean | null
          support_experience?: boolean | null
          sustainability_diversity?: boolean | null
          sustainability_standard_diversity?: boolean | null
          system_diversity?: boolean | null
          systems_thinking_experience?: boolean | null
          target_diversity?: boolean | null
          teaching_experience?: string | null
          team_management_experience?: boolean | null
          team_size_preferences?: string | null
          teamwork_diversity?: boolean | null
          teamwork_skills?: string | null
          technical_skills?: string | null
          technology_diversity?: boolean | null
          tenure_diversity?: boolean | null
          tertiary_rights_standard_diversity?: boolean | null
          testing_experience?: boolean | null
          thought_diversity?: boolean | null
          thought_leadership?: boolean | null
          thought_leadership_experience?: boolean | null
          threat_diversity?: boolean | null
          time_management_skills?: string | null
          tool_diversity?: boolean | null
          trade_rights_standard_diversity?: boolean | null
          trade_secret_standard_diversity?: boolean | null
          trademark_standard_diversity?: boolean | null
          training_certifications?: string | null
          training_diversity?: boolean | null
          training_experience?: boolean | null
          trait_diversity?: boolean | null
          transparency_diversity?: boolean | null
          transparency_standard_diversity?: boolean | null
          travel_frequency?: string | null
          travel_requirements?: string | null
          travel_rights_standard_diversity?: boolean | null
          travel_willingness?: boolean | null
          turnover_diversity?: boolean | null
          uncertainty_diversity?: boolean | null
          uniqueness_diversity?: boolean | null
          updated_at?: string
          urgency_diversity?: boolean | null
          usability_standard_diversity?: boolean | null
          user_experience_experience?: boolean | null
          user_id?: string | null
          user_interface_experience?: boolean | null
          value_diversity?: boolean | null
          vehicle_brand?: string | null
          vehicle_license?: string | null
          vehicle_type?: string | null
          vendor_management_experience?: boolean | null
          virtual_reality_experience?: boolean | null
          visa_rights_standard_diversity?: boolean | null
          vision_diversity?: boolean | null
          volatility_diversity?: boolean | null
          volunteer_experience?: string | null
          weakness_diversity?: boolean | null
          weaknesses?: string | null
          web_development_experience?: boolean | null
          webinars_attended?: string | null
          weekend_work_experience?: boolean | null
          weekend_work_willingness?: boolean | null
          weight_kg?: number | null
          willing_overtime?: boolean | null
          willing_relocate?: boolean | null
          willing_shift?: boolean | null
          women_rights_standard_diversity?: boolean | null
          work_environment_preferences?: string | null
          work_experience?: string | null
          work_life_balance_preferences?: string | null
          work_schedule_requirements?: string | null
          workplace_standard_diversity?: boolean | null
          workshops_attended?: string | null
          writing_experience?: boolean | null
        }
        Relationships: []
      }
      candidate_skills: {
        Row: {
          created_at: string
          id: string
          level: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidate_work_experience: {
        Row: {
          company_name: string
          created_at: string
          department: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_description: string | null
          location: string | null
          position: string
          reason_leaving: string | null
          salary: number | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          department?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_description?: string | null
          location?: string | null
          position?: string
          reason_leaving?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          department?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_description?: string | null
          location?: string | null
          position?: string
          reason_leaving?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          activation_code_id: string | null
          birth_date: string | null
          created_at: string
          education: string | null
          email: string
          gender: string | null
          id: string
          name: string
          phone: string
          photo_url: string | null
          position: string
          status: string
          updated_at: string
        }
        Insert: {
          activation_code_id?: string | null
          birth_date?: string | null
          created_at?: string
          education?: string | null
          email: string
          gender?: string | null
          id?: string
          name: string
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activation_code_id?: string | null
          birth_date?: string | null
          created_at?: string
          education?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_activation_code_id_fkey"
            columns: ["activation_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          activation_code_id: string | null
          admin_notes: string | null
          applied_at: string
          cover_letter: string | null
          created_at: string
          id: string
          status: string
          status_updated_at: string
          updated_at: string
          user_id: string
          vacancy_id: string
        }
        Insert: {
          activation_code_id?: string | null
          admin_notes?: string | null
          applied_at?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          status?: string
          status_updated_at?: string
          updated_at?: string
          user_id: string
          vacancy_id: string
        }
        Update: {
          activation_code_id?: string | null
          admin_notes?: string | null
          applied_at?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          status?: string
          status_updated_at?: string
          updated_at?: string
          user_id?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "job_vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_vacancies: {
        Row: {
          closes_at: string | null
          created_at: string
          department: string | null
          description: string | null
          employment_type: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_salary: number | null
          min_salary: number | null
          posted_by: string | null
          requirements: string | null
          responsibilities: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_salary?: number | null
          min_salary?: number | null
          posted_by?: string | null
          requirements?: string | null
          responsibilities?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          category: string | null
          correct_answer: string | null
          created_at: string
          expected_answer: string | null
          id: string
          is_correct: boolean | null
          question_number: number
          question_text: string
          question_text_en: string | null
          reaction_time_ms: number | null
          selected_answer: string
          selected_answer_label: string
          test_result_id: string
          typed_answer: string | null
        }
        Insert: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          expected_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_number: number
          question_text: string
          question_text_en?: string | null
          reaction_time_ms?: number | null
          selected_answer: string
          selected_answer_label?: string
          test_result_id: string
          typed_answer?: string | null
        }
        Update: {
          category?: string | null
          correct_answer?: string | null
          created_at?: string
          expected_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_number?: number
          question_text?: string
          question_text_en?: string | null
          reaction_time_ms?: number | null
          selected_answer?: string
          selected_answer_label?: string
          test_result_id?: string
          typed_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      test_instruments: {
        Row: {
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          name_en: string
          norm_reference: string
          question_count: number
          scoring_method: string
          target_audience: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          name_en?: string
          norm_reference?: string
          question_count?: number
          scoring_method?: string
          target_audience?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          norm_reference?: string
          question_count?: number
          scoring_method?: string
          target_audience?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_interpretations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          instrument_id: string
          interpretation_key: string
          interpretation_text: string
          interpretation_text_en: string | null
          max_value: number | null
          min_value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          instrument_id: string
          interpretation_key: string
          interpretation_text: string
          interpretation_text_en?: string | null
          max_value?: number | null
          min_value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          instrument_id?: string
          interpretation_key?: string
          interpretation_text?: string
          interpretation_text_en?: string | null
          max_value?: number | null
          min_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_interpretations_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_question_options: {
        Row: {
          category_target: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_correct: boolean | null
          option_definition: string | null
          option_definition_en: string | null
          option_label: string
          option_text: string
          option_text_en: string | null
          question_id: string
          score_value: number
        }
        Insert: {
          category_target?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          option_definition?: string | null
          option_definition_en?: string | null
          option_label: string
          option_text: string
          option_text_en?: string | null
          question_id: string
          score_value?: number
        }
        Update: {
          category_target?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_correct?: boolean | null
          option_definition?: string | null
          option_definition_en?: string | null
          option_label?: string
          option_text?: string
          option_text_en?: string | null
          question_id?: string
          score_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          category: string | null
          created_at: string
          group_number: number | null
          id: string
          image_url: string | null
          instrument_id: string
          options_image: string | null
          question_image: string | null
          question_number: number
          question_text: string
          question_text_en: string | null
          question_type: string
          scoring_rule: string | null
          subtest_code: string | null
          time_limit_minutes: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          group_number?: number | null
          id?: string
          image_url?: string | null
          instrument_id: string
          options_image?: string | null
          question_image?: string | null
          question_number?: number
          question_text: string
          question_text_en?: string | null
          question_type?: string
          scoring_rule?: string | null
          subtest_code?: string | null
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          group_number?: number | null
          id?: string
          image_url?: string | null
          instrument_id?: string
          options_image?: string | null
          question_image?: string | null
          question_number?: number
          question_text?: string
          question_text_en?: string | null
          question_type?: string
          scoring_rule?: string | null
          subtest_code?: string | null
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_result_details: {
        Row: {
          accuracy_rate: number | null
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          questions_count: number
          segment_number: number
          speed_per_minute: number | null
          test_result_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          questions_count?: number
          segment_number?: number
          speed_per_minute?: number | null
          test_result_id: string
        }
        Update: {
          accuracy_rate?: number | null
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          questions_count?: number
          segment_number?: number
          speed_per_minute?: number | null
          test_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_result_details_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          accuracy_score: number | null
          answered_questions: number
          candidate_id: string | null
          candidate_name: string
          candidate_profile: Json | null
          categories: Json
          completed_at: string
          created_at: string
          duration_seconds: number | null
          id: string
          instrument_id: string | null
          interpretation: string | null
          position: string
          score: number
          speed_score: number | null
          stability_score: number | null
          status: string
          test_name: string
          total_questions: number
          webcam_photo_url: string | null
          work_capacity: number | null
        }
        Insert: {
          accuracy_score?: number | null
          answered_questions?: number
          candidate_id?: string | null
          candidate_name: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          instrument_id?: string | null
          interpretation?: string | null
          position?: string
          score?: number
          speed_score?: number | null
          stability_score?: number | null
          status?: string
          test_name?: string
          total_questions?: number
          webcam_photo_url?: string | null
          work_capacity?: number | null
        }
        Update: {
          accuracy_score?: number | null
          answered_questions?: number
          candidate_id?: string | null
          candidate_name?: string
          candidate_profile?: Json | null
          categories?: Json
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          instrument_id?: string | null
          interpretation?: string | null
          position?: string
          score?: number
          speed_score?: number | null
          stability_score?: number | null
          status?: string
          test_name?: string
          total_questions?: number
          webcam_photo_url?: string | null
          work_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "test_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          activation_code_id: string
          answers: Json
          candidate_email: string
          completed_subtests: string[]
          created_at: string
          current_question_idx: number
          current_test_idx: number
          id: string
          is_code_deactivated: boolean
          last_active_at: string
          last_violation_at: string | null
          original_duration_seconds: number
          seconds_remaining: number
          test_started_at: string | null
          time_penalty_seconds: number
          updated_at: string
          violation_count: number
          violation_history: Json
        }
        Insert: {
          activation_code_id: string
          answers?: Json
          candidate_email: string
          completed_subtests?: string[]
          created_at?: string
          current_question_idx?: number
          current_test_idx?: number
          id?: string
          is_code_deactivated?: boolean
          last_active_at?: string
          last_violation_at?: string | null
          original_duration_seconds?: number
          seconds_remaining?: number
          test_started_at?: string | null
          time_penalty_seconds?: number
          updated_at?: string
          violation_count?: number
          violation_history?: Json
        }
        Update: {
          activation_code_id?: string
          answers?: Json
          candidate_email?: string
          completed_subtests?: string[]
          created_at?: string
          current_question_idx?: number
          current_test_idx?: number
          id?: string
          is_code_deactivated?: boolean
          last_active_at?: string
          last_violation_at?: string | null
          original_duration_seconds?: number
          seconds_remaining?: number
          test_started_at?: string | null
          time_penalty_seconds?: number
          updated_at?: string
          violation_count?: number
          violation_history?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_activate_candidate_login: {
        Args: { candidate_email: string }
        Returns: string
      }
      admin_delete_candidate_account: {
        Args: { candidate_email: string }
        Returns: string
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      admin_reset_candidate_password: {
        Args: { candidate_email: string; new_password?: string }
        Returns: string
      }
      get_application_status_flow: {
        Args: never
        Returns: {
          status_label: string
          status_order: number
          status_value: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
