// Dynamics 365 CRM - TypeScript Type Definitions

export interface Account {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  primary_contact: string | null;
  email: string | null;
  website: string | null;
  fax: string | null;
  parent_account: string | null;
  ticker_symbol: string | null;
  street: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  annual_revenue: number;
  employees: number;
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  account_id: string | null;
  account_name: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  preferred_contact_method: string;
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  opportunity_code: string | null;
  topic: string;
  sales_group: string | null;
  application: string | null;
  business_unit: string | null;
  opportunity_start_time: string | null;
  opportunity_finish_time: string | null;
  est_revenue: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>;

export interface Lead {
  id: string;
  first_name: string | null;
  last_name: string;
  topic: string;
  status: string;
  source: string;
  rating: string;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  website: string | null;
  owner: string;
  stage_index: number;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  name: string;
  website: string | null;
  ticker_symbol: string | null;
  strengths: string | null;
  weaknesses: string | null;
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  subject: string;
  activity_type: string;
  regarding: string | null;
  regarding_id: string | null;
  priority: string;
  due_date: string | null;
  status: string;
  description: string | null;
  assignee: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  entry_type: string;
  icon: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  created_by: string;
  created_at: string;
}

// Form data types for create/update operations
export type AccountInput = Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;
export type ContactInput = Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>;
export type OpportunityInput = Partial<Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>>;
export type LeadInput = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>;
export type CompetitorInput = Partial<Omit<Competitor, 'id' | 'created_at' | 'updated_at'>>;
export type ActivityInput = Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>;
export type TimelineEntryInput = Partial<Omit<TimelineEntry, 'id' | 'created_at'>>;

export interface ProjectApplication {
  id: string;
  name: string;
  application_name: string;
  segment: string;
  segment_cn: string;
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ProjectApplicationInput = Partial<Omit<ProjectApplication, 'id' | 'created_at' | 'updated_at'>>;

export interface OEM {
  id: string;
  name: string; // OEM名称
  short_name_en: string | null; // 英文简称/别称
  short_name_cn: string | null; // 中文简称/别称
  full_name: string | null; // OEM全称
  associated_account: string | null; // 关联客户
  application_coverage: string | null; // 应用覆盖率
  first_data_source: string | null; // 首次数据来源
  data_source_list: string | null; // 数据来源列表
  data_mod_status: string | null; // 数据修改状态
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type OEMInput = Partial<Omit<OEM, 'id' | 'created_at' | 'updated_at'>>;

export interface OES {
  id: string;
  name: string; // OES名称
  short_name_en: string | null; // 英文简称/别称
  short_name_cn: string | null; // 中文简称/别称
  full_name: string | null; // OES全称
  associated_account: string | null; // 关联客户
  battery_makers: string | null; // Battery Makers
  first_data_source: string | null; // 首次数据来源
  data_source_list: string | null; // 数据来源列表
  data_mod_status: string | null; // 数据修改状态
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type OESInput = Partial<Omit<OES, 'id' | 'created_at' | 'updated_at'>>;

export interface ProjectVehicleModel {
  id: string;
  name: string; // 名称
  name_cn: string | null; // 中文名称
  oes_full_name: string | null; // OES全称
  internal_code: string | null; // 内部编码
  external_code: string | null; // 外部编码
  in_out_code: string | null; // 内/外部代码
  brand: string | null; // 品牌
  parent_oem: string | null; // 所属OEM
  oem_text: string | null; // OEM文本
  oem_full_name_parent: string | null; // OEM全称 (所属OEM)
  crm_project_oem: string | null; // CRM项目OEM
  body_type: string | null; // 车身类型
  energy_type: string | null; // 能源类型
  sop: string | null; // SOP
  eop: string | null; // EOP
  first_data_source: string | null; // 首次数据来源
  data_source_list: string | null; // 数据来源列表
  matches_prod_sales: string | null; // 是否匹配产销表车型
  data_mod_status: string | null; // 数据修改状态
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ProjectVehicleModelInput = Partial<Omit<ProjectVehicleModel, 'id' | 'created_at' | 'updated_at'>>;

export interface TeamMember {
  name: string;
  role: string;
  responsibility: string;
}

export interface PhaseTask {
  id?: string;       // unique row identifier (UUID)
  task: string;
  owner: string;
  start_date: string;
  due_date: string;
  status: string; // Not Started, In Progress, Completed, Delayed
  coordinating_resources?: string;
  description?: string;
  item_description?: string;
  priority?: string; // High, Medium, Low
  reference_url?: string;
}

export interface ProjectPlan {
  id: string;
  name: string;
  status: string; // Draft, Active, On Hold, Completed
  current_phase: string | null; // M0, M1, M2, M3, M4
  team_members: TeamMember[] | null;

  m0_start: string | null;
  m0_end: string | null;
  m0_tasks: PhaseTask[] | null;

  m1_start: string | null;
  m1_end: string | null;
  m1_tasks: PhaseTask[] | null;

  m2_start: string | null;
  m2_end: string | null;
  m2_tasks: PhaseTask[] | null;

  m3_start: string | null;
  m3_end: string | null;
  m3_tasks: PhaseTask[] | null;

  m4_start: string | null;
  m4_end: string | null;
  m4_tasks: PhaseTask[] | null;

  owner: string;
  created_at: string;
  updated_at: string;
}

export type ProjectPlanInput = Partial<Omit<ProjectPlan, 'id' | 'created_at' | 'updated_at'>>;

// Dashboard aggregation types
export interface DashboardData {
  pipelineData: { name: string; amount: number }[];
  revenueData: { month: string; revenue: number }[];
  winLossData: { name: string; value: number }[];
  projectTasksData?: { name: string; 'Not Started': number; 'In Progress': number; 'Completed': number; 'Delayed': number }[];
  totalAccounts: number;
  totalContacts: number;
  totalOpportunities: number;
  totalLeads: number;
}
