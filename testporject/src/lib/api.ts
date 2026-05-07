// Dynamics 365 CRM - Supabase API Service Layer
// Provides CRUD operations for all CRM entities

import { supabase } from './supabase';
import type {
  Account, AccountInput,
  Contact, ContactInput,
  Opportunity, OpportunityInput,
  Lead, LeadInput,
  Competitor, CompetitorInput,
  Activity, ActivityInput,
  TimelineEntry, TimelineEntryInput,
  ProjectApplication, ProjectApplicationInput,
  ProjectPlan, ProjectPlanInput,
  DashboardData,
} from './types';

// ============================================
// ACCOUNTS
// ============================================
export const accountsApi = {
  async list(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('status', 'Active')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(account: AccountInput): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, account: AccountInput): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// CONTACTS
// ============================================
export const contactsApi = {
  async list(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'Active')
      .order('last_name');
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(contact: ContactInput): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, contact: ContactInput): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// OPPORTUNITIES
// ============================================
export const opportunitiesApi = {
  async list(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Opportunity | null> {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(opportunity: OpportunityInput): Promise<Opportunity> {
    const payload = { ...opportunity };
    if (payload.opportunity_start_time === '') payload.opportunity_start_time = null;
    if (payload.opportunity_finish_time === '') payload.opportunity_finish_time = null;
    const { data, error } = await supabase
      .from('opportunities')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(opportunities: OpportunityInput[]): Promise<Opportunity[]> {
    const payloads = opportunities.map(opp => {
      const payload = { ...opp };
      if (payload.opportunity_start_time === '') payload.opportunity_start_time = null;
      if (payload.opportunity_finish_time === '') payload.opportunity_finish_time = null;
      return payload;
    });
    const { data, error } = await supabase
      .from('opportunities')
      .insert(payloads)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, opportunity: OpportunityInput): Promise<Opportunity> {
    const payload = { ...opportunity };
    if (payload.opportunity_start_time === '') payload.opportunity_start_time = null;
    if (payload.opportunity_finish_time === '') payload.opportunity_finish_time = null;
    const { data, error } = await supabase
      .from('opportunities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// LEADS
// ============================================
export const leadsApi = {
  async list(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(lead: LeadInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, lead: LeadInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// COMPETITORS
// ============================================
export const competitorsApi = {
  async list(): Promise<Competitor[]> {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('status', 'Active')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Competitor | null> {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(competitor: CompetitorInput): Promise<Competitor> {
    const { data, error } = await supabase
      .from('competitors')
      .insert(competitor)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, competitor: CompetitorInput): Promise<Competitor> {
    const { data, error } = await supabase
      .from('competitors')
      .update(competitor)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('competitors')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// ACTIVITIES
// ============================================
export const activitiesApi = {
  async list(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(activity: ActivityInput): Promise<Activity> {
    const payload = { ...activity };
    if (payload.due_date === '') payload.due_date = null;
    const { data, error } = await supabase
      .from('activities')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, activity: ActivityInput): Promise<Activity> {
    const payload = { ...activity };
    if (payload.due_date === '') payload.due_date = null;
    const { data, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('activities')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ============================================
// TIMELINE ENTRIES
// ============================================
export const timelineApi = {
  async listByEntity(entityType: string, entityId: string): Promise<TimelineEntry[]> {
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(entry: TimelineEntryInput): Promise<TimelineEntry> {
    const { data, error } = await supabase
      .from('timeline_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// PROJECT APPLICATIONS
// ============================================
export const projectApplicationsApi = {
  async list(): Promise<ProjectApplication[]> {
    const { data, error } = await supabase
      .from('project_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ProjectApplication | null> {
    const { data, error } = await supabase
      .from('project_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(app: ProjectApplicationInput): Promise<ProjectApplication> {
    const { data, error } = await supabase
      .from('project_applications')
      .insert(app)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(apps: ProjectApplicationInput[]): Promise<ProjectApplication[]> {
    const { data, error } = await supabase
      .from('project_applications')
      .insert(apps)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, app: ProjectApplicationInput): Promise<ProjectApplication> {
    const { data, error } = await supabase
      .from('project_applications')
      .update(app)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('project_applications')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

export const oemsApi = {
  async list(): Promise<OEM[]> {
    const { data, error } = await supabase
      .from('oems')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<OEM | null> {
    const { data, error } = await supabase
      .from('oems')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(oem: OEMInput): Promise<OEM> {
    const { data, error } = await supabase
      .from('oems')
      .insert(oem)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(oems: OEMInput[]): Promise<OEM[]> {
    const { data, error } = await supabase
      .from('oems')
      .insert(oems)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, oem: OEMInput): Promise<OEM> {
    const { data, error } = await supabase
      .from('oems')
      .update(oem)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('oems')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
};

export const oesApi = {
  async list(): Promise<OES[]> {
    const { data, error } = await supabase
      .from('oes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<OES | null> {
    const { data, error } = await supabase
      .from('oes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(oes: OESInput): Promise<OES> {
    const { data, error } = await supabase
      .from('oes')
      .insert(oes)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(oesList: OESInput[]): Promise<OES[]> {
    const { data, error } = await supabase
      .from('oes')
      .insert(oesList)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, oes: OESInput): Promise<OES> {
    const { data, error } = await supabase
      .from('oes')
      .update(oes)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('oes')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
};

export const projectVehicleModelsApi = {
  async list(): Promise<ProjectVehicleModel[]> {
    const { data, error } = await supabase
      .from('project_vehicle_models')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ProjectVehicleModel | null> {
    const { data, error } = await supabase
      .from('project_vehicle_models')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(model: ProjectVehicleModelInput): Promise<ProjectVehicleModel> {
    const { data, error } = await supabase
      .from('project_vehicle_models')
      .insert(model)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(models: ProjectVehicleModelInput[]): Promise<ProjectVehicleModel[]> {
    const { data, error } = await supabase
      .from('project_vehicle_models')
      .insert(models)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, model: ProjectVehicleModelInput): Promise<ProjectVehicleModel> {
    const { data, error } = await supabase
      .from('project_vehicle_models')
      .update(model)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('project_vehicle_models')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
};

// ============================================
// PROJECT PLANS
// ============================================
export const projectPlansApi = {
  async list(): Promise<ProjectPlan[]> {
    const { data, error } = await supabase
      .from('project_plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ProjectPlan | null> {
    const { data, error } = await supabase
      .from('project_plans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(plan: ProjectPlanInput): Promise<ProjectPlan> {
    const { data, error } = await supabase
      .from('project_plans')
      .insert(plan)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createMany(plans: ProjectPlanInput[]): Promise<ProjectPlan[]> {
    const { data, error } = await supabase
      .from('project_plans')
      .insert(plans)
      .select();
    if (error) throw error;
    return data || [];
  },

  async update(id: string, plan: ProjectPlanInput): Promise<ProjectPlan> {
    const { data, error } = await supabase
      .from('project_plans')
      .update(plan)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('project_plans')
      .delete()
      .in('id', ids);
    if (error) throw error;
  }
};

// ============================================
// DASHBOARD DATA
// ============================================
export const dashboardApi = {
  async getData(): Promise<DashboardData> {
    // Get opportunity pipeline data grouped by stage
    const { data: opps } = await supabase
      .from('opportunities')
      .select('stage, est_revenue, status');

    const stages = ['Qualify', 'Develop', 'Propose', 'Close'];
    const pipelineData = stages.map(stage => ({
      name: stage,
      amount: (opps || [])
        .filter(o => o.stage === stage)
        .reduce((sum, o) => sum + (o.est_revenue || 0), 0),
    }));

    // Revenue trend (simulated monthly from opportunities)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = monthNames.map((month, i) => ({
      month,
      revenue: Math.round(
        (opps || []).reduce((sum, o) => sum + (o.est_revenue || 0), 0) / 6 * (0.5 + Math.random())
      ),
    }));

    // Win/Loss ratio
    const won = (opps || []).filter(o => o.status === 'Won').length || 4;
    const lost = (opps || []).filter(o => o.status === 'Lost').length || 3;
    const winLossData = [
      { name: 'Won', value: won * 100 },
      { name: 'Lost', value: lost * 100 },
    ];

    // Counts
    const { count: totalAccounts } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
    const { count: totalContacts } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
    const { count: totalOpportunities } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });

    // Project tasks by owner
    const { data: plans } = await supabase.from('project_plans').select('m0_tasks, m1_tasks, m2_tasks, m3_tasks, m4_tasks');
    const ownerTaskMap: Record<string, { name: string; 'Not Started': number; 'In Progress': number; 'Completed': number; 'Delayed': number }> = {};

    (plans || []).forEach(plan => {
      const allTasks = [
        ...(plan.m0_tasks || []),
        ...(plan.m1_tasks || []),
        ...(plan.m2_tasks || []),
        ...(plan.m3_tasks || []),
        ...(plan.m4_tasks || [])
      ];

      allTasks.forEach(task => {
        const owner = task.owner || 'Unassigned';
        if (!ownerTaskMap[owner]) {
          ownerTaskMap[owner] = {
            name: owner,
            'Not Started': 0,
            'In Progress': 0,
            'Completed': 0,
            'Delayed': 0
          };
        }
        
        if (task.status === 'Not Started') ownerTaskMap[owner]['Not Started']++;
        else if (task.status === 'In Progress') ownerTaskMap[owner]['In Progress']++;
        else if (task.status === 'Completed') ownerTaskMap[owner]['Completed']++;
        else if (task.status === 'Delayed') ownerTaskMap[owner]['Delayed']++;
      });
    });

    const projectTasksData = Object.values(ownerTaskMap);

    return {
      pipelineData,
      revenueData,
      winLossData,
      projectTasksData,
      totalAccounts: totalAccounts || 0,
      totalContacts: totalContacts || 0,
      totalOpportunities: totalOpportunities || 0,
      totalLeads: totalLeads || 0,
    };
  },
};
